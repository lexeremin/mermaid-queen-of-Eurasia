import { isBossKind } from '@/data/enemies';
import { layerLevel, type UndergroundLevel } from '@/data/maps/underground';
import { combat } from '@/game/combat-sim';
import { currentWorld } from '@/game/world/current-map';
import { nav } from '@/game/world/nav';
import { useDungeonStore } from '@/store/dungeon-store';
import type { Collider } from '@/systems/collision';
import { createEnemy } from '@/systems/enemy-ai';

/** The layer whose walls, gate and monsters are in the world right now (null on the surface). */
let installed: UndergroundLevel | null = null;
/** The combat state the installed layer's monsters were added to (`resetCombat` makes a new one). */
let installedIn: object | null = null;
let installedColliders = new Set<Collider>();

export const activeLevel = (): UndergroundLevel | null => installed;

/** Whether the boss gate currently blocks the corridor. */
export const gateIsShut = (): boolean =>
  installed?.gate ? currentWorld.colliders.includes(installed.gate.box) : false;

function removeColliders(): void {
  const colliders = currentWorld.colliders as Collider[];
  for (let i = colliders.length - 1; i >= 0; i--) {
    if (installedColliders.has(colliders[i]!)) colliders.splice(i, 1);
  }
  installedColliders = new Set();
}

function removeLevel(): void {
  removeColliders();
  combat.enemies = combat.enemies.filter((e) => !e.instanced);
  installed = null;
  installedIn = null;
}

function addLevel(level: UndergroundLevel): void {
  const colliders = currentWorld.colliders as Collider[];
  installedColliders = new Set(level.colliders);
  colliders.push(...level.colliders);
  for (const s of level.enemies) {
    combat.enemies.push(
      createEnemy(
        s.id,
        s.kind,
        { x: s.x, z: s.z },
        { dormant: s.dormant, instanced: true, power: s.power },
      ),
    );
  }
  installed = level;
  installedIn = combat;
}

/**
 * Makes the world match the dungeon store: the walls, monsters and gate of the layer Rosa is in are installed (and
 * the previous layer's removed), the gate blocks its corridor until it is opened (which changes what is walkable,
 * so the path cache is cleared). Call after loading a save, after a reset, when the layer changes and when the gate
 * opens.
 */
export function syncDungeonWorld(): void {
  const { layer, gateOpen } = useDungeonStore.getState();
  if (installed && installedIn !== combat) {
    // A new combat state (new game, tests): the old layer's monsters went with the old one.
    removeColliders();
    installed = null;
    installedIn = null;
  }
  if ((installed?.layer ?? 0) !== layer) {
    if (installed) removeLevel();
    if (layer > 0) addLevel(layerLevel(layer));
    nav.reset();
  }
  const gate = installed?.gate?.box;
  if (!gate) return;
  const colliders = currentWorld.colliders as Collider[];
  const shut = colliders.includes(gate);
  if (gateOpen && shut) {
    colliders.splice(colliders.indexOf(gate), 1);
    nav.reset();
  } else if (!gateOpen && !shut) {
    colliders.push(gate);
    installedColliders.add(gate);
    nav.reset();
  }
}

/** Every monster of the layer (not the boss or his helpers). */
export const hallMonsters = () =>
  combat.enemies.filter((e) => e.instanced && !isBossKind(e.kind) && !e.helper);

export const hallsAreClear = (): boolean => {
  const monsters = hallMonsters();
  return monsters.length > 0 && monsters.every((e) => e.state === 'dead');
};

/** Rosa steps into a layer (from either side): it is made fresh, with all its monsters and a shut gate. */
export function enterLayer(layer: number): void {
  useDungeonStore.getState().setLayer(layer);
  if (installed && installed.layer === layer) {
    // The same layer again (down and up the same stairs): make it fresh.
    removeLevel();
  }
  syncDungeonWorld();
}

/** Back on the surface: the layer's walls and monsters leave the world. */
export function leaveDungeon(): void {
  useDungeonStore.getState().setLayer(0);
  syncDungeonWorld();
}

// A fresh game starts on the surface.
syncDungeonWorld();
