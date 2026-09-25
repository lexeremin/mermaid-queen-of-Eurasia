import type { Entrance, Point } from '@/data/maps/types';

/** Paving is laid on a grid of 1 m cells; variants are chosen per block of BLOCK x BLOCK cells (one 64 px tile = 4 m). */
export const CELL = 1;
export const BLOCK = 4;
export const VARIANTS = 4;

export type Rect = { cx: number; cz: number; w: number; d: number };
export type Lane = { points: readonly Point[]; width: number };

export type Grid = {
  minX: number;
  minZ: number;
  cols: number;
  rows: number;
  /** 1 where the ground is paved (cobbles), 0 where it is lawn. Row-major, `rows` rows of `cols`. */
  paved: Uint8Array;
};

export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

const distanceToSegment = (px: number, pz: number, a: Point, b: Point): number => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len2 = dx * dx + dz * dz;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / len2));
  return Math.hypot(px - (a[0] + t * dx), pz - (a[1] + t * dz));
};

/** Marks every cell whose centre lies in a paved rectangle or within half a lane's width of its centre line. */
export function rasterize(bounds: Bounds, rects: readonly Rect[], lanes: readonly Lane[]): Grid {
  const minX = Math.floor(bounds.minX / CELL) * CELL;
  const minZ = Math.floor(bounds.minZ / CELL) * CELL;
  const cols = Math.ceil((bounds.maxX - minX) / CELL);
  const rows = Math.ceil((bounds.maxZ - minZ) / CELL);
  const paved = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = minX + (i + 0.5) * CELL;
      const z = minZ + (j + 0.5) * CELL;
      const inRect = rects.some(
        (r) => Math.abs(x - r.cx) <= r.w / 2 && Math.abs(z - r.cz) <= r.d / 2,
      );
      const inLane = lanes.some((lane) => {
        for (let k = 0; k + 1 < lane.points.length; k++) {
          if (distanceToSegment(x, z, lane.points[k]!, lane.points[k + 1]!) <= lane.width / 2)
            return true;
        }
        return false;
      });
      if (inRect || inLane) paved[j * cols + i] = 1;
    }
  }
  return { minX, minZ, cols, rows, paved };
}

export const isPaved = (grid: Grid, i: number, j: number): boolean =>
  i >= 0 && j >= 0 && i < grid.cols && j < grid.rows && grid.paved[j * grid.cols + i] === 1;

export type Side = 'west' | 'east' | 'north' | 'south';
export type KerbEdge = { i: number; j: number; side: Side };

const NEIGHBOURS: readonly (readonly [Side, number, number])[] = [
  ['west', -1, 0],
  ['east', 1, 0],
  ['north', 0, -1],
  ['south', 0, 1],
];

/** Where a paved cell meets lawn: one kerb edge per exposed side. Entrance mouths are left open (see `openings`). */
export function kerbEdges(grid: Grid, openings: readonly Entrance[] = []): KerbEdge[] {
  const edges: KerbEdge[] = [];
  for (let j = 0; j < grid.rows; j++) {
    for (let i = 0; i < grid.cols; i++) {
      if (!isPaved(grid, i, j)) continue;
      for (const [side, di, dj] of NEIGHBOURS) {
        if (isPaved(grid, i + di, j + dj)) continue;
        if (inOpening(grid, i, j, side, openings)) continue;
        edges.push({ i, j, side });
      }
    }
  }
  return edges;
}

const OPENING_DEPTH = 4;
const OPENING_MARGIN = 0.6;

/** An edge crossing the way through a gate (its mouth) must not get a kerb: paving and lawn just meet there. */
function inOpening(
  grid: Grid,
  i: number,
  j: number,
  side: Side,
  openings: readonly Entrance[],
): boolean {
  const x =
    grid.minX + (i + 0.5) * CELL + (side === 'west' ? -CELL / 2 : side === 'east' ? CELL / 2 : 0);
  const z =
    grid.minZ + (j + 0.5) * CELL + (side === 'north' ? -CELL / 2 : side === 'south' ? CELL / 2 : 0);
  return openings.some((e) => {
    if (e.axis === 'z') {
      return (
        side !== 'west' &&
        side !== 'east' &&
        Math.abs(x - e.x) <= e.width / 2 + OPENING_MARGIN &&
        Math.abs(z - e.z) <= OPENING_DEPTH
      );
    }
    return (
      side !== 'north' &&
      side !== 'south' &&
      Math.abs(z - e.z) <= e.width / 2 + OPENING_MARGIN &&
      Math.abs(x - e.x) <= OPENING_DEPTH
    );
  });
}

/** Deterministic hash of two integers into [0, 1). */
export function hash2(a: number, b: number, seed = 0): number {
  let h =
    (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(seed | 0, 2147483647)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export type Variant = { index: number; flipX: boolean; flipZ: boolean };

/** The paving variant of the block that contains cell (i, j): same for all 16 cells of a block, so joints stay clean. */
export function blockVariant(grid: Grid, i: number, j: number, seed = 7): Variant {
  const bx = Math.floor((grid.minX + i * CELL) / (BLOCK * CELL));
  const bz = Math.floor((grid.minZ + j * CELL) / (BLOCK * CELL));
  return {
    index: Math.floor(hash2(bx, bz, seed) * VARIANTS),
    flipX: hash2(bx, bz, seed + 1) < 0.5,
    flipZ: hash2(bx, bz, seed + 2) < 0.5,
  };
}

/** UV rectangle (u0, v0, u1, v1) inside the 2x2 atlas for one cell; a flipped variant mirrors its texels. */
export function cellUv(
  grid: Grid,
  i: number,
  j: number,
  seed = 7,
): [number, number, number, number] {
  const v = blockVariant(grid, i, j, seed);
  const worldI = Math.round((grid.minX + i * CELL) / CELL);
  const worldJ = Math.round((grid.minZ + j * CELL) / CELL);
  const a = ((worldI % BLOCK) + BLOCK) % BLOCK;
  const b = ((worldJ % BLOCK) + BLOCK) % BLOCK;
  const ax = v.flipX ? BLOCK - 1 - a : a;
  const bz = v.flipZ ? BLOCK - 1 - b : b;
  const tileU = (v.index % 2) * 0.5;
  const tileV = Math.floor(v.index / 2) * 0.5;
  const step = 0.5 / BLOCK;
  let u0 = tileU + ax * step;
  let u1 = u0 + step;
  let v0 = tileV + bz * step;
  let v1 = v0 + step;
  if (v.flipX) [u0, u1] = [u1, u0];
  if (v.flipZ) [v0, v1] = [v1, v0];
  return [u0, v0, u1, v1];
}
