export const WARMING_AT = 30;
export const MESMERIZED_AT = 60;
export const MAX_RELATIONSHIP = 100;

export type Tier = 'gloomy' | 'warming' | 'mesmerized';

export const clampRelationship = (value: number): number =>
  Math.min(MAX_RELATIONSHIP, Math.max(0, value));

export function tierOf(relationship: number): Tier {
  if (relationship >= MESMERIZED_AT) return 'mesmerized';
  if (relationship >= WARMING_AT) return 'warming';
  return 'gloomy';
}

/** Mesmerized men show the heart buff; anyone who joined the kingdom keeps it. */
export const showsHeart = (relationship: number, joined: boolean): boolean =>
  joined || relationship >= MESMERIZED_AT;
