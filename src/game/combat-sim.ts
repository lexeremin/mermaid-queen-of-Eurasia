import { resetSim, sim } from '@/game/sim';
import { currentMap } from '@/game/world/current-map';
import { useCombatStore } from '@/store/combat-store';
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

/** "Get up": back at the spawn with partial health, enemies calmed. */
export function reviveAtSpawn(): void {
  revive(combat, currentStats());
  resetSim();
  sim.path = [];
  useGameStore.getState().setDowned(false);
  useCombatStore.getState().set(combat.hp, combat.mana);
}
