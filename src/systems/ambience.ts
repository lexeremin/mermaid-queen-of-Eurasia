/** The plan for the generative ambience: which layers are audible where, and when the little events come. */
export type AmbienceScene = 'surface' | 'underground' | 'boss';

/** How loud each layer is in a scene (0 to 1 of its own ceiling), and whether bells and drips play. */
export type AmbienceMix = {
  wind: number;
  pad: number;
  drone: number;
  pulse: number;
  bells: boolean;
  drips: boolean;
};

export const MIXES: Readonly<Record<AmbienceScene, AmbienceMix>> = {
  surface: { wind: 1, pad: 1, drone: 0, pulse: 0, bells: true, drips: false },
  underground: { wind: 0.12, pad: 0, drone: 1, pulse: 0, bells: false, drips: true },
  boss: { wind: 0, pad: 0, drone: 0.7, pulse: 1, bells: false, drips: false },
};

export const sceneFor = (underground: boolean, inArena: boolean): AmbienceScene =>
  !underground ? 'surface' : inArena ? 'boss' : 'underground';

/** Notes of the bells: an A minor pentatonic over two octaves. */
export const BELL_NOTES: readonly number[] = [
  220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99,
];

const range = (lo: number, hi: number, roll: number): number => lo + (hi - lo) * roll;

/** Seconds until the next bell (rare: a distant bell now and then), and until the next drip. */
export const nextBellDelay = (random: () => number): number => range(9, 25, random());
export const nextDripDelay = (random: () => number): number => range(1.2, 5.7, random());

export function pickBell(random: () => number): number {
  return BELL_NOTES[Math.floor(random() * BELL_NOTES.length)]!;
}

/** The drizzle's hiss: silent when dry, faint at most. */
export const rainHiss = (rain: number): number => 0.045 * Math.min(1, Math.max(0, rain));

/** What each layer's ceiling is, as an audio gain (kept low: this sits under the game). */
export const CEILING = { wind: 0.05, pad: 0.022, drone: 0.05, pulse: 0.05 } as const;
