import { describe, expect, it } from 'vitest';
import { VILLAGE } from '@/data/maps/village';
import { resolveCircle } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { zoneAt } from '@/systems/zones';

const world = buildCollisionWorld(VILLAGE);
const STEP = 0.4;
const { bounds } = VILLAGE;

const walkable = (x: number, z: number): boolean => {
  const p = resolveCircle({ x, z }, PLAYER_RADIUS, world);
  return Math.abs(p.x - x) < 1e-6 && Math.abs(p.z - z) < 1e-6;
};

function riverCenterZ(x: number): number {
  const pts = VILLAGE.river.ribbon.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a && b && x >= a[0] && x <= b[0])
      return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
  }
  return NaN;
}

function floodFromSpawn(): Set<string> {
  const cols = Math.floor((bounds.maxX - bounds.minX) / STEP);
  const rows = Math.floor((bounds.maxZ - bounds.minZ) / STEP);
  const key = (i: number, j: number) => `${i},${j}`;
  const toWorld = (i: number, j: number): [number, number] => [
    bounds.minX + i * STEP,
    bounds.minZ + j * STEP,
  ];
  const start = [
    Math.round((VILLAGE.spawn.x - bounds.minX) / STEP),
    Math.round((VILLAGE.spawn.z - bounds.minZ) / STEP),
  ] as const;
  const seen = new Set<string>([key(...start)]);
  const queue: (readonly [number, number])[] = [start];
  while (queue.length > 0) {
    const [i, j] = queue.pop() as readonly [number, number];
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
  return seen;
}

describe('village map', () => {
  it('spawns Rosa on free ground inside the bounds', () => {
    expect(walkable(VILLAGE.spawn.x, VILLAGE.spawn.z)).toBe(true);
  });

  it('keeps colliding placements inside the walkable bounds', () => {
    for (const p of VILLAGE.placements) {
      if (p.collide === false) continue;
      expect(p.x).toBeGreaterThan(bounds.minX);
      expect(p.x).toBeLessThan(bounds.maxX);
      expect(p.z).toBeGreaterThan(bounds.minZ);
      expect(p.z).toBeLessThan(bounds.maxZ);
    }
  });

  it('blocks the river and the buildings', () => {
    expect(walkable(-10, riverCenterZ(-10))).toBe(false);
    expect(walkable(20, riverCenterZ(20))).toBe(false);
    expect(walkable(-11, -7)).toBe(false);
    expect(walkable(0, 2)).toBe(false);
  });

  it('lets Rosa reach the forest entrance, and only across the bridge', () => {
    const reached = floodFromSpawn();
    const cells = [...reached].map((k) => k.split(',').map(Number) as [number, number]);
    const points = cells.map(([i, j]) => ({
      x: bounds.minX + (i ?? 0) * STEP,
      z: bounds.minZ + (j ?? 0) * STEP,
    }));

    expect(points.some((p) => zoneAt(VILLAGE.zones, p)?.id === 'forest-entrance')).toBe(true);
    expect(points.some((p) => p.z < riverCenterZ(0) - 4)).toBe(true);

    const inRiverBand = points.filter(
      (p) => Math.abs(p.x) > 3.5 && Math.abs(p.z - riverCenterZ(p.x)) < 1.5,
    );
    expect(inRiverBand).toHaveLength(0);
    const onBridge = points.filter((p) => Math.abs(p.x) < 1 && Math.abs(p.z - riverCenterZ(0)) < 1);
    expect(onBridge.length).toBeGreaterThan(0);
  });
});
