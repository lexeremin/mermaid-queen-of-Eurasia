import { describe, expect, it } from 'vitest';
import type { AbilityId } from '@/systems/abilities';
import { MAX_LEVEL, addXp, computeStats, xpToNext } from '@/systems/progression';
import {
  ALL_UNLOCKED_LEVEL,
  PASSIVE_LEVEL,
  UNLOCK_LEVEL,
  WINGS_LEVEL,
  gainsAtLevel,
  hasPassive,
  hasWings,
  isUnlocked,
} from '@/systems/skills';

const ABILITY_IDS: AbilityId[] = ['attack', 'aura', 'blink', 'spell'];
const none = { weapon: null, outfit: null, charm: null };

describe('skills by level', () => {
  it('unlocks the abilities one by one between level 1 and level 10', () => {
    const levels = ABILITY_IDS.map((id) => UNLOCK_LEVEL[id]);
    expect(UNLOCK_LEVEL.attack).toBe(1);
    expect(new Set(levels).size).toBe(levels.length);
    expect(Math.max(...levels)).toBe(10);
    expect(ALL_UNLOCKED_LEVEL).toBe(10);
    expect(isUnlocked('attack', 1)).toBe(true);
    expect(isUnlocked('spell', 9)).toBe(false);
    expect(isUnlocked('spell', 10)).toBe(true);
  });

  it('gives each ability one passive, every tenth level from 20, and wings at 60', () => {
    expect(PASSIVE_LEVEL).toEqual({ attack: 20, aura: 30, spell: 40, blink: 50 });
    expect(WINGS_LEVEL).toBe(60);
    expect(MAX_LEVEL).toBe(60);
    expect(hasPassive('attack', 19)).toBe(false);
    expect(hasPassive('attack', 20)).toBe(true);
    expect(hasPassive('blink', 49)).toBe(false);
    expect(hasWings(59)).toBe(false);
    expect(hasWings(60)).toBe(true);
  });

  it('announces what a level brings', () => {
    expect(gainsAtLevel(1)).toEqual([]);
    expect(gainsAtLevel(3).map((g) => g.text)).toEqual(['Aura unlocked']);
    expect(gainsAtLevel(30)[0]?.title).toBe('NEW PASSIVE');
    expect(gainsAtLevel(60).map((g) => g.title)).toContain('HOLY WINGS');
    expect(gainsAtLevel(11)).toEqual([]);
  });
});

describe('sixty levels', () => {
  it('keeps the first levels as they were and asks more of the later ones', () => {
    expect(xpToNext(1)).toBe(40);
    expect(xpToNext(9)).toBe(280);
    for (let l = 1; l < MAX_LEVEL - 1; l++) expect(xpToNext(l + 1)).toBeGreaterThan(xpToNext(l));
    expect(computeStats(10, none).maxHp).toBe(190);
    expect(computeStats(10, none).damageMult).toBeCloseTo(1.54);
    expect(computeStats(60, none).maxHp).toBeGreaterThan(computeStats(10, none).maxHp * 3);
    expect(computeStats(99, none)).toEqual(computeStats(60, none));
  });

  it('reaches the cap with enough xp and stops there', () => {
    const r = addXp({ level: 1, xp: 0 }, 1_000_000);
    expect(r.progress).toEqual({ level: MAX_LEVEL, xp: 0 });
    expect(r.levelsGained).toBe(MAX_LEVEL - 1);
  });
});
