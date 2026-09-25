import { UNDERGROUND } from '@/data/maps/underground';
import { combat } from '@/game/combat-sim';
import { currentWorld } from '@/game/world/current-map';
import { nav } from '@/game/world/nav';
import { useDungeonStore } from '@/store/dungeon-store';
import type { Collider } from '@/systems/collision';

const GATE_COLLIDER: Collider = UNDERGROUND.gate.box;

/** Whether the boss gate currently blocks the corridor. */
export const gateIsShut = (): boolean => currentWorld.colliders.includes(GATE_COLLIDER);

/**
 * Makes the world match the dungeon store: the gate blocks the corridor until it is opened (which changes what
 * is walkable, so the path cache is cleared), and a beaten boss stays down along with his helpers.
 * Call after loading a save, after a reset, and when the gate opens.
 */
export function syncDungeonWorld(): void {
  const { gateOpen, bossDefeated } = useDungeonStore.getState();
  const colliders = currentWorld.colliders as Collider[];
  const shut = colliders.includes(GATE_COLLIDER);
  if (gateOpen && shut) {
    colliders.splice(colliders.indexOf(GATE_COLLIDER), 1);
    nav.reset();
  } else if (!gateOpen && !shut) {
    colliders.push(GATE_COLLIDER);
    nav.reset();
  }
  if (bossDefeated) {
    for (const e of combat.enemies) {
      if (e.kind !== 'boss' && !e.helper) continue;
      e.dormant = false;
      e.hp = 0;
      e.state = 'dead';
      e.deadFor = 999;
    }
  }
}

// A fresh game starts with the gate shut.
syncDungeonWorld();
