import { describe, expect, it } from 'vitest';
import {
  footprintToColliders,
  polylineToCapsules,
  resolveCircle,
  type CollisionWorld,
} from '@/systems/collision';

const bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
const world = (colliders: CollisionWorld['colliders']): CollisionWorld => ({ bounds, colliders });
const R = 0.4;

describe('resolveCircle', () => {
  it('leaves a free position untouched', () => {
    expect(resolveCircle({ x: 5, z: 5 }, R, world([]))).toEqual({ x: 5, z: 5 });
  });

  it('pushes out of a box along the nearest face', () => {
    const w = world([{ kind: 'box', cx: 0, cz: 0, hx: 2, hz: 1 }]);
    const p = resolveCircle({ x: 0, z: -1.1 }, R, w);
    expect(p.x).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(-1 - R);
  });

  it('pushes a circle that is fully inside a box out through the nearest side', () => {
    const w = world([{ kind: 'box', cx: 0, cz: 0, hx: 2, hz: 1 }]);
    const p = resolveCircle({ x: 1.8, z: 0.1 }, R, w);
    expect(p.x).toBeCloseTo(2 + R);
  });

  it('pushes out of a circle collider', () => {
    const w = world([{ kind: 'circle', x: 0, z: 0, r: 1 }]);
    const p = resolveCircle({ x: 1, z: 0 }, R, w);
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(1 + R);
  });

  it('pushes out of a capsule and slides along it', () => {
    const w = world([{ kind: 'capsule', ax: -5, az: 0, bx: 5, bz: 0, r: 1 }]);
    const p = resolveCircle({ x: 2, z: 1.1 }, R, w);
    expect(p.x).toBeCloseTo(2);
    expect(p.z).toBeCloseTo(1 + R);
  });

  it('keeps the circle inside the map bounds', () => {
    const p = resolveCircle({ x: 99, z: -99 }, R, world([]));
    expect(p).toEqual({ x: 20 - R, z: -20 + R });
  });

  it('slides along a wall when moving diagonally into it', () => {
    const w = world([{ kind: 'box', cx: 0, cz: 0, hx: 5, hz: 0.5 }]);
    const start = { x: 0, z: 1.0 };
    const moved = { x: start.x + 1, z: start.z - 0.5 };
    const p = resolveCircle(moved, R, w);
    expect(p.x).toBeCloseTo(1);
    expect(p.z).toBeCloseTo(0.5 + R);
  });

  it('can pass through a gap wider than its diameter and not through a narrower one', () => {
    const wall = (gap: number) =>
      world([
        { kind: 'box', cx: -10 - gap / 2, cz: 0, hx: 10, hz: 0.5 },
        { kind: 'box', cx: 10 + gap / 2, cz: 0, hx: 10, hz: 0.5 },
      ]);
    const open = resolveCircle({ x: 0, z: 0 }, R, wall(1.2));
    expect(open).toEqual({ x: 0, z: 0 });
    const shut = resolveCircle({ x: 0, z: 0 }, R, wall(0.5));
    expect(Math.abs(shut.x) > 0.01 || Math.abs(shut.z) > 0.01).toBe(true);
  });
});

describe('footprintToColliders', () => {
  const shapes = [{ kind: 'box' as const, x: 1, z: 0, hx: 2, hz: 1 }];

  it('translates at rotation 0', () => {
    expect(footprintToColliders(shapes, 10, 5)).toEqual([
      { kind: 'box', cx: 11, cz: 5, hx: 2, hz: 1 },
    ]);
  });

  it('rotates offsets and swaps half extents in quarter turns (matches three.js rotation.y)', () => {
    const [east] = footprintToColliders(shapes, 0, 0, Math.PI / 2);
    expect(east).toMatchObject({ cx: 0, hx: 1, hz: 2 });
    expect(east && 'cz' in east ? east.cz : NaN).toBeCloseTo(-1);
    const [south] = footprintToColliders(shapes, 0, 0, Math.PI);
    expect(south).toMatchObject({ cx: -1, hx: 2, hz: 1 });
    const [west] = footprintToColliders(shapes, 0, 0, -Math.PI / 2);
    expect(west && 'cz' in west ? west.cz : NaN).toBeCloseTo(1);
  });

  it('scales circles, rotates them by any angle, and rejects non-quarter box rotations', () => {
    const [c] = footprintToColliders([{ kind: 'circle', x: 0, z: 0, r: 0.5 }], 1, 2, 0, 2);
    expect(c).toEqual({ kind: 'circle', x: 1, z: 2, r: 1 });
    const [off] = footprintToColliders([{ kind: 'circle', x: 1, z: 0, r: 0.5 }], 0, 0, 0.3);
    expect(off && 'x' in off ? off.x : NaN).toBeCloseTo(Math.cos(0.3));
    expect(() => footprintToColliders(shapes, 0, 0, 0.3)).toThrow();
  });
});

describe('polylineToCapsules', () => {
  it('creates one capsule per segment', () => {
    const caps = polylineToCapsules(
      [
        [0, 0],
        [1, 0],
        [2, 1],
      ],
      1.5,
    );
    expect(caps).toHaveLength(2);
    expect(caps[1]).toMatchObject({ ax: 1, bx: 2, r: 1.5 });
  });
});
