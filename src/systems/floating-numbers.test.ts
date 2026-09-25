import { describe, expect, it } from 'vitest';
import {
  BIG_HIT,
  MAX_NUMBERS,
  NUMBER_LIFE,
  opacity,
  pushNumber,
  rise,
  stepNumbers,
  type FloatingNumber,
} from '@/systems/floating-numbers';
import {
  MAX_OFFSET,
  MAX_TRAUMA,
  addTrauma,
  drainTrauma,
  shakeOffset,
  traumaForHurt,
} from '@/systems/shake';
import {
  CLEAR_SPELL,
  FADE_SECONDS,
  RAIN_SPELL,
  initialWeather,
  stepWeather,
  type Weather,
} from '@/systems/weather';

describe('floating numbers', () => {
  it('show the rounded damage, dropping nothing-hits, and mark the big ones', () => {
    const list: FloatingNumber[] = [];
    pushNumber(list, 1, 0, 0, 12.4, 'enemy');
    pushNumber(list, 2, 0, 0, BIG_HIT, 'enemy');
    pushNumber(list, 3, 0, 0, 9, 'player');
    pushNumber(list, 4, 0, 0, 0.2, 'enemy');
    expect(list.map((n) => [n.text, n.kind])).toEqual([
      ['12', 'enemy'],
      ['35', 'big'],
      ['-9', 'player'],
    ]);
  });

  it('are kept few, newest last, and expire', () => {
    const list: FloatingNumber[] = [];
    for (let i = 0; i < MAX_NUMBERS + 8; i++) pushNumber(list, i, 0, 0, 5, 'enemy');
    expect(list).toHaveLength(MAX_NUMBERS);
    expect(list[list.length - 1]!.id).toBe(MAX_NUMBERS + 7);
    stepNumbers(list, NUMBER_LIFE / 2);
    expect(list).toHaveLength(MAX_NUMBERS);
    stepNumbers(list, NUMBER_LIFE);
    expect(list).toHaveLength(0);
  });

  it('rise fast and settle, fade only at the end, and drift apart', () => {
    expect(rise(0, 1)).toBe(0);
    expect(rise(1, 1)).toBeCloseTo(1.6);
    expect(rise(0.25, 1) / 1.6).toBeGreaterThan(0.25);
    expect(opacity(0, 1)).toBe(1);
    expect(opacity(0.6, 1)).toBe(1);
    expect(opacity(0.9, 1)).toBeLessThan(0.4);
    expect(opacity(1, 1)).toBe(0);
    const list: FloatingNumber[] = [];
    for (let i = 1; i <= 6; i++) pushNumber(list, i, 0, 0, 5, 'enemy');
    expect(new Set(list.map((n) => n.drift)).size).toBeGreaterThan(3);
    for (const n of list) expect(Math.abs(n.drift)).toBeLessThanOrEqual(0.5);
  });
});

describe('screen shake', () => {
  it('builds up to a limit and drains away', () => {
    let t = addTrauma(0, 0.4);
    expect(t).toBeCloseTo(0.4);
    t = addTrauma(t, 5);
    expect(t).toBe(MAX_TRAUMA);
    t = drainTrauma(t, 0.4);
    expect(t).toBeLessThan(MAX_TRAUMA);
    expect(drainTrauma(0.1, 1)).toBe(0);
    expect(addTrauma(0.2, -5)).toBe(0);
  });

  it('shakes more than proportionally with trauma, stays inside its limit, and is still when there is none', () => {
    expect(Math.abs(shakeOffset(0, 3).x)).toBe(0);
    expect(Math.abs(shakeOffset(0, 3).y)).toBe(0);
    let small = 0;
    let big = 0;
    for (let t = 0; t < 4; t += 0.013) {
      small = Math.max(small, Math.abs(shakeOffset(0.3, t).x));
      const o = shakeOffset(1, t);
      big = Math.max(big, Math.abs(o.x));
      expect(Math.abs(o.x)).toBeLessThanOrEqual(MAX_OFFSET + 1e-9);
      expect(Math.abs(o.y)).toBeLessThanOrEqual(MAX_OFFSET + 1e-9);
    }
    expect(big / small).toBeGreaterThan(5);
  });

  it('is gentle for a scratch and heavier for a blow, never more than half', () => {
    expect(traumaForHurt(5)).toBeLessThan(0.25);
    expect(traumaForHurt(40)).toBeGreaterThan(traumaForHurt(5));
    expect(traumaForHurt(500)).toBeLessThanOrEqual(0.55);
  });
});

describe('weather', () => {
  const seq = (values: number[]) => {
    let i = 0;
    return () => values[i++ % values.length]!;
  };

  it('starts dry, turns to drizzle after a spell, and fades in slowly', () => {
    let w = initialWeather();
    const random = seq([0.5]);
    expect(w.rain).toBe(0);
    for (let i = 0; i < 400 && w.target === 0; i++) w = stepWeather(w, 0.5, true, random);
    expect(w.target).toBe(1);
    expect(w.rain).toBeGreaterThan(0);
    expect(w.rain).toBeLessThan(0.2);
    for (let t = 0; t < FADE_SECONDS + 1; t += 0.5) w = stepWeather(w, 0.5, true, random);
    expect(w.rain).toBe(1);
  });

  it('keeps its spells inside the ranges and alternates', () => {
    let w = initialWeather();
    const targets: number[] = [];
    for (let i = 0; i < 20000; i++) {
      const before = w.target;
      w = stepWeather(w, 0.1, true, seq([0, 1, 0.3, 0.7]));
      if (w.target !== before) {
        targets.push(w.target);
        const range = w.target === 1 ? RAIN_SPELL : CLEAR_SPELL;
        expect(w.left).toBeGreaterThanOrEqual(range[0] - 1e-9);
        expect(w.left).toBeLessThanOrEqual(range[1] + 1e-9);
      }
    }
    expect(targets.slice(0, 4)).toEqual([1, 0, 1, 0]);
  });

  it('dries up quickly when it is switched off or Rosa goes underground, then comes back', () => {
    let w: Weather = { rain: 1, target: 1, left: 100 };
    w = stepWeather(w, 1, false, () => 0.5);
    expect(w.rain).toBeLessThan(1);
    for (let i = 0; i < 6; i++) w = stepWeather(w, 1, false, () => 0.5);
    expect(w.rain).toBe(0);
    for (let i = 0; i < 12; i++) w = stepWeather(w, 1, true, () => 0.5);
    expect(w.rain).toBe(1);
  });
});
