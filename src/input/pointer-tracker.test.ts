import { describe, expect, it } from 'vitest';
import { createPointerTracker } from '@/input/pointer-tracker';

describe('pointer tracker', () => {
  it('follows one pointer and ignores the others', () => {
    const t = createPointerTracker();
    t.down(1);
    expect(t.owns(1)).toBe(true);
    expect(t.owns(2)).toBe(false);
    expect(t.up(2)).toBe(false);
    expect(t.active).toBe(1);
    expect(t.up(1)).toBe(true);
    expect(t.active).toBeNull();
  });

  it('a new press takes over from a pointer whose release never arrived', () => {
    const t = createPointerTracker();
    t.down(1);
    expect(t.down(7)).toBe(1);
    expect(t.owns(7)).toBe(true);
    expect(t.up(1)).toBe(false);
    expect(t.up(7)).toBe(true);
  });

  it('reset frees the control', () => {
    const t = createPointerTracker();
    t.down(3);
    t.reset();
    expect(t.active).toBeNull();
    t.down(4);
    expect(t.owns(4)).toBe(true);
  });
});
