import { beforeEach, describe, expect, it } from 'vitest';
import {
  acceptQuestAction,
  claimQuestAction,
  currentRank,
  currentReputation,
  onEnemyDefeatedForQuests,
} from '@/game/quest-actions';
import { useArchangelStore } from '@/store/archangel-store';
import { useNpcStore } from '@/store/npc-store';
import { useProgressStore } from '@/store/progress-store';
import { useQuestStore } from '@/store/quest-store';
import { countOf } from '@/systems/inventory';

beforeEach(() => {
  useProgressStore.getState().reset();
  useQuestStore.getState().reset();
  useNpcStore.getState().reset();
  useArchangelStore.getState().reset();
});

const log = () => useQuestStore.getState().log;

describe('quest actions', () => {
  it('accepts, tracks kills and claims XP, items and reputation', () => {
    expect(acceptQuestAction('clear-the-gloom')).toBe(true);
    expect(claimQuestAction('clear-the-gloom')).toBe(false);
    for (let i = 0; i < 3; i++) onEnemyDefeatedForQuests('tycoon');
    expect(claimQuestAction('clear-the-gloom')).toBe(true);
    expect(log().completed).toEqual(['clear-the-gloom']);
    expect(useProgressStore.getState().level).toBe(2);
    expect(countOf(useProgressStore.getState().bag, 'coldKvass')).toBe(2);
    expect(currentReputation()).toBe(8);
    expect(claimQuestAction('clear-the-gloom')).toBe(false);
  });

  it('gates quests by rank and unlocks them through reputation', () => {
    expect(acceptQuestAction('a-court-forms')).toBe(false);
    useQuestStore.getState().setLog({
      active: {},
      completed: ['first-notes', 'clear-the-gloom', 'pearls-for-the-board'],
    });
    expect(currentRank()).toBe(1);
    expect(acceptQuestAction('a-court-forms')).toBe(true);
  });

  it('counts people who joined toward reputation and the recruit quest', () => {
    useQuestStore.getState().setLog({
      active: {},
      completed: ['first-notes', 'clear-the-gloom', 'pearls-for-the-board'],
    });
    acceptQuestAction('a-court-forms');
    useNpcStore.getState().apply({ type: 'join', npc: 'grisha' });
    useNpcStore.getState().apply({ type: 'join', npc: 'tolik' });
    expect(currentReputation()).toBe(26 + 16);
    expect(claimQuestAction('a-court-forms')).toBe(true);
    expect(countOf(useProgressStore.getState().bag, 'roseBrooch')).toBe(1);
  });

  it('consumes pearls on claim', () => {
    useProgressStore.getState().addItem('pearl', 4);
    acceptQuestAction('pearls-for-the-board');
    expect(claimQuestAction('pearls-for-the-board')).toBe(true);
    expect(useProgressStore.getState().keepsakes.pearl).toBe(1);
  });
});

describe('Save the Archangels', () => {
  it('is ready once all three are saved and pays the feather', () => {
    useQuestStore.getState().setLog({
      active: {},
      completed: [
        'first-notes',
        'clear-the-gloom',
        'pearls-for-the-board',
        'a-court-forms',
        'gavel-down',
        'the-grand-tour',
        'a-necklace-for-the-queen',
      ],
    });
    expect(currentRank()).toBeGreaterThanOrEqual(2);
    expect(acceptQuestAction('save-the-archangels')).toBe(true);
    useArchangelStore.getState().save('michael');
    useArchangelStore.getState().save('gabriel');
    expect(claimQuestAction('save-the-archangels')).toBe(false);
    useArchangelStore.getState().save('serafima');
    expect(claimQuestAction('save-the-archangels')).toBe(true);
    expect(countOf(useProgressStore.getState().bag, 'archangelFeather')).toBe(1);
  });
});
