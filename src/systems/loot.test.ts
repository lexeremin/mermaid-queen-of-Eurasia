import { describe, expect, it } from 'vitest';
import { ITEMS } from '@/data/items';
import { LOOT_TABLES, rollLoot } from '@/systems/loot';
import { mulberry32 } from '@/utils/random';

describe('loot', () => {
  it('drops nothing when every roll fails and everything when every roll succeeds', () => {
    expect(rollLoot('speaker', () => 0.9999)).toEqual([]);
    const all = rollLoot('speaker', () => 0);
    expect(all).toContain('healingTea');
    expect(all).toContain('pearl');
    expect(all.length).toBe(LOOT_TABLES.speaker.rolls.length + 1);
  });

  it('only ever drops items that exist, and gear from the enemy pool', () => {
    const random = mulberry32(3);
    for (const kind of ['tycoon', 'speaker', 'demagogue'] as const) {
      for (let i = 0; i < 300; i++) {
        for (const id of rollLoot(kind, random)) expect(ITEMS[id]).toBeDefined();
      }
      for (const id of LOOT_TABLES[kind].gear.pool) expect(ITEMS[id].kind).toBe('equipment');
    }
  });

  it('matches the documented drop rates over many kills', () => {
    const random = mulberry32(11);
    const N = 6000;
    for (const kind of ['tycoon', 'speaker', 'demagogue'] as const) {
      const counts = { healingTea: 0, coldKvass: 0, pearl: 0, gear: 0 };
      for (let i = 0; i < N; i++) {
        for (const id of rollLoot(kind, random)) {
          if (id === 'healingTea' || id === 'coldKvass' || id === 'pearl') counts[id] += 1;
          else counts.gear += 1;
        }
      }
      for (const roll of LOOT_TABLES[kind].rolls) {
        const rate = counts[roll.id as 'healingTea' | 'coldKvass' | 'pearl'] / N;
        expect(rate).toBeGreaterThan(roll.chance - 0.03);
        expect(rate).toBeLessThan(roll.chance + 0.03);
      }
      expect(counts.gear / N).toBeGreaterThan(LOOT_TABLES[kind].gear.chance - 0.03);
      expect(counts.gear / N).toBeLessThan(LOOT_TABLES[kind].gear.chance + 0.03);
    }
  });

  it('stronger enemies drop better', () => {
    expect(LOOT_TABLES.speaker.gear.chance).toBeGreaterThan(LOOT_TABLES.tycoon.gear.chance);
  });
});
