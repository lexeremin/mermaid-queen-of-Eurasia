import { beforeEach, describe, expect, it } from 'vitest';
import { UNDERGROUND } from '@/data/maps/underground';
import { combat } from '@/game/combat-sim';
import { gateIsShut, syncDungeonWorld } from '@/game/dungeon-sim';
import { currentWorld } from '@/game/world/current-map';
import { useDungeonStore } from '@/store/dungeon-store';
import { resolveCircle } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';

const gate = UNDERGROUND.gate;
const blocked = () => {
  const from = { x: gate.x, z: gate.z + 2 };
  const to = resolveCircle({ x: gate.x, z: gate.z - 0.2 }, PLAYER_RADIUS, currentWorld);
  return Math.abs(to.z - (gate.z - 0.2)) > 0.01 || from.z < to.z;
};

describe('the boss gate in the world', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset();
    syncDungeonWorld();
  });

  it('starts shut, and blocks the corridor', () => {
    expect(gateIsShut()).toBe(true);
    expect(blocked()).toBe(true);
  });

  it('stops blocking once opened, and shuts again for a fresh game', () => {
    useDungeonStore.getState().openGate();
    syncDungeonWorld();
    expect(gateIsShut()).toBe(false);
    expect(blocked()).toBe(false);
    useDungeonStore.getState().reset();
    syncDungeonWorld();
    expect(gateIsShut()).toBe(true);
  });

  it('adds the collider only once however often it syncs', () => {
    syncDungeonWorld();
    syncDungeonWorld();
    const count = currentWorld.colliders.filter((c) => c === gate.box).length;
    expect(count).toBe(1);
  });

  it('keeps a beaten boss and his helpers down', () => {
    useDungeonStore.getState().defeatBoss();
    syncDungeonWorld();
    const boss = combat.enemies.find((e) => e.kind === 'boss')!;
    expect(boss.state).toBe('dead');
    expect(combat.enemies.filter((e) => e.helper).every((e) => e.state === 'dead')).toBe(true);
  });
});
