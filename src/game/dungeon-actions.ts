import { CHEST_LOOT } from '@/data/chests';
import { ITEMS } from '@/data/items';
import { METRO } from '@/data/maps/red-square';
import { UNDERGROUND, isUnderground } from '@/data/maps/underground';
import { playSfx } from '@/audio/sfx';
import { combat } from '@/game/combat-sim';
import { hallsAreClear, resetInstance, syncDungeonWorld } from '@/game/dungeon-sim';
import { spawnPickup } from '@/game/loot-sim';
import { awardOnce } from '@/game/progress-actions';
import { sim } from '@/game/sim';
import { currentMap, currentWorld } from '@/game/world/current-map';
import { track } from '@/net/stats';
import { useDungeonStore } from '@/store/dungeon-store';
import { useGameStore } from '@/store/game-store';
import { useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { pushEffect } from '@/systems/combat';
import { resolveCircle } from '@/systems/collision';
import { addAllToStash } from '@/systems/inventory';
import { PLAYER_RADIUS } from '@/systems/movement';
import { scatter } from '@/systems/pickups';
import type { Vec2 } from '@/utils/vec2';

const toast = (text: string, kind: 'xp' | 'item' | 'warn' | 'info' = 'info') =>
  useToastStore.getState().push(text, kind);

/** Rosa opens a chest by walking this close to it. */
export const CHEST_REACH = 1.3;

/** Moves Rosa straight to `dest` (metro, stairs, Recall): no loading screen and no fade, just a burst of bubbles. */
export function travelTo(dest: Vec2, arrivalToast?: string): void {
  const from = { ...sim.curr.pos };
  const pos = resolveCircle(dest, PLAYER_RADIUS, currentWorld);
  sim.prev = { ...sim.curr, pos };
  sim.curr = { ...sim.curr, pos };
  sim.path = [];
  sim.talkTo = null;
  combat.projectiles = [];
  pushEffect(combat, 'bubbles', from.x, from.z, { x: 0, z: 1 }, 0.8, 1.2);
  pushEffect(combat, 'bubbles', pos.x, pos.z, { x: 0, z: 1 }, 0.8, 1.2);
  useGameStore.getState().setUnderground(isUnderground(pos));
  if (arrivalToast) toast(arrivalToast, 'info');
}

export function goDown(): void {
  resetInstance();
  track('underground_entered');
  travelTo(UNDERGROUND.arrival);
}

export function goUp(): void {
  travelTo(METRO.door);
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
    const { bag, keepsakes } = useProgressStore.getState();
    const next = addAllToStash({ bag, keepsakes }, loot.items);
    if (!next) {
      warnFull();
      continue;
    }
    useProgressStore.getState().setStash(next.bag, next.keepsakes);
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

/** Once every monster of the halls is down, the boss gate opens by itself (until Rosa re-enters). */
export function stepGate(pos: Vec2): void {
  const dungeon = useDungeonStore.getState();
  if (dungeon.gateOpen || !isUnderground(pos) || !hallsAreClear()) return;
  dungeon.clearHalls();
  dungeon.openGate();
  syncDungeonWorld();
  playSfx('wave');
  toast('The halls are silent. The gate to the Vault opens.', 'info');
  track('gate_opened');
}

export const BOSS_REWARD = { pearls: 5, charm: 'registrarSeal' } as const;

/** The boss falls: the fight is over for good, and the reward spills onto the floor. */
export function onBossDefeated(at: Vec2): void {
  const dungeon = useDungeonStore.getState();
  if (dungeon.bossDefeated) return;
  dungeon.defeatBoss();
  useToastStore.getState().announce('THE FATHER OF CORRUPTION IS NO MORE');
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
