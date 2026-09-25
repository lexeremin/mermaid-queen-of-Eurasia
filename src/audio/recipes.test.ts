import { describe, expect, it } from 'vitest';
import { AURA_GAIN, JOY_ARPEGGIO, WAVE, bubbleBlips, giggleChirps, swell } from '@/audio/recipes';

describe('bubble blips', () => {
  it('are a short, rising, gently fading run of pops', () => {
    for (const r of [0, 0.5, 0.99]) {
      const blips = bubbleBlips(() => r);
      expect(blips.length).toBeGreaterThanOrEqual(3);
      const end = Math.max(...blips.map((b) => b.at + b.dur));
      expect(end).toBeLessThan(0.45);
      blips.forEach((b, i) => {
        expect(b.to).toBeGreaterThan(b.from);
        expect(b.gain).toBeGreaterThan(0);
        expect(b.gain).toBeLessThan(0.2);
        if (i > 0) {
          expect(b.at).toBeGreaterThan(blips[i - 1]!.at);
          expect(b.gain).toBeLessThan(blips[i - 1]!.gain);
        }
      });
    }
  });
});

describe('wave swell', () => {
  it('starts silent, peaks at the attack, and dies away smoothly', () => {
    expect(swell(0, WAVE.attack, WAVE.dur)).toBe(0);
    expect(swell(WAVE.attack, WAVE.attack, WAVE.dur)).toBeCloseTo(1);
    expect(swell(WAVE.dur, WAVE.attack, WAVE.dur)).toBe(0);
    let previous = 1;
    for (let t = WAVE.attack; t < WAVE.dur; t += 0.05) {
      const v = swell(t, WAVE.attack, WAVE.dur);
      expect(v).toBeLessThanOrEqual(previous + 1e-9);
      previous = v;
    }
  });
});

describe('loudness', () => {
  it('keeps the sung Aura well under full scale', () => {
    expect(AURA_GAIN).toBeLessThanOrEqual(0.4);
  });
});

describe('joy sound', () => {
  it('is a rising arpeggio that ends within a couple of seconds', () => {
    const { notes, gap, dur, echoDelay } = JOY_ARPEGGIO;
    notes.forEach((f, i) => {
      if (i > 0) expect(f).toBeGreaterThan(notes[i - 1]!);
    });
    expect((notes.length - 1) * gap + echoDelay + dur).toBeLessThan(2);
  });

  it('has a giggle of quick, fading chirps after the arpeggio starts', () => {
    for (const r of [0, 0.5, 0.99]) {
      const chirps = giggleChirps(() => r);
      expect(chirps.length).toBeGreaterThanOrEqual(5);
      chirps.forEach((c, i) => {
        expect(c.at).toBeGreaterThan(0.4);
        expect(c.dur).toBeLessThan(0.12);
        expect(c.gain).toBeGreaterThan(0);
        expect(c.gain).toBeLessThan(0.15);
        if (i > 0) {
          expect(c.at).toBeGreaterThan(chirps[i - 1]!.at);
          expect(c.gain).toBeLessThan(chirps[i - 1]!.gain);
        }
      });
      const last = chirps[chirps.length - 1]!;
      expect(last.at + last.dur).toBeLessThan(1.5);
    }
  });
});
