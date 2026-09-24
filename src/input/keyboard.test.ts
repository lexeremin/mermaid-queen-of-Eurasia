import { describe, expect, it } from 'vitest';
import { keysToMove } from '@/input/keyboard';
import { length } from '@/utils/vec2';

describe('keysToMove', () => {
  it('maps WASD and arrows to world axes (up = -z)', () => {
    expect(keysToMove(new Set(['KeyW']))).toEqual({ x: 0, z: -1 });
    expect(keysToMove(new Set(['ArrowDown']))).toEqual({ x: 0, z: 1 });
    expect(keysToMove(new Set(['KeyA']))).toEqual({ x: -1, z: 0 });
    expect(keysToMove(new Set(['ArrowRight']))).toEqual({ x: 1, z: 0 });
  });

  it('normalizes diagonals and cancels opposing keys', () => {
    expect(length(keysToMove(new Set(['KeyW', 'KeyD'])))).toBeCloseTo(1);
    expect(keysToMove(new Set(['KeyA', 'KeyD']))).toEqual({ x: 0, z: 0 });
    expect(keysToMove(new Set())).toEqual({ x: 0, z: 0 });
  });
});
