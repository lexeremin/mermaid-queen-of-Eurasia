import { describe, expect, it } from 'vitest';
import { RED_SQUARE } from '@/data/maps/red-square';
import { resolveCircle } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid, findPath } from '@/systems/pathfinding';

const world = buildCollisionWorld(RED_SQUARE);
const grid = createNavGrid(world, PLAYER_RADIUS, 0.5);
const entrances = RED_SQUARE.entrances ?? [];
const REACH = 8;
/** How far the straight corridor must stay clear on each side: GUM's interior is a 9 m wide gallery. */
const reachOf = (id: string): readonly [number, number] =>
  id.startsWith('gum') ? [3.5, REACH] : [REACH, REACH];

const free = (x: number, z: number) => {
  const p = resolveCircle({ x, z }, PLAYER_RADIUS, world);
  return Math.hypot(p.x - x, p.z - z) < 1e-6;
};

/** Point at distance `t` along the direction of travel and `side` metres to the left of it. */
const at = (e: (typeof entrances)[number], t: number, side: number) =>
  e.axis === 'x' ? { x: e.x + t, z: e.z + side } : { x: e.x + side, z: e.z + t };

describe('entrances', () => {
  it('lists the three GUM portals, the Resurrection Gate and the garden gate', () => {
    expect(entrances.map((e) => e.id).sort()).toEqual(
      [
        'garden-gate',
        'gum-portal--18',
        'gum-portal-0',
        'gum-portal-18',
        'resurrection-gate',
      ].sort(),
    );
    expect(new Set(entrances.map((e) => e.id)).size).toBe(entrances.length);
  });

  it('has a clear corridor straight through, 8 m out on the plaza side, with nothing in the way', () => {
    for (const e of entrances) {
      const [back, front] = reachOf(e.id);
      for (let t = -back; t <= front; t += 0.25) {
        for (const side of [-0.7, 0, 0.7]) {
          const p = at(e, t, side);
          expect(
            free(p.x, p.z),
            `${e.id} blocked at ${t} m, ${side} m aside (${p.x}, ${p.z})`,
          ).toBe(true);
        }
      }
    }
  });

  it('is wide enough for Rosa and a companion side by side', () => {
    for (const e of entrances) expect(e.width).toBeGreaterThanOrEqual(3);
  });

  it('can be walked to and through from the spawn', () => {
    for (const e of entrances) {
      const [back, front] = reachOf(e.id);
      const a = at(e, -back, 0);
      const b = at(e, front, 0);
      expect(findPath(grid, RED_SQUARE.spawn, a), `${e.id} near side`).not.toBeNull();
      expect(findPath(grid, a, b), `${e.id} through`).not.toBeNull();
    }
  });
});
