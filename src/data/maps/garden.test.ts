import { describe, expect, it } from 'vitest';
import { RED_SQUARE } from '@/data/maps/red-square';
import type { MapData } from '@/data/maps/types';
import { isInWater } from '@/systems/water';
import { resolveCircle } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid, findPath } from '@/systems/pathfinding';
import { TALK_RANGE, approachPoint } from '@/systems/interaction';
import { zoneAt } from '@/systems/zones';

const gridOf = (map: MapData) => createNavGrid(buildCollisionWorld(map), PLAYER_RADIUS, 0.5);
const grid = gridOf(RED_SQUARE);
const world = buildCollisionWorld(RED_SQUARE);
const shrine = RED_SQUARE.placements.find((p) => p.asset === 'shrine')!;
// The garden's own plants (the embankment's pearls are tested with the north of the map).
const gathers = (RED_SQUARE.gatherables ?? []).filter((g) => !g.id.startsWith('pearl-e'));
const GARDEN_ENTRANCE = { x: 53, z: 38 };

const free = (x: number, z: number) => {
  const p = resolveCircle({ x, z }, PLAYER_RADIUS, world);
  return Math.hypot(p.x - x, p.z - z) < 1e-6;
};

describe('garden gatherables', () => {
  it('has 6 rose hips, 6 moon mint and 7 hidden pearls with unique ids', () => {
    expect(new Set(gathers.map((g) => g.id)).size).toBe(gathers.length);
    expect(gathers.filter((g) => g.kind === 'roseHip')).toHaveLength(6);
    expect(gathers.filter((g) => g.kind === 'moonMint')).toHaveLength(6);
    expect(gathers.filter((g) => g.kind === 'pearl')).toHaveLength(7);
  });

  it('puts every one on free ground inside the garden that Rosa can walk to', () => {
    for (const g of gathers) {
      expect(free(g.x, g.z), g.id).toBe(true);
      expect(g.x, g.id).toBeGreaterThan(45.5);
      expect(g.x, g.id).toBeLessThan(RED_SQUARE.bounds.maxX);
      expect(findPath(grid, RED_SQUARE.spawn, { x: g.x, z: g.z }), g.id).not.toBeNull();
    }
  });

  it('hides two pearls in the pond ends, inside the swim zones', () => {
    for (const id of ['pearl-6', 'pearl-7']) {
      const g = gathers.find((n) => n.id === id)!;
      expect(isInWater(world.water, { x: g.x, z: g.z }), id).toBe(true);
    }
  });

  it('keeps plants apart so one step cannot sweep several', () => {
    for (const a of gathers)
      for (const b of gathers)
        if (a.id < b.id)
          expect(Math.hypot(a.x - b.x, a.z - b.z), `${a.id}/${b.id}`).toBeGreaterThan(2);
  });
});

describe('garden monsters', () => {
  it('has ten enemies in the garden strip, all on ground Rosa can reach', () => {
    const inGarden = RED_SQUARE.enemies.filter((e) => e.x > 45.5);
    expect(inGarden).toHaveLength(10);
    for (const e of inGarden) {
      expect(findPath(grid, RED_SQUARE.spawn, { x: e.x, z: e.z }), e.id).not.toBeNull();
    }
  });

  it('posts two guards just outside the shrine entrance', () => {
    const guards = RED_SQUARE.enemies.filter((e) => e.id.endsWith('-shrine'));
    expect(guards).toHaveLength(2);
    for (const g of guards) expect(Math.hypot(g.x - shrine.x, g.z - shrine.z)).toBeLessThan(9);
  });
});

describe('the hidden Pearl Shrine', () => {
  const front = approachPoint(
    { id: 's', x: shrine.x, z: shrine.z },
    { x: shrine.x, z: shrine.z + 6 },
  );

  it('can be reached and prayed at, through the gap in the hedge', () => {
    const path = findPath(grid, GARDEN_ENTRANCE, front);
    expect(path).not.toBeNull();
    const end = path![path!.length - 1]!;
    expect(Math.hypot(end.x - shrine.x, end.z - shrine.z)).toBeLessThanOrEqual(TALK_RANGE);
    const crossing = path!.find((p, i, all) => i > 0 && all[i - 1]!.z > -23.5 && p.z <= -23.5);
    expect(crossing).toBeDefined();
    expect(crossing!.x).toBeGreaterThan(58.4);
    expect(crossing!.x).toBeLessThan(60.4);
  });

  it('is closed on every other side: plugging the gap shuts the nook', () => {
    const plugged: MapData = {
      ...RED_SQUARE,
      placements: [...RED_SQUARE.placements, { asset: 'hedge', x: 59.4, z: -23.5 }],
    };
    expect(findPath(gridOf(plugged), GARDEN_ENTRANCE, front)).toBeNull();
  });

  it('announces itself with its own zone, which wins over the garden zone', () => {
    const zone = zoneAt(RED_SQUARE.zones, { x: shrine.x, z: shrine.z + 2 });
    expect(zone?.id).toBe('pearl-shrine');
    expect(zoneAt(RED_SQUARE.zones, { x: 53, z: 0 })?.id).toBe('alexander-garden');
  });
});
