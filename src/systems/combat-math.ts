import type { Vec2 } from '@/utils/vec2';

const dist = (a: Vec2, b: Vec2): number => Math.hypot(b.x - a.x, b.z - a.z);

/** Angle (radians) between two unit-ish direction vectors. */
export function angleBetween(a: Vec2, b: Vec2): number {
  const la = Math.hypot(a.x, a.z);
  const lb = Math.hypot(b.x, b.z);
  if (la < 1e-9 || lb < 1e-9) return 0;
  const cos = (a.x * b.x + a.z * b.z) / (la * lb);
  return Math.acos(Math.min(1, Math.max(-1, cos)));
}

/** Is a circular target inside a cone in front of `origin`? */
export function inCone(
  origin: Vec2,
  facing: Vec2,
  target: Vec2,
  targetRadius: number,
  range: number,
  halfAngle: number,
): boolean {
  const d = dist(origin, target);
  if (d > range + targetRadius) return false;
  if (d <= targetRadius) return true;
  const toTarget = { x: target.x - origin.x, z: target.z - origin.z };
  const slack = Math.asin(Math.min(1, targetRadius / d));
  return angleBetween(facing, toTarget) <= halfAngle + slack;
}

export const inCircle = (
  center: Vec2,
  target: Vec2,
  targetRadius: number,
  radius: number,
): boolean => dist(center, target) <= radius + targetRadius;

/** In a ring band (for expanding aura rings): distance within [inner, outer] of the target's radius. */
export const inBand = (center: Vec2, target: Vec2, inner: number, outer: number): boolean => {
  const d = dist(center, target);
  return d >= inner && d <= outer;
};

export type AimTarget = { id: string; pos: Vec2; radius: number };

/**
 * Nearest target within `range` and `maxAngle` of the facing direction; returns the direction to
 * aim, or the original facing if nothing qualifies.
 */
export function aimAssist(
  origin: Vec2,
  facing: Vec2,
  targets: readonly AimTarget[],
  range: number,
  maxAngle: number,
): Vec2 {
  let best: AimTarget | null = null;
  let bestDistance = Infinity;
  for (const t of targets) {
    const d = dist(origin, t.pos);
    if (d > range + t.radius) continue;
    if (angleBetween(facing, { x: t.pos.x - origin.x, z: t.pos.z - origin.z }) > maxAngle) continue;
    if (d < bestDistance) {
      best = t;
      bestDistance = d;
    }
  }
  if (!best) return facing;
  const dx = best.pos.x - origin.x;
  const dz = best.pos.z - origin.z;
  const len = Math.hypot(dx, dz);
  return len < 1e-6 ? facing : { x: dx / len, z: dz / len };
}

/** Unit vector pointing from `from` to `to`, or (0, 1) when they coincide. */
export function directionTo(from: Vec2, to: Vec2): Vec2 {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.hypot(dx, dz);
  return len < 1e-6 ? { x: 0, z: 1 } : { x: dx / len, z: dz / len };
}
