import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import { isZero, normalize, type Vec2 } from '@/utils/vec2';

export const PLAYER_SPEED = 5;
export const PLAYER_RADIUS = 0.4;
/** Radians per second the character can turn toward the direction it is moving. */
export const TURN_SPEED = 14;

export type PlayerState = { pos: Vec2; facing: Vec2 };
export type MoveIntent = { move: Vec2 };

export function createPlayer(spawn: Vec2 = { x: 0, z: 0 }): PlayerState {
  return { pos: { x: spawn.x, z: spawn.z }, facing: { x: 0, z: 1 } };
}

/** Rotates the unit vector `current` toward `desired` by at most `maxAngle` (angle = atan2(x, z)). */
export function turnToward(current: Vec2, desired: Vec2, maxAngle: number): Vec2 {
  const from = Math.atan2(current.x, current.z);
  const to = Math.atan2(desired.x, desired.z);
  let diff = to - from;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) <= maxAngle) return { x: desired.x, z: desired.z };
  const angle = from + Math.sign(diff) * maxAngle;
  return { x: Math.sin(angle), z: Math.cos(angle) };
}

export function stepPlayer(
  player: PlayerState,
  intent: MoveIntent,
  dt: number,
  world: CollisionWorld,
  /** Scales the walking speed (the mermaid form is slower on land and faster in water). */
  speedMult = 1,
): PlayerState {
  const { move } = intent;
  const target = {
    x: player.pos.x + move.x * PLAYER_SPEED * speedMult * dt,
    z: player.pos.z + move.z * PLAYER_SPEED * speedMult * dt,
  };
  const pos = resolveCircle(target, PLAYER_RADIUS, world);
  const facing = isZero(move)
    ? player.facing
    : turnToward(player.facing, normalize(move), TURN_SPEED * dt);
  return { pos, facing };
}
