import type { AbilityId } from '@/systems/abilities';

/** The level at which each ability becomes Rosa's, one by one. */
export const UNLOCK_LEVEL: Readonly<Record<AbilityId, number>> = {
  attack: 1,
  aura: 3,
  blink: 6,
  spell: 10,
};

/** The level at which each ability gains its passive effect (every tenth level after the last unlock). */
export const PASSIVE_LEVEL: Readonly<Record<AbilityId, number>> = {
  attack: 20,
  aura: 30,
  spell: 40,
  blink: 50,
};

/** At this level Rosa grows holy wings and a halo in her human look. */
export const WINGS_LEVEL = 60;

/** The level from which every ability is available (before any passive): the default of combat tests. */
export const ALL_UNLOCKED_LEVEL = Math.max(...Object.values(UNLOCK_LEVEL));

export const isUnlocked = (id: AbilityId, level: number): boolean => level >= UNLOCK_LEVEL[id];
export const hasPassive = (id: AbilityId, level: number): boolean => level >= PASSIVE_LEVEL[id];
export const hasWings = (level: number): boolean => level >= WINGS_LEVEL;

const ABILITY_NAMES: Readonly<Record<AbilityId, string>> = {
  attack: 'Trident',
  aura: 'Aura',
  blink: 'Blink',
  spell: 'Surge',
};

const PASSIVE_NAMES: Readonly<Record<AbilityId, string>> = {
  attack: 'Sea Wave',
  aura: 'Beams of Light',
  spell: 'Leaping Sharks',
  blink: 'Arcane Blast',
};

/** Everything that begins at exactly this level: a new ability, a passive or the wings. */
export function gainsAtLevel(level: number): { title: string; text: string }[] {
  const gains: { title: string; text: string }[] = [];
  for (const id of Object.keys(UNLOCK_LEVEL) as AbilityId[]) {
    if (UNLOCK_LEVEL[id] === level && level > 1) {
      gains.push({ title: 'NEW SKILL', text: `${ABILITY_NAMES[id]} unlocked` });
    }
  }
  for (const id of Object.keys(PASSIVE_LEVEL) as AbilityId[]) {
    if (PASSIVE_LEVEL[id] === level) {
      gains.push({ title: 'NEW PASSIVE', text: `${ABILITY_NAMES[id]}: ${PASSIVE_NAMES[id]}` });
    }
  }
  if (level === WINGS_LEVEL) gains.push({ title: 'HOLY WINGS', text: 'Rosa is crowned' });
  return gains;
}

export const abilityName = (id: AbilityId): string => ABILITY_NAMES[id];
export const passiveName = (id: AbilityId): string => PASSIVE_NAMES[id];
