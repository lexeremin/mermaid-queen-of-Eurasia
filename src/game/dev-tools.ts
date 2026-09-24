import { walkTo } from '@/game/GameLoop';
import { sim } from '@/game/sim';
import { input } from '@/input/input-state';
import { currentWorld } from '@/game/world/current-map';
import { resolveCircle } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { useGameStore, type HeroForm } from '@/store/game-store';

declare global {
  interface Window {
    __mq?: {
      teleport: (x: number, z: number) => void;
      setForm: (form: HeroForm) => void;
      moveTo: (x: number, z: number) => boolean;
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
