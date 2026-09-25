import { beforeEach, describe, expect, it, vi } from 'vitest';
import { METRO } from '@/data/maps/red-square';
import { MAX_LAYER, isUnderground, layerLevel } from '@/data/maps/underground';
import { combat, resetCombat } from '@/game/combat-sim';
import {
  bossReward,
  depthChoices,
  goDeeper,
  goDown,
  goUp,
  onBossDefeated,
  stepGate,
  travelTo,
} from '@/game/dungeon-actions';
import { activeLevel, hallMonsters, syncDungeonWorld } from '@/game/dungeon-sim';
import { loot } from '@/game/loot-sim';
import { resetSim, sim } from '@/game/sim';
import { currentMap } from '@/game/world/current-map';
import { useDungeonStore } from '@/store/dungeon-store';
import { useToastStore } from '@/store/toast-store';

vi.mock('@/audio/sfx', () => ({ playSfx: vi.fn() }));

const dungeon = () => useDungeonStore.getState();
const near = (a: { x: number; z: number }, b: { x: number; z: number }) =>
  Math.hypot(a.x - b.x, a.z - b.z) < 1;

beforeEach(() => {
  resetCombat();
  resetSim();
  dungeon().reset();
  syncDungeonWorld();
  useToastStore.setState({ toasts: [] });
  loot.pickups = [];
});

describe('the stairs', () => {
  it('lead down from the pavilion to the landing of layer 1, and further down layer by layer', () => {
    goDown();
    expect(dungeon().layer).toBe(1);
    expect(near(sim.curr.pos, layerLevel(1).arrival)).toBe(true);
    goDeeper();
    expect(dungeon().layer).toBe(2);
    expect(near(sim.curr.pos, layerLevel(2).arrival)).toBe(true);
    expect(dungeon().deepest).toBe(2);
    expect(isUnderground(sim.curr.pos)).toBe(true);
  });

  it('lead up to the foot of the stairs down of the layer above, and out of layer 1 to the pavilion', () => {
    goDown();
    goDeeper();
    goUp();
    expect(dungeon().layer).toBe(1);
    expect(near(sim.curr.pos, layerLevel(1).arrivalDown)).toBe(true);
    goUp();
    expect(dungeon().layer).toBe(0);
    expect(near(sim.curr.pos, METRO.door)).toBe(true);
    expect(activeLevel()).toBeNull();
    expect(combat.enemies.some((e) => e.instanced)).toBe(false);
  });

  it('stop at the bottom: layer 100 has nothing deeper', () => {
    dungeon().setLayer(MAX_LAYER);
    syncDungeonWorld();
    goDeeper();
    expect(dungeon().layer).toBe(MAX_LAYER);
    expect(useToastStore.getState().toasts.some((t) => t.text.includes('deepest'))).toBe(true);
  });

  it('cannot skip past the deepest layer reached from the pavilion', () => {
    goDown(50);
    expect(dungeon().layer).toBe(1);
    dungeon().setLayer(30);
    dungeon().setLayer(0);
    syncDungeonWorld();
    goDown(20);
    expect(dungeon().layer).toBe(20);
    dungeon().setLayer(0);
    syncDungeonWorld();
    goDown(99);
    expect(dungeon().layer).toBe(30);
  });

  it('are left behind by Recall or any other trip to the surface', () => {
    goDown();
    goDeeper();
    travelTo(currentMap.spawn);
    expect(dungeon().layer).toBe(0);
    expect(activeLevel()).toBeNull();
    expect(dungeon().deepest).toBe(2);
  });
});

describe('the depth choices at the metro door', () => {
  it('are layer 1, every tenth layer reached and the deepest', () => {
    expect(depthChoices(0)).toEqual([1]);
    expect(depthChoices(1)).toEqual([1]);
    expect(depthChoices(9)).toEqual([1, 9]);
    expect(depthChoices(10)).toEqual([1, 10]);
    expect(depthChoices(27)).toEqual([1, 10, 20, 27]);
    expect(depthChoices(100)).toHaveLength(11);
  });
});

describe('clearing a layer', () => {
  it('counts as cleared once every monster is down, once per visit', () => {
    goDown();
    stepGate(sim.curr.pos);
    expect(dungeon().layerCleared).toBe(false);
    for (const e of hallMonsters()) {
      e.hp = 0;
      e.state = 'dead';
    }
    stepGate(sim.curr.pos);
    expect(dungeon().layerCleared).toBe(true);
    expect(dungeon().hallsCleared).toBe(true);
    expect(dungeon().gateOpen).toBe(false);
    const toasts = useToastStore.getState().toasts.length;
    stepGate(sim.curr.pos);
    expect(useToastStore.getState().toasts).toHaveLength(toasts);
  });

  it('opens the gate of a boss layer', () => {
    dungeon().setLayer(10);
    syncDungeonWorld();
    travelTo(layerLevel(10).arrival);
    for (const e of hallMonsters()) {
      e.hp = 0;
      e.state = 'dead';
    }
    stepGate(sim.curr.pos);
    expect(dungeon().gateOpen).toBe(true);
  });
});

describe('a boss falls', () => {
  it('pays pearls and the Registrar’s Seal on layer 10, once, and only pearls-worth on a repeat', () => {
    dungeon().setLayer(10);
    onBossDefeated({ x: 13, z: 130 });
    const first = loot.pickups.length;
    expect(first).toBe(bossReward(10).pearls + 1);
    expect(loot.pickups.some((p) => p.item === 'registrarSeal')).toBe(true);
    expect(dungeon().bossDefeated).toBe(true);
    expect(dungeon().bossLayers).toEqual([10]);
    onBossDefeated({ x: 13, z: 130 });
    expect(loot.pickups).toHaveLength(first);
  });

  it('pays a different reward on each boss layer, better with depth', () => {
    expect(bossReward(10).gear).toBe('registrarSeal');
    expect(bossReward(20).pearls).toBeGreaterThan(bossReward(10).pearls);
    expect(new Set([20, 30, 40, 50].map((n) => bossReward(n).gear)).size).toBeGreaterThan(1);
    dungeon().setLayer(30);
    onBossDefeated({ x: 13, z: 130 });
    dungeon().setLayer(40);
    onBossDefeated({ x: 13, z: 130 });
    expect(dungeon().bossLayers).toEqual([30, 40]);
  });
});
