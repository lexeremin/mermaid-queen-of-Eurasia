import { clamp } from '@/utils/math';
import { isZero, normalize, type Vec2 } from '@/utils/vec2';

export const PLAYER_SPEED = 5;
export const WORLD_HALF_SIZE = 28;

export type PlayerState = { pos: Vec2; facing: Vec2 };
export type MoveIntent = { move: Vec2; aim: Vec2 };

export function createPlayer(): PlayerState {
  return { pos: { x: 0, z: 0 }, facing: { x: 0, z: 1 } };
}

export function stepPlayer(player: PlayerState, intent: MoveIntent, dt: number): PlayerState {
  const { move, aim } = intent;
  const pos = {
    x: clamp(player.pos.x + move.x * PLAYER_SPEED * dt, -WORLD_HALF_SIZE, WORLD_HALF_SIZE),
    z: clamp(player.pos.z + move.z * PLAYER_SPEED * dt, -WORLD_HALF_SIZE, WORLD_HALF_SIZE),
  };
  const facing = !isZero(aim) ? normalize(aim) : !isZero(move) ? normalize(move) : player.facing;
  return { pos, facing };
}
