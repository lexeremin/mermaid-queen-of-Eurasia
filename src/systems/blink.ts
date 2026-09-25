import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import type { Vec2 } from '@/utils/vec2';

/** The point `range` metres at most from `from`, toward `aim`. */
export function clampToRange(from: Vec2, aim: Vec2, range: number): Vec2 {
  const dx = aim.x - from.x;
  const dz = aim.z - from.z;
  const d = Math.hypot(dx, dz);
  if (d <= range) return { x: aim.x, z: aim.z };
  return { x: from.x + (dx / d) * range, z: from.z + (dz / d) * range };
}

const STEP = 0.5;

/**
 * Where a blink toward `aim` lands: the aim point (held to `range`) if Rosa can stand there, otherwise the
 * closest spot along the way back to her that she can. Walls and props do not stop the blink, but it never lands
 * somewhere she could not walk to (`sameRegion` rejects other regions, like the far side of a shut gate).
 * Returns null when there is nowhere better than where she already is.
 */
export function pickBlinkDestination(
  from: Vec2,
  aim: Vec2,
  range: number,
  world: CollisionWorld,
  sameRegion: (to: Vec2) => boolean,
  minDistance = 1,
): Vec2 | null {
  const target = clampToRange(from, aim, range);
  const total = Math.hypot(target.x - from.x, target.z - from.z);
  if (total < minDistance) return null;
  for (let d = total; d >= minDistance; d -= STEP) {
    const t = d / total;
    const p = { x: from.x + (target.x - from.x) * t, z: from.z + (target.z - from.z) * t };
    const inBounds =
      p.x > world.bounds.minX &&
      p.x < world.bounds.maxX &&
      p.z > world.bounds.minZ &&
      p.z < world.bounds.maxZ;
    if (!inBounds) continue;
    const free = resolveCircle(p, PLAYER_RADIUS, world);
    if (Math.abs(free.x - p.x) > 1e-6 || Math.abs(free.z - p.z) > 1e-6) continue;
    if (sameRegion(p)) return p;
  }
  return null;
}
