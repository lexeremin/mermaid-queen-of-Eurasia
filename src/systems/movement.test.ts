import { describe, expect, it } from 'vitest';
import type { CollisionWorld } from '@/systems/collision';
import { createPlayer, PLAYER_RADIUS, PLAYER_SPEED, stepPlayer } from '@/systems/movement';

const still = { x: 0, z: 0 };
const bounds = { minX: -28, maxX: 28, minZ: -28, maxZ: 28 };
const open: CollisionWorld = { bounds, colliders: [] };

describe('stepPlayer', () => {
  it('moves at PLAYER_SPEED along the move vector', () => {
    const next = stepPlayer(createPlayer(), { move: { x: 1, z: 0 }, aim: still }, 0.5, open);
    expect(next.pos.x).toBeCloseTo(PLAYER_SPEED * 0.5);
    expect(next.pos.z).toBe(0);
  });

  it('starts at the given spawn', () => {
    expect(createPlayer({ x: 3, z: 13 }).pos).toEqual({ x: 3, z: 13 });
  });

  it('does not mutate the previous state', () => {
    const start = createPlayer();
    stepPlayer(start, { move: { x: 1, z: 0 }, aim: still }, 1, open);
    expect(start.pos).toEqual({ x: 0, z: 0 });
  });

  it('stops at the map bounds', () => {
    const start = { ...createPlayer(), pos: { x: 27.5, z: -27.5 } };
    const next = stepPlayer(start, { move: { x: 1, z: -1 }, aim: still }, 10, open);
    expect(next.pos).toEqual({ x: 28 - PLAYER_RADIUS, z: -28 + PLAYER_RADIUS });
  });

  it('is blocked by a wall and slides along it', () => {
    const wall: CollisionWorld = {
      bounds,
      colliders: [{ kind: 'box', cx: 5, cz: 0, hx: 0.5, hz: 10 }],
    };
    const start = { ...createPlayer(), pos: { x: 4, z: 0 } };
    const next = stepPlayer(start, { move: { x: 0.7071, z: 0.7071 }, aim: still }, 0.2, wall);
    expect(next.pos.x).toBeCloseTo(4.5 - PLAYER_RADIUS);
    expect(next.pos.z).toBeCloseTo(0.7071);
  });

  it('faces the aim direction when aiming, else the move direction, else keeps facing', () => {
    const start = createPlayer();
    const aiming = stepPlayer(start, { move: { x: 1, z: 0 }, aim: { x: 0, z: -2 } }, 0.1, open);
    expect(aiming.facing).toEqual({ x: 0, z: -1 });
    const moving = stepPlayer(start, { move: { x: -1, z: 0 }, aim: still }, 0.1, open);
    expect(moving.facing).toEqual({ x: -1, z: 0 });
    const idle = stepPlayer(moving, { move: still, aim: still }, 0.1, open);
    expect(idle.facing).toEqual({ x: -1, z: 0 });
  });
});
