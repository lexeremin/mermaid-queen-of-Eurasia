import { sim } from '@/game/sim';
import { currentWorld } from '@/game/world/current-map';
import { resolveCircle } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';

declare global {
  interface Window {
    __mq?: { teleport: (x: number, z: number) => void; world: typeof currentWorld };
  }
}

/** Dev-only helpers for browser-driven verification. */
export function installDevTools(): void {
  window.__mq = {
    world: currentWorld,
    teleport(x, z) {
      const pos = resolveCircle({ x, z }, PLAYER_RADIUS, currentWorld);
      sim.prev = { ...sim.curr, pos };
      sim.curr = { ...sim.curr, pos };
    },
  };
}
