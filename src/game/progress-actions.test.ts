import { beforeEach, describe, expect, it } from 'vitest';
import { combat, resetCombat } from '@/game/combat-sim';
import { consumeAt, grantXp, quickUse } from '@/game/progress-actions';
import { useProgressStore } from '@/store/progress-store';
import { countOf } from '@/systems/inventory';

beforeEach(() => {
  useProgressStore.getState().reset();
  resetCombat();
});

describe('consumables', () => {
  it('heals and consumes one tea', () => {
    useProgressStore.getState().addItem('healingTea', 2);
    combat.hp = 30;
    expect(quickUse('healingTea')).toBe('used');
    expect(combat.hp).toBe(75);
    expect(countOf(useProgressStore.getState().bag, 'healingTea')).toBe(1);
  });

  it('caps at max health', () => {
    useProgressStore.getState().addItem('healingTea');
    combat.hp = 80;
    quickUse('healingTea');
    expect(combat.hp).toBe(100);
  });

  it('refuses and keeps the item when it would do nothing', () => {
    useProgressStore.getState().addItem('coldKvass');
    combat.mana = 100;
    expect(quickUse('coldKvass')).toBe('full');
    expect(countOf(useProgressStore.getState().bag, 'coldKvass')).toBe(1);
  });

  it('does nothing while downed or with an empty slot', () => {
    useProgressStore.getState().addItem('healingTea');
    combat.hp = 10;
    combat.downed = true;
    expect(consumeAt(0)).toBe('blocked');
    combat.downed = false;
    expect(consumeAt(5)).toBe('empty');
    expect(quickUse('coldKvass')).toBe('empty');
  });

  it('does not consume equipment or keepsakes', () => {
    useProgressStore.getState().addItem('pearl');
    expect(consumeAt(0)).toBe('blocked');
    expect(countOf(useProgressStore.getState().bag, 'pearl')).toBe(1);
  });
});

describe('level up', () => {
  it('fully heals to the new maximum', () => {
    combat.hp = 20;
    combat.mana = 5;
    grantXp(40);
    expect(useProgressStore.getState().level).toBe(2);
    expect(combat.hp).toBe(110);
    expect(combat.mana).toBe(108);
  });

  it('does not heal without a level', () => {
    combat.hp = 20;
    grantXp(10);
    expect(combat.hp).toBe(20);
  });
});
