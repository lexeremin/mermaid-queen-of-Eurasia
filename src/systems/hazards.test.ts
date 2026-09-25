import { describe, expect, it } from 'vitest';
import { HAZARD_LINGER, overlapsHazard, stepHazards, type Hazard } from '@/systems/hazards';

const circle = (delay = 1): Hazard => ({
  id: 1,
  shape: { kind: 'circle', x: 0, z: 0, r: 3 },
  delay,
  age: 0,
  damage: 10,
  hit: false,
});

describe('hazard shapes', () => {
  it('a circle covers anyone whose body touches it', () => {
    const shape = { kind: 'circle', x: 0, z: 0, r: 3 } as const;
    expect(overlapsHazard(shape, { x: 3.2, z: 0 }, 0.35)).toBe(true);
    expect(overlapsHazard(shape, { x: 3.5, z: 0 }, 0.35)).toBe(false);
  });

  it('a rectangle follows its rotation', () => {
    const shape = { kind: 'rect', x: 0, z: 0, hx: 8, hz: 1, rot: Math.PI / 2 } as const;
    // Rotated a quarter turn: long along z.
    expect(overlapsHazard(shape, { x: 0, z: 7 }, 0.3)).toBe(true);
    expect(overlapsHazard(shape, { x: 7, z: 0 }, 0.3)).toBe(false);
    expect(overlapsHazard(shape, { x: 1.2, z: 0 }, 0.3)).toBe(true);
    expect(overlapsHazard(shape, { x: 1.5, z: 0 }, 0.3)).toBe(false);
  });
});

describe('stepHazards', () => {
  it('lands once when its delay is up, then flashes and disappears', () => {
    let list = [circle(1)];
    let landedTotal = 0;
    for (let t = 0; t < 2; t += 0.1) {
      const step = stepHazards(list, 0.1);
      landedTotal += step.landed.length;
      list = step.remaining;
    }
    expect(landedTotal).toBe(1);
    expect(list).toHaveLength(0);
  });

  it('keeps a landed hazard for the flash duration', () => {
    const h = circle(0.5);
    const first = stepHazards([h], 0.5);
    expect(first.landed).toHaveLength(1);
    expect(first.remaining).toHaveLength(1);
    const later = stepHazards(first.remaining, HAZARD_LINGER + 0.01);
    expect(later.landed).toHaveLength(0);
    expect(later.remaining).toHaveLength(0);
  });
});
