/** Parameters for the synthesized sounds. Pure data and math so it can be tested; `sfx.ts` plays them. */

export type SfxKind = 'swing' | 'hit' | 'bubbles' | 'wave' | 'gather' | 'joy' | SpecKind;

/** A soft two-note chime for picking up a herb or pearl. */
export const GATHER = {
  notes: [880, 1318.5] as readonly number[],
  gap: 0.075,
  dur: 0.22,
  gain: 0.11,
} as const;

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

export type Chirp = { at: number; from: number; to: number; dur: number; gain: number };

/** A bright rising arpeggio (C major pentatonic, two octaves) with a quieter echo, the sound of a saved child. */
export const JOY_ARPEGGIO = {
  notes: [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98] as readonly number[],
  gap: 0.09,
  dur: 0.5,
  gain: 0.1,
  echoDelay: 0.16,
  echoGain: 0.4,
} as const;

/** A child's giggle: a run of quick chirps that rise and fall in pitch, each a little quieter. */
export function giggleChirps(random: () => number = Math.random): Chirp[] {
  const count = 6;
  const chirps: Chirp[] = [];
  let at = 0.45;
  for (let i = 0; i < count; i++) {
    const base = 880 + random() * 220 + (i % 2 === 0 ? 0 : 140);
    chirps.push({
      at,
      from: base,
      to: base * (i % 2 === 0 ? 1.35 : 0.85),
      dur: 0.07 + random() * 0.02,
      gain: 0.12 * (1 - i * 0.1),
    });
    at += 0.085 + random() * 0.03;
  }
  return chirps;
}

// --- Sounds described as data: a few tones and bursts of noise, played by one generic player ---

export type ToneSpec = {
  /** Seconds after the start. */
  at: number;
  freq: number;
  /** The pitch the tone glides to over its length. */
  to?: number;
  dur: number;
  gain: number;
  type?: OscillatorType;
};

export type NoiseSpec = {
  at: number;
  dur: number;
  gain: number;
  filter: 'lowpass' | 'bandpass' | 'highpass';
  from: number;
  to?: number;
  q?: number;
};

export type SfxSpec = { tones: readonly ToneSpec[]; noise?: readonly NoiseSpec[] };

const arpeggio = (
  notes: readonly number[],
  gap: number,
  dur: number,
  gain: number,
  type: OscillatorType = 'triangle',
): ToneSpec[] => notes.map((freq, i) => ({ at: i * gap, freq, dur, gain, type }));

export type SpecKind =
  | 'ui'
  | 'levelUp'
  | 'questAccept'
  | 'questDone'
  | 'loot'
  | 'hurt'
  | 'downed'
  | 'blink'
  | 'splash'
  | 'bossRoar'
  | 'bossDown'
  | 'crit';

/** UI clicks, level-up, quests, loot, blink, hurt, splash and the boss: every one short and quiet. */
export const SPECS: Readonly<Record<SpecKind, SfxSpec>> = {
  ui: { tones: [{ at: 0, freq: 1320, to: 1760, dur: 0.05, gain: 0.05, type: 'sine' }] },
  levelUp: {
    tones: [
      ...arpeggio([523.25, 659.25, 783.99, 1046.5], 0.11, 0.55, 0.1),
      { at: 0.44, freq: 1568, dur: 0.9, gain: 0.05, type: 'sine' },
      { at: 0.44, freq: 2093, dur: 0.9, gain: 0.03, type: 'sine' },
    ],
  },
  questAccept: { tones: arpeggio([392, 587.33], 0.12, 0.3, 0.09, 'sine') },
  questDone: {
    tones: [
      ...arpeggio([392, 493.88, 587.33, 783.99], 0.09, 0.4, 0.09),
      { at: 0.36, freq: 987.77, dur: 0.8, gain: 0.05, type: 'sine' },
    ],
  },
  loot: {
    tones: [
      { at: 0, freq: 1046.5, dur: 0.08, gain: 0.07, type: 'sine' },
      { at: 0.06, freq: 1567.98, dur: 0.14, gain: 0.06, type: 'sine' },
    ],
  },
  hurt: {
    tones: [{ at: 0, freq: 170, to: 60, dur: 0.16, gain: 0.3, type: 'sine' }],
    noise: [{ at: 0, dur: 0.09, gain: 0.16, filter: 'lowpass', from: 1400 }],
  },
  downed: { tones: arpeggio([392, 329.63, 261.63, 196], 0.22, 0.6, 0.1, 'sine') },
  blink: {
    tones: [{ at: 0, freq: 320, to: 1500, dur: 0.14, gain: 0.09, type: 'sine' }],
    noise: [{ at: 0, dur: 0.12, gain: 0.05, filter: 'bandpass', from: 1800, to: 3800, q: 1.4 }],
  },
  splash: {
    tones: [],
    noise: [
      { at: 0, dur: 0.35, gain: 0.16, filter: 'bandpass', from: 900, to: 400, q: 0.8 },
      { at: 0.05, dur: 0.2, gain: 0.08, filter: 'highpass', from: 3000 },
    ],
  },
  bossRoar: {
    tones: [
      { at: 0, freq: 110, to: 52, dur: 1.1, gain: 0.22, type: 'sawtooth' },
      { at: 0, freq: 55, to: 40, dur: 1.2, gain: 0.25, type: 'sine' },
    ],
    noise: [{ at: 0, dur: 0.9, gain: 0.12, filter: 'lowpass', from: 700, to: 200 }],
  },
  bossDown: {
    tones: [
      { at: 0, freq: 130, to: 45, dur: 1.4, gain: 0.25, type: 'sawtooth' },
      ...arpeggio([523.25, 392, 293.66, 196], 0.28, 0.7, 0.07, 'sine').map((t) => ({
        ...t,
        at: t.at + 0.5,
      })),
    ],
    noise: [{ at: 0, dur: 1.1, gain: 0.14, filter: 'lowpass', from: 900, to: 150 }],
  },
  crit: {
    tones: [
      { at: 0, freq: 880, to: 1760, dur: 0.09, gain: 0.08, type: 'triangle' },
      { at: 0.05, freq: 1318.5, dur: 0.16, gain: 0.05, type: 'sine' },
    ],
  },
};

/** The length of a spec in seconds. */
export const specLength = (spec: SfxSpec): number =>
  Math.max(
    0,
    ...spec.tones.map((t) => t.at + t.dur),
    ...(spec.noise ?? []).map((n) => n.at + n.dur),
  );
