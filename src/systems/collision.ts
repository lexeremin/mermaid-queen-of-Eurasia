import type { Shape } from '@/data/types';
import { clamp } from '@/utils/math';
import type { Vec2 } from '@/utils/vec2';

export type Collider =
  | { kind: 'box'; cx: number; cz: number; hx: number; hz: number }
  | { kind: 'circle'; x: number; z: number; r: number }
  | { kind: 'capsule'; ax: number; az: number; bx: number; bz: number; r: number };

export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };
export type CollisionWorld = {
  bounds: Bounds;
  colliders: readonly Collider[];
  /** Swim zones: capsules along rivers and ponds. Not solid; `isInWater` tests against them. */
  water?: readonly Collider[];
};

const PASSES = 4;

function pushFromPoint(pos: Vec2, px: number, pz: number, minDistance: number): Vec2 {
  const dx = pos.x - px;
  const dz = pos.z - pz;
  const dist = Math.hypot(dx, dz);
  if (dist >= minDistance) return pos;
  if (dist < 1e-9) return { x: pos.x, z: pos.z + minDistance };
  const k = minDistance / dist;
  return { x: px + dx * k, z: pz + dz * k };
}

function pushFromBox(pos: Vec2, c: Extract<Collider, { kind: 'box' }>, radius: number): Vec2 {
  const nearestX = clamp(pos.x, c.cx - c.hx, c.cx + c.hx);
  const nearestZ = clamp(pos.z, c.cz - c.hz, c.cz + c.hz);
  const inside = nearestX === pos.x && nearestZ === pos.z;
  if (!inside) return pushFromPoint(pos, nearestX, nearestZ, radius);

  const toMinX = pos.x - (c.cx - c.hx);
  const toMaxX = c.cx + c.hx - pos.x;
  const toMinZ = pos.z - (c.cz - c.hz);
  const toMaxZ = c.cz + c.hz - pos.z;
  const smallest = Math.min(toMinX, toMaxX, toMinZ, toMaxZ);
  if (smallest === toMinX) return { x: c.cx - c.hx - radius, z: pos.z };
  if (smallest === toMaxX) return { x: c.cx + c.hx + radius, z: pos.z };
  if (smallest === toMinZ) return { x: pos.x, z: c.cz - c.hz - radius };
  return { x: pos.x, z: c.cz + c.hz + radius };
}

function pushFromCapsule(
  pos: Vec2,
  c: Extract<Collider, { kind: 'capsule' }>,
  radius: number,
): Vec2 {
  const abx = c.bx - c.ax;
  const abz = c.bz - c.az;
  const lengthSq = abx * abx + abz * abz;
  const t =
    lengthSq === 0 ? 0 : clamp(((pos.x - c.ax) * abx + (pos.z - c.az) * abz) / lengthSq, 0, 1);
  return pushFromPoint(pos, c.ax + abx * t, c.az + abz * t, c.r + radius);
}

function push(pos: Vec2, collider: Collider, radius: number): Vec2 {
  switch (collider.kind) {
    case 'box':
      return pushFromBox(pos, collider, radius);
    case 'circle':
      return pushFromPoint(pos, collider.x, collider.z, collider.r + radius);
    case 'capsule':
      return pushFromCapsule(pos, collider, radius);
  }
}

/** Moves a circle out of every collider and inside the map bounds. Sliding falls out of push-out. */
export function resolveCircle(start: Vec2, radius: number, world: CollisionWorld): Vec2 {
  const { bounds } = world;
  let pos = start;
  for (let pass = 0; pass < PASSES; pass++) {
    for (const collider of world.colliders) pos = push(pos, collider, radius);
    pos = {
      x: clamp(pos.x, bounds.minX + radius, bounds.maxX - radius),
      z: clamp(pos.z, bounds.minZ + radius, bounds.maxZ - radius),
    };
  }
  return pos;
}

const round = (v: number): number => Math.round(v * 1e9) / 1e9;

/**
 * Places asset-local footprint shapes into the world, rotating like three.js `rotation.y`.
 * Boxes only support quarter turns (they stay axis-aligned); circles accept any angle.
 */
export function footprintToColliders(
  shapes: readonly Shape[],
  x: number,
  z: number,
  rotY = 0,
  scale = 1,
): Collider[] {
  const quarterTurns = Math.round(rotY / (Math.PI / 2));
  const isQuarter = Math.abs(rotY - quarterTurns * (Math.PI / 2)) < 1e-6;
  const cos = Math.cos(rotY);
  const sin = Math.sin(rotY);
  const swap = Math.abs(quarterTurns) % 2 === 1;
  return shapes.map((shape): Collider => {
    const lx = shape.x * scale;
    const lz = shape.z * scale;
    const wx = x + round(lx * cos + lz * sin);
    const wz = z + round(-lx * sin + lz * cos);
    if (shape.kind === 'circle') return { kind: 'circle', x: wx, z: wz, r: shape.r * scale };
    if (!isQuarter)
      throw new Error(`Box collider rotation must be a multiple of 90 degrees, got ${rotY}`);
    return {
      kind: 'box',
      cx: wx,
      cz: wz,
      hx: (swap ? shape.hz : shape.hx) * scale,
      hz: (swap ? shape.hx : shape.hz) * scale,
    };
  });
}

/** Chain of capsules along a polyline, e.g. a river. */
export function polylineToCapsules(
  points: readonly (readonly [number, number])[],
  r: number,
): Collider[] {
  const capsules: Collider[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a && b) capsules.push({ kind: 'capsule', ax: a[0], az: a[1], bx: b[0], bz: b[1], r });
  }
  return capsules;
}
