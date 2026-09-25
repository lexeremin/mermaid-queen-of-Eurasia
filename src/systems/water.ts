import type { Collider } from '@/systems/collision';
import type { Vec2 } from '@/utils/vec2';

/** Whether a point is over water: inside any of the water colliders' capsules. */
export function isInWater(water: readonly Collider[] | undefined, p: Vec2): boolean {
  if (!water) return false;
  for (const c of water) {
    if (c.kind !== 'capsule') continue;
    const abx = c.bx - c.ax;
    const abz = c.bz - c.az;
    const lengthSq = abx * abx + abz * abz;
    let t = lengthSq === 0 ? 0 : ((p.x - c.ax) * abx + (p.z - c.az) * abz) / lengthSq;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    if (Math.hypot(p.x - (c.ax + abx * t), p.z - (c.az + abz * t)) <= c.r) return true;
  }
  return false;
}
