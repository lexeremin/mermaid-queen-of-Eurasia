import { describe, expect, it } from 'vitest';
import { QUESTS, RANKS } from '@/data/quests';
import { NPCS } from '@/data/npcs';
import { addToBag, emptyBag, countOf } from '@/systems/inventory';
import {
  acceptQuest,
  claimQuest,
  emptyLog,
  isReady,
  rankIndex,
  recordKill,
  recordVisit,
  reputation,
  statusOf,
  trackerLine,
  type QuestLog,
  type WorldView,
} from '@/systems/quests';

const view = (over: Partial<WorldView> = {}): WorldView => ({
  level: 1,
  bag: emptyBag(),
  joinedCount: 0,
  relationship: () => 0,
  ...over,
});

const quest = (id: string) => {
  const def = QUESTS.find((q) => q.id === id);
  if (!def) throw new Error(id);
  return def;
};

const accept = (log: QuestLog, id: string, rank = 4): QuestLog => {
  const next = acceptQuest(log, id, rank);
  if (!next) throw new Error(`cannot accept ${id}`);
  return next;
};

describe('ranks and reputation', () => {
  it('maps reputation to rank at the thresholds', () => {
    expect(rankIndex(0)).toBe(0);
    expect(rankIndex(24)).toBe(0);
    expect(rankIndex(25)).toBe(1);
    expect(rankIndex(149)).toBe(3);
    expect(rankIndex(150)).toBe(4);
  });

  it('adds quest reputation and 8 per joined person', () => {
    const log: QuestLog = { active: {}, completed: ['first-notes', 'clear-the-gloom'] };
    expect(reputation(log, 0)).toBe(16);
    expect(reputation(log, 3)).toBe(40);
  });

  it('ignores unknown completed quests', () => {
    expect(reputation({ active: {}, completed: ['nope'] }, 0)).toBe(0);
  });

  it('can reach every rank in order, so no quest is permanently locked', () => {
    let log = emptyLog();
    let joined = 0;
    const rankNow = () => rankIndex(reputation(log, joined));
    let rounds = 0;
    while (log.completed.length < QUESTS.length) {
      const available = QUESTS.filter(
        (q) => q.minRank <= rankNow() && !log.completed.includes(q.id),
      );
      expect(available.length, `stuck at rank ${rankNow()} after ${rounds} rounds`).toBeGreaterThan(
        0,
      );
      log = { active: {}, completed: [...log.completed, ...available.map((q) => q.id)] };
      joined = Math.min(NPCS.length, joined + 2);
      rounds += 1;
    }
    expect(reputation(log, NPCS.length)).toBeGreaterThanOrEqual(
      RANKS[RANKS.length - 1]?.min ?? Infinity,
    );
  });

  it('gives the first tier enough reputation to unlock rank 1 without any recruits', () => {
    const tier0 = QUESTS.filter((q) => q.minRank === 0).reduce((s, q) => s + q.reward.rep, 0);
    expect(tier0).toBeGreaterThanOrEqual(RANKS[1]?.min ?? Infinity);
  });
});

describe('quest data', () => {
  it('has unique ids and valid npc references', () => {
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length);
    const npcIds = new Set(NPCS.map((n) => n.id));
    for (const q of QUESTS)
      for (const o of q.objectives)
        if (o.kind === 'mesmerize') expect(npcIds.has(o.npc)).toBe(true);
  });

  it('never asks for more recruits than there are NPCs', () => {
    for (const q of QUESTS)
      for (const o of q.objectives)
        if (o.kind === 'recruit') expect(o.count).toBeLessThanOrEqual(NPCS.length);
  });
});

describe('accepting', () => {
  it('locks quests above the rank and unlocks them at it', () => {
    const def = quest('a-court-forms');
    expect(statusOf(def, emptyLog(), view(), 0)).toBe('locked');
    expect(statusOf(def, emptyLog(), view(), 1)).toBe('available');
    expect(acceptQuest(emptyLog(), def.id, 0)).toBeNull();
  });

  it('refuses a second accept and completed quests', () => {
    const log = accept(emptyLog(), 'clear-the-gloom');
    expect(acceptQuest(log, 'clear-the-gloom', 4)).toBeNull();
    expect(
      acceptQuest({ active: {}, completed: ['clear-the-gloom'] }, 'clear-the-gloom', 4),
    ).toBeNull();
    expect(acceptQuest(emptyLog(), 'missing', 4)).toBeNull();
  });
});

describe('progress', () => {
  it('counts kills after accepting, filtered by enemy kind', () => {
    let log = accept(accept(emptyLog(), 'clear-the-gloom'), 'gavel-down');
    log = recordKill(log, 'tycoon');
    log = recordKill(log, 'speaker');
    expect(log.active['clear-the-gloom']?.counts[0]).toBe(2);
    expect(log.active['gavel-down']?.counts[0]).toBe(1);
  });

  it('does not count kills for quests that were not accepted, and caps at the goal', () => {
    let log = accept(emptyLog(), 'clear-the-gloom');
    for (let i = 0; i < 6; i++) log = recordKill(log, 'demagogue');
    expect(log.active['clear-the-gloom']?.counts[0]).toBe(3);
    expect(recordKill(emptyLog(), 'tycoon')).toEqual(emptyLog());
  });

  it('records each zone once and ignores irrelevant zones', () => {
    let log = accept(emptyLog(), 'the-grand-tour');
    log = recordVisit(log, 'gum');
    log = recordVisit(log, 'gum');
    log = recordVisit(log, 'somewhere-else');
    expect(log.active['the-grand-tour']?.visited).toEqual(['gum']);
  });

  it('reads live state for mesmerize, recruit, collect and level objectives', () => {
    const log = accept(emptyLog(), 'first-notes');
    const def = quest('first-notes');
    const p = log.active['first-notes'];
    if (!p) throw new Error('missing');
    expect(isReady(def, p, view({ relationship: () => 59 }))).toBe(false);
    expect(isReady(def, p, view({ relationship: (id) => (id === 'sergei' ? 60 : 0) }))).toBe(true);

    const court = accept(emptyLog(), 'a-court-forms').active['a-court-forms'];
    if (!court) throw new Error('missing');
    expect(isReady(quest('a-court-forms'), court, view({ joinedCount: 2 }))).toBe(true);

    const tide = accept(emptyLog(), 'rising-tide').active['rising-tide'];
    if (!tide) throw new Error('missing');
    expect(isReady(quest('rising-tide'), tide, view({ level: 5 }))).toBe(true);
    expect(isReady(quest('rising-tide'), tide, view({ level: 4 }))).toBe(false);
  });

  it('shows a tracker line with the next unfinished objective', () => {
    const log = recordKill(accept(emptyLog(), 'clear-the-gloom'), 'tycoon');
    const p = log.active['clear-the-gloom'];
    if (!p) throw new Error('missing');
    expect(trackerLine(quest('clear-the-gloom'), p, view())).toBe('Clear the Gloom: 1/3');
    const notes = accept(emptyLog(), 'first-notes').active['first-notes'];
    if (!notes) throw new Error('missing');
    expect(trackerLine(quest('first-notes'), notes, view())).toBe('First Notes: Mesmerize Sergey');
  });
});

describe('claiming', () => {
  const pearls = (n: number) => addToBag(emptyBag(), 'pearl', n).bag;

  it('refuses when the quest is not ready', () => {
    const log = accept(emptyLog(), 'pearls-for-the-board');
    expect(claimQuest(log, 'pearls-for-the-board', view({ bag: pearls(2) }))).toEqual({
      ok: false,
      reason: 'not-ready',
    });
  });

  it('consumes collected items, adds rewards and moves the quest to completed', () => {
    const log = accept(emptyLog(), 'pearls-for-the-board');
    const result = claimQuest(log, 'pearls-for-the-board', view({ bag: pearls(4) }));
    if (!result.ok) throw new Error('should claim');
    expect(countOf(result.bag, 'pearl')).toBe(1);
    expect(countOf(result.bag, 'healingTea')).toBe(2);
    expect(result.log.completed).toEqual(['pearls-for-the-board']);
    expect(result.log.active['pearls-for-the-board']).toBeUndefined();
  });

  it('refuses without losing anything when the rewards do not fit', () => {
    let bag = emptyBag();
    for (let i = 0; i < 20; i++)
      bag = addToBag(bag, i % 2 ? 'silverTrident' : 'pearlTrident', 1).bag;
    const log = accept(emptyLog(), 'a-court-forms');
    const result = claimQuest(log, 'a-court-forms', view({ bag, joinedCount: 2 }));
    expect(result).toEqual({ ok: false, reason: 'bag-full' });
  });

  it('frees space by consuming collected items before adding rewards', () => {
    let bag = pearls(3);
    for (let i = 0; i < 19; i++) bag = addToBag(bag, 'silverTrident', 1).bag;
    const log = accept(emptyLog(), 'pearls-for-the-board');
    expect(claimQuest(log, 'pearls-for-the-board', view({ bag })).ok).toBe(true);
  });
});
