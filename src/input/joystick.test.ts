import { describe, expect, it } from 'vitest';
import { joystickVector } from '@/input/joystick';
import { length } from '@/utils/vec2';

describe('joystickVector', () => {
  it('is zero inside the deadzone', () => {
    expect(joystickVector(2, 2, 60)).toEqual({ x: 0, z: 0 });
    expect(joystickVector(0, 0, 60)).toEqual({ x: 0, z: 0 });
  });

  it('is full magnitude at and beyond the radius', () => {
    expect(length(joystickVector(60, 0, 60))).toBeCloseTo(1);
    expect(length(joystickVector(500, 0, 60))).toBeCloseTo(1);
  });

  it('maps screen-up (negative dy) to negative z', () => {
    const v = joystickVector(0, -60, 60);
    expect(v.x).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(-1);
  });

  it('is analog between deadzone and radius', () => {
    const half = length(joystickVector(30, 0, 60));
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(1);
  });
});
