import { describe, expect, it } from 'vitest';
import { RED_SQUARE } from '@/data/maps/red-square';
import { resolveCircle } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { zoneAt } from '@/systems/zones';

const world = buildCollisionWorld(RED_SQUARE);
const STEP = 0.4;
const { bounds } = RED_SQUARE;

const walkable = (x: number, z: number): boolean => {
  const p = resolveCircle({ x, z }, PLAYER_RADIUS, world);
  return Math.abs(p.x - x) < 1e-6 && Math.abs(p.z - z) < 1e-6;
};

function floodFromSpawn(): Set<string> {
  const cols = Math.floor((bounds.maxX - bounds.minX) / STEP);
  const rows = Math.floor((bounds.maxZ - bounds.minZ) / STEP);
  const key = (i: number, j: number) => `${i},${j}`;
  const toWorld = (i: number, j: number): [number, number] => [
    bounds.minX + i * STEP,
    bounds.minZ + j * STEP,
  ];
  const start = [
    Math.round((RED_SQUARE.spawn.x - bounds.minX) / STEP),
    Math.round((RED_SQUARE.spawn.z - bounds.minZ) / STEP),
  ] as const;
  const seen = new Set<string>([key(...start)]);
  const queue: (readonly [number, number])[] = [start];
  while (queue.length > 0) {
    const [i, j] = queue.pop() as readonly [number, number];
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni > cols || nj > rows || seen.has(key(ni, nj))) continue;
      if (!walkable(...toWorld(ni, nj))) continue;
      seen.add(key(ni, nj));
      queue.push([ni, nj]);
    }
  }
  return seen;
}

const reachable = floodFromSpawn();
const canReach = (x: number, z: number, radius = 0.6): boolean => {
  for (let dx = -radius; dx <= radius; dx += STEP) {
    for (let dz = -radius; dz <= radius; dz += STEP) {
      const i = Math.round((x + dx - bounds.minX) / STEP);
      const j = Math.round((z + dz - bounds.minZ) / STEP);
      if (reachable.has(`${i},${j}`)) return true;
    }
  }
  return false;
};

describe('Red Square map (real layout)', () => {
  it('spawns Rosa on free ground inside the bounds', () => {
    expect(walkable(RED_SQUARE.spawn.x, RED_SQUARE.spawn.z)).toBe(true);
  });

  it('reaches both ends of the square', () => {
    expect(canReach(-3, -29)).toBe(true);
    expect(canReach(0, 29)).toBe(true);
  });

  it('reaches inside GUM through every portal', () => {
    for (const z of [-18, 0, 18]) {
      expect(canReach(-14.6, z)).toBe(true);
      expect(canReach(-16.5, z)).toBe(true);
      expect(canReach(-19.6, z)).toBe(true);
    }
  });

  it('walks the whole gallery around the fountain and kiosks', () => {
    expect(canReach(-26.8, 0)).toBe(true);
    expect(canReach(-20, 0)).toBe(true);
    expect(canReach(-23.3, 21)).toBe(true);
    expect(canReach(-23.3, -21)).toBe(true);
    expect(zoneAt(RED_SQUARE.zones, { x: -23.3, z: 21 })?.id).toBe('gum');
  });

  it('blocks the solid parts: facade wings, fountain, kiosks, west wall, Kremlin towers', () => {
    expect(walkable(-16.5, 5)).toBe(false);
    expect(walkable(-23.3, 0)).toBe(false);
    expect(walkable(-23.3, 8)).toBe(false);
    expect(walkable(-27.7, 0)).toBe(false);
    expect(walkable(13, -29)).toBe(false);
    expect(walkable(13, -2)).toBe(false);
    expect(walkable(-9, 25)).toBe(false);
  });

  it('keeps the Kremlin wall out of reach (right side) and never lets Rosa past the bounds', () => {
    expect(canReach(14.5, 0, 0.5)).toBe(false);
    expect(canReach(-30, 0, 0.5)).toBe(false);
    expect(canReach(0, 31, 0.5)).toBe(false);
    expect(canReach(0, -31, 0.5)).toBe(false);
  });

  it('places the buildings in their real relative positions', () => {
    const at = (asset: string) => RED_SQUARE.placements.find((p) => p.asset === asset);
    const basil = at('basil');
    const museum = at('museum');
    const kazan = at('kazan');
    const gate = at('resurrectionGate');
    const facade = at('gumFacade');
    const wall = at('kremlinWall');
    expect(basil && museum && kazan && gate && facade && wall).toBeTruthy();
    // Far end vs near end.
    expect(basil!.z).toBeLessThan(-30);
    expect(museum!.z).toBeGreaterThan(30);
    // Facing the museum end from St. Basil's: GUM on the left (west), Kremlin on the right (east).
    expect(facade!.x).toBeLessThan(wall!.x);
    // Near end, left to right: Kazan, museum, Resurrection Gate.
    expect(kazan!.x).toBeLessThan(museum!.x);
    expect(museum!.x).toBeLessThan(gate!.x);
    // Resurrection Gate sits on the Kremlin side of the square.
    expect(gate!.x).toBeGreaterThan(0);
  });
});
