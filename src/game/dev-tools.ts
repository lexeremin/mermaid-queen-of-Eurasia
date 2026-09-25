import { Vector3, type Camera } from 'three';
import { loot, spawnDrops, spawnPickup } from '@/game/loot-sim';
import { grantXp } from '@/game/progress-actions';
import { gather } from '@/game/gather-sim';
import { useGardenStore } from '@/store/garden-store';
import { useDungeonStore } from '@/store/dungeon-store';
import { goDown, goUp, openBossDoor } from '@/game/dungeon-actions';
import { syncDungeonWorld } from '@/game/dungeon-sim';
import { renderStats } from '@/game/render-stats';
import { audioLog } from '@/audio/engine';
import { useQuestStore } from '@/store/quest-store';
import { useProgressStore } from '@/store/progress-store';
import { combat } from '@/game/combat-sim';
import { walkTo } from '@/game/GameLoop';
import { sim } from '@/game/sim';
import { input } from '@/input/input-state';
import { currentWorld } from '@/game/world/current-map';
import { resolveCircle } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { useDialogueStore } from '@/store/dialogue-store';
import { useGameStore, type HeroForm } from '@/store/game-store';
import { useNpcStore } from '@/store/npc-store';

declare global {
  interface Window {
    __mq?: {
      teleport: (x: number, z: number) => void;
      setForm: (form: HeroForm) => void;
      moveTo: (x: number, z: number) => boolean;
      project: (x: number, y: number, z: number) => { x: number; y: number };
      combat: () => typeof combat;
      npcs: typeof useNpcStore;
      dialogue: typeof useDialogueStore;
      world: typeof currentWorld;
      input: typeof input;
      audioLog: typeof audioLog;
      renderStats: typeof renderStats;
      garden: typeof useGardenStore;
      gather: typeof gather;
      progress: typeof useProgressStore;
      quests: typeof useQuestStore;
      loot: typeof loot;
      spawnDrops: typeof spawnDrops;
      spawnPickup: typeof spawnPickup;
      grantXp: typeof grantXp;
      dungeon: typeof useDungeonStore;
      goDown: typeof goDown;
      goUp: typeof goUp;
      openBossDoor: typeof openBossDoor;
      syncDungeonWorld: typeof syncDungeonWorld;
    };
  }
}

/** Dev-only helpers for browser-driven verification. */
export function installDevTools(): void {
  window.__mq = {
    world: currentWorld,
    input,
    audioLog,
    renderStats,
    garden: useGardenStore,
    gather,
    progress: useProgressStore,
    quests: useQuestStore,
    loot,
    spawnDrops,
    spawnPickup,
    grantXp,
    dungeon: useDungeonStore,
    goDown,
    goUp,
    openBossDoor,
    syncDungeonWorld,
    project(x, y, z) {
      const camera = (window as { __mqCamera?: Camera }).__mqCamera;
      if (!camera) return { x: 0, y: 0 };
      const v = new Vector3(x, y, z).project(camera);
      return { x: ((v.x + 1) / 2) * window.innerWidth, y: ((1 - v.y) / 2) * window.innerHeight };
    },
    combat: () => combat,
    npcs: useNpcStore,
    dialogue: useDialogueStore,
    moveTo: (x, z) => walkTo({ x, z }),
    setForm: (form) => useGameStore.getState().setForm(form),
    teleport(x, z) {
      const pos = resolveCircle({ x, z }, PLAYER_RADIUS, currentWorld);
      sim.prev = { ...sim.curr, pos };
      sim.curr = { ...sim.curr, pos };
    },
  };
  if (new URLSearchParams(window.location.search).get('form') === 'mermaid') {
    useGameStore.getState().setForm('mermaid');
  }
}
