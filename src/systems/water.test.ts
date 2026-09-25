import { describe, expect, it } from 'vitest';
import type { Collider } from '@/systems/collision';
import { isInWater } from '@/systems/water';

const pond: Collider[] = [{ kind: 'capsule', ax: 0, az: 0, bx: 0, bz: 10, r: 1.5 }];

describe('isInWater', () => {
  it('is true inside a water capsule, its end caps included, and false outside', () => {
    expect(isInWater(pond, { x: 0, z: 5 })).toBe(true);
    expect(isInWater(pond, { x: 1.4, z: 5 })).toBe(true);
    expect(isInWater(pond, { x: 0, z: -1.2 })).toBe(true);
    expect(isInWater(pond, { x: 1.6, z: 5 })).toBe(false);
    expect(isInWater(pond, { x: 0, z: 12 })).toBe(false);
  });

  it('is false with no water at all', () => {
    expect(isInWater(undefined, { x: 0, z: 0 })).toBe(false);
    expect(isInWater([], { x: 0, z: 0 })).toBe(false);
  });
});
