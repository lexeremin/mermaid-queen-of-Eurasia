import { beforeEach, describe, expect, it } from 'vitest';
import { useDungeonStore } from '@/store/dungeon-store';

const s = () => useDungeonStore.getState();

describe('dungeon store', () => {
  beforeEach(() => s().reset());

  it('starts on the surface, untouched, with the gate shut', () => {
    expect(s()).toMatchObject({
      hallsCleared: false,
      gateOpen: false,
      layerCleared: false,
      bossDefeated: false,
      cachesTaken: [],
      layer: 0,
      deepest: 0,
      bossLayers: [],
    });
  });

  it('records milestones and takes each chest once', () => {
    s().clearHalls();
    s().openGate();
    s().takeCache('L1-c1');
    s().takeCache('L1-c1');
    expect(s().hallsCleared).toBe(true);
    expect(s().gateOpen).toBe(true);
    expect(s().cachesTaken).toEqual(['L1-c1']);
  });

  it('remembers the deepest layer, and shuts the gate and the cleared flag on every new layer', () => {
    s().setLayer(4);
    s().openGate();
    s().setLayerCleared();
    s().setLayer(3);
    expect(s().layer).toBe(3);
    expect(s().deepest).toBe(4);
    expect(s().gateOpen).toBe(false);
    expect(s().layerCleared).toBe(false);
    s().setLayer(9);
    s().setLayer(0);
    expect(s().deepest).toBe(9);
    s().setLayer(500);
    expect(s().layer).toBe(100);
  });

  it('pays each boss layer once and marks the first boss for the quest', () => {
    s().payBoss(10);
    s().payBoss(10);
    s().payBoss(20);
    expect(s().bossDefeated).toBe(true);
    expect(s().bossLayers).toEqual([10, 20]);
  });

  it('hydrates from a save without sharing its arrays, and resets', () => {
    const cachesTaken = ['L3-c1'];
    const bossLayers = [10];
    s().hydrate({
      hallsCleared: true,
      bossDefeated: true,
      cachesTaken,
      layer: 12,
      deepest: 14,
      bossLayers,
    });
    cachesTaken.push('L4-c1');
    bossLayers.push(20);
    expect(s().cachesTaken).toEqual(['L3-c1']);
    expect(s().bossLayers).toEqual([10]);
    expect(s().layer).toBe(12);
    expect(s().deepest).toBe(14);
    expect(s().gateOpen).toBe(false);
    s().reset();
    expect(s().bossDefeated).toBe(false);
    expect(s().layer).toBe(0);
  });
});
