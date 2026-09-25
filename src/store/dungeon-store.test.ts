import { beforeEach, describe, expect, it } from 'vitest';
import { useDungeonStore } from '@/store/dungeon-store';

const s = () => useDungeonStore.getState();

describe('dungeon store', () => {
  beforeEach(() => s().reset());

  it('starts untouched, with the gate shut', () => {
    expect(s()).toMatchObject({
      hallsCleared: false,
      gateOpen: false,
      bossDefeated: false,
      cachesTaken: [],
    });
  });

  it('records milestones and takes each chest once', () => {
    s().clearHalls();
    s().openGate();
    s().takeCache('chest-hall');
    s().takeCache('chest-hall');
    expect(s().hallsCleared).toBe(true);
    expect(s().gateOpen).toBe(true);
    expect(s().cachesTaken).toEqual(['chest-hall']);
  });

  it('shuts the gate again when the halls refill, unless the boss is beaten', () => {
    s().openGate();
    s().closeGate();
    expect(s().gateOpen).toBe(false);
    s().defeatBoss();
    s().closeGate();
    expect(s().gateOpen).toBe(true);
  });

  it('hydrates from a save without sharing its array, and resets', () => {
    const cachesTaken = ['chest-cellar'];
    s().hydrate({ hallsCleared: true, bossDefeated: true, cachesTaken });
    cachesTaken.push('chest-hall');
    expect(s().cachesTaken).toEqual(['chest-cellar']);
    expect(s().gateOpen).toBe(true);
    s().reset();
    expect(s().bossDefeated).toBe(false);
    expect(s().gateOpen).toBe(false);
  });
});
