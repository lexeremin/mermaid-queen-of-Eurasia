import type { EnemySpawn, Placement } from '@/data/maps/types';
import { assembleWallRun, UNDERGROUND_KIT, type WallRun } from '@/data/maps/wall-runs';
import { BOSS_KINDS, type EnemyKind } from '@/data/enemies';
import type { Collider } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid, findPath } from '@/systems/pathfinding';
import type { Zone } from '@/systems/zones';
import { mulberry32 } from '@/utils/random';
import type { Vec2 } from '@/utils/vec2';

/**
 * The Moscow underground: 100 layers, each generated from its number on a 2 m grid. Every layer has the same fixed
 * Landing (entrance, stairs up) at the south end and the same fixed Stairs hall (exit, stairs down) at the north end;
 * between them the rooms, corridors, monsters, chests and decorations are random. Every 10th layer ends in the boss
 * arena. Floors, walls (every floor edge beside rock becomes a run filled by the wall assembler), colliders,
 * features and spawns all come from the generated floor plan. Layers live in the same world as the surface, in a
 * region far south of Manezhnaya Square, that nothing on the surface can walk into.
 */
const HALF_PI = Math.PI / 2;

export const CELL = 2;
export const COLS = 26;
export const ROWS = 47;
/** World position of the grid's top-left corner (the north-west corner of cell 0,0). */
export const UG_ORIGIN = { x: -13, z: 100 };
/** Thickness of a wall piece (see build_underground_assets.py). */
export const WALL_THICKNESS = 1.8;

/** The underground region starts here; anything at or beyond this z is "down below". */
export const UG_MIN_Z = UG_ORIGIN.z - 4;
export const isUnderground = (pos: Vec2): boolean => pos.z >= UG_MIN_Z;

export const MAX_LAYER = 100;
/** Every this many layers the way down leads through the boss arena. */
export const BOSS_EVERY = 10;
/** Which boss guards a boss layer: the five take turns, then start again (tougher, through the layer's power). */
export const bossKindFor = (layer: number): EnemyKind =>
  BOSS_KINDS[(Math.floor(layer / BOSS_EVERY) - 1) % BOSS_KINDS.length]!;

/** The arena of each boss: its name and floor colour. */
const ARENAS: Readonly<Record<string, { label: string; color: string }>> = {
  boss: { label: 'Registry Vault', color: '#4a2f3a' },
  lobbyist: { label: 'The Lobby', color: '#3a3f55' },
  senator: { label: 'Senate Floor', color: '#4a4638' },
  baron: { label: 'Yacht Club', color: '#2f4552' },
  spin: { label: 'Press Room', color: '#4a3550' },
};

export const isBossLayer = (layer: number): boolean => layer % BOSS_EVERY === 0;
/** How much tougher the monsters of a layer are than the base kind (see `Enemy.power`). */
export const layerPower = (layer: number): number =>
  1 + 0.06 * (layer - 1) + 0.0004 * (layer - 1) ** 2;
/** Ten layers make a tier: it sets the light colour and the quality of the chests. */
export const layerTier = (layer: number): number => Math.floor((layer - 1) / BOSS_EVERY);

export type RoomKind = 'landing' | 'exit' | 'room' | 'arena';

export type Room = {
  id: string;
  label: string;
  kind: RoomKind;
  c0: number;
  r0: number;
  w: number;
  h: number;
  color: string;
};

export type Chest = { id: string; x: number; z: number };

export type UndergroundLevel = {
  layer: number;
  /** floor[row][col] */
  floor: boolean[][];
  rooms: Room[];
  placements: Placement[];
  colliders: Collider[];
  floors: { cx: number; cz: number; w: number; d: number; color: string; y: number }[];
  enemies: EnemySpawn[];
  chests: Chest[];
  lights: { x: number; y: number; z: number; color: string; intensity: number; distance: number }[];
  zones: Zone[];
  /** Where Rosa arrives from above (in front of the stairs up). */
  arrival: Vec2;
  stairsUp: Vec2;
  /** Where Rosa arrives from below (in front of the stairs down), and the stairs themselves. */
  arrivalDown: Vec2;
  stairsDown: Vec2;
  /** The boss gate (boss layers only): centre and the box that blocks the corridor while it is shut. */
  gate: { x: number; z: number; box: Extract<Collider, { kind: 'box' }> } | null;
  boss: Vec2 | null;
  /** The boss arena (boss layers only). */
  arena: { cx: number; cz: number; hx: number; hz: number } | null;
  /** Where each room's centre is. */
  centers: Record<string, Vec2>;
};

const cellCenter = (c: number, r: number): Vec2 => ({
  x: UG_ORIGIN.x + (c + 0.5) * CELL,
  z: UG_ORIGIN.z + (r + 0.5) * CELL,
});
const gridX = (c: number) => UG_ORIGIN.x + c * CELL;
const gridZ = (r: number) => UG_ORIGIN.z + r * CELL;

// --- The fixed parts of every layer -------------------------------------------------------------------------
// Rows run north (0, the exit) to south (46, the landing). Everything is centred on the corridor columns 12 and 13.
const MID_COL = 12;
const LANDING = { c0: 8, r0: 39, w: 10, h: 8 };
const EXIT = { c0: 8, r0: 0, w: 10, h: 8 };
/** Doors: 2 cells wide, 3 long, straight out of each hall. */
const LANDING_DOOR = { c0: MID_COL, r0: 36, w: 2, h: 3 };
const EXIT_DOOR = { c0: MID_COL, r0: 8, w: 2, h: 3 };
/** The boss arena (its corners are cut, 2 x 2 cells each) and the corridor with the gate south of it. */
const ARENA = { c0: 7, r0: 11, w: 12, h: 12 };
const ARENA_CUT = 2;
const GATE_CORRIDOR = { c0: MID_COL, r0: 23, w: 2, h: 3 };
const mid = gridX(MID_COL + 1);

const HALL_COLOR = '#4b4046';
const EXIT_COLOR = '#3f4650';
const CORRIDOR_COLOR = '#302a35';
const ROOM_COLORS = ['#3b3547', '#3a4a50', '#43393a', '#38423c', '#463a4c', '#41403a'];
const ROOM_NAMES = [
  'Records Cellar',
  'Platform Hall',
  'Ledger Vault',
  'Stamp Room',
  'Forms Archive',
  'Queue Hall',
  'Filing Rooms',
  'Clerks’ Gallery',
];
/** Light colours per tier (ten layers each), from warm lamplight down to cold deep-station blue. */
const TIER_LIGHTS = [
  '#ffc98a',
  '#ffbf8a',
  '#ffb59a',
  '#f2b0b0',
  '#e0b0c8',
  '#c8b0dc',
  '#b0b8e8',
  '#9cc4e8',
  '#8cd0e0',
  '#8ce0d0',
];

type Rect = { c0: number; r0: number; w: number; h: number };
type Rng = () => number;
const int = (rng: Rng, lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1));
const pick = <T>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)]!;

const emptyFloor = (): boolean[][] =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => false));

function fill(floor: boolean[][], rect: Rect, value = true): void {
  for (let r = rect.r0; r < rect.r0 + rect.h; r++)
    for (let c = rect.c0; c < rect.c0 + rect.w; c++)
      if (floor[r]?.[c] !== undefined) floor[r]![c] = value;
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

const overlaps = (a: Rect, b: Rect, gap: number): boolean =>
  a.c0 < b.c0 + b.w + gap &&
  b.c0 < a.c0 + a.w + gap &&
  a.r0 < b.r0 + b.h + gap &&
  b.r0 < a.r0 + a.h + gap;

/** Cells that the random parts must never touch: the fixed rooms and the ring of rock around them. */
function lockedCells(rects: readonly Rect[]): boolean[][] {
  const locked = emptyFloor();
  for (const r of rects) fill(locked, { c0: r.c0 - 1, r0: r.r0 - 1, w: r.w + 2, h: r.h + 2 }, true);
  return locked;
}

/** A 2 wide strip of floor from cell a to cell b: along one axis first, then the other. */
function carvePath(
  floor: boolean[][],
  locked: boolean[][],
  a: { c: number; r: number },
  b: { c: number; r: number },
  horizontalFirst: boolean,
  rows: { lo: number; hi: number },
): void {
  const strip = (c0: number, r0: number, w: number, h: number) => {
    for (let r = r0; r < r0 + h; r++)
      for (let c = c0; c < c0 + w; c++) {
        if (c < 1 || c > COLS - 2 || r < rows.lo || r > rows.hi || locked[r]![c]) continue;
        floor[r]![c] = true;
      }
  };
  const horizontal = (row: number, from: number, to: number) =>
    strip(Math.min(from, to), row, Math.abs(to - from) + 2, 2);
  const vertical = (col: number, from: number, to: number) =>
    strip(col, Math.min(from, to), 2, Math.abs(to - from) + 2);
  if (horizontalFirst) {
    horizontal(a.r, a.c, b.c);
    vertical(b.c, a.r, b.r);
  } else {
    vertical(a.c, a.r, b.r);
    horizontal(b.r, a.c, b.c);
  }
}

/**
 * Removes what the wall builder cannot draw: a single rock cell between two floor cells (two walls would overlap)
 * and a checkerboard vertex (two floor cells touching at a corner). The rock cells are filled in, except the locked
 * ones around the fixed rooms.
 */
function fixTopology(floor: boolean[][], locked: boolean[][]): void {
  for (let pass = 0; pass < 40; pass++) {
    let changed = false;
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (floor[r]![c] || locked[r]![c]) continue;
        if (
          (isFloor(floor, c - 1, r) && isFloor(floor, c + 1, r)) ||
          (isFloor(floor, c, r - 1) && isFloor(floor, c, r + 1))
        ) {
          floor[r]![c] = true;
          changed = true;
        }
      }
    }
    for (let r = 1; r < ROWS; r++) {
      for (let c = 1; c < COLS; c++) {
        const a = isFloor(floor, c - 1, r - 1);
        const b = isFloor(floor, c, r - 1);
        const d = isFloor(floor, c - 1, r);
        const e = isFloor(floor, c, r);
        if (a !== e || b !== d || a === b) continue;
        const rock = a
          ? [
              [c, r - 1],
              [c - 1, r],
            ]
          : [
              [c - 1, r - 1],
              [c, r],
            ];
        const free = rock.find(([cc, rr]) => !locked[rr!]![cc!]);
        if (!free) throw new Error(`layer topology: locked checkerboard at ${c},${r}`);
        floor[free[1]!]![free[0]!] = true;
        changed = true;
      }
    }
    if (!changed) return;
  }
  throw new Error('layer topology did not settle');
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
function wallRuns(
  floor: boolean[][],
  seedBase: number,
): { run: WallRun; box: Extract<Collider, { kind: 'box' }> }[] {
  const out: { run: WallRun; box: Extract<Collider, { kind: 'box' }> }[] = [];
  let seed = seedBase;
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

const rectBox = (r: Rect) => ({
  cx: gridX(r.c0) + (r.w * CELL) / 2,
  cz: gridZ(r.r0) + (r.h * CELL) / 2,
  hx: (r.w * CELL) / 2,
  hz: (r.h * CELL) / 2,
});

const layerSeed = (layer: number, attempt: number): number =>
  Math.imul(layer, 0x9e3779b1) ^ 0x51ed270b ^ Math.imul(attempt, 0x85ebca6b);

const COLUMN_R = 0.75;
const STACK_R = 0.6;

/** Picks up to `count` room sizes and places them without overlapping (a gap of 2 cells) inside the band of rows. */
function placeRooms(
  rng: Rng,
  layer: number,
  band: { lo: number; hi: number },
  fixed: readonly Rect[],
): Rect[] {
  const bossLayer = isBossLayer(layer);
  const want = bossLayer
    ? int(rng, 2, 3)
    : int(rng, 3, 5) + (layer >= 30 ? 1 : 0) + (layer >= 60 ? 1 : 0);
  const rooms: Rect[] = [];
  for (let attempt = 0; attempt < 120 && rooms.length < want; attempt++) {
    const w = int(rng, 5, bossLayer ? 9 : 11);
    const h = int(rng, 4, bossLayer ? 6 : 8);
    if (band.hi - band.lo + 1 < h) continue;
    const room: Rect = {
      c0: int(rng, 1, COLS - 1 - w),
      r0: int(rng, band.lo, band.hi - h + 1),
      w,
      h,
    };
    if ([...rooms, ...fixed].some((other) => overlaps(room, other, 2))) continue;
    rooms.push(room);
  }
  return rooms;
}

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.z - b.z);

/** The walkable box around the level, for the check that every layer can be walked through. */
const LEVEL_BOUNDS = {
  minX: UG_ORIGIN.x - 6,
  maxX: UG_ORIGIN.x + COLS * CELL + 6,
  minZ: UG_ORIGIN.z - 8,
  maxZ: UG_ORIGIN.z + ROWS * CELL + 6,
};

/** Whether Rosa can walk from the landing to the stairs and to every monster and chest (the boss gate open). */
function isWalkable(level: UndergroundLevel): boolean {
  const nav = createNavGrid(
    { bounds: LEVEL_BOUNDS, colliders: level.colliders, water: [] },
    PLAYER_RADIUS,
    0.5,
  );
  const from = level.arrival;
  if (!findPath(nav, from, level.arrivalDown)) return false;
  return [...level.enemies.filter((e) => !e.dormant), ...level.chests].every(
    (p) => findPath(nav, from, { x: p.x, z: p.z }) !== null,
  );
}

const MAX_ATTEMPTS = 12;

/**
 * The layer, generated from its number. A roll whose columns, stacks or corridors would block the way is thrown away
 * and rolled again (from the same number, so the result never changes).
 */
export function generateLayer(layer: number): UndergroundLevel {
  if (!Number.isInteger(layer) || layer < 1 || layer > MAX_LAYER) {
    throw new Error(`no such layer: ${layer}`);
  }
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const level = buildLayer(layer, attempt);
    if (isWalkable(level)) return level;
  }
  throw new Error(`layer ${layer} could not be made walkable`);
}

function buildLayer(layer: number, attempt: number): UndergroundLevel {
  const rng = mulberry32(layerSeed(layer, attempt));
  const bossLayer = isBossLayer(layer);
  const power = layerPower(layer);
  const tier = layerTier(layer);

  // --- Floor plan ---
  const floor = emptyFloor();
  const fixedRects: Rect[] = [LANDING, EXIT, ...(bossLayer ? [ARENA] : [])];
  const locked = lockedCells(fixedRects);
  fill(floor, LANDING);
  fill(floor, EXIT);
  fill(floor, LANDING_DOOR);
  fill(floor, EXIT_DOOR);
  for (const door of [LANDING_DOOR, EXIT_DOOR]) fill(locked, door, false);
  if (bossLayer) {
    fill(floor, ARENA);
    fill(floor, GATE_CORRIDOR);
    fill(locked, GATE_CORRIDOR, false);
    fill(locked, { c0: ARENA.c0 + ARENA.w / 2 - 1, r0: ARENA.r0 - 1, w: 2, h: 1 }, false);
    const { c0, r0, w, h } = ARENA;
    for (const cut of [
      { c0, r0 },
      { c0: c0 + w - ARENA_CUT, r0 },
      { c0, r0: r0 + h - ARENA_CUT },
      { c0: c0 + w - ARENA_CUT, r0: r0 + h - ARENA_CUT },
    ])
      fill(floor, { ...cut, w: ARENA_CUT, h: ARENA_CUT }, false);
  }

  const band = bossLayer ? { lo: 27, hi: 35 } : { lo: 11, hi: 35 };
  const rows = bossLayer ? { lo: 26, hi: 37 } : { lo: 9, hi: 37 };
  let placed = placeRooms(rng, layer, band, fixedRects);
  if (placed.length < 2) {
    // A crowded roll: fall back to two rooms side by side.
    placed = bossLayer
      ? [
          { c0: 2, r0: 28, w: 7, h: 5 },
          { c0: 15, r0: 28, w: 8, h: 5 },
        ]
      : [
          { c0: 2, r0: 14, w: 8, h: 6 },
          { c0: 14, r0: 24, w: 9, h: 6 },
        ];
  }
  // South to north: the path starts at the landing and ends at the stairs (or the gate).
  placed.sort((a, b) => b.r0 + b.h / 2 - (a.r0 + a.h / 2));
  for (const room of placed) fill(floor, room);
  const centerOf = (r: Rect) => ({ c: r.c0 + Math.floor(r.w / 2), r: r.r0 + Math.floor(r.h / 2) });
  const stops = [
    { c: MID_COL, r: LANDING_DOOR.r0 },
    ...placed.map(centerOf),
    { c: MID_COL, r: bossLayer ? GATE_CORRIDOR.r0 + GATE_CORRIDOR.h : EXIT_DOOR.r0 + EXIT_DOOR.h },
  ];
  for (let i = 0; i + 1 < stops.length; i++) {
    carvePath(floor, locked, stops[i]!, stops[i + 1]!, rng() < 0.5, rows);
  }
  // The odd loop: two rooms that are not neighbours on the path get a second corridor.
  if (placed.length >= 3 && rng() < 0.6) {
    const i = int(rng, 0, placed.length - 3);
    carvePath(floor, locked, centerOf(placed[i]!), centerOf(placed[i + 2]!), rng() < 0.5, rows);
  }
  fixTopology(floor, locked);

  // --- Rooms and zones ---
  const rooms: Room[] = [
    {
      id: 'ug-hall',
      label: layer === 1 ? 'Ticket Hall' : 'Landing',
      kind: 'landing',
      ...LANDING,
      color: HALL_COLOR,
    },
    { id: 'ug-exit', label: 'Stairs Hall', kind: 'exit', ...EXIT, color: EXIT_COLOR },
  ];
  if (bossLayer)
    rooms.push({
      id: 'ug-arena',
      label: ARENAS[bossKindFor(layer)]!.label,
      kind: 'arena',
      ...ARENA,
      color: ARENAS[bossKindFor(layer)]!.color,
    });
  const names = [...ROOM_NAMES];
  placed.forEach((r, i) => {
    const name = names.splice(Math.floor(rng() * names.length), 1)[0] ?? `Room ${i + 1}`;
    rooms.push({
      id: `ug-room-${i + 1}`,
      label: name,
      kind: 'room',
      ...r,
      color: pick(rng, ROOM_COLORS),
    });
  });
  const centers: Record<string, Vec2> = {};
  for (const room of rooms) {
    const b = rectBox(room);
    centers[room.id] = { x: b.cx, z: b.cz };
  }

  // --- Walls, floors, stairs ---
  const walls = wallRuns(floor, 700 + layer * 1000);
  const placements: Placement[] = walls.flatMap((w) => assembleWallRun(w.run, UNDERGROUND_KIT));
  const colliders: Collider[] = walls.map((w) => w.box);

  // Floors: a dark rock bed under everything (the camera looks past the walls), then one rectangle per run of cells.
  const roomAt = (c: number, r: number): Room | undefined =>
    rooms.find(
      (room) => c >= room.c0 && c < room.c0 + room.w && r >= room.r0 && r < room.r0 + room.h,
    );
  const colorOf = (c: number, r: number): string => roomAt(c, r)?.color ?? CORRIDOR_COLOR;
  const floors: UndergroundLevel['floors'] = [
    { cx: mid, cz: gridZ(ROWS / 2), w: 110, d: 120, color: '#15111a', y: 0.03 },
  ];
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      if (!floor[r]![c]) {
        c++;
        continue;
      }
      const color = colorOf(c, r);
      let end = c + 1;
      while (end < COLS && floor[r]![end] && colorOf(end, r) === color) end++;
      floors.push({
        cx: gridX(c) + ((end - c) * CELL) / 2,
        cz: gridZ(r) + CELL / 2,
        w: (end - c) * CELL,
        d: CELL,
        color,
        y: 0.04,
      });
      c = end;
    }
  }

  const stairsUp = { x: mid, z: gridZ(ROWS) - 1.3 };
  const arrival = { x: mid, z: stairsUp.z - 2.9 };
  const stairsDown = { x: mid, z: gridZ(0) + 1.3 };
  const arrivalDown = { x: mid, z: stairsDown.z + 2.9 };
  placements.push(
    { asset: 'ugStairs', x: stairsUp.x, z: stairsUp.z, rotY: Math.PI, collide: false },
    { asset: 'ugStairs', x: stairsDown.x, z: stairsDown.z, rotY: 0, collide: false },
  );
  colliders.push(
    { kind: 'box', cx: stairsUp.x, cz: stairsUp.z + 0.2, hx: 2.4, hz: 1.4 },
    { kind: 'box', cx: stairsDown.x, cz: stairsDown.z - 0.2, hx: 2.4, hz: 1.4 },
  );

  // --- Decoration: fixed stacks in the halls, columns and stacks in the random rooms ---
  const stackAt = (x: number, z: number, rotY = 0) => {
    placements.push({ asset: 'paperStack', x, z, rotY });
    colliders.push({ kind: 'circle', x, z, r: STACK_R });
  };
  const landingBox = rectBox(LANDING);
  const exitBox = rectBox(EXIT);
  stackAt(landingBox.cx - landingBox.hx + 1.2, landingBox.cz - 2, 0.4);
  stackAt(landingBox.cx + landingBox.hx - 1.2, landingBox.cz - 1, -0.3);
  stackAt(landingBox.cx + landingBox.hx - 1.2, landingBox.cz + 2, 0.2);
  stackAt(exitBox.cx - exitBox.hx + 1.2, exitBox.cz + 2, -0.4);
  stackAt(exitBox.cx + exitBox.hx - 1.2, exitBox.cz + 1, 0.3);
  stackAt(exitBox.cx + exitBox.hx - 1.2, exitBox.cz - 2, -0.2);

  const obstacles: Vec2[] = [];
  const randomRooms = rooms.filter((room) => room.kind === 'room');
  for (const room of randomRooms) {
    const b = rectBox(room);
    // Columns stay well away from the walls, where the corridors come in.
    if (room.w >= 8 && room.h >= 7) {
      for (const [sx, sz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        const p = { x: b.cx + (sx * b.hx) / 2, z: b.cz + (sz * b.hz) / 2 };
        placements.push({ asset: 'ugColumn', x: p.x, z: p.z });
        colliders.push({ kind: 'circle', x: p.x, z: p.z, r: COLUMN_R });
        obstacles.push(p);
      }
    }
    for (let i = 0, n = int(rng, 1, 3); i < n; i++) {
      const side = int(rng, 0, 3);
      const along = rng() * 2 - 1;
      const p =
        side < 2
          ? { x: b.cx + along * (b.hx - 1.6), z: b.cz + (side === 0 ? -1 : 1) * (b.hz - 1.2) }
          : { x: b.cx + (side === 2 ? -1 : 1) * (b.hx - 1.2), z: b.cz + along * (b.hz - 1.6) };
      if (obstacles.some((o) => dist(o, p) < 2)) continue;
      stackAt(p.x, p.z, rng() * 6);
      obstacles.push(p);
    }
  }

  // --- Monsters ---
  const enemies: EnemySpawn[] = [];
  const spawnPoint = (room: Room, avoid: readonly Vec2[], margin = 1.6): Vec2 => {
    const b = rectBox(room);
    let best: Vec2 = { x: b.cx, z: b.cz };
    for (let attempt = 0; attempt < 30; attempt++) {
      const p = {
        x: b.cx + (rng() * 2 - 1) * (b.hx - margin),
        z: b.cz + (rng() * 2 - 1) * (b.hz - margin),
      };
      best = p;
      if (avoid.every((o) => dist(o, p) >= 2.2)) return p;
    }
    return best;
  };
  const kindFor = (): EnemyKind => {
    const roll = rng();
    const speaker = 0.14 + layer / 700;
    const demagogue = 0.28 + layer / 500;
    if (roll < speaker) return 'speaker';
    if (roll < speaker + demagogue) return 'demagogue';
    return 'tycoon';
  };
  const spawned: Vec2[] = [];
  randomRooms.forEach((room, i) => {
    const area = room.w * room.h;
    const count = Math.max(1, Math.round(area / 22)) + Math.floor(layer / 25) + (bossLayer ? 1 : 0);
    for (let k = 0; k < count; k++) {
      const p = spawnPoint(room, [...obstacles, ...spawned]);
      spawned.push(p);
      enemies.push({ id: `L${layer}-r${i + 1}-${k + 1}`, kind: kindFor(), x: p.x, z: p.z, power });
    }
    if (layer >= 5 && rng() < Math.min(0.4, layer / 250)) {
      const p = spawnPoint(room, [...obstacles, ...spawned], 2.2);
      spawned.push(p);
      enemies.push({ id: `L${layer}-r${i + 1}-elite`, kind: 'registrar', x: p.x, z: p.z, power });
    }
  });

  let gate: UndergroundLevel['gate'] = null;
  let boss: Vec2 | null = null;
  let arena: UndergroundLevel['arena'] = null;
  if (bossLayer) {
    const a = centers['ug-arena']!;
    arena = rectBox(ARENA);
    boss = { x: a.x, z: a.z - 3 };
    enemies.push({
      id: `L${layer}-boss`,
      kind: bossKindFor(layer),
      x: boss.x,
      z: boss.z,
      power,
    });
    [
      [-9, -2],
      [9, -2],
      [-9, 7],
      [9, 7],
    ].forEach(([dx, dz], i) => {
      enemies.push({
        id: `L${layer}-helper-${i + 1}`,
        kind: i % 2 ? 'demagogue' : 'tycoon',
        x: a.x + dx!,
        z: a.z + dz!,
        dormant: true,
        power,
      });
    });
    const gateRow = GATE_CORRIDOR.r0 + 1.5;
    gate = {
      x: mid,
      z: gridZ(gateRow),
      box: { kind: 'box', cx: mid, cz: gridZ(gateRow), hx: 2, hz: 0.9 },
    };
    // Cover for the fight.
    for (const dx of [-7, 7])
      for (const dz of [-6, 6]) {
        const p = { x: a.x + dx, z: a.z + dz };
        placements.push({ asset: 'ugColumn', x: p.x, z: p.z });
        colliders.push({ kind: 'circle', x: p.x, z: p.z, r: COLUMN_R });
      }
  }

  // --- Chests ---
  const chests: Chest[] = [];
  const chestCount = randomRooms.length === 0 ? 0 : 1 + (rng() < 0.4 ? 1 : 0);
  for (let i = 0; i < chestCount; i++) {
    const room = pick(rng, randomRooms);
    const p = spawnPoint(room, [...obstacles, ...spawned, ...chests], 2);
    chests.push({ id: `L${layer}-c${i + 1}`, x: p.x, z: p.z });
    obstacles.push(p);
  }

  // --- Lights: always four (the count must not change between layers, or every material recompiles) ---
  const tint = TIER_LIGHTS[Math.min(TIER_LIGHTS.length - 1, tier)]!;
  const lightRooms = [
    centers['ug-hall']!,
    centers['ug-exit']!,
    ...(bossLayer ? [centers['ug-arena']!] : []),
    ...randomRooms.map((room) => centers[room.id]!),
  ];
  const fallbacks = [
    { x: mid, z: gridZ(20) },
    { x: mid, z: gridZ(30) },
  ];
  const lights: UndergroundLevel['lights'] = [0, 1, 2, 3].map((i) => {
    const at = lightRooms[i] ?? fallbacks[i - lightRooms.length] ?? fallbacks[0]!;
    const big = bossLayer && at === centers['ug-arena'];
    return {
      x: at.x,
      y: 3.4,
      z: at.z,
      color: big ? '#ff9a7a' : tint,
      intensity: big ? 120 : 100,
      distance: big ? 34 : 28,
    };
  });

  const zones: Zone[] = [
    ...rooms.map((room) => ({ id: room.id, label: room.label, box: rectBox(room) })),
    // Corridors and everything else below ground.
    {
      id: 'underground',
      label: 'Moscow underground',
      box: { cx: mid, cz: gridZ(ROWS / 2), hx: 50, hz: 60 },
    },
  ];

  return {
    layer,
    floor,
    rooms,
    placements,
    colliders,
    floors,
    enemies: enemies.map((e) => ({ ...e, instanced: true })),
    chests,
    lights,
    zones,
    arrival,
    stairsUp,
    arrivalDown,
    stairsDown,
    gate,
    boss,
    arena,
    centers,
  };
}

const cache = new Map<number, UndergroundLevel>();

/** The generated layer, kept for a moment (a few layers are used again and again: the current one and its neighbours). */
export function layerLevel(layer: number): UndergroundLevel {
  const hit = cache.get(layer);
  if (hit) {
    cache.delete(layer);
    cache.set(layer, hit);
    return hit;
  }
  const level = generateLayer(layer);
  cache.set(layer, level);
  while (cache.size > 4) cache.delete(cache.keys().next().value as number);
  return level;
}

export { cellCenter };
