import { describe, expect, it } from 'vitest';
import { effectiveLevel, isQuality, nextQuality, settingsFor, stepLevel } from '@/systems/quality';

describe('graphics quality', () => {
  it('steps down and up the ladder and stops at the ends', () => {
    expect(stepLevel('high', 'down')).toBe('medium');
    expect(stepLevel('medium', 'down')).toBe('low');
    expect(stepLevel('low', 'down')).toBe('low');
    expect(stepLevel('low', 'up')).toBe('medium');
    expect(stepLevel('high', 'up')).toBe('high');
  });

  it('lower levels cost less', () => {
    for (const touch of [false, true]) {
      const [h, m, l] = (['high', 'medium', 'low'] as const).map((x) => settingsFor(x, touch));
      expect(h!.dpr).toBeGreaterThan(m!.dpr);
      expect(m!.dpr).toBeGreaterThan(l!.dpr - 1e-9);
      expect(h!.glowLamps).toBeGreaterThan(m!.glowLamps);
      expect(l!.glowLamps).toBe(0);
    }
    expect(settingsFor('high', true).dpr).toBeLessThan(settingsFor('high', false).dpr);
  });

  it('a fixed choice wins over the automatic level, Auto follows it', () => {
    expect(effectiveLevel('low', 'high')).toBe('low');
    expect(effectiveLevel('auto', 'medium')).toBe('medium');
  });

  it('cycles through every choice and validates', () => {
    expect(nextQuality('auto')).toBe('high');
    expect(nextQuality('low')).toBe('auto');
    expect(isQuality('medium')).toBe(true);
    expect(isQuality('ultra')).toBe(false);
  });
});
