/** Graphics quality: the player's choice, and the level that is actually used (Auto steps it by frame rate). */
export type Quality = 'auto' | 'high' | 'medium' | 'low';
export type Level = 'high' | 'medium' | 'low';

export const QUALITIES: readonly Quality[] = ['auto', 'high', 'medium', 'low'];
const LEVELS: readonly Level[] = ['high', 'medium', 'low'];

export const isQuality = (value: unknown): value is Quality =>
  typeof value === 'string' && (QUALITIES as readonly string[]).includes(value);

export type LevelSettings = {
  /** Highest pixel ratio the canvas may use. */
  dpr: number;
  /** How many lanterns glow around Rosa (0 turns the glow off). */
  glowLamps: number;
};

export function settingsFor(level: Level, touch: boolean): LevelSettings {
  if (level === 'high') return { dpr: touch ? 1.5 : 2, glowLamps: 18 };
  if (level === 'medium') return { dpr: touch ? 1.25 : 1.5, glowLamps: 8 };
  return { dpr: 1, glowLamps: 0 };
}

/** The level in use: a fixed choice as is, or the automatic one. */
export const effectiveLevel = (quality: Quality, auto: Level): Level =>
  quality === 'auto' ? auto : quality;

/** One step down (worse) or up (better) the ladder, stopping at its ends. */
export function stepLevel(level: Level, direction: 'down' | 'up'): Level {
  const i = LEVELS.indexOf(level) + (direction === 'down' ? 1 : -1);
  return LEVELS[Math.min(LEVELS.length - 1, Math.max(0, i))] ?? level;
}

export const nextQuality = (q: Quality): Quality =>
  QUALITIES[(QUALITIES.indexOf(q) + 1) % QUALITIES.length] ?? 'auto';

export const qualityLabel = (q: Quality): string => q[0]!.toUpperCase() + q.slice(1);
