import { describe, expect, it } from 'vitest';
import { RED_SQUARE } from '@/data/maps/red-square';
import { resolveCircle } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { zoneAt } from '@/systems/zones';

const world = buildCollisionWorld(RED_SQUARE);
const STEP = 0.4;
const { bounds } = RED_SQUARE;

const walkable = (x: number, z: number): boolean => {
  const p = resolveCircle({ x, z }, PLAYER_RADIUS, world);
  return Math.abs(p.x - x) < 1e-6 && Math.abs(p.z - z) < 1e-6;
};

function canalCenterZ(x: number): number {
  const pts = RED_SQUARE.river.ribbon.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a && b && x >= a[0] && x <= b[0])
      return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
  }
  return NaN;
}

function floodFromSpawn(): { x: number; z: number }[] {
  const cols = Math.floor((bounds.maxX - bounds.minX) / STEP);
  const rows = Math.floor((bounds.maxZ - bounds.minZ) / STEP);
  const key = (i: number, j: number) => `${i},${j}`;
  const toWorld = (i: number, j: number): [number, number] => [
    bounds.minX + i * STEP,
    bounds.minZ + j * STEP,
  ];
  const start = [
    Math.round((RED_SQUARE.spawn.x - bounds.minX) / STEP),
    Math.round((RED_SQUARE.spawn.z - bounds.minZ) / STEP),
  ] as const;
  const seen = new Set<string>([key(...start)]);
  const queue: (readonly [number, number])[] = [start];
  const points: { x: number; z: number }[] = [];
  while (queue.length > 0) {
    const [i, j] = queue.pop() as readonly [number, number];
    const [x, z] = toWorld(i, j);
    points.push({ x, z });
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni > cols || nj > rows || seen.has(key(ni, nj))) continue;
      if (!walkable(...toWorld(ni, nj))) continue;
      seen.add(key(ni, nj));
      queue.push([ni, nj]);
    }
  }
  return points;
}

describe('Red Square map', () => {
  it('spawns Rosa on free ground inside the bounds', () => {
    expect(walkable(RED_SQUARE.spawn.x, RED_SQUARE.spawn.z)).toBe(true);
  });

  it('keeps colliding placements inside the walkable bounds', () => {
    for (const p of RED_SQUARE.placements) {
      if (p.collide === false) continue;
      expect(p.x).toBeGreaterThan(bounds.minX);
      expect(p.x).toBeLessThan(bounds.maxX);
      expect(p.z).toBeGreaterThan(bounds.minZ);
      expect(p.z).toBeLessThan(bounds.maxZ);
    }
  });

  it('places every non-colliding backdrop piece outside the walkable bounds', () => {
    for (const p of RED_SQUARE.placements) {
      if (p.collide !== false) continue;
      const inside =
        p.x > bounds.minX && p.x < bounds.maxX && p.z > bounds.minZ && p.z < bounds.maxZ;
      expect(inside).toBe(false);
    }
  });

  it('blocks the canal, stalls, lodge, gate posts and lampposts', () => {
    expect(walkable(-10, canalCenterZ(-10))).toBe(false);
    expect(walkable(10, canalCenterZ(10))).toBe(false);
    expect(walkable(13, -4)).toBe(false);
    expect(walkable(-11, 23)).toBe(false);
    expect(walkable(-14.5, 14 - 2.1)).toBe(false);
    expect(walkable(-14.5, 14 + 2.1)).toBe(false);
    expect(walkable(-8, 12)).toBe(false);
  });

  it('lets Rosa reach the Alexander Garden gate and the cathedral forecourt, only across the bridge', () => {
    const points = floodFromSpawn();

    expect(points.some((p) => zoneAt(RED_SQUARE.zones, p)?.id === 'garden-entrance')).toBe(true);
    expect(points.some((p) => p.z < canalCenterZ(0) - 4)).toBe(true);

    const inCanalBand = points.filter(
      (p) => Math.abs(p.x) > 4.5 && Math.abs(p.z - canalCenterZ(p.x)) < 1.5,
    );
    expect(inCanalBand).toHaveLength(0);
    const onBridge = points.filter((p) => Math.abs(p.x) < 1 && Math.abs(p.z - canalCenterZ(0)) < 1);
    expect(onBridge.length).toBeGreaterThan(0);
  });
});
