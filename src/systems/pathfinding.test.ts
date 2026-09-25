import { describe, expect, it } from 'vitest';
import type { CollisionWorld } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid, findPath, steerAlongPath } from '@/systems/pathfinding';

const bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
const open: CollisionWorld = { bounds, colliders: [] };
const wall: CollisionWorld = {
  bounds,
  colliders: [{ kind: 'box', cx: 0, cz: 0, hx: 1, hz: 12 }],
};
const closedRoom: CollisionWorld = {
  bounds,
  colliders: [{ kind: 'box', cx: 0, cz: 0, hx: 20, hz: 1 }],
};

const pathLength = (from: { x: number; z: number }, path: { x: number; z: number }[]): number => {
  let total = 0;
  let prev = from;
  for (const p of path) {
    total += Math.hypot(p.x - prev.x, p.z - prev.z);
    prev = p;
  }
  return total;
};

describe('findPath', () => {
  it('goes straight in open ground with a single waypoint', () => {
    const grid = createNavGrid(open, PLAYER_RADIUS);
    const path = findPath(grid, { x: -10, z: 5 }, { x: 8, z: -6 });
    expect(path).toHaveLength(1);
    expect(path?.[0]).toEqual({ x: 8, z: -6 });
  });

  it('routes around a wall and every waypoint is walkable', () => {
    const grid = createNavGrid(wall, PLAYER_RADIUS);
    const from = { x: -8, z: 0 };
    const path = findPath(grid, from, { x: 8, z: 0 });
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(1);
    for (const p of path!) expect(grid.isFreePoint(p.x, p.z)).toBe(true);
    expect(pathLength(from, path!)).toBeLessThan(45);
    expect(pathLength(from, path!)).toBeGreaterThan(16);
  });

  it('keeps every segment collision free after smoothing', () => {
    const grid = createNavGrid(wall, PLAYER_RADIUS);
    const from = { x: -8, z: 0 };
    const path = findPath(grid, from, { x: 8, z: 0 })!;
    let prev = from;
    for (const p of path) {
      for (let t = 0; t <= 1; t += 0.05) {
        const x = prev.x + (p.x - prev.x) * t;
        const z = prev.z + (p.z - prev.z) * t;
        expect(grid.isFreePoint(x, z)).toBe(true);
      }
      prev = p;
    }
  });

  it('snaps a blocked target to the nearest free spot next to it', () => {
    const grid = createNavGrid(wall, PLAYER_RADIUS);
    const path = findPath(grid, { x: -8, z: 0 }, { x: 0, z: 0 });
    expect(path).not.toBeNull();
    const end = path![path!.length - 1]!;
    expect(grid.isFreePoint(end.x, end.z)).toBe(true);
    expect(Math.abs(end.x)).toBeLessThan(3);
  });

  it('returns null when the target is walled off', () => {
    const grid = createNavGrid(
      { bounds, colliders: [{ kind: 'box', cx: 0, cz: 0, hx: 25, hz: 1 }] },
      PLAYER_RADIUS,
    );
    expect(findPath(grid, { x: 0, z: 10 }, { x: 0, z: -10 })).toBeNull();
    expect(createNavGrid(closedRoom, PLAYER_RADIUS).cols).toBeGreaterThan(10);
  });
});

describe('steerAlongPath', () => {
  it('heads for the next waypoint at full speed', () => {
    const step = steerAlongPath({ x: 0, z: 0 }, [{ x: 0, z: -10 }]);
    expect(step.move.x).toBeCloseTo(0);
    expect(step.move.z).toBeCloseTo(-1);
    expect(step.path).toHaveLength(1);
  });

  it('drops reached waypoints and stops at the end', () => {
    const pos = { x: 0, z: 0 };
    const step = steerAlongPath(pos, [
      { x: 0.1, z: 0 },
      { x: 5, z: 0 },
    ]);
    expect(step.path).toHaveLength(1);
    expect(step.move.x).toBeCloseTo(1);
    const done = steerAlongPath({ x: 5, z: 0.1 }, [{ x: 5, z: 0 }]);
    expect(done.path).toHaveLength(0);
    expect(done.move).toEqual({ x: 0, z: 0 });
  });
});

describe('walkable regions', () => {
  const wall: CollisionWorld = {
    bounds: { minX: 0, maxX: 20, minZ: 0, maxZ: 20 },
    colliders: [{ kind: 'box', cx: 10, cz: 10, hx: 0.5, hz: 20 }],
  };

  it('tells whether two points can be walked between', () => {
    const grid = createNavGrid(wall, 0.4, 0.5);
    expect(grid.sameRegion({ x: 2, z: 5 }, { x: 4, z: 15 })).toBe(true);
    expect(grid.sameRegion({ x: 2, z: 5 }, { x: 18, z: 5 })).toBe(false);
  });

  it('notices when a wall goes away after a reset', () => {
    const colliders = [...wall.colliders];
    const world: CollisionWorld = { bounds: wall.bounds, colliders };
    const grid = createNavGrid(world, 0.4, 0.5);
    expect(grid.sameRegion({ x: 2, z: 5 }, { x: 18, z: 5 })).toBe(false);
    colliders.length = 0;
    grid.reset();
    expect(grid.sameRegion({ x: 2, z: 5 }, { x: 18, z: 5 })).toBe(true);
  });
});
