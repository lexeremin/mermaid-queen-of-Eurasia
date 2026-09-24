import { describe, expect, it } from 'vitest';
import {
  BASE_STATS,
  MAX_LEVEL,
  MAX_REDUCTION,
  addXp,
  computeStats,
  equipmentBonuses,
  xpToNext,
  type Equipment,
} from '@/systems/progression';

const none: Equipment = { weapon: null, outfit: null, charm: null };

describe('xp and levels', () => {
  it('needs more xp each level', () => {
    expect(xpToNext(1)).toBe(40);
    expect(xpToNext(2)).toBe(70);
    for (let l = 1; l < MAX_LEVEL - 1; l++) expect(xpToNext(l + 1)).toBeGreaterThan(xpToNext(l));
  });

  it('adds xp without levelling below the threshold', () => {
    const r = addXp({ level: 1, xp: 0 }, 39);
    expect(r).toEqual({ progress: { level: 1, xp: 39 }, levelsGained: 0 });
  });

  it('levels up and carries the remainder', () => {
    const r = addXp({ level: 1, xp: 30 }, 25);
    expect(r.progress).toEqual({ level: 2, xp: 15 });
    expect(r.levelsGained).toBe(1);
  });

  it('can gain several levels from one big reward', () => {
    const r = addXp({ level: 1, xp: 0 }, 40 + 70 + 100 + 5);
    expect(r.progress).toEqual({ level: 4, xp: 5 });
    expect(r.levelsGained).toBe(3);
  });

  it('stops at the level cap and ignores non-positive amounts', () => {
    const capped = addXp({ level: MAX_LEVEL, xp: 0 }, 9999);
    expect(capped.progress).toEqual({ level: MAX_LEVEL, xp: 0 });
    expect(addXp({ level: 3, xp: 10 }, 0).progress).toEqual({ level: 3, xp: 10 });
    expect(addXp({ level: 3, xp: 10 }, -5).progress).toEqual({ level: 3, xp: 10 });
    expect(addXp({ level: MAX_LEVEL - 1, xp: 0 }, 10_000).progress.level).toBe(MAX_LEVEL);
  });
});

describe('derived stats', () => {
  it('level 1 with no gear is the base', () => {
    expect(computeStats(1, none)).toEqual(BASE_STATS);
  });

  it('grows with level', () => {
    const s = computeStats(5, none);
    expect(s.maxHp).toBe(140);
    expect(s.maxMana).toBe(132);
    expect(s.damageMult).toBeCloseTo(1.24);
  });

  it('adds equipment bonuses', () => {
    const s = computeStats(1, {
      weapon: 'pearlTrident',
      outfit: 'rainCloak',
      charm: 'songbirdWhistle',
    });
    expect(s.damageMult).toBeCloseTo(1.3);
    expect(s.maxHp).toBe(110);
    expect(s.maxMana).toBe(100 + 10 + 20);
    expect(s.reduction).toBeCloseTo(0.12);
    expect(s.manaRegen).toBeCloseTo(6);
    expect(equipmentBonuses({ weapon: 'silverTrident', outfit: null, charm: null }).damagePct).toBe(
      15,
    );
  });

  it('caps damage reduction and clamps odd levels', () => {
    expect(MAX_REDUCTION).toBe(0.6);
    expect(computeStats(99, none).maxHp).toBe(computeStats(MAX_LEVEL, none).maxHp);
    expect(computeStats(-4, none).maxHp).toBe(100);
  });

  it('ignores unknown equipment ids from a bad save', () => {
    const s = computeStats(1, { weapon: 'nope' as never, outfit: null, charm: null });
    expect(s).toEqual(BASE_STATS);
  });
});
