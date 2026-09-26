import { describe, expect, it } from 'vitest';
import { TIPS, TIP_IDS, isVeteran, pickTip, type TipContext } from '@/systems/tips';

const ctx = (over: Partial<TipContext> = {}): TipContext => ({
  touch: false,
  playSeconds: 0,
  level: 1,
  questsDone: 0,
  hpFraction: 1,
  nearPerson: false,
  monsterNear: false,
  underground: false,
  hasItems: false,
  hasPotion: false,
  boardMark: null,
  ...over,
});

describe('tips', () => {
  it('have unique ids and text for keyboard and touch', () => {
    expect(new Set(TIP_IDS).size).toBe(TIPS.length);
    for (const tip of TIPS) {
      expect(tip.title.length).toBeGreaterThan(2);
      expect(tip.text(false).length).toBeGreaterThan(20);
      expect(tip.text(true).length).toBeGreaterThan(20);
    }
  });

  it('say the right buttons for the device', () => {
    const fight = TIPS.find((t) => t.id === 'fight')!;
    expect(fight.text(false)).toContain('Space');
    expect(fight.text(false)).toContain('right mouse');
    expect(fight.text(true)).toContain('ATK');
    expect(fight.text(true)).not.toContain('Space');
  });

  it('start with how to walk, a moment after the game starts, and nothing before', () => {
    expect(pickTip(ctx({ playSeconds: 0 }), [])).toBeNull();
    expect(pickTip(ctx({ playSeconds: 3 }), [])?.id).toBe('move');
  });

  it('show each tip once, in order, and only when it is useful', () => {
    const c = ctx({ playSeconds: 20, boardMark: 'available' });
    expect(pickTip(c, [])?.id).toBe('move');
    expect(pickTip(c, ['move'])?.id).toBe('board');
    expect(pickTip(c, ['move', 'board'])).toBeNull();
    expect(pickTip(ctx({ playSeconds: 20 }), ['move'])).toBeNull();
    expect(pickTip(ctx({ playSeconds: 20, nearPerson: true }), ['move'])?.id).toBe('people');
    expect(pickTip(ctx({ playSeconds: 20, monsterNear: true }), ['move'])?.id).toBe('fight');
  });

  it('only warns about health when there is something to drink', () => {
    const low = ctx({ playSeconds: 200, hpFraction: 0.2 });
    expect(pickTip(low, ['move', 'map'])).toBeNull();
    expect(pickTip({ ...low, hasPotion: true }, ['move', 'map'])?.id).toBe('health');
  });

  it('gives the skill tips as each skill opens, but not long after', () => {
    const seenBasics = ['move', 'board', 'people', 'fight', 'bag', 'map', 'health'];
    expect(pickTip(ctx({ level: 3 }), seenBasics)?.id).toBe('aura');
    expect(pickTip(ctx({ level: 6 }), [...seenBasics, 'aura'])?.id).toBe('blink');
    expect(pickTip(ctx({ level: 10 }), [...seenBasics, 'aura', 'blink'])?.id).toBe('surge');
    expect(pickTip(ctx({ level: 40 }), seenBasics)).toBeNull();
  });

  it('leaves the basics out for players who have played a while', () => {
    const veteran = ctx({
      level: 30,
      playSeconds: 500,
      boardMark: 'available',
      nearPerson: true,
      monsterNear: true,
      hasItems: true,
    });
    expect(isVeteran(veteran)).toBe(true);
    expect(pickTip(veteran, [])).toBeNull();
    expect(isVeteran(ctx({ questsDone: 2 }))).toBe(true);
  });

  it('greets a first descent', () => {
    expect(pickTip(ctx({ level: 5, underground: true }), ['aura', 'move'])?.id).toBe('underground');
  });
});
