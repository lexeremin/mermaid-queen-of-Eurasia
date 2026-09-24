import type { ItemId } from '@/data/items';
import type { Vec2 } from '@/utils/vec2';

export type Pickup = {
  id: number;
  item: ItemId;
  pos: Vec2;
  age: number;
  /** Age (seconds) before it can be collected; a dropped item is ignored for a moment. */
  collectAfter: number;
};

export const COLLECT_RADIUS = 1.3;
export const MAGNET_RADIUS = 3;
export const MAGNET_SPEED = 6;
export const PICKUP_LIFE = 60;
export const DROP_DELAY = 3;

export type PickupStep = {
  pickups: Pickup[];
  collected: ItemId[];
  /** Items in range that could not be collected because the bag is full. */
  blocked: ItemId[];
};

/**
 * Advances pickups: ageing and expiry, magnet pull, collection. `tryAdd` is asked for each item in
 * reach and returns true when the bag took it. Pure apart from `tryAdd`.
 */
export function stepPickups(
  pickups: readonly Pickup[],
  player: Vec2,
  dt: number,
  tryAdd: (item: ItemId) => boolean,
): PickupStep {
  const kept: Pickup[] = [];
  const collected: ItemId[] = [];
  const blocked: ItemId[] = [];
  for (const p of pickups) {
    const age = p.age + dt;
    if (age >= PICKUP_LIFE) continue;
    let pos = p.pos;
    const dx = player.x - pos.x;
    const dz = player.z - pos.z;
    const d = Math.hypot(dx, dz);
    const ready = age >= p.collectAfter;
    if (ready && d <= COLLECT_RADIUS) {
      if (tryAdd(p.item)) {
        collected.push(p.item);
        continue;
      }
      blocked.push(p.item);
    } else if (ready && d <= MAGNET_RADIUS && d > 1e-6) {
      const step = Math.min(d, MAGNET_SPEED * dt);
      pos = { x: pos.x + (dx / d) * step, z: pos.z + (dz / d) * step };
    }
    kept.push({ ...p, age, pos });
  }
  return { pickups: kept, collected, blocked };
}

/** Scatter positions on a ring around a death point. `random` returns [0, 1). */
export function scatter(center: Vec2, count: number, random: () => number): Vec2[] {
  const start = random() * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = start + (i / Math.max(1, count)) * Math.PI * 2;
    const radius = 0.8 + random() * 0.6;
    return { x: center.x + Math.cos(angle) * radius, z: center.z + Math.sin(angle) * radius };
  });
}
