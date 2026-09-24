import { createPlayer, type PlayerState } from '@/systems/movement';
import { lerp } from '@/utils/math';
import type { Vec2 } from '@/utils/vec2';

export const SIM_STEP = 1 / 60;
export const MAX_STEPS_PER_FRAME = 5;

export const sim: { prev: PlayerState; curr: PlayerState; alpha: number } = {
  prev: createPlayer(),
  curr: createPlayer(),
  alpha: 0,
};

export function resetSim(): void {
  sim.prev = createPlayer();
  sim.curr = createPlayer();
  sim.alpha = 0;
}

export function getRenderPosition(out: Vec2): Vec2 {
  out.x = lerp(sim.prev.pos.x, sim.curr.pos.x, sim.alpha);
  out.z = lerp(sim.prev.pos.z, sim.curr.pos.z, sim.alpha);
  return out;
}
