import type { Vec2 } from '@/utils/vec2';

export const TALK_RANGE = 2.8;
export const CLICK_PICK_RADIUS = 1.4;

export type Spot = { id: string; x: number; z: number };

function nearest(spots: readonly Spot[], point: Vec2, maxDistance: number): Spot | null {
  let best: Spot | null = null;
  let bestDistance = maxDistance;
  for (const spot of spots) {
    const d = Math.hypot(spot.x - point.x, spot.z - point.z);
    if (d <= bestDistance) {
      best = spot;
      bestDistance = d;
    }
  }
  return best;
}

/** The nearest NPC within talking range of the player. */
export const nearestTalkable = (spots: readonly Spot[], pos: Vec2): Spot | null =>
  nearest(spots, pos, TALK_RANGE);

/** The NPC under a clicked ground point, if any. */
export const npcAtPoint = (spots: readonly Spot[], point: Vec2): Spot | null =>
  nearest(spots, point, CLICK_PICK_RADIUS);

/** A spot next to the NPC on the side facing the player, to walk to before talking. */
export function approachPoint(spot: Spot, from: Vec2, distance = TALK_RANGE * 0.6): Vec2 {
  const dx = from.x - spot.x;
  const dz = from.z - spot.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: spot.x + (dx / len) * distance, z: spot.z + (dz / len) * distance };
}

export type Ray3 = {
  origin: { x: number; y: number; z: number };
  dir: { x: number; y: number; z: number };
};

export const NPC_HEIGHT = 2.1;
export const RAY_PICK_RADIUS = 0.75;

/** Squared distance between an infinite ray and the vertical segment at (x, z) from y=0 to `height`. */
function raySegmentDistance(ray: Ray3, x: number, z: number, height: number): number {
  const { origin: o, dir: d } = ray;
  // Ray: o + t d (t >= 0); segment: (x, s, z), s in [0, height]; segment direction (0, 1, 0).
  const wx = o.x - x;
  const wy = o.y;
  const wz = o.z - z;
  const a = d.x * d.x + d.y * d.y + d.z * d.z;
  const b = d.y;
  const c = 1;
  const dd = d.x * wx + d.y * wy + d.z * wz;
  const e = wy;
  const denom = a * c - b * b;
  let t = denom > 1e-9 ? (b * e - c * dd) / denom : 0;
  if (t < 0) t = 0;
  let sParam = (e + b * t) / c;
  if (sParam < 0) {
    sParam = 0;
    t = Math.max(0, -dd / a);
  } else if (sParam > height) {
    sParam = height;
    t = Math.max(0, (b * height - dd) / a);
  }
  const px = o.x + d.x * t - x;
  const py = o.y + d.y * t - sParam;
  const pz = o.z + d.z * t - z;
  return Math.hypot(px, py, pz);
}

/** The NPC whose body the ray passes closest to (within RAY_PICK_RADIUS). */
export function npcUnderRay(spots: readonly Spot[], ray: Ray3): Spot | null {
  let best: Spot | null = null;
  let bestDistance = RAY_PICK_RADIUS;
  for (const spot of spots) {
    const d = raySegmentDistance(ray, spot.x, spot.z, NPC_HEIGHT);
    if (d <= bestDistance) {
      best = spot;
      bestDistance = d;
    }
  }
  return best;
}
