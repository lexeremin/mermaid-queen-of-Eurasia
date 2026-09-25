import { describe, expect, it } from 'vitest';
import type { CollisionWorld } from '@/systems/collision';
import { clampToRange, pickBlinkDestination } from '@/systems/blink';

const world: CollisionWorld = {
  bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
  colliders: [{ kind: 'box', cx: 6, cz: 0, hx: 1, hz: 20 }],
};
const anywhere = () => true;
const from = { x: 0, z: 0 };

describe('clampToRange', () => {
  it('keeps a near aim and shortens a far one along the same line', () => {
    expect(clampToRange(from, { x: 3, z: 4 }, 10)).toEqual({ x: 3, z: 4 });
    const far = clampToRange(from, { x: 30, z: 40 }, 10);
    expect(far.x).toBeCloseTo(6);
    expect(far.z).toBeCloseTo(8);
  });
});

describe('pickBlinkDestination', () => {
  it('lands exactly on a free aim point', () => {
    expect(pickBlinkDestination(from, { x: -8, z: 3 }, 14, world, anywhere)).toEqual({
      x: -8,
      z: 3,
    });
  });

  it('jumps over a wall to the free ground behind it', () => {
    const dest = pickBlinkDestination(from, { x: 10, z: 0 }, 14, world, anywhere)!;
    expect(dest).toEqual({ x: 10, z: 0 });
  });

  it('falls back to the nearest free spot toward Rosa when the aim is inside something', () => {
    const dest = pickBlinkDestination(from, { x: 6, z: 0 }, 14, world, anywhere)!;
    expect(dest.x).toBeLessThan(5);
    expect(dest.x).toBeGreaterThan(3);
    expect(dest.z).toBeCloseTo(0);
  });

  it('never lands beyond its range', () => {
    const dest = pickBlinkDestination(from, { x: -40, z: 0 }, 14, world, anywhere)!;
    expect(Math.hypot(dest.x, dest.z)).toBeLessThanOrEqual(14 + 1e-9);
  });

  it('refuses another region, stopping at the last place she could walk to', () => {
    const sameSide = (p: { x: number }) => p.x < 5;
    const dest = pickBlinkDestination(from, { x: 12, z: 0 }, 14, world, sameSide)!;
    expect(dest.x).toBeLessThan(5);
  });

  it('gives up when there is nowhere to go', () => {
    expect(pickBlinkDestination(from, { x: 0.3, z: 0 }, 14, world, anywhere)).toBeNull();
    expect(pickBlinkDestination(from, { x: 12, z: 0 }, 14, world, () => false)).toBeNull();
  });

  it('stays inside the map bounds', () => {
    const tight: CollisionWorld = {
      bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
      colliders: [],
    };
    const dest = pickBlinkDestination(from, { x: 12, z: 0 }, 14, tight, anywhere)!;
    expect(dest.x).toBeLessThan(5);
  });
});
