import type { EnemyKind } from '@/data/enemies';
import type { ItemId } from '@/data/items';
import { rollLoot } from '@/systems/loot';
import { DROP_DELAY, scatter, type Pickup } from '@/systems/pickups';
import type { Vec2 } from '@/utils/vec2';

/** Mutable ground loot, like `combat`. Read by the renderer every frame. */
export const loot: { pickups: Pickup[]; nextId: number } = { pickups: [], nextId: 1 };

export function resetLoot(): void {
  loot.pickups = [];
}

export function spawnPickup(item: ItemId, pos: Vec2, collectAfter = 0): void {
  loot.pickups.push({ id: loot.nextId++, item, pos: { ...pos }, age: 0, collectAfter });
}

/** Rolls the enemy's loot table and scatters the drops around where it fell. */
export function spawnDrops(
  kind: EnemyKind,
  at: Vec2,
  random: () => number = Math.random,
): ItemId[] {
  const drops = rollLoot(kind, random);
  const spots = scatter(at, drops.length, random);
  drops.forEach((id, i) => {
    const spot = spots[i];
    if (spot) spawnPickup(id, spot);
  });
  return drops;
}

export function dropOnGround(item: ItemId, at: Vec2): void {
  spawnPickup(item, { x: at.x + 0.9, z: at.z + 0.4 }, DROP_DELAY);
}
