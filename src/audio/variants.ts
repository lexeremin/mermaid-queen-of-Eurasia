export type VoiceKind = 'attack' | 'spell' | 'aura';

export const VOICE_FILES: Readonly<Record<VoiceKind, readonly string[]>> = {
  attack: [1, 2, 3, 4].map((n) => `/assets/audio/rosa_attack_${n}.mp3`),
  spell: [1, 2].map((n) => `/assets/audio/rosa_spell_${n}.mp3`),
  aura: [1, 2, 3].map((n) => `/assets/audio/rosa_aura_${n}.mp3`),
};

/** How much the playback speed (and therefore pitch) may vary around 1 so repeats do not sound identical. */
export const RATE_SPREAD: Readonly<Record<VoiceKind, number>> = {
  attack: 0.07,
  spell: 0.03,
  aura: 0,
};

/** Picks a variant index that is not the one played last (when there is a choice). */
export function pickVariant(
  count: number,
  last: number,
  random: () => number = Math.random,
): number {
  if (count <= 1) return 0;
  const pick = Math.floor(random() * (count - 1));
  return pick >= last && last >= 0 ? pick + 1 : pick;
}

export const playbackRate = (kind: VoiceKind, random: () => number = Math.random): number =>
  1 + (random() * 2 - 1) * RATE_SPREAD[kind];
