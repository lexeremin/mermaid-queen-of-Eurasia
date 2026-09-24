import { describe, expect, it } from 'vitest';
import {
  RATE_SPREAD,
  VOICE_FILES,
  pickVariant,
  playbackRate,
  type VoiceKind,
} from '@/audio/variants';

describe('voice variants', () => {
  it('never repeats the previous variant when there is a choice', () => {
    for (let count = 2; count <= 5; count++) {
      for (let last = 0; last < count; last++) {
        for (let i = 0; i < 40; i++) {
          const pick = pickVariant(count, last, () => i / 40);
          expect(pick).toBeGreaterThanOrEqual(0);
          expect(pick).toBeLessThan(count);
          expect(pick).not.toBe(last);
        }
      }
    }
  });

  it('covers every variant over many picks', () => {
    const seen = new Set<number>();
    let last = -1;
    for (let i = 0; i < 200; i++) {
      last = pickVariant(4, last, () => (i * 0.6180339) % 1);
      seen.add(last);
    }
    expect(seen.size).toBe(4);
  });

  it('handles one variant and the first play', () => {
    expect(pickVariant(1, 0)).toBe(0);
    expect(pickVariant(3, -1, () => 0.99)).toBeLessThan(3);
  });

  it('keeps the playback rate inside the spread, and the song at its natural speed', () => {
    for (const kind of Object.keys(RATE_SPREAD) as VoiceKind[]) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
        expect(Math.abs(playbackRate(kind, () => r) - 1)).toBeLessThanOrEqual(
          RATE_SPREAD[kind] + 1e-9,
        );
      }
    }
    expect(playbackRate('aura', () => 0.3)).toBe(1);
  });

  it('lists every sample once', () => {
    const all = Object.values(VOICE_FILES).flat();
    expect(new Set(all).size).toBe(all.length);
    expect(VOICE_FILES.attack.length).toBeGreaterThanOrEqual(3);
  });
});
