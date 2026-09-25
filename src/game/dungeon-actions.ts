import { CHEST_LOOT } from '@/data/chests';
import { ITEMS } from '@/data/items';
import { METRO } from '@/data/maps/red-square';
import { UNDERGROUND, isUnderground } from '@/data/maps/underground';
import { playSfx } from '@/audio/sfx';
import { combat } from '@/game/combat-sim';
import { gateIsShut, syncDungeonWorld } from '@/game/dungeon-sim';
import { spawnPickup } from '@/game/loot-sim';
import { awardOnce } from '@/game/progress-actions';
import { sim } from '@/game/sim';
import { currentMap, currentWorld } from '@/game/world/current-map';
import { track } from '@/net/stats';
import { useDungeonStore } from '@/store/dungeon-store';
import { useGameStore } from '@/store/game-store';
import { useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { resolveCircle } from '@/systems/collision';
import { addToBag, countOf, firstIndexOf } from '@/systems/inventory';
import { PLAYER_RADIUS } from '@/systems/movement';
import { scatter } from '@/systems/pickups';
import type { Vec2 } from '@/utils/vec2';

const toast = (text: string, kind: 'xp' | 'item' | 'warn' | 'info' = 'info') =>
  useToastStore.getState().push(text, kind);

const FADE_MS = 320;
const HOLD_MS = 140;
/** Rosa opens a chest by walking this close to it. */
export const CHEST_REACH = 1.3;

/** Fades to black, moves Rosa, fades back. The world waits (the sim is paused) while it runs. */
export function travelTo(dest: Vec2, arrivalToast?: string): void {
  const game = useGameStore.getState();
  if (game.transitioning) return;
  game.setTransitioning(true);
  window.setTimeout(() => {
    const pos = resolveCircle(dest, PLAYER_RADIUS, currentWorld);
    sim.prev = { ...sim.curr, pos };
    sim.curr = { ...sim.curr, pos };
    sim.path = [];
    sim.talkTo = null;
    combat.projectiles = [];
    useGameStore.getState().setUnderground(isUnderground(pos));
    if (arrivalToast) toast(arrivalToast, 'info');
    window.setTimeout(() => useGameStore.getState().setTransitioning(false), HOLD_MS);
  }, FADE_MS);
}

export function goDown(): void {
  track('underground_entered');
  travelTo(UNDERGROUND.arrival);
}

export function goUp(): void {
  travelTo(METRO.door);
}

/** The boss door: opens for good with the Registrar's Stamp, otherwise explains what is missing. */
export function openBossDoor(): void {
  const dungeon = useDungeonStore.getState();
  if (dungeon.gateOpen || !gateIsShut()) {
    toast('The gate stands open', 'info');
    return;
  }
  const progress = useProgressStore.getState();
  const index = firstIndexOf(progress.bag, 'registrarStamp');
  if (index < 0) {
    toast("The ruby seal wants the Registrar's Stamp. The Chief Registrar keeps it.", 'warn');
    return;
  }
  progress.removeAt(index);
  dungeon.openGate();
  syncDungeonWorld();
  playSfx('wave');
  toast('The stamp turns in the lock. The gate opens for good.', 'info');
  track('gate_opened');
}

/** Chests open when Rosa walks up to them (once ever). If the bag cannot hold the loot they stay closed. */
export function stepChests(pos: Vec2): void {
  const chests = currentMap.chests;
  if (!chests || !isUnderground(pos)) return;
  const taken = useDungeonStore.getState().cachesTaken;
  for (const chest of chests) {
    if (taken.includes(chest.id)) continue;
    if (Math.hypot(chest.x - pos.x, chest.z - pos.z) > CHEST_REACH) continue;
    const loot = CHEST_LOOT[chest.id];
    if (!loot) continue;
    let bag = useProgressStore.getState().bag;
    let fits = true;
    for (const item of loot.items) {
      const added = addToBag(bag, item.id, item.qty);
      if (added.leftover > 0) fits = false;
      bag = added.bag;
    }
    if (!fits) {
      warnFull();
      continue;
    }
    useProgressStore.getState().setBag(bag);
    useDungeonStore.getState().takeCache(chest.id);
    playSfx('gather');
    toast(`Opened the ${loot.label}`, 'info');
    for (const item of loot.items)
      toast(`${item.qty > 1 ? `${item.qty} x ` : ''}${ITEMS[item.id].name}`, 'item');
    track('chest_opened', { id: chest.id });
  }
}

let lastFullWarning = 0;
function warnFull(): void {
  const now = performance.now();
  if (now - lastFullWarning < 3000) return;
  lastFullWarning = now;
  toast('Make room in your bag for the chest', 'warn');
}

/** The Chief Registrar always carries the stamp (until Rosa has it). */
export function onRegistrarDefeated(at: Vec2): void {
  const dungeon = useDungeonStore.getState();
  if (dungeon.stampFound || dungeon.gateOpen) return;
  if (countOf(useProgressStore.getState().bag, 'registrarStamp') > 0) return;
  spawnPickup('registrarStamp', { x: at.x, z: at.z + 0.6 });
  toast("The Chief Registrar drops the Registrar's Stamp", 'item');
}

/** Called when an item enters the bag: the stamp is a milestone for the quests. */
export function onItemCollected(item: string): void {
  if (item === 'registrarStamp') useDungeonStore.getState().findStamp();
}

export const BOSS_REWARD = { pearls: 5, charm: 'registrarSeal' } as const;

/** The boss falls: the fight is over for good, and the reward spills onto the floor. */
export function onBossDefeated(at: Vec2): void {
  const dungeon = useDungeonStore.getState();
  if (dungeon.bossDefeated) return;
  dungeon.defeatBoss();
  useToastStore.getState().announce('LORD BUMAZHNIK IS FILED UNDER "DEFEATED"');
  const spots = scatter(at, BOSS_REWARD.pearls + 1, Math.random);
  for (let i = 0; i < BOSS_REWARD.pearls; i++) {
    const spot = spots[i];
    if (spot) spawnPickup('pearl', spot);
  }
  const charm = spots[BOSS_REWARD.pearls];
  if (charm) spawnPickup(BOSS_REWARD.charm, charm);
  track('boss_defeated');
}

/** XP for the first visit to the underground. Call once at startup. */
export function startDungeonHooks(): void {
  useGameStore.subscribe((state, prev) => {
    if (state.underground && !prev.underground) {
      awardOnce('underground', 40, 'Entered the Moscow underground');
    }
  });
}
