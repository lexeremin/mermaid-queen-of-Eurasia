import { beforeEach, describe, expect, it } from 'vitest';
import { useDungeonStore } from '@/store/dungeon-store';

const s = () => useDungeonStore.getState();

describe('dungeon store', () => {
  beforeEach(() => s().reset());

  it('starts untouched', () => {
    expect(s()).toMatchObject({
      stampFound: false,
      gateOpen: false,
      bossDefeated: false,
      cachesTaken: [],
    });
  });

  it('records milestones and takes each chest once', () => {
    s().findStamp();
    s().openGate();
    s().takeCache('chest-hall');
    s().takeCache('chest-hall');
    expect(s().stampFound).toBe(true);
    expect(s().gateOpen).toBe(true);
    expect(s().cachesTaken).toEqual(['chest-hall']);
  });

  it('hydrates from a save without sharing its array, and resets', () => {
    const cachesTaken = ['chest-cellar'];
    s().hydrate({ stampFound: true, gateOpen: true, bossDefeated: true, cachesTaken });
    cachesTaken.push('chest-hall');
    expect(s().cachesTaken).toEqual(['chest-cellar']);
    s().reset();
    expect(s().bossDefeated).toBe(false);
  });
});
