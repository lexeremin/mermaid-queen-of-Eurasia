import { Vector3, type Camera } from 'three';
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
    };
  }
}

/** Dev-only helpers for browser-driven verification. */
export function installDevTools(): void {
  window.__mq = {
    world: currentWorld,
    input,
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
