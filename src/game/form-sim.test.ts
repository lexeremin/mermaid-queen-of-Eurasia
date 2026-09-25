import { beforeEach, describe, expect, it } from 'vitest';
import { RED_SQUARE } from '@/data/maps/red-square';
import { QUEST_BY_ID } from '@/data/quests';
import { combat, resetCombat } from '@/game/combat-sim';
import {
  FORM_COOLDOWN_MS,
  mermaidUnlocked,
  resetFormClock,
  toggleForm,
  unlockMermaid,
} from '@/game/form-sim';
import { acceptQuestAction, claimQuestAction } from '@/game/quest-actions';
import { currentWorld } from '@/game/world/current-map';
import { useGameStore } from '@/store/game-store';
import { useNpcStore } from '@/store/npc-store';
import { useProgressStore } from '@/store/progress-store';
import { useQuestStore } from '@/store/quest-store';
import { resolveCircle } from '@/systems/collision';
import { PLAYER_RADIUS, PLAYER_SPEED, stepPlayer, createPlayer } from '@/systems/movement';
import { computeStats } from '@/systems/progression';
import { STARTER_EQUIPMENT } from '@/data/items';

const pearl6 = RED_SQUARE.gatherables!.find((g) => g.id === 'pearl-6')!;
const onFoot = () => {
  const p = resolveCircle({ x: pearl6.x, z: pearl6.z }, PLAYER_RADIUS, currentWorld);
  return Math.hypot(p.x - pearl6.x, p.z - pearl6.z) < 1e-6;
};

beforeEach(() => {
  useProgressStore.getState().reset();
  useQuestStore.getState().reset();
  useNpcStore.getState().reset();
  useGameStore.getState().setForm('human');
  resetCombat();
  resetFormClock();
});

describe('changing form', () => {
  it('needs the form unlocked first', () => {
    expect(toggleForm(10_000)).toBe('locked');
    expect(useGameStore.getState().form).toBe('human');
  });

  it('switches back and forth, but not twice within the pause', () => {
    unlockMermaid();
    expect(toggleForm(10_000)).toBe('switched');
    expect(useGameStore.getState().form).toBe('mermaid');
    expect(toggleForm(10_000 + FORM_COOLDOWN_MS - 1)).toBe('busy');
    expect(toggleForm(10_000 + FORM_COOLDOWN_MS + 1)).toBe('switched');
    expect(useGameStore.getState().form).toBe('human');
  });

  it('does not switch while fainted', () => {
    unlockMermaid();
    combat.downed = true;
    expect(toggleForm(10_000)).toBe('busy');
  });

  it('bursts bubbles when it changes', () => {
    unlockMermaid();
    toggleForm(10_000);
    expect(combat.effects.some((e) => e.type === 'bubbles')).toBe(true);
  });
});

describe('the mermaid swims', () => {
  it('takes the water colliders out of the world, and puts them back for a human', () => {
    expect(onFoot()).toBe(false);
    useGameStore.getState().setForm('mermaid');
    expect(onFoot()).toBe(true);
    useGameStore.getState().setForm('human');
    expect(onFoot()).toBe(false);
  });

  it('is slower on land and faster in the water', () => {
    const world = { bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 }, colliders: [] };
    const walk = (mult: number) =>
      stepPlayer(createPlayer({ x: 0, z: 0 }), { move: { x: 1, z: 0 } }, 1, world, mult).pos.x;
    expect(walk(1)).toBeCloseTo(PLAYER_SPEED);
    expect(walk(0.9)).toBeLessThan(PLAYER_SPEED);
    expect(walk(1.35)).toBeGreaterThan(PLAYER_SPEED);
  });

  it('regenerates more mana', () => {
    const human = computeStats(5, STARTER_EQUIPMENT, 'human');
    const mermaid = computeStats(5, STARTER_EQUIPMENT, 'mermaid');
    expect(mermaid.manaRegen).toBe(human.manaRegen + 2);
    expect(mermaid.maxHp).toBe(human.maxHp);
  });
});

describe('the unlock quest', () => {
  it('unlocks the form when it is claimed, and only then', () => {
    const def = QUEST_BY_ID.get('return-to-the-water')!;
    expect(def.reward.unlocks).toEqual(['mermaid']);
    useNpcStore.getState().reset();
    useQuestStore.getState().setLog({
      active: {},
      completed: ['first-notes', 'clear-the-gloom', 'pearls-for-the-board'],
    });
    expect(acceptQuestAction('return-to-the-water')).toBe(true);
    expect(mermaidUnlocked()).toBe(false);
    useProgressStore.getState().addItem('pearl', 4);
    useQuestStore.getState().setLog({
      ...useQuestStore.getState().log,
      active: {
        'return-to-the-water': { counts: [0, 0], visited: ['pearl-shrine'] },
      },
    });
    expect(claimQuestAction('return-to-the-water')).toBe(true);
    expect(mermaidUnlocked()).toBe(true);
    expect(useProgressStore.getState().keepsakes.pearl ?? 0).toBe(0);
  });
});
