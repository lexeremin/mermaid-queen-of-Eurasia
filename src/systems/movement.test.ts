import { describe, expect, it } from 'vitest';
import { createPlayer, PLAYER_SPEED, stepPlayer, WORLD_HALF_SIZE } from '@/systems/movement';

const still = { x: 0, z: 0 };

describe('stepPlayer', () => {
  it('moves at PLAYER_SPEED along the move vector', () => {
    const next = stepPlayer(createPlayer(), { move: { x: 1, z: 0 }, aim: still }, 0.5);
    expect(next.pos.x).toBeCloseTo(PLAYER_SPEED * 0.5);
    expect(next.pos.z).toBe(0);
  });

  it('does not mutate the previous state', () => {
    const start = createPlayer();
    stepPlayer(start, { move: { x: 1, z: 0 }, aim: still }, 1);
    expect(start.pos).toEqual({ x: 0, z: 0 });
  });

  it('clamps to world bounds', () => {
    const start = { ...createPlayer(), pos: { x: WORLD_HALF_SIZE, z: -WORLD_HALF_SIZE } };
    const next = stepPlayer(start, { move: { x: 1, z: -1 }, aim: still }, 10);
    expect(next.pos).toEqual({ x: WORLD_HALF_SIZE, z: -WORLD_HALF_SIZE });
  });

  it('faces the aim direction when aiming, else the move direction, else keeps facing', () => {
    const start = createPlayer();
    const aiming = stepPlayer(start, { move: { x: 1, z: 0 }, aim: { x: 0, z: -2 } }, 0.1);
    expect(aiming.facing).toEqual({ x: 0, z: -1 });
    const moving = stepPlayer(start, { move: { x: -1, z: 0 }, aim: still }, 0.1);
    expect(moving.facing).toEqual({ x: -1, z: 0 });
    const idle = stepPlayer(moving, { move: still, aim: still }, 0.1);
    expect(idle.facing).toEqual({ x: -1, z: 0 });
  });
});
