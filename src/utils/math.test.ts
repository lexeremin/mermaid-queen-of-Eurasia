import { describe, expect, it } from 'vitest';
import { clamp, lerp } from '@/utils/math';
import { isZero, length, normalize } from '@/utils/vec2';

describe('math', () => {
  it('clamps and lerps', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
});

describe('vec2', () => {
  it('normalizes to unit length and leaves zero as zero', () => {
    expect(length(normalize({ x: 3, z: 4 }))).toBeCloseTo(1);
    expect(normalize({ x: 0, z: 0 })).toEqual({ x: 0, z: 0 });
    expect(isZero({ x: 0, z: 0 })).toBe(true);
    expect(isZero({ x: 0.1, z: 0 })).toBe(false);
  });
});
