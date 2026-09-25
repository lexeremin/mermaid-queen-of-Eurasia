import { isUnderground, layerLevel } from '@/data/maps/underground';
import { resetSim, sim } from '@/game/sim';
import { currentMap } from '@/game/world/current-map';
import { useCombatStore } from '@/store/combat-store';
import { useDungeonStore } from '@/store/dungeon-store';
import { resetLoot } from '@/game/loot-sim';
import { useGameStore } from '@/store/game-store';
import { currentStats } from '@/store/progress-store';
import { createCombatState, revive, type CombatState } from '@/systems/combat';

/** Mutable combat simulation state, like `sim`. Read by the renderer and HUD every frame. */
export let combat: CombatState = createCombatState(currentMap.enemies);

export function resetCombat(): void {
  combat = createCombatState(currentMap.enemies);
  resetLoot();
  useCombatStore.getState().set(combat.hp, combat.mana);
  useGameStore.getState().setDowned(false);
}

/** "Get up": back at the spawn (or, underground, at the foot of the stairs) with partial health, enemies calmed. */
export function reviveAtSpawn(): void {
  const below = isUnderground(sim.curr.pos);
  revive(combat, currentStats());
  resetSim();
  if (below) {
    const pos = { ...layerLevel(Math.max(1, useDungeonStore.getState().layer)).arrival };
    sim.prev = { ...sim.curr, pos };
    sim.curr = { ...sim.curr, pos };
  }
  sim.path = [];
  useGameStore.getState().setDowned(false);
  useCombatStore.getState().set(combat.hp, combat.mana);
}
