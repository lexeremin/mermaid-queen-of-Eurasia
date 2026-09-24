/** Parameters for the synthesized sounds. Pure data and math so it can be tested; `sfx.ts` plays them. */

export type SfxKind = 'swing' | 'hit' | 'bubbles' | 'wave';

export const AURA_FILE = '/assets/audio/rosa_aura.mp3';
/** The sung "ah" is kept quiet so it sits under the game rather than on top of it. */
export const AURA_GAIN = 0.32;

export const SWING = { dur: 0.13, from: 2400, to: 800, gain: 0.1 } as const;

export const HIT = {
  noiseDur: 0.05,
  lowpass: 1500,
  thumpFrom: 180,
  thumpTo: 55,
  thumpDur: 0.12,
  noiseGain: 0.22,
  thumpGain: 0.32,
} as const;

export const WAVE = {
  dur: 2.0,
  attack: 0.5,
  cutoffFrom: 260,
  cutoffPeak: 1000,
  cutoffTo: 320,
  gain: 0.2,
  pad: [196, 247, 294] as readonly number[],
  padGain: 0.028,
} as const;

export type Blip = { at: number; from: number; to: number; dur: number; gain: number };

/** A little run of rising bubble "bloops" with slightly random pitches, quieter as it goes. */
export function bubbleBlips(random: () => number = Math.random): Blip[] {
  const count = 4;
  const blips: Blip[] = [];
  let at = 0;
  for (let i = 0; i < count; i++) {
    const from = 520 + random() * 380;
    blips.push({
      at,
      from,
      to: from * (1.7 + random() * 0.5),
      dur: 0.07 + random() * 0.04,
      gain: 0.15 * (1 - i * 0.16),
    });
    at += 0.035 + random() * 0.03;
  }
  return blips;
}

/** Swell used by the wave sound: linear rise to 1 at `attack`, then a smooth fall to 0 at `dur`. */
export function swell(t: number, attack: number, dur: number): number {
  if (t <= 0 || t >= dur) return 0;
  if (t < attack) return t / attack;
  const k = (t - attack) / (dur - attack);
  return 0.5 * (1 + Math.cos(Math.PI * k));
}
