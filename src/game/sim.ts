import { currentMap } from '@/game/world/current-map';
import { createPlayer, type PlayerState } from '@/systems/movement';
import { lerp } from '@/utils/math';
import type { Vec2 } from '@/utils/vec2';

export const SIM_STEP = 1 / 60;
export const MAX_STEPS_PER_FRAME = 5;

export const sim: {
  prev: PlayerState;
  curr: PlayerState;
  alpha: number;
  /** Remaining waypoints of a click-to-move walk; the last one is the destination. */
  path: Vec2[];
  stuckTime: number;
} = {
  prev: createPlayer(currentMap.spawn),
  curr: createPlayer(currentMap.spawn),
  alpha: 0,
  path: [],
  stuckTime: 0,
};

export function resetSim(): void {
  sim.prev = createPlayer(currentMap.spawn);
  sim.curr = createPlayer(currentMap.spawn);
  sim.alpha = 0;
  sim.path = [];
  sim.stuckTime = 0;
}

export function getRenderPosition(out: Vec2): Vec2 {
  out.x = lerp(sim.prev.pos.x, sim.curr.pos.x, sim.alpha);
  out.z = lerp(sim.prev.pos.z, sim.curr.pos.z, sim.alpha);
  return out;
}
