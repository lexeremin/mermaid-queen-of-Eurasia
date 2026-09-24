import { describe, expect, it } from 'vitest';
import { RED_SQUARE } from '@/data/maps/red-square';
import { resolveCircle } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { zoneAt } from '@/systems/zones';

const world = buildCollisionWorld(RED_SQUARE);
const STEP = 0.5;
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

const at = (asset: string) => RED_SQUARE.placements.find((p) => p.asset === asset);

describe('Red Square map (real layout)', () => {
  it('spawns Rosa on free ground inside the bounds', () => {
    expect(walkable(RED_SQUARE.spawn.x, RED_SQUARE.spawn.z)).toBe(true);
  });

  it('reaches both ends of Red Square', () => {
    expect(canReach(-3, -29)).toBe(true);
    expect(canReach(0, 29)).toBe(true);
  });

  it('reaches inside GUM through every portal and around the fountain', () => {
    for (const z of [-18, 0, 18]) {
      expect(canReach(-14.6, z)).toBe(true);
      expect(canReach(-16.5, z)).toBe(true);
      expect(canReach(-19.6, z)).toBe(true);
    }
    expect(canReach(-26.8, 0)).toBe(true);
    expect(canReach(-23.3, 21)).toBe(true);
    expect(canReach(-23.3, -21)).toBe(true);
    expect(zoneAt(RED_SQUARE.zones, { x: -23.3, z: 21 })?.id).toBe('gum');
  });

  it('walks out through the Resurrection Gate onto Manezhnaya Square', () => {
    expect(canReach(9, 31)).toBe(true);
    expect(canReach(9, 33.5)).toBe(true);
    expect(canReach(9, 38.5)).toBe(true);
    expect(canReach(25, 45)).toBe(true);
    expect(canReach(25, 70)).toBe(true);
    expect(zoneAt(RED_SQUARE.zones, { x: 25, z: 45 })?.id).toBe('manezh');
  });

  it('reaches the Alexander Garden entrance and the whole promenade', () => {
    expect(canReach(53, 44)).toBe(true);
    expect(canReach(53, 22)).toBe(true);
    expect(canReach(53, -27)).toBe(true);
    expect(canReach(56, 8)).toBe(true);
    expect(canReach(49.5, 15.5)).toBe(true);
    expect(zoneAt(RED_SQUARE.zones, { x: 53, z: -27 })?.id).toBe('alexander-garden');
  });

  it('crosses the Trinity Bridge over the pond into the pocket by the Trinity Tower', () => {
    expect(canReach(51.6, 28)).toBe(true);
    expect(canReach(48, 28)).toBe(true);
    expect(canReach(46, 28)).toBe(true);
  });

  it('blocks the solid parts, the pond and the Kremlin', () => {
    expect(walkable(-16.5, 5)).toBe(false);
    expect(walkable(-23.3, 0)).toBe(false);
    expect(walkable(-23.3, 8)).toBe(false);
    expect(walkable(25, 56)).toBe(false);
    expect(walkable(48, 22)).toBe(false);
    expect(walkable(48, 33)).toBe(false);
    expect(walkable(57.5, 28)).toBe(false);
    expect(walkable(49.5, 13)).toBe(false);
    expect(walkable(-9, 25)).toBe(false);
    expect(canReach(29, 0, 0.5)).toBe(false);
    expect(canReach(44, -20, 0.5)).toBe(false);
    expect(canReach(-4, 44, 0.5)).toBe(false);
  });

  it('places the buildings in their real relative positions', () => {
    const basil = at('basil');
    const museum = at('museum');
    const kazan = at('kazan');
    const gate = at('resurrectionGate');
    const facade = RED_SQUARE.placements.find((p) => p.asset === 'gumFacade' && p.z === 0);
    const wall = at('kremlinWall');
    const manege = at('manege');
    const kutafya = at('kutafya');
    const grotto = at('grotto');
    const gardenGate = at('gardenGate');
    expect(
      basil &&
        museum &&
        kazan &&
        gate &&
        facade &&
        wall &&
        manege &&
        kutafya &&
        grotto &&
        gardenGate,
    ).toBeTruthy();
    // Red Square: far end vs near end, GUM left, Kremlin right.
    expect(basil!.z).toBeLessThan(-30);
    expect(museum!.z).toBeGreaterThan(30);
    expect(facade!.x).toBeLessThan(wall!.x);
    expect(kazan!.x).toBeLessThan(museum!.x);
    expect(museum!.x).toBeLessThan(gate!.x);
    // Manezhnaya Square lies beyond the Resurrection Gate, on the far side from St. Basil's.
    const manezh = RED_SQUARE.zones.find((z) => z.id === 'manezh')!;
    expect(manezh.box.cz).toBeGreaterThan(gate!.z);
    // The garden is on the far side of the Kremlin: right of the Kremlin's interior, outside its
    // west wall, and only reachable via Manezhnaya Square.
    const westWall = RED_SQUARE.placements.find((p) => p.asset === 'kremlinWall' && p.x === 44)!;
    expect(gardenGate!.x).toBeGreaterThan(westWall.x);
    expect(kutafya!.x).toBeGreaterThan(westWall.x);
    expect(grotto!.x).toBeGreaterThan(westWall.x);
    expect(manege!.x).toBeGreaterThan(gardenGate!.x);
    // Every reachable garden cell is south (via Manezhnaya) of, or beside, the Kremlin wall line.
    expect(canReach(46.2, 28)).toBe(true);
    expect(walkable(44, 28)).toBe(false);
  });
});
