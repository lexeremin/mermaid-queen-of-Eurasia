import { ENEMIES, type EnemyKind } from '@/data/enemies';
import { chestLoot } from '@/data/chests';
import { ITEMS, type ItemId } from '@/data/items';
import { METRO } from '@/data/maps/red-square';
import { BOSS_EVERY, MAX_LAYER, isUnderground } from '@/data/maps/underground';
import { playSfx } from '@/audio/sfx';
import { combat } from '@/game/combat-sim';
import {
  activeLevel,
  enterLayer,
  hallsAreClear,
  leaveDungeon,
  syncDungeonWorld,
} from '@/game/dungeon-sim';
import { spawnPickup } from '@/game/loot-sim';
import { awardOnce } from '@/game/progress-actions';
import { sim } from '@/game/sim';
import { currentWorld } from '@/game/world/current-map';
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
  combat.seaWaves = [];
  combat.sharks = [];
  pushEffect(combat, 'bubbles', from.x, from.z, { x: 0, z: 1 }, 0.8, 1.2);
  pushEffect(combat, 'bubbles', pos.x, pos.z, { x: 0, z: 1 }, 0.8, 1.2);
  useGameStore.getState().setUnderground(isUnderground(pos));
  // Anywhere on the surface (Recall, the pavilion) means the layer she was in is left behind.
  if (!isUnderground(pos) && useDungeonStore.getState().layer > 0) leaveDungeon();
  if (arrivalToast) toast(arrivalToast, 'info');
}

/**
 * Rosa steps into `layer` from the metro pavilion or from the stairs of the layer above (arriving at its landing),
 * or from below (arriving at the stairs down). The layer is made fresh: full of monsters, the gate shut.
 */
function enter(layer: number, from: 'above' | 'below'): void {
  enterLayer(layer);
  const level = activeLevel();
  if (!level) return;
  travelTo(from === 'above' ? level.arrival : level.arrivalDown);
  if (layer > 1 && from === 'above') toast(`Depth ${layer}`, 'info');
}

/** From the metro pavilion: down to `layer` (layer 1, the Ticket Hall, unless she has already been deeper). */
export function goDown(layer = 1): void {
  const target = Math.max(1, Math.min(layer, Math.max(1, useDungeonStore.getState().deepest)));
  track('underground_entered', { layer: target });
  enter(target, 'above');
}

/** The stairs up: to the layer above (or the surface from layer 1). */
export function goUp(): void {
  const { layer } = useDungeonStore.getState();
  if (layer <= 1) {
    leaveDungeon();
    travelTo(METRO.door);
    return;
  }
  enter(layer - 1, 'below');
}

/** The stairs down: to the next layer. */
export function goDeeper(): void {
  const { layer } = useDungeonStore.getState();
  if (layer >= MAX_LAYER) {
    toast('This is the deepest stair in Moscow.', 'info');
    return;
  }
  track('layer_entered', { layer: layer + 1 });
  enter(layer + 1, 'above');
}

/** The layers the metro door offers: the first, every tenth reached, and the deepest. */
export function depthChoices(deepest: number): number[] {
  const list = new Set<number>([1]);
  for (let n = BOSS_EVERY; n <= deepest; n += BOSS_EVERY) list.add(n);
  if (deepest >= 1) list.add(deepest);
  return [...list].sort((x, y) => x - y);
}

/** Chests open when Rosa walks up to them (once ever). If the bag cannot hold the loot they stay closed. */
export function stepChests(pos: Vec2): void {
  const chests = activeLevel()?.chests;
  if (!chests || !isUnderground(pos)) return;
  const taken = useDungeonStore.getState().cachesTaken;
  for (const chest of chests) {
    if (taken.includes(chest.id)) continue;
    if (Math.hypot(chest.x - pos.x, chest.z - pos.z) > CHEST_REACH) continue;
    const loot = chestLoot(chest.id);
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

/** Once every monster of the layer is down, it counts as cleared and (on a boss layer) the gate opens. */
export function stepGate(pos: Vec2): void {
  const dungeon = useDungeonStore.getState();
  if (dungeon.layerCleared || dungeon.layer === 0 || !isUnderground(pos) || !hallsAreClear())
    return;
  dungeon.setLayerCleared();
  dungeon.clearHalls();
  playSfx('wave');
  if (activeLevel()?.gate) {
    dungeon.openGate();
    syncDungeonWorld();
    toast('The layer is silent. The gate to the Vault opens.', 'info');
    track('gate_opened', { layer: dungeon.layer });
  } else {
    toast('The layer is silent. The way down is clear.', 'info');
    track('layer_cleared', { layer: dungeon.layer });
  }
}

/** What the boss of `layer` leaves behind: pearls on every boss layer, and gear that gets better with depth. */
export function bossReward(layer: number): { pearls: number; gear: ItemId } {
  if (layer <= BOSS_EVERY) return { pearls: 5, gear: 'registrarSeal' };
  const pool: ItemId[] = ['pearlTrident', 'velvetGown', 'songbirdWhistle', 'archangelFeather'];
  return {
    pearls: 5 + Math.floor(layer / BOSS_EVERY),
    gear: pool[(layer / BOSS_EVERY) % pool.length]!,
  };
}

/** The boss falls. The reward spills onto the floor, once per boss layer; the boss returns on the next visit. */
export function onBossDefeated(at: Vec2, kind: EnemyKind = 'boss'): void {
  const dungeon = useDungeonStore.getState();
  const layer = dungeon.layer;
  const first = !dungeon.bossDefeated;
  useToastStore.getState().announce(`${ENEMIES[kind].name.toUpperCase()} IS DOWN`);
  if (dungeon.bossLayers.includes(layer)) {
    dungeon.payBoss(layer);
    return;
  }
  dungeon.payBoss(layer);
  const reward = bossReward(layer);
  const spots = scatter(at, reward.pearls + 1, Math.random);
  for (let i = 0; i < reward.pearls; i++) {
    const spot = spots[i];
    if (spot) spawnPickup('pearl', spot);
  }
  const charm = spots[reward.pearls];
  if (charm) spawnPickup(reward.gear, charm);
  track('boss_defeated', { layer, first });
}

/** XP for the first visit to the underground. Call once at startup. */
export function startDungeonHooks(): void {
  useGameStore.subscribe((state, prev) => {
    if (state.underground && !prev.underground) {
      awardOnce('underground', 40, 'Entered the Moscow underground');
    }
  });
}
