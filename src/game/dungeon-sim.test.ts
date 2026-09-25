import { beforeEach, describe, expect, it } from 'vitest';
import { isBossKind } from '@/data/enemies';
import { isUnderground, layerLevel } from '@/data/maps/underground';
import { combat, resetCombat } from '@/game/combat-sim';
import {
  activeLevel,
  enterLayer,
  gateIsShut,
  hallMonsters,
  hallsAreClear,
  leaveDungeon,
  syncDungeonWorld,
} from '@/game/dungeon-sim';
import { currentMap, currentWorld } from '@/game/world/current-map';
import { useDungeonStore } from '@/store/dungeon-store';
import { resolveCircle } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';

const SURFACE_ENEMIES = currentMap.enemies.length;

const kill = (e: (typeof combat.enemies)[number]) => {
  e.hp = 0;
  e.state = 'dead';
  e.deadFor = 999;
};

beforeEach(() => {
  resetCombat();
  useDungeonStore.getState().reset();
  syncDungeonWorld();
});

describe('a layer in the world', () => {
  it('starts on the surface: nothing underground is installed', () => {
    expect(activeLevel()).toBeNull();
    expect(combat.enemies).toHaveLength(SURFACE_ENEMIES);
    expect(combat.enemies.every((e) => !e.instanced)).toBe(true);
  });

  it('brings in its walls and monsters when entered, and takes them out when left', () => {
    const before = currentWorld.colliders.length;
    enterLayer(3);
    const level = layerLevel(3);
    expect(activeLevel()).toBe(level);
    expect(currentWorld.colliders.length).toBe(before + level.colliders.length + 0);
    expect(combat.enemies).toHaveLength(SURFACE_ENEMIES + level.enemies.length);
    expect(combat.enemies.slice(SURFACE_ENEMIES).map((e) => e.id)).toEqual(
      level.enemies.map((e) => e.id),
    );
    expect(combat.enemies.slice(SURFACE_ENEMIES).every((e) => e.instanced && e.power > 1)).toBe(
      true,
    );
    // The wall of the landing now stops Rosa.
    const wall = level.colliders[0]!;
    if (wall.kind === 'box') {
      const p = resolveCircle({ x: wall.cx, z: wall.cz }, PLAYER_RADIUS, currentWorld);
      expect(Math.hypot(p.x - wall.cx, p.z - wall.cz)).toBeGreaterThan(0.1);
    }
    leaveDungeon();
    expect(activeLevel()).toBeNull();
    expect(currentWorld.colliders.length).toBe(before);
    expect(combat.enemies).toHaveLength(SURFACE_ENEMIES);
  });

  it('swaps one layer for the next without leaving anything of the first behind', () => {
    const before = currentWorld.colliders.length;
    enterLayer(1);
    enterLayer(2);
    const level = layerLevel(2);
    expect(useDungeonStore.getState().layer).toBe(2);
    expect(currentWorld.colliders.length).toBe(before + level.colliders.length);
    expect(combat.enemies.filter((e) => e.instanced).every((e) => e.id.startsWith('L2-'))).toBe(
      true,
    );
    expect(isUnderground(level.arrival)).toBe(true);
  });

  it('makes a layer fresh each time it is entered: monsters back, gate shut', () => {
    enterLayer(10);
    hallMonsters().forEach(kill);
    useDungeonStore.getState().openGate();
    syncDungeonWorld();
    expect(hallsAreClear()).toBe(true);
    expect(gateIsShut()).toBe(false);
    enterLayer(9);
    enterLayer(10);
    expect(hallsAreClear()).toBe(false);
    expect(hallMonsters().every((e) => e.state !== 'dead' && e.hp > 0)).toBe(true);
    expect(gateIsShut()).toBe(true);
    expect(combat.enemies.filter((e) => e.helper).every((e) => e.dormant)).toBe(true);
  });

  it('gives monsters the health of their layer', () => {
    enterLayer(50);
    const mob = combat.enemies.find((e) => e.id.startsWith('L50-') && e.kind === 'tycoon')!;
    expect(mob.power).toBeCloseTo(layerLevel(50).enemies[0]!.power!);
    expect(mob.hp).toBeCloseTo(24 * mob.power);
  });

  it('adds walls once however often it syncs, and puts them back after a new combat state', () => {
    enterLayer(2);
    const count = currentWorld.colliders.length;
    syncDungeonWorld();
    syncDungeonWorld();
    expect(currentWorld.colliders.length).toBe(count);
    resetCombat();
    useDungeonStore.getState().hydrate({
      ...useDungeonStore.getState(),
      layer: 2,
      cachesTaken: [],
      bossLayers: [],
    });
    syncDungeonWorld();
    expect(currentWorld.colliders.length).toBe(count);
    expect(combat.enemies).toHaveLength(SURFACE_ENEMIES + layerLevel(2).enemies.length);
  });
});

describe('the boss gate', () => {
  it('blocks a boss layer until it is opened, and there is no gate on other layers', () => {
    enterLayer(10);
    expect(gateIsShut()).toBe(true);
    useDungeonStore.getState().openGate();
    syncDungeonWorld();
    expect(gateIsShut()).toBe(false);
    enterLayer(11);
    expect(gateIsShut()).toBe(false);
    expect(activeLevel()!.gate).toBeNull();
  });

  it('counts the monsters of the layer, not the boss or his helpers', () => {
    enterLayer(20);
    const level = layerLevel(20);
    const expected = level.enemies.filter((e) => !isBossKind(e.kind) && !e.dormant).length;
    expect(hallMonsters()).toHaveLength(expected);
    expect(hallMonsters().every((e) => !isBossKind(e.kind) && !e.helper)).toBe(true);
    expect(hallsAreClear()).toBe(false);
    hallMonsters().forEach(kill);
    expect(hallsAreClear()).toBe(true);
  });
});
