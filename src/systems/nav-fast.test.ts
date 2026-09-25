import { describe, expect, it } from 'vitest';
import { RED_SQUARE } from '@/data/maps/red-square';
import { UNDERGROUND } from '@/data/maps/underground';
import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createFreeTest, createNavGrid } from '@/systems/pathfinding';

const slow = (world: CollisionWorld, x: number, z: number): boolean => {
  const p = resolveCircle({ x, z }, PLAYER_RADIUS, world);
  return Math.abs(p.x - x) < 1e-6 && Math.abs(p.z - z) < 1e-6;
};

describe('fast free-cell test', () => {
  const world: CollisionWorld = {
    bounds: { minX: 0, maxX: 20, minZ: 0, maxZ: 20 },
    colliders: [
      { kind: 'box', cx: 10, cz: 10, hx: 2, hz: 1 },
      { kind: 'circle', x: 4, z: 4, r: 1 },
      { kind: 'capsule', ax: 14, az: 3, bx: 18, bz: 9, r: 0.7 },
    ],
  };

  it('agrees with pushing a circle out of the colliders, on a dense sample', () => {
    const test = createFreeTest(world, PLAYER_RADIUS);
    for (let x = -1; x <= 21; x += 0.13) {
      for (let z = -1; z <= 21; z += 0.13) {
        expect(test.isFree(x, z), `${x.toFixed(2)},${z.toFixed(2)}`).toBe(slow(world, x, z));
      }
    }
  });

  it('agrees on the whole real map, gate shut, on the grid the game uses', () => {
    const real = buildCollisionWorld(RED_SQUARE);
    const colliders = [...real.colliders, UNDERGROUND.gate.box];
    const shut: CollisionWorld = { bounds: real.bounds, colliders };
    const test = createFreeTest(shut, PLAYER_RADIUS);
    let checked = 0;
    for (let x = shut.bounds.minX; x <= shut.bounds.maxX; x += 1.5) {
      for (let z = shut.bounds.minZ; z <= shut.bounds.maxZ; z += 1.5) {
        if (test.isFree(x, z) !== slow(shut, x, z)) throw new Error(`differs at ${x},${z}`);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(5000);
  });

  it('notices colliders added later after a rebuild', () => {
    const colliders = [...world.colliders];
    const w: CollisionWorld = { bounds: world.bounds, colliders };
    const test = createFreeTest(w, PLAYER_RADIUS);
    expect(test.isFree(16, 16)).toBe(true);
    colliders.push({ kind: 'circle', x: 16, z: 16, r: 1 });
    test.rebuild();
    expect(test.isFree(16, 16)).toBe(false);
  });
});

describe('nav grid warming', () => {
  it('fills the whole real map quickly and reports when it is ready', async () => {
    const real = buildCollisionWorld(RED_SQUARE);
    const grid = createNavGrid(real, PLAYER_RADIUS, 0.5);
    const start = performance.now();
    await grid.prewarm();
    await grid.ready();
    expect(performance.now() - start).toBeLessThan(1500);
    const [i, j] = grid.toCell(RED_SQUARE.spawn.x, RED_SQUARE.spawn.z);
    expect(grid.isFreeCell(i, j)).toBe(true);
  });

  it('re-warms after a reset', async () => {
    const colliders: CollisionWorld['colliders'][number][] = [];
    const w: CollisionWorld = { bounds: { minX: 0, maxX: 10, minZ: 0, maxZ: 10 }, colliders };
    const grid = createNavGrid(w, PLAYER_RADIUS, 0.5);
    await grid.prewarm();
    colliders.push({ kind: 'box', cx: 5, cz: 5, hx: 1, hz: 1 });
    grid.reset();
    await grid.ready();
    const [i, j] = grid.toCell(5, 5);
    expect(grid.isFreeCell(i, j)).toBe(false);
  });
});
