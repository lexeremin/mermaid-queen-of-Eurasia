import { describe, expect, it } from 'vitest';
import {
  BELL_NOTES,
  CEILING,
  MIXES,
  nextBellDelay,
  nextDripDelay,
  pickBell,
  rainHiss,
  sceneFor,
} from '@/systems/ambience';

describe('ambience', () => {
  it('picks the scene from where Rosa is', () => {
    expect(sceneFor(false, false)).toBe('surface');
    expect(sceneFor(false, true)).toBe('surface');
    expect(sceneFor(true, false)).toBe('underground');
    expect(sceneFor(true, true)).toBe('boss');
  });

  it('has bells only on the surface, drips only in the corridors, and a pulse only in an arena', () => {
    expect(MIXES.surface.bells).toBe(true);
    expect(MIXES.underground.bells).toBe(false);
    expect(MIXES.underground.drips).toBe(true);
    expect(MIXES.boss.drips).toBe(false);
    expect(MIXES.boss.pulse).toBe(1);
    expect(MIXES.surface.pulse).toBe(0);
    expect(MIXES.surface.drone).toBe(0);
  });

  it('keeps every layer quiet: the ceilings are small gains', () => {
    for (const v of Object.values(CEILING)) {
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThanOrEqual(0.06);
    }
    expect(rainHiss(0)).toBe(0);
    expect(rainHiss(1)).toBeLessThanOrEqual(0.05);
    expect(rainHiss(3)).toBe(rainHiss(1));
  });

  it('spaces its little events: bells rarely, drips often, and only from the scale', () => {
    for (const r of [0, 0.5, 0.999]) {
      expect(nextBellDelay(() => r)).toBeGreaterThanOrEqual(9);
      expect(nextBellDelay(() => r)).toBeLessThanOrEqual(25);
      expect(nextDripDelay(() => r)).toBeGreaterThanOrEqual(1.2);
      expect(nextDripDelay(() => r)).toBeLessThanOrEqual(5.7);
      expect(BELL_NOTES).toContain(pickBell(() => r));
    }
    expect(nextBellDelay(() => 0.5)).toBeGreaterThan(nextDripDelay(() => 0.5));
  });
});
