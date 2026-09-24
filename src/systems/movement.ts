import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import { isZero, normalize, type Vec2 } from '@/utils/vec2';

export const PLAYER_SPEED = 5;
export const PLAYER_RADIUS = 0.4;

export type PlayerState = { pos: Vec2; facing: Vec2 };
export type MoveIntent = { move: Vec2; aim: Vec2 };

export function createPlayer(spawn: Vec2 = { x: 0, z: 0 }): PlayerState {
  return { pos: { x: spawn.x, z: spawn.z }, facing: { x: 0, z: 1 } };
}

export function stepPlayer(
  player: PlayerState,
  intent: MoveIntent,
  dt: number,
  world: CollisionWorld,
): PlayerState {
  const { move, aim } = intent;
  const target = {
    x: player.pos.x + move.x * PLAYER_SPEED * dt,
    z: player.pos.z + move.z * PLAYER_SPEED * dt,
  };
  const pos = resolveCircle(target, PLAYER_RADIUS, world);
  const facing = !isZero(aim) ? normalize(aim) : !isZero(move) ? normalize(move) : player.facing;
  return { pos, facing };
}
