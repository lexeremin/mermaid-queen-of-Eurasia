import { describe, expect, it } from 'vitest';
import { NPC_BY_ID, NPCS } from '@/data/npcs';
import { RED_SQUARE } from '@/data/maps/red-square';
import { approachPoint, TALK_RANGE } from '@/systems/interaction';
import { resolveCircle } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid, findPath } from '@/systems/pathfinding';

const world = buildCollisionWorld(RED_SQUARE);
const grid = createNavGrid(world, PLAYER_RADIUS, 0.5);

describe('NPC placement', () => {
  it('has one spot for each of the eight NPCs', () => {
    expect(RED_SQUARE.npcs.map((n) => n.id).sort()).toEqual(NPCS.map((n) => n.id).sort());
    for (const spot of RED_SQUARE.npcs) expect(NPC_BY_ID.has(spot.id)).toBe(true);
  });

  it('puts every NPC on free ground inside the bounds', () => {
    const { bounds } = RED_SQUARE;
    for (const spot of RED_SQUARE.npcs) {
      expect(spot.x).toBeGreaterThan(bounds.minX);
      expect(spot.x).toBeLessThan(bounds.maxX);
      expect(spot.z).toBeGreaterThan(bounds.minZ);
      expect(spot.z).toBeLessThan(bounds.maxZ);
    }
  });

  it('lets Rosa walk from the spawn to within talking range of every NPC', () => {
    for (const spot of RED_SQUARE.npcs) {
      const target = approachPoint(spot, RED_SQUARE.spawn);
      const path = findPath(grid, RED_SQUARE.spawn, target);
      expect(path, spot.id).not.toBeNull();
      const end = path![path!.length - 1]!;
      expect(Math.hypot(end.x - spot.x, end.z - spot.z), spot.id).toBeLessThanOrEqual(TALK_RANGE);
    }
  });

  it('never stands an NPC inside a building or prop', () => {
    const bare = buildCollisionWorld({ ...RED_SQUARE, npcs: [] });
    for (const spot of RED_SQUARE.npcs) {
      const p = resolveCircle({ x: spot.x, z: spot.z }, 0.6, bare);
      expect(Math.hypot(p.x - spot.x, p.z - spot.z), spot.id).toBeLessThan(0.01);
    }
  });

  it('keeps NPCs at least 2 m apart so they never overlap', () => {
    const spots = RED_SQUARE.npcs;
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        const a = spots[i]!;
        const b = spots[j]!;
        expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(2);
      }
    }
  });
});

describe('enemy placement', () => {
  const bare = buildCollisionWorld({ ...RED_SQUARE, npcs: [] });

  it('has unique ids and all three enemy kinds', () => {
    const ids = RED_SQUARE.enemies.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(RED_SQUARE.enemies.map((e) => e.kind))).toEqual(
      new Set(['paperWisp', 'stampGolem', 'memoThrower']),
    );
  });

  it('spawns on free ground inside the bounds', () => {
    const { bounds } = RED_SQUARE;
    for (const e of RED_SQUARE.enemies) {
      expect(e.x).toBeGreaterThan(bounds.minX);
      expect(e.x).toBeLessThan(bounds.maxX);
      expect(e.z).toBeGreaterThan(bounds.minZ);
      expect(e.z).toBeLessThan(bounds.maxZ);
      const p = resolveCircle({ x: e.x, z: e.z }, 1, bare);
      expect(Math.hypot(p.x - e.x, p.z - e.z), e.id).toBeLessThan(0.01);
    }
  });

  it('keeps enemies out of aggro range of every NPC and of the player spawn', () => {
    for (const e of RED_SQUARE.enemies) {
      for (const n of RED_SQUARE.npcs)
        expect(Math.hypot(e.x - n.x, e.z - n.z), `${e.id}/${n.id}`).toBeGreaterThan(12);
      expect(Math.hypot(e.x - RED_SQUARE.spawn.x, e.z - RED_SQUARE.spawn.z), e.id).toBeGreaterThan(
        12,
      );
    }
  });

  it('lets Rosa walk to every enemy spawn', () => {
    for (const e of RED_SQUARE.enemies) {
      expect(findPath(grid, RED_SQUARE.spawn, { x: e.x, z: e.z }), e.id).not.toBeNull();
    }
  });
});
