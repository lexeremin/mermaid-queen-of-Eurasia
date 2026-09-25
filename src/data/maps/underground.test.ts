import { describe, expect, it } from 'vitest';
import { BOSS_KINDS, ENEMIES, isBossKind } from '@/data/enemies';
import { METRO, RED_SQUARE } from '@/data/maps/red-square';
import {
  BOSS_EVERY,
  bossKindFor,
  CELL,
  COLS,
  MAX_LAYER,
  ROWS,
  UG_ORIGIN,
  generateLayer,
  isBossLayer,
  isUnderground,
  layerLevel,
  layerPower,
  type UndergroundLevel,
} from '@/data/maps/underground';
import { UNDERGROUND_REGION } from '@/game/map/map-view';
import { UNDERGROUND_KIT } from '@/data/maps/wall-runs';
import { resolveCircle, type Collider } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid, findPath } from '@/systems/pathfinding';

const layers = Array.from({ length: MAX_LAYER }, (_, i) => i + 1);
const levels = new Map<number, UndergroundLevel>();
const level = (n: number) => {
  let l = levels.get(n);
  if (!l) levels.set(n, (l = generateLayer(n)));
  return l;
};

const worldOf = (l: UndergroundLevel, gateShut = false) => ({
  bounds: RED_SQUARE.bounds,
  colliders: [...l.colliders, ...(gateShut && l.gate ? [l.gate.box] : [])] as Collider[],
  water: [] as Collider[],
});
const free = (l: UndergroundLevel, x: number, z: number, radius: number): boolean => {
  const p = resolveCircle({ x, z }, radius, worldOf(l));
  return Math.abs(p.x - x) < 1e-6 && Math.abs(p.z - z) < 1e-6;
};
const connected = (
  l: UndergroundLevel,
  from: { x: number; z: number },
  to: { x: number; z: number },
  gateShut = false,
) => findPath(createNavGrid(worldOf(l, gateShut), PLAYER_RADIUS, 0.5), from, to) !== null;

/** The cells (floor or not) of the fixed rooms and their surroundings, as a string, to compare layers. */
const fixedPart = (l: UndergroundLevel): string => {
  const rows = [...l.floor.slice(0, 9), ...l.floor.slice(37)];
  return rows.map((r) => r.map((c) => (c ? '#' : '.')).join('')).join('|');
};

describe('the generator', () => {
  it('makes all 100 layers quickly and refuses layers that do not exist', () => {
    const t0 = performance.now();
    for (const n of layers) level(n);
    expect(performance.now() - t0).toBeLessThan(6000);
    for (const bad of [0, 101, -1, 1.5]) expect(() => generateLayer(bad)).toThrow();
  });

  it('is deterministic per layer and different from layer to layer', () => {
    const sig = (l: UndergroundLevel) => JSON.stringify([l.floor, l.enemies, l.chests]);
    expect(sig(generateLayer(37))).toBe(sig(generateLayer(37)));
    const signatures = new Set(layers.map((n) => sig(level(n))));
    expect(signatures.size).toBe(layers.length);
    expect(layerLevel(12)).toBe(layerLevel(12));
  });

  it('lies inside the underground region and the map', () => {
    expect(isUnderground({ x: 25, z: 60 })).toBe(false);
    expect(UG_ORIGIN.z + ROWS * CELL).toBeLessThan(RED_SQUARE.bounds.maxZ);
    expect(UG_ORIGIN.x).toBeGreaterThan(RED_SQUARE.bounds.minX + 10);
    expect(UG_ORIGIN.x + COLS * CELL).toBeLessThan(RED_SQUARE.bounds.maxX);
    for (const n of layers) {
      const l = level(n);
      expect(isUnderground(l.arrival), `${n}`).toBe(true);
      for (const f of l.floors.filter((floor) => floor.w < 60)) {
        expect(f.cx - f.w / 2).toBeGreaterThanOrEqual(UNDERGROUND_REGION.minX);
        expect(f.cx + f.w / 2).toBeLessThanOrEqual(UNDERGROUND_REGION.maxX);
        expect(f.cz - f.d / 2).toBeGreaterThanOrEqual(UNDERGROUND_REGION.minZ);
        expect(f.cz + f.d / 2).toBeLessThanOrEqual(UNDERGROUND_REGION.maxZ);
      }
    }
  });
});

describe('the fixed entrance and exit', () => {
  const first = level(1);

  it('are identical on every layer: same cells, stairs, arrival points, props', () => {
    for (const n of layers) {
      const l = level(n);
      const isBoss = isBossLayer(n);
      // Rows 0-8 (exit hall and its wall) and 37-46 (landing) match layer 1 exactly, except that a boss layer
      // has the same rooms plus its own arena and doors farther in.
      expect(fixedPart(l).slice(0, COLS * 9 + 8), `${n}`).toBe(
        fixedPart(first).slice(0, COLS * 9 + 8),
      );
      const landing = (x: UndergroundLevel) =>
        x.floor
          .slice(39)
          .map((r) => r.join(''))
          .join('|');
      expect(landing(l), `${n}`).toBe(landing(first));
      expect(l.stairsUp).toEqual(first.stairsUp);
      expect(l.stairsDown).toEqual(first.stairsDown);
      expect(l.arrival).toEqual(first.arrival);
      expect(l.arrivalDown).toEqual(first.arrivalDown);
      expect(l.centers['ug-hall']).toEqual(first.centers['ug-hall']);
      expect(l.centers['ug-exit']).toEqual(first.centers['ug-exit']);
      expect(l.zones.find((z) => z.id === 'ug-hall')!.box).toEqual(
        first.zones.find((z) => z.id === 'ug-hall')!.box,
      );
      expect(l.lights).toHaveLength(4);
      void isBoss;
    }
  });

  it('are safe: no monster or chest inside either hall', () => {
    for (const n of layers) {
      const l = level(n);
      for (const id of ['ug-hall', 'ug-exit']) {
        const b = l.zones.find((z) => z.id === id)!.box;
        const inside = (p: { x: number; z: number }) =>
          Math.abs(p.x - b.cx) <= b.hx + 1 && Math.abs(p.z - b.cz) <= b.hz + 1;
        for (const e of l.enemies) expect(inside(e), `${n} ${e.id}`).toBe(false);
        for (const c of l.chests) expect(inside(c), `${n} ${c.id}`).toBe(false);
      }
    }
  });

  it('call the first landing the Ticket Hall, so "Into the Depths" still counts', () => {
    expect(first.zones.find((z) => z.id === 'ug-hall')!.label).toBe('Ticket Hall');
    expect(level(2).zones.find((z) => z.id === 'ug-hall')!.label).toBe('Landing');
  });
});

describe('the bosses of the tenth layers', () => {
  it('take turns, five kinds, then again', () => {
    const order = layers.filter(isBossLayer).map((n) => bossKindFor(n));
    expect(order).toEqual([...BOSS_KINDS, ...BOSS_KINDS]);
    expect(order.slice(0, 5)).toEqual(['boss', 'lobbyist', 'senator', 'baron', 'spin']);
  });

  it('put the right boss in each arena, with its own name on the door', () => {
    const labels = new Set<string>();
    for (const n of layers.filter(isBossLayer)) {
      const l = level(n);
      expect(l.enemies.find((e) => isBossKind(e.kind))!.kind).toBe(bossKindFor(n));
      labels.add(l.zones.find((z) => z.id === 'ug-arena')!.label);
    }
    expect(labels.size).toBe(5);
  });
});

describe('the way through a layer', () => {
  it('always leads from the landing to the stairs down (through the open gate on boss layers)', () => {
    for (const n of layers) {
      const l = level(n);
      expect(free(l, l.arrival.x, l.arrival.z, PLAYER_RADIUS), `${n} arrival`).toBe(true);
      expect(free(l, l.arrivalDown.x, l.arrivalDown.z, PLAYER_RADIUS), `${n} arrivalDown`).toBe(
        true,
      );
      expect(connected(l, l.arrival, l.arrivalDown), `layer ${n}`).toBe(true);
    }
  });

  it('holds every boss layer shut behind its gate until the layer is cleared', () => {
    for (const n of layers.filter(isBossLayer)) {
      const l = level(n);
      expect(l.gate, `${n}`).not.toBeNull();
      expect(connected(l, l.arrival, l.arrivalDown, true), `${n} shut`).toBe(false);
      expect(
        connected(l, l.arrival, { x: l.gate!.x, z: l.gate!.z + 3 }, true),
        `${n} to gate`,
      ).toBe(true);
    }
    for (const n of layers.filter((k) => !isBossLayer(k))) expect(level(n).gate).toBeNull();
  });

  it('cannot be reached on foot from the surface', () => {
    const surface = createNavGrid(buildCollisionWorld(RED_SQUARE), PLAYER_RADIUS, 0.5);
    const l = level(1);
    expect(findPath(surface, RED_SQUARE.spawn, l.arrival)).toBeNull();
    expect(findPath(surface, RED_SQUARE.spawn, { x: 30, z: 62 })).not.toBeNull();
    expect(findPath(surface, RED_SQUARE.spawn, METRO.door)).not.toBeNull();
  });
});

describe('what a layer holds', () => {
  it('puts every spawn and chest on free, reachable floor', () => {
    for (const n of [1, 2, 3, 7, 10, 20, 33, 50, 64, 80, 99, 100]) {
      const l = level(n);
      const world = createNavGrid(worldOf(l), PLAYER_RADIUS, 0.5);
      for (const e of l.enemies)
        expect(free(l, e.x, e.z, ENEMIES[e.kind].radius), `${n} ${e.id}`).toBe(true);
      for (const c of l.chests) expect(free(l, c.x, c.z, 0.6), `${n} ${c.id}`).toBe(true);
      for (const p of [...l.enemies, ...l.chests]) {
        if ('dormant' in p && p.dormant) continue;
        expect(findPath(world, l.arrival, { x: p.x, z: p.z }), `${n} ${p.id}`).not.toBeNull();
      }
    }
  });

  it('gives every layer monsters and a chest, with unique ids and depth-scaled power', () => {
    for (const n of layers) {
      const l = level(n);
      const ids = [...l.enemies.map((e) => e.id), ...l.chests.map((c) => c.id)];
      expect(new Set(ids).size, `${n}`).toBe(ids.length);
      const mobs = l.enemies.filter((e) => !isBossKind(e.kind) && !e.dormant);
      expect(mobs.length, `${n}`).toBeGreaterThanOrEqual(3);
      expect(l.chests.length, `${n}`).toBeGreaterThanOrEqual(1);
      for (const e of l.enemies) {
        expect(e.instanced).toBe(true);
        expect(e.power).toBeCloseTo(layerPower(n));
        expect(e.id.startsWith(`L${n}-`)).toBe(true);
      }
      for (const c of l.chests) expect(c.id).toMatch(new RegExp(`^L${n}-c[12]$`));
    }
  });

  it('gets tougher with depth: more monsters, elites from layer 5, a much higher power', () => {
    const count = (n: number) =>
      level(n).enemies.filter((e) => !isBossKind(e.kind) && !e.dormant).length;
    const avg = (from: number, to: number) =>
      layers.slice(from - 1, to).reduce((sum, n) => sum + count(n), 0) / (to - from + 1);
    expect(avg(91, 100)).toBeGreaterThan(avg(1, 10));
    expect(
      layers.filter((n) => n < 5).some((n) => level(n).enemies.some((e) => e.kind === 'registrar')),
    ).toBe(false);
    expect(layers.some((n) => level(n).enemies.some((e) => e.kind === 'registrar'))).toBe(true);
    expect(layerPower(1)).toBe(1);
    expect(layerPower(100)).toBeGreaterThan(6);
  });

  it('has the boss, his four helpers and the arena on every tenth layer, and only there', () => {
    expect(BOSS_EVERY).toBe(10);
    for (const n of layers) {
      const l = level(n);
      const bosses = l.enemies.filter((e) => isBossKind(e.kind));
      const helpers = l.enemies.filter((e) => e.dormant);
      if (isBossLayer(n)) {
        expect(bosses, `${n}`).toHaveLength(1);
        expect(helpers, `${n}`).toHaveLength(4);
        expect(l.zones.some((z) => z.id === 'ug-arena')).toBe(true);
        expect(l.arena).not.toBeNull();
        expect(l.boss).not.toBeNull();
      } else {
        expect(bosses).toHaveLength(0);
        expect(helpers).toHaveLength(0);
        expect(l.arena).toBeNull();
      }
    }
  });

  it('is built from the dark-brick kit, with no wall stretched out of shape', () => {
    for (const n of [1, 2, 10, 55, 100]) {
      const walls = level(n).placements.filter(
        (p) => UNDERGROUND_KIT.long.some((v) => v.asset === p.asset) || p.asset === 'ugWallShort',
      );
      expect(walls.length, `${n}`).toBeGreaterThan(30);
      for (const w of walls) {
        expect(w.stretch ?? 1).toBeGreaterThan(0.3);
        expect(w.stretch ?? 1).toBeLessThan(1.75);
      }
    }
  });
});
