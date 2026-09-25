import { describe, expect, it } from 'vitest';
import {
  AURA_GAIN,
  JOY_ARPEGGIO,
  SPECS,
  WAVE,
  bubbleBlips,
  giggleChirps,
  specLength,
  swell,
  type SpecKind,
} from '@/audio/recipes';

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

describe('sounds described as data', () => {
  const kinds = Object.keys(SPECS) as SpecKind[];

  it('has the sounds the game asks for', () => {
    for (const kind of [
      'ui',
      'levelUp',
      'questAccept',
      'questDone',
      'loot',
      'hurt',
      'downed',
      'blink',
      'splash',
      'bossRoar',
      'bossDown',
      'crit',
    ] as const) {
      expect(kinds).toContain(kind);
    }
  });

  it('keeps every sound short, quiet and inside the range of hearing', () => {
    for (const kind of kinds) {
      const spec = SPECS[kind];
      expect(spec.tones.length + (spec.noise?.length ?? 0), kind).toBeGreaterThan(0);
      expect(specLength(spec), kind).toBeLessThan(2.5);
      for (const t of spec.tones) {
        expect(t.freq, kind).toBeGreaterThan(30);
        expect(t.freq, kind).toBeLessThan(4000);
        if (t.to) {
          expect(t.to, kind).toBeGreaterThan(30);
          expect(t.to, kind).toBeLessThan(4000);
        }
        expect(t.gain, kind).toBeGreaterThan(0);
        expect(t.gain, kind).toBeLessThanOrEqual(0.3);
        expect(t.dur, kind).toBeGreaterThan(0.03);
      }
      for (const n of spec.noise ?? []) {
        expect(n.gain, kind).toBeLessThanOrEqual(0.2);
        expect(n.from, kind).toBeGreaterThan(50);
      }
    }
  });

  it('makes level-up and the quest jingles rise, the fall of Rosa fall, and the UI tick tiny', () => {
    const notes = (k: SpecKind) => SPECS[k].tones.filter((t) => t.dur >= 0.3).map((t) => t.freq);
    const up = SPECS.levelUp.tones.slice(0, 4).map((t) => t.freq);
    expect([...up].sort((a, b) => a - b)).toEqual(up);
    const done = SPECS.questDone.tones.slice(0, 4).map((t) => t.freq);
    expect([...done].sort((a, b) => a - b)).toEqual(done);
    const down = SPECS.downed.tones.map((t) => t.freq);
    expect([...down].sort((a, b) => b - a)).toEqual(down);
    expect(specLength(SPECS.ui)).toBeLessThan(0.1);
    expect(notes('bossRoar').every((f) => f < 200)).toBe(true);
  });
});
