export type Vec2 = { x: number; z: number };

const EPSILON = 1e-6;

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.z);
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  return len < EPSILON ? { x: 0, z: 0 } : { x: v.x / len, z: v.z / len };
}

export function isZero(v: Vec2): boolean {
  return length(v) < EPSILON;
}
