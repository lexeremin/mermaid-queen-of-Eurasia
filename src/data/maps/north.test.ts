import { describe, expect, it } from 'vitest';
import { RED_SQUARE } from '@/data/maps/red-square';
import { QUESTS } from '@/data/quests';
import { resolveCircle } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid, findPath } from '@/systems/pathfinding';
import { isInWater } from '@/systems/water';
import { zoneAt } from '@/systems/zones';

const world = buildCollisionWorld(RED_SQUARE);
const grid = createNavGrid(world, PLAYER_RADIUS, 0.5);
const free = (x: number, z: number, r = PLAYER_RADIUS): boolean => {
  const p = resolveCircle({ x, z }, r, world);
  return Math.hypot(p.x - x, p.z - z) < 1e-6;
};
const reach = (x: number, z: number) => findPath(grid, RED_SQUARE.spawn, { x, z });

const NEW_ZONES = [
  'lantern-1',
  'lantern-2',
  'lantern-3',
  'lantern-4',
  'lobnoe',
  'monument',
  'amphitheatre',
  'chapel',
  'zaryadye',
  'spusk',
  'embankment',
];
const zone = (id: string) => RED_SQUARE.zones.find((z) => z.id === id)!;

describe('the north of Red Square', () => {
  it('can be walked: down the Spusk to the embankment, and into Zaryadye Park', () => {
    for (const [x, z] of [
      [9, -30],
      [9, -39],
      [27, -40],
      [44, -39],
      [-12, -31],
      [-20.5, -32.5],
      [-21.5, -41.2],
    ] as const) {
      expect(free(x, z), `${x},${z}`).toBe(true);
      expect(reach(x, z), `${x},${z}`).not.toBeNull();
    }
  });

  it('joins the garden to Red Square: the promenade runs east onto the garden path', () => {
    const path = findPath(grid, { x: 9, z: -39 }, { x: 52, z: -30 })!;
    expect(path).not.toBeNull();
    expect(path.every((p) => !isInWater(world.water, p))).toBe(true);
  });

  it('is solid where it should be: the cathedral, the monument, the platform, the amphitheatre, the chapel', () => {
    for (const [x, z] of [
      [-3, -37],
      [-5.5, -22.5],
      [4.5, -24.5],
      [-15, -38.4],
      [-24.5, -38],
    ] as const) {
      expect(free(x, z), `${x},${z}`).toBe(false);
    }
  });

  it('keeps the river closed except by the garden path: railings along the bank, nothing behind the cathedral', () => {
    // From the embankment there is no way onto the far bank that does not go round through the garden path.
    const path = findPath(grid, { x: 20, z: -40 }, { x: 36, z: -61.6 })!;
    expect(path).not.toBeNull();
    expect(Math.max(...path.map((p) => p.x))).toBeGreaterThan(46);
    // The strip behind Saint Basil's is shut.
    expect(free(-3, -44)).toBe(false);
    // Nobody swims in from the embankment or the park.
    for (const x of [8, 20, 30, 40, -10, -20]) {
      const z = x < 0 ? -42.6 : -43.8;
      expect(free(x, z + 0.3), `rail at ${x}`).toBe(false);
    }
  });

  it('puts every new monster and pearl on free, reachable, dry ground', () => {
    const spawns = RED_SQUARE.enemies.filter((e) => /-(emb|park)-/.test(e.id));
    expect(spawns).toHaveLength(10);
    for (const e of spawns) {
      expect(free(e.x, e.z, 0.8), e.id).toBe(true);
      expect(reach(e.x, e.z), e.id).not.toBeNull();
    }
    const pearls = (RED_SQUARE.gatherables ?? []).filter((g) => g.id.startsWith('pearl-e'));
    expect(pearls).toHaveLength(5);
    for (const g of pearls) {
      expect(free(g.x, g.z), g.id).toBe(true);
      expect(isInWater(world.water, { x: g.x, z: g.z }), g.id).toBe(false);
      expect(reach(g.x, g.z), g.id).not.toBeNull();
    }
  });

  it('has every new zone, each with somewhere Rosa can stand inside it', () => {
    for (const id of NEW_ZONES) {
      const { box } = zone(id);
      let found = false;
      for (let x = box.cx - box.hx; x <= box.cx + box.hx && !found; x += 0.5) {
        for (let z = box.cz - box.hz; z <= box.cz + box.hz && !found; z += 0.5) {
          if (zoneAt(RED_SQUARE.zones, { x, z })?.id === id && free(x, z) && reach(x, z))
            found = true;
        }
      }
      expect(found, id).toBe(true);
    }
  });

  it('does not change the zones that were there: the garden and the river still answer', () => {
    expect(zoneAt(RED_SQUARE.zones, { x: 54, z: 0 })?.id).toBe('alexander-garden');
    expect(zoneAt(RED_SQUARE.zones, { x: 30, z: -50 })?.id).toBe('moskva');
    expect(zoneAt(RED_SQUARE.zones, { x: 0, z: 24 })).toBeNull();
  });

  it('is what the new quests ask for: every zone they name exists', () => {
    const ids = new Set(RED_SQUARE.zones.map((z) => z.id));
    for (const q of QUESTS)
      for (const o of q.objectives)
        if (o.kind === 'visit')
          // The underground's zones belong to its layers, not to this map.
          for (const id of o.zones.filter((zone) => !zone.startsWith('ug-')))
            expect(ids.has(id), `${q.id}: ${id}`).toBe(true);
  });
});
