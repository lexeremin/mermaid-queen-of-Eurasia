import type { EnemySpawn, Placement } from '@/data/maps/types';
import { assembleWallRun, UNDERGROUND_KIT, type WallRun } from '@/data/maps/wall-runs';
import type { Collider } from '@/systems/collision';
import type { Zone } from '@/systems/zones';
import type { Vec2 } from '@/utils/vec2';

/**
 * The Moscow underground: a level generated from a small spec of rooms and corridors on a 2 m grid. Floors, walls
 * (every floor edge beside rock becomes a run filled by the wall assembler), colliders, features and spawns all
 * come from the spec. It lives in the same world as the surface, in a region far south of Manezhnaya Square, that
 * nothing on the surface can walk into.
 */
const HALF_PI = Math.PI / 2;

export const CELL = 2;
/** World position of the grid's top-left corner (the north-west corner of cell 0,0). */
export const UG_ORIGIN = { x: 11, z: 100 };
const COLS = 14;
const ROWS = 47;
/** Thickness of a wall piece (see build_underground_assets.py). */
export const WALL_THICKNESS = 1.8;

/** The underground region starts here; anything at or beyond this z is "down below". */
export const UG_MIN_Z = UG_ORIGIN.z - 4;
export const isUnderground = (pos: Vec2): boolean => pos.z >= UG_MIN_Z;

type Room = {
  id: string;
  label: string;
  c0: number;
  r0: number;
  w: number;
  h: number;
  color: string;
};

// Rows run north (0, the boss arena) to south (46, the arrival hall). Everything is centred on the corridor
// columns 6 and 7.
const ARENA: Room = {
  id: 'ug-arena',
  label: 'Registry Vault',
  c0: 1,
  r0: 0,
  w: 12,
  h: 12,
  color: '#4a2f3a',
};
const CELLAR: Room = {
  id: 'ug-cellar',
  label: 'Records Cellar',
  c0: 2,
  r0: 15,
  w: 10,
  h: 8,
  color: '#3b3547',
};
const PLATFORM: Room = {
  id: 'ug-platform',
  label: 'Grand Platform Hall',
  c0: 0,
  r0: 26,
  w: 14,
  h: 10,
  color: '#3a4a50',
};
const HALL: Room = {
  id: 'ug-hall',
  label: 'Ticket Hall',
  c0: 2,
  r0: 39,
  w: 10,
  h: 8,
  color: '#4b4046',
};
const ROOMS: readonly Room[] = [ARENA, CELLAR, PLATFORM, HALL];
/** Corridors join the rooms (2 cells wide, 3 long). */
const CORRIDORS = [
  { c0: 6, r0: 12, w: 2, h: 3 },
  { c0: 6, r0: 23, w: 2, h: 3 },
  { c0: 6, r0: 36, w: 2, h: 3 },
];
const CORRIDOR_COLOR = '#302a35';
/** The boss arena's corners are cut (2 x 2 cells each). */
const ARENA_CUT = 2;

export type Chest = { id: string; x: number; z: number };

export type UndergroundLevel = {
  /** floor[row][col] */
  floor: boolean[][];
  placements: Placement[];
  colliders: Collider[];
  floors: { cx: number; cz: number; w: number; d: number; color: string; y: number }[];
  enemies: EnemySpawn[];
  chests: Chest[];
  lights: { x: number; y: number; z: number; color: string; intensity: number; distance: number }[];
  zones: Zone[];
  /** Where Rosa arrives, and the way back up. */
  arrival: Vec2;
  stairs: Vec2;
  /** The boss gate: centre and the box that blocks the corridor while it is shut. */
  gate: { x: number; z: number; box: Extract<Collider, { kind: 'box' }> };
  boss: Vec2;
  /** Where each room's centre is. */
  centers: Record<string, Vec2>;
};

const cellCenter = (c: number, r: number): Vec2 => ({
  x: UG_ORIGIN.x + (c + 0.5) * CELL,
  z: UG_ORIGIN.z + (r + 0.5) * CELL,
});
const gridX = (c: number) => UG_ORIGIN.x + c * CELL;
const gridZ = (r: number) => UG_ORIGIN.z + r * CELL;

function carve(): boolean[][] {
  const floor = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => false));
  const fill = (c0: number, r0: number, w: number, h: number) => {
    for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) floor[r]![c] = true;
  };
  for (const room of ROOMS) fill(room.c0, room.r0, room.w, room.h);
  for (const corridor of CORRIDORS) fill(corridor.c0, corridor.r0, corridor.w, corridor.h);
  const clear = (c0: number, r0: number, w: number, h: number) => {
    for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) floor[r]![c] = false;
  };
  const { c0, r0, w, h } = ARENA;
  clear(c0, r0, ARENA_CUT, ARENA_CUT);
  clear(c0 + w - ARENA_CUT, r0, ARENA_CUT, ARENA_CUT);
  clear(c0, r0 + h - ARENA_CUT, ARENA_CUT, ARENA_CUT);
  clear(c0 + w - ARENA_CUT, r0 + h - ARENA_CUT, ARENA_CUT, ARENA_CUT);
  return floor;
}

const isFloor = (floor: boolean[][], c: number, r: number): boolean => floor[r]?.[c] === true;

/** Number of floor cells among the four around the grid vertex (c, r) (its top-left is cell c - 1, r - 1). */
function floorAround(floor: boolean[][], c: number, r: number): number {
  return [
    isFloor(floor, c - 1, r - 1),
    isFloor(floor, c, r - 1),
    isFloor(floor, c - 1, r),
    isFloor(floor, c, r),
  ].filter(Boolean).length;
}

type Edge = { line: number; from: number; to: number; floorSide: -1 | 1 };

/** Horizontal runs (along x): where a floor cell has rock to its north or south, merged along the row. */
function horizontalEdges(floor: boolean[][]): Edge[] {
  const edges: Edge[] = [];
  for (let r = 0; r <= ROWS; r++) {
    let open: Edge | null = null;
    for (let c = 0; c <= COLS; c++) {
      const north = isFloor(floor, c, r - 1);
      const south = isFloor(floor, c, r);
      const side = c < COLS && north !== south ? (south ? 1 : -1) : 0;
      if (open && side === open.floorSide) {
        open.to = c + 1;
        continue;
      }
      if (open) edges.push(open);
      open = side === 0 ? null : { line: r, from: c, to: c + 1, floorSide: side };
    }
  }
  return edges;
}

/** Vertical runs (along z): where a floor cell has rock to its west or east, merged down the column. */
function verticalEdges(floor: boolean[][]): Edge[] {
  const edges: Edge[] = [];
  for (let c = 0; c <= COLS; c++) {
    let open: Edge | null = null;
    for (let r = 0; r <= ROWS; r++) {
      const west = isFloor(floor, c - 1, r);
      const east = isFloor(floor, c, r);
      const side = r < ROWS && west !== east ? (east ? 1 : -1) : 0;
      if (open && side === open.floorSide) {
        open.to = r + 1;
        continue;
      }
      if (open) edges.push(open);
      open = side === 0 ? null : { line: c, from: r, to: r + 1, floorSide: side };
    }
  }
  return edges;
}

/**
 * Turns the floor boundary into wall runs. The wall sits on the rock side of the edge, its inner face flush with
 * the floor. Where a horizontal run ends at a vertex it reaches past it by one wall thickness (around a convex
 * floor corner, closing the corner square) or stops short by one (at a concave corner, where the crossing
 * vertical wall already covers that square). Vertical runs never change length.
 */
function wallRuns(floor: boolean[][]): { run: WallRun; box: Extract<Collider, { kind: 'box' }> }[] {
  const out: { run: WallRun; box: Extract<Collider, { kind: 'box' }> }[] = [];
  let seed = 700;
  const t = WALL_THICKNESS;

  const adjust = (c: number, r: number): number => {
    const n = floorAround(floor, c, r);
    if (n === 1) return t;
    if (n === 3) return -t;
    if (n === 2 && isFloor(floor, c - 1, r - 1) === isFloor(floor, c, r)) {
      throw new Error(`checkerboard vertex at ${c},${r}`);
    }
    return 0;
  };

  for (const edge of horizontalEdges(floor)) {
    const z = gridZ(edge.line) - edge.floorSide * (t / 2);
    const x0 = gridX(edge.from) - adjust(edge.from, edge.line);
    const x1 = gridX(edge.to) + adjust(edge.to, edge.line);
    out.push({
      run: { from: { x: x0, z }, to: { x: x1, z }, rotY: 0, nodes: [], seed: seed++ },
      box: { kind: 'box', cx: (x0 + x1) / 2, cz: z, hx: (x1 - x0) / 2, hz: t / 2 },
    });
  }
  for (const edge of verticalEdges(floor)) {
    const x = gridX(edge.line) - edge.floorSide * (t / 2);
    const z0 = gridZ(edge.from);
    const z1 = gridZ(edge.to);
    out.push({
      run: { from: { x, z: z0 }, to: { x, z: z1 }, rotY: HALF_PI, nodes: [], seed: seed++ },
      box: { kind: 'box', cx: x, cz: (z0 + z1) / 2, hx: t / 2, hz: (z1 - z0) / 2 },
    });
  }
  return out;
}

const roomBox = (room: Room) => ({
  cx: gridX(room.c0) + (room.w * CELL) / 2,
  cz: gridZ(room.r0) + (room.h * CELL) / 2,
  hx: (room.w * CELL) / 2,
  hz: (room.h * CELL) / 2,
});

export function buildUnderground(): UndergroundLevel {
  const floor = carve();
  const walls = wallRuns(floor);
  const placements: Placement[] = walls.flatMap((w) => assembleWallRun(w.run, UNDERGROUND_KIT));
  const colliders: Collider[] = walls.map((w) => w.box);

  const centers: Record<string, Vec2> = {};
  for (const room of ROOMS) {
    const b = roomBox(room);
    centers[room.id] = { x: b.cx, z: b.cz };
  }
  const mid = centers[HALL.id]!.x;

  // Floors: a dark rock bed under everything (the camera looks past the walls), then each room and corridor.
  const floors: UndergroundLevel['floors'] = [
    { cx: mid, cz: gridZ(ROWS / 2), w: 110, d: 120, color: '#15111a', y: 0.03 },
    ...ROOMS.map((room) => {
      const b = roomBox(room);
      return { cx: b.cx, cz: b.cz, w: b.hx * 2, d: b.hz * 2, color: room.color, y: 0.04 };
    }),
    ...CORRIDORS.map((c) => ({
      cx: gridX(c.c0) + (c.w * CELL) / 2,
      cz: gridZ(c.r0) + (c.h * CELL) / 2,
      w: c.w * CELL,
      d: c.h * CELL,
      color: CORRIDOR_COLOR,
      y: 0.04,
    })),
  ];

  const stairs = { x: mid, z: gridZ(HALL.r0 + HALL.h) - 1.3 };
  placements.push({ asset: 'ugStairs', x: stairs.x, z: stairs.z, rotY: Math.PI, collide: false });
  colliders.push({ kind: 'box', cx: stairs.x, cz: stairs.z + 0.2, hx: 2.4, hz: 1.4 });
  const arrival = { x: mid, z: stairs.z - 2.9 };

  // Columns: two rows of four in the Platform Hall, four for cover in the boss arena.
  const platformTop = gridZ(PLATFORM.r0);
  const columnSpots: Vec2[] = [
    ...[-9, -3, 3, 9].flatMap((dx) => [
      { x: mid + dx, z: platformTop + 5 },
      { x: mid + dx, z: platformTop + 15 },
    ]),
    ...[-7, 7].flatMap((dx) => [
      { x: mid + dx, z: centers[ARENA.id]!.z - 6 },
      { x: mid + dx, z: centers[ARENA.id]!.z + 6 },
    ]),
  ];
  for (const s of columnSpots) placements.push({ asset: 'ugColumn', x: s.x, z: s.z });

  // Warm light pools over the rooms (no fixtures: nothing hangs from the ceiling) and stacks of forms clutter the edges.
  const c = centers;
  const lights: UndergroundLevel['lights'] = [
    { x: c[HALL.id]!.x, y: 3.4, z: c[HALL.id]!.z, color: '#ffc98a', intensity: 90, distance: 26 },
    { x: mid, y: 3.4, z: c[PLATFORM.id]!.z, color: '#ffb877', intensity: 110, distance: 30 },
    { x: mid, y: 3.4, z: c[CELLAR.id]!.z, color: '#ffc0a0', intensity: 90, distance: 26 },
    { x: mid, y: 3.4, z: c[ARENA.id]!.z, color: '#ff9a7a', intensity: 120, distance: 34 },
  ];
  const stackAt = (x: number, z: number, rotY = 0): Placement => ({
    asset: 'paperStack',
    x,
    z,
    rotY,
  });
  const hallBox = roomBox(HALL);
  const cellarBox = roomBox(CELLAR);
  const platformBox = roomBox(PLATFORM);
  placements.push(
    stackAt(hallBox.cx - hallBox.hx + 1.2, hallBox.cz - 2, 0.4),
    stackAt(hallBox.cx + hallBox.hx - 1.2, hallBox.cz - 1, -0.3),
    stackAt(hallBox.cx + hallBox.hx - 1.2, hallBox.cz + 2, 0.2),
    stackAt(cellarBox.cx - cellarBox.hx + 1.2, cellarBox.cz + 1, 0),
    stackAt(cellarBox.cx - cellarBox.hx + 1.2, cellarBox.cz + 2.2, 0.5),
    stackAt(cellarBox.cx + cellarBox.hx - 1.2, cellarBox.cz - 2, -0.4),
    stackAt(cellarBox.cx + cellarBox.hx - 1.2, cellarBox.cz + 3, 0.1),
    stackAt(cellarBox.cx - 2, cellarBox.cz - cellarBox.hz + 1.2, 0.2),
    stackAt(platformBox.cx - platformBox.hx + 1.2, platformBox.cz - 4, 0.3),
    stackAt(platformBox.cx + platformBox.hx - 1.2, platformBox.cz + 4, -0.2),
  );

  // Gate across the boss corridor (rendered and toggled separately, so it is not a plain placement).
  const gateRow = CORRIDORS[0]!.r0 + 1.5;
  const gate = {
    x: mid,
    z: gridZ(gateRow),
    box: { kind: 'box' as const, cx: mid, cz: gridZ(gateRow), hx: 2, hz: 0.9 },
  };

  const hall = c[HALL.id]!;
  const platform = c[PLATFORM.id]!;
  const cellar = c[CELLAR.id]!;
  const arena = c[ARENA.id]!;
  const enemies: EnemySpawn[] = [
    { id: 'ug-hall-1', kind: 'tycoon', x: hall.x - 6, z: hall.z - 6.4 },
    { id: 'ug-hall-2', kind: 'tycoon', x: hall.x + 6, z: hall.z - 6.4 },
    { id: 'ug-hall-3', kind: 'speaker', x: hall.x, z: hall.z - 6.4 },
    { id: 'ug-platform-1', kind: 'tycoon', x: platform.x - 8, z: platform.z - 3 },
    { id: 'ug-platform-2', kind: 'tycoon', x: platform.x + 8, z: platform.z + 3 },
    { id: 'ug-platform-3', kind: 'demagogue', x: platform.x - 8, z: platform.z + 3 },
    { id: 'ug-platform-4', kind: 'demagogue', x: platform.x + 8, z: platform.z - 3 },
    { id: 'ug-platform-5', kind: 'speaker', x: platform.x, z: platform.z - 5 },
    { id: 'ug-cellar-1', kind: 'tycoon', x: cellar.x - 6, z: cellar.z + 1 },
    { id: 'ug-cellar-2', kind: 'demagogue', x: cellar.x + 6, z: cellar.z + 1 },
    { id: 'ug-cellar-3', kind: 'speaker', x: cellar.x + 5, z: cellar.z - 4 },
    { id: 'ug-registrar', kind: 'registrar', x: cellar.x, z: cellar.z - 2 },
    { id: 'ug-boss', kind: 'boss', x: arena.x, z: arena.z - 3 },
    ...[
      [-9, -2],
      [9, -2],
      [-9, 7],
      [9, 7],
    ].map(([dx, dz], i) => ({
      id: `ug-helper-${i + 1}`,
      kind: (i % 2 ? 'demagogue' : 'tycoon') as EnemySpawn['kind'],
      x: arena.x + dx!,
      z: arena.z + dz!,
      dormant: true,
    })),
  ];

  const chests: Chest[] = [
    { id: 'chest-hall', x: hallBox.cx - hallBox.hx + 1.6, z: hallBox.cz + hallBox.hz - 1.8 },
    {
      id: 'chest-platform',
      x: platformBox.cx - platformBox.hx + 1.8,
      z: platformBox.cz + platformBox.hz - 1.8,
    },
    {
      id: 'chest-cellar',
      x: cellarBox.cx - cellarBox.hx + 1.6,
      z: cellarBox.cz - cellarBox.hz + 1.8,
    },
  ];

  const zones: Zone[] = [
    ...ROOMS.map((room) => ({ id: room.id, label: room.label, box: roomBox(room) })),
    // Corridors and everything else below ground.
    {
      id: 'underground',
      label: 'Moscow underground',
      box: { cx: mid, cz: gridZ(ROWS / 2), hx: 50, hz: 60 },
    },
  ];

  return {
    floor,
    placements,
    colliders,
    floors,
    enemies: enemies.map((e) => ({ ...e, instanced: true })),
    chests,
    lights,
    zones,
    arrival,
    stairs,
    gate,
    boss: { x: arena.x, z: arena.z - 3 },
    centers,
  };
}

export const UNDERGROUND: UndergroundLevel = buildUnderground();
export { cellCenter };
