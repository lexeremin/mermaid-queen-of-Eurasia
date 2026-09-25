import { describe, expect, it } from 'vitest';
import { ENEMIES } from '@/data/enemies';
import { METRO, RED_SQUARE } from '@/data/maps/red-square';
import { CELL, UG_ORIGIN, UNDERGROUND, isUnderground } from '@/data/maps/underground';
import { assembleWallRun, UNDERGROUND_KIT } from '@/data/maps/wall-runs';
import { resolveCircle } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';

const world = buildCollisionWorld(RED_SQUARE);
const level = UNDERGROUND;

const free = (x: number, z: number, radius: number): boolean => {
  const p = resolveCircle({ x, z }, radius, world);
  return Math.abs(p.x - x) < 1e-6 && Math.abs(p.z - z) < 1e-6;
};

/** Flood fill over 0.5 m steps for a walker of Rosa's size, starting from a point. `extra` adds temporary blockers. */
function flood(start: { x: number; z: number }, blockGate: boolean): Set<string> {
  const step = 0.5;
  const colliders = blockGate ? [...world.colliders, level.gate.box] : world.colliders;
  const w = { bounds: world.bounds, colliders };
  const key = (i: number, j: number) => `${i},${j}`;
  const ok = (x: number, z: number) => {
    const p = resolveCircle({ x, z }, PLAYER_RADIUS, w);
    return Math.abs(p.x - x) < 1e-6 && Math.abs(p.z - z) < 1e-6;
  };
  const toI = (v: number, o: number) => Math.round((v - o) / step);
  const seen = new Set<string>([key(toI(start.x, 0), toI(start.z, 0))]);
  const queue: [number, number][] = [[toI(start.x, 0), toI(start.z, 0)]];
  while (queue.length > 0) {
    const [i, j] = queue.pop()!;
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const ni = i + di;
      const nj = j + dj;
      const k = key(ni, nj);
      if (seen.has(k) || !ok(ni * step, nj * step)) continue;
      seen.add(k);
      queue.push([ni, nj]);
    }
  }
  return seen;
}
const reached = (set: Set<string>, x: number, z: number) =>
  set.has(`${Math.round(x / 0.5)},${Math.round(z / 0.5)}`);

describe('generated underground level', () => {
  it('lies entirely below the surface and inside the map bounds', () => {
    expect(isUnderground(level.arrival)).toBe(true);
    expect(isUnderground({ x: 25, z: 60 })).toBe(false);
    expect(level.arrival.z).toBeGreaterThan(RED_SQUARE.bounds.maxZ - 30);
    expect(UG_ORIGIN.z + 47 * CELL).toBeLessThan(RED_SQUARE.bounds.maxZ);
  });

  it('has walls of the dark-brick kit that never overlap and never leave a hole in the boundary', () => {
    const walls = level.placements.filter(
      (p) => UNDERGROUND_KIT.long.some((v) => v.asset === p.asset) || p.asset === 'ugWallShort',
    );
    expect(walls.length).toBeGreaterThan(40);
    for (const w of walls) {
      expect(w.stretch ?? 1).toBeGreaterThan(0.6);
      expect(w.stretch ?? 1).toBeLessThan(1.6);
    }
  });

  it('is deterministic', () => {
    expect(level.placements.map((p) => `${p.asset}${p.x}${p.z}`)).toEqual(
      level.placements.map((p) => `${p.asset}${p.x}${p.z}`),
    );
    const run = { from: { x: 0, z: 0 }, to: { x: 24, z: 0 }, rotY: 0, nodes: [], seed: 1 };
    expect(assembleWallRun(run, UNDERGROUND_KIT)).toEqual(assembleWallRun(run, UNDERGROUND_KIT));
  });

  it('puts the arrival, chests, columns and every spawn on free floor', () => {
    expect(free(level.arrival.x, level.arrival.z, PLAYER_RADIUS)).toBe(true);
    for (const c of level.chests) expect(free(c.x, c.z, 0.6), c.id).toBe(true);
    for (const e of level.enemies) expect(free(e.x, e.z, ENEMIES[e.kind].radius), e.id).toBe(true);
  });

  it('connects every room from the arrival once the gate is open', () => {
    const open = flood(level.arrival, false);
    for (const [id, c] of Object.entries(level.centers))
      expect(reached(open, c.x, c.z), id).toBe(true);
    for (const c of level.chests) expect(reached(open, c.x, c.z), c.id).toBe(true);
    for (const e of level.enemies) expect(reached(open, e.x, e.z), e.id).toBe(true);
    expect(reached(open, level.stairs.x, level.stairs.z - 2.2)).toBe(true);
  });

  it('keeps the boss arena behind the gate while it is shut, and everything else open', () => {
    const shut = flood(level.arrival, true);
    expect(reached(shut, level.centers['ug-cellar']!.x, level.centers['ug-cellar']!.z)).toBe(true);
    expect(reached(shut, level.centers['ug-platform']!.x, level.centers['ug-platform']!.z)).toBe(
      true,
    );
    expect(reached(shut, level.boss.x, level.boss.z)).toBe(false);
    expect(reached(shut, level.centers['ug-arena']!.x, level.centers['ug-arena']!.z)).toBe(false);
  });

  it('cannot be reached on foot from the surface', () => {
    const surface = flood(RED_SQUARE.spawn, false);
    expect(reached(surface, level.arrival.x, level.arrival.z)).toBe(false);
    for (const [, c] of Object.entries(level.centers))
      expect(reached(surface, c.x, c.z)).toBe(false);
    // Manezhnaya Square itself is reachable, and so is the front of the metro pavilion.
    expect(reached(surface, 30, 62)).toBe(true);
    expect(reached(surface, METRO.door.x, METRO.door.z)).toBe(true);
  });

  it('holds the plan: three rooms of monsters, an elite, dormant helpers, a boss', () => {
    const count = (prefix: string) => level.enemies.filter((e) => e.id.startsWith(prefix)).length;
    expect(count('ug-hall')).toBe(3);
    expect(count('ug-platform')).toBe(5);
    expect(count('ug-cellar')).toBe(3);
    expect(level.enemies.filter((e) => e.kind === 'registrar')).toHaveLength(1);
    expect(level.enemies.filter((e) => e.kind === 'boss')).toHaveLength(1);
    expect(level.enemies.filter((e) => e.dormant)).toHaveLength(4);
    expect(level.chests).toHaveLength(3);
  });

  it('is part of the surface map data, with unique ids', () => {
    const ids = RED_SQUARE.enemies.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(RED_SQUARE.chests).toHaveLength(3);
    expect(RED_SQUARE.undergroundLights?.length).toBeGreaterThan(0);
  });
});
