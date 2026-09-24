import { describe, expect, it } from 'vitest';
import {
  aimAssist,
  angleBetween,
  directionTo,
  inBand,
  inCircle,
  inCone,
} from '@/systems/combat-math';

const north = { x: 0, z: -1 };
const deg = (d: number) => (d * Math.PI) / 180;

describe('combat math', () => {
  it('measures angles between directions', () => {
    expect(angleBetween({ x: 1, z: 0 }, { x: 0, z: 1 })).toBeCloseTo(Math.PI / 2);
    expect(angleBetween(north, north)).toBeCloseTo(0);
    expect(angleBetween({ x: 0, z: 0 }, north)).toBe(0);
  });

  it('inCone: in front and in range', () => {
    expect(inCone({ x: 0, z: 0 }, north, { x: 0, z: -2 }, 0.4, 2.3, deg(55))).toBe(true);
  });

  it('inCone: behind, too far, or too wide are misses', () => {
    const o = { x: 0, z: 0 };
    expect(inCone(o, north, { x: 0, z: 2 }, 0.4, 2.3, deg(55))).toBe(false);
    expect(inCone(o, north, { x: 0, z: -4 }, 0.4, 2.3, deg(55))).toBe(false);
    expect(inCone(o, north, { x: 2, z: -0.3 }, 0.3, 2.3, deg(55))).toBe(false);
  });

  it('inCone: a big body counts at the edge of the arc, and overlapping always counts', () => {
    const o = { x: 0, z: 0 };
    expect(inCone(o, north, { x: 1.9, z: -1.0 }, 0.8, 2.3, deg(55))).toBe(true);
    expect(inCone(o, north, { x: 0.1, z: 0.1 }, 0.5, 2.3, deg(55))).toBe(true);
  });

  it('inCircle and inBand', () => {
    expect(inCircle({ x: 0, z: 0 }, { x: 3, z: 0 }, 0.5, 2.4)).toBe(false);
    expect(inCircle({ x: 0, z: 0 }, { x: 3, z: 0 }, 0.5, 3.6)).toBe(true);
    expect(inBand({ x: 0, z: 0 }, { x: 4, z: 0 }, 3, 5)).toBe(true);
    expect(inBand({ x: 0, z: 0 }, { x: 2, z: 0 }, 3, 5)).toBe(false);
  });

  it('aim assist turns toward the nearest enemy within range and angle', () => {
    const targets = [
      { id: 'far', pos: { x: 0, z: -3.5 }, radius: 0.4 },
      { id: 'near', pos: { x: 1.2, z: -1.5 }, radius: 0.4 },
    ];
    const aimed = aimAssist({ x: 0, z: 0 }, north, targets, 3.6, deg(80));
    expect(aimed.x).toBeGreaterThan(0.5);
    expect(aimed.z).toBeLessThan(0);
    expect(Math.hypot(aimed.x, aimed.z)).toBeCloseTo(1);
  });

  it('aim assist keeps the facing when nothing qualifies', () => {
    const behind = [{ id: 'b', pos: { x: 0, z: 2 }, radius: 0.4 }];
    expect(aimAssist({ x: 0, z: 0 }, north, behind, 3.6, deg(80))).toEqual(north);
    expect(aimAssist({ x: 0, z: 0 }, north, [], 3.6, deg(80))).toEqual(north);
  });

  it('directionTo is a unit vector', () => {
    const d = directionTo({ x: 1, z: 1 }, { x: 4, z: 5 });
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(1);
    expect(directionTo({ x: 1, z: 1 }, { x: 1, z: 1 })).toEqual({ x: 0, z: 1 });
  });
});
