import { describe, expect, it } from 'vitest';
import type { CollisionWorld } from '@/systems/collision';
import {
  createPlayer,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  stepPlayer,
  turnToward,
  TURN_SPEED,
} from '@/systems/movement';

const still = { x: 0, z: 0 };
const bounds = { minX: -28, maxX: 28, minZ: -28, maxZ: 28 };
const open: CollisionWorld = { bounds, colliders: [] };

describe('stepPlayer', () => {
  it('moves at PLAYER_SPEED along the move vector', () => {
    const next = stepPlayer(createPlayer(), { move: { x: 1, z: 0 } }, 0.5, open);
    expect(next.pos.x).toBeCloseTo(PLAYER_SPEED * 0.5);
    expect(next.pos.z).toBe(0);
  });

  it('starts at the given spawn', () => {
    expect(createPlayer({ x: 3, z: 13 }).pos).toEqual({ x: 3, z: 13 });
  });

  it('does not mutate the previous state', () => {
    const start = createPlayer();
    stepPlayer(start, { move: { x: 1, z: 0 } }, 1, open);
    expect(start.pos).toEqual({ x: 0, z: 0 });
  });

  it('stops at the map bounds', () => {
    const start = { ...createPlayer(), pos: { x: 27.5, z: -27.5 } };
    const next = stepPlayer(start, { move: { x: 1, z: -1 } }, 10, open);
    expect(next.pos).toEqual({ x: 28 - PLAYER_RADIUS, z: -28 + PLAYER_RADIUS });
  });

  it('is blocked by a wall and slides along it', () => {
    const wall: CollisionWorld = {
      bounds,
      colliders: [{ kind: 'box', cx: 5, cz: 0, hx: 0.5, hz: 10 }],
    };
    const start = { ...createPlayer(), pos: { x: 4, z: 0 } };
    const next = stepPlayer(start, { move: { x: 0.7071, z: 0.7071 } }, 0.2, wall);
    expect(next.pos.x).toBeCloseTo(4.5 - PLAYER_RADIUS);
    expect(next.pos.z).toBeCloseTo(0.7071);
  });

  it('keeps facing when idle', () => {
    const start = { ...createPlayer(), facing: { x: -1, z: 0 } };
    expect(stepPlayer(start, { move: still }, 0.1, open).facing).toEqual({ x: -1, z: 0 });
  });

  it('turns toward the movement direction instead of snapping', () => {
    const start = createPlayer();
    const dt = 1 / 60;
    const next = stepPlayer(start, { move: { x: 1, z: 0 } }, dt, open);
    const turned = Math.atan2(next.facing.x, next.facing.z);
    expect(turned).toBeGreaterThan(0);
    expect(turned).toBeLessThan(Math.PI / 2);
    expect(turned).toBeCloseTo(TURN_SPEED * dt);
  });

  it('finishes turning to face the movement direction after a short time', () => {
    let player = createPlayer();
    for (let i = 0; i < 30; i++)
      player = stepPlayer(player, { move: { x: 1, z: 0 } }, 1 / 60, open);
    expect(player.facing.x).toBeCloseTo(1);
    expect(player.facing.z).toBeCloseTo(0);
  });
});

describe('turnToward', () => {
  it('takes the short way around', () => {
    const result = turnToward(
      { x: Math.sin(3), z: Math.cos(3) },
      { x: Math.sin(-3), z: Math.cos(-3) },
      0.1,
    );
    const angle = Math.atan2(result.x, result.z);
    expect(angle).toBeGreaterThan(3);
  });

  it('reaches the target when within the maximum angle', () => {
    expect(turnToward({ x: 0, z: 1 }, { x: 1, z: 0 }, Math.PI)).toEqual({ x: 1, z: 0 });
  });
});
