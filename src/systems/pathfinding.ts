import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import type { Vec2 } from '@/utils/vec2';

export type NavGrid = {
  readonly cell: number;
  readonly cols: number;
  readonly rows: number;
  isFreeCell: (i: number, j: number) => boolean;
  isFreePoint: (x: number, z: number) => boolean;
  toCell: (x: number, z: number) => [number, number];
  cellCenter: (i: number, j: number) => Vec2;
  /** Fills the walkability cache in small chunks so the first click does not stall. */
  prewarm: () => Promise<void>;
  /** Forgets the cache (a gate opened or closed, so walkability changed). */
  reset: () => void;
  /** Whether two points lie in the same walkable region (a walk from one to the other exists). */
  sameRegion: (a: Vec2, b: Vec2) => boolean;
};

const UNKNOWN = 0;
const FREE = 1;
const BLOCKED = 2;

/** Walkability grid for a circle of `radius` over the collision world, computed lazily and cached. */
export function createNavGrid(world: CollisionWorld, radius: number, cell = 0.5): NavGrid {
  const { minX, maxX, minZ, maxZ } = world.bounds;
  const cols = Math.floor((maxX - minX) / cell) + 1;
  const rows = Math.floor((maxZ - minZ) / cell) + 1;
  const state = new Uint8Array(cols * rows);

  const isFreePoint = (x: number, z: number): boolean => {
    const p = resolveCircle({ x, z }, radius, world);
    return Math.abs(p.x - x) < 1e-6 && Math.abs(p.z - z) < 1e-6;
  };

  // Connected walkable regions, labelled lazily by a flood fill and dropped whenever the cache is reset.
  let labels: Int32Array | null = null;
  const computeLabels = (): Int32Array => {
    const out = new Int32Array(cols * rows);
    let next = 0;
    const stack: number[] = [];
    for (let start = 0; start < out.length; start++) {
      if (out[start] !== 0) continue;
      const si = start % cols;
      const sj = Math.floor(start / cols);
      if (!isFreeCell(si, sj)) continue;
      next += 1;
      out[start] = next;
      stack.push(start);
      while (stack.length > 0) {
        const k = stack.pop() as number;
        const i = k % cols;
        const j = Math.floor(k / cols);
        for (const [di, dj] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const ni = i + di;
          const nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
          const nk = nj * cols + ni;
          if (out[nk] !== 0 || !isFreeCell(ni, nj)) continue;
          out[nk] = next;
          stack.push(nk);
        }
      }
    }
    return out;
  };
  const regionAt = (x: number, z: number): number => {
    labels ??= computeLabels();
    const ci = Math.round((x - minX) / cell);
    const cj = Math.round((z - minZ) / cell);
    for (let r = 0; r <= 2; r++) {
      for (let dj = -r; dj <= r; dj++) {
        for (let di = -r; di <= r; di++) {
          const i = ci + di;
          const j = cj + dj;
          if (i < 0 || j < 0 || i >= cols || j >= rows) continue;
          const label = labels[j * cols + i] ?? 0;
          if (label !== 0) return label;
        }
      }
    }
    return 0;
  };

  const isFreeCell = (i: number, j: number): boolean => {
    if (i < 0 || j < 0 || i >= cols || j >= rows) return false;
    const k = j * cols + i;
    let s = state[k] ?? UNKNOWN;
    if (s === UNKNOWN) {
      s = isFreePoint(minX + i * cell, minZ + j * cell) ? FREE : BLOCKED;
      state[k] = s;
    }
    return s === FREE;
  };

  return {
    cell,
    cols,
    rows,
    isFreeCell,
    isFreePoint,
    toCell: (x, z) => [Math.round((x - minX) / cell), Math.round((z - minZ) / cell)],
    cellCenter: (i, j) => ({ x: minX + i * cell, z: minZ + j * cell }),
    reset: () => {
      state.fill(UNKNOWN);
      labels = null;
    },
    sameRegion: (a, b) => {
      const ra = regionAt(a.x, a.z);
      return ra !== 0 && ra === regionAt(b.x, b.z);
    },
    async prewarm() {
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) isFreeCell(i, j);
        if (j % 12 === 11) await new Promise((resolve) => setTimeout(resolve, 0));
      }
    },
  };
}

function nearestFreeCell(
  grid: NavGrid,
  i: number,
  j: number,
  maxRing = 14,
): [number, number] | null {
  if (grid.isFreeCell(i, j)) return [i, j];
  for (let ring = 1; ring <= maxRing; ring++) {
    let best: [number, number] | null = null;
    let bestDist = Infinity;
    for (let dj = -ring; dj <= ring; dj++) {
      for (let di = -ring; di <= ring; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== ring) continue;
        if (!grid.isFreeCell(i + di, j + dj)) continue;
        const d = di * di + dj * dj;
        if (d < bestDist) {
          bestDist = d;
          best = [i + di, j + dj];
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/** Conservative straight-line check: all four grid cells around every sample must be free. */
function lineFree(grid: NavGrid, a: Vec2, b: Vec2): boolean {
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.max(1, Math.ceil(length / (grid.cell / 2)));
  const origin = grid.cellCenter(0, 0);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const gx = (a.x + (b.x - a.x) * t - origin.x) / grid.cell;
    const gz = (a.z + (b.z - a.z) * t - origin.z) / grid.cell;
    const i0 = Math.floor(gx);
    const j0 = Math.floor(gz);
    if (
      !grid.isFreeCell(i0, j0) ||
      !grid.isFreeCell(i0 + 1, j0) ||
      !grid.isFreeCell(i0, j0 + 1) ||
      !grid.isFreeCell(i0 + 1, j0 + 1)
    ) {
      return false;
    }
  }
  return true;
}

class MinHeap {
  private readonly items: { key: number; cost: number }[] = [];
  get size(): number {
    return this.items.length;
  }
  push(key: number, cost: number): void {
    const items = this.items;
    items.push({ key, cost });
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      const a = items[i];
      const b = items[parent];
      if (!a || !b || b.cost <= a.cost) break;
      items[i] = b;
      items[parent] = a;
      i = parent;
    }
  }
  pop(): number {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (top === undefined || last === undefined) return -1;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < items.length && (items[l]?.cost ?? Infinity) < (items[m]?.cost ?? Infinity)) m = l;
        if (r < items.length && (items[r]?.cost ?? Infinity) < (items[m]?.cost ?? Infinity)) m = r;
        if (m === i) break;
        const a = items[i];
        const b = items[m];
        if (!a || !b) break;
        items[i] = b;
        items[m] = a;
        i = m;
      }
    }
    return top.key;
  }
}

const NEIGHBORS: readonly (readonly [number, number, number])[] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/**
 * Waypoints (excluding the start) from `from` to `to`, or null if unreachable.
 * A blocked start or target snaps to the nearest free cell, so clicking a wall walks to its edge.
 */
export function findPath(grid: NavGrid, from: Vec2, to: Vec2): Vec2[] | null {
  const [fi, fj] = grid.toCell(from.x, from.z);
  const [ti, tj] = grid.toCell(to.x, to.z);
  const start = nearestFreeCell(grid, fi, fj);
  const goal = nearestFreeCell(grid, ti, tj);
  if (!start || !goal) return null;

  const { cols, rows } = grid;
  const startKey = start[1] * cols + start[0];
  const goalKey = goal[1] * cols + goal[0];
  const cost = new Float32Array(cols * rows).fill(Infinity);
  const parent = new Int32Array(cols * rows).fill(-1);
  const closed = new Uint8Array(cols * rows);
  const open = new MinHeap();
  const heuristic = (i: number, j: number): number => {
    const dx = Math.abs(i - goal[0]);
    const dz = Math.abs(j - goal[1]);
    return dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz);
  };

  cost[startKey] = 0;
  open.push(startKey, heuristic(start[0], start[1]));
  let found = startKey === goalKey;
  while (!found && open.size > 0) {
    const key = open.pop();
    if (key < 0 || closed[key]) continue;
    closed[key] = 1;
    if (key === goalKey) {
      found = true;
      break;
    }
    const i = key % cols;
    const j = (key - i) / cols;
    for (const [di, dj, step] of NEIGHBORS) {
      const ni = i + di;
      const nj = j + dj;
      if (!grid.isFreeCell(ni, nj)) continue;
      if (di !== 0 && dj !== 0 && (!grid.isFreeCell(i + di, j) || !grid.isFreeCell(i, j + dj)))
        continue;
      const nk = nj * cols + ni;
      const next = (cost[key] ?? Infinity) + step;
      if (next < (cost[nk] ?? Infinity)) {
        cost[nk] = next;
        parent[nk] = key;
        open.push(nk, next + heuristic(ni, nj));
      }
    }
  }
  if (!found) return null;

  const cells: Vec2[] = [];
  for (let k = goalKey; k !== -1 && k !== startKey; k = parent[k] ?? -1) {
    const i = k % cols;
    cells.push(grid.cellCenter(i, (k - i) / cols));
  }
  cells.reverse();

  const end = grid.isFreePoint(to.x, to.z)
    ? { x: to.x, z: to.z }
    : grid.cellCenter(goal[0], goal[1]);
  if (cells.length === 0) return [end];
  cells[cells.length - 1] = end;

  const smoothed: Vec2[] = [];
  let anchor: Vec2 = grid.cellCenter(start[0], start[1]);
  let index = 0;
  while (index < cells.length) {
    let far = index;
    for (let k = cells.length - 1; k > index; k--) {
      const candidate = cells[k];
      if (candidate && lineFree(grid, anchor, candidate)) {
        far = k;
        break;
      }
    }
    const waypoint = cells[far];
    if (!waypoint) break;
    smoothed.push(waypoint);
    anchor = waypoint;
    index = far + 1;
  }
  return smoothed;
}

export type PathStep = { move: Vec2; path: Vec2[] };

/** Direction toward the next waypoint at full speed; waypoints within `arrival` are dropped. */
export function steerAlongPath(pos: Vec2, path: readonly Vec2[], arrival = 0.25): PathStep {
  let remaining = path;
  while (remaining.length > 0) {
    const next = remaining[0];
    if (!next || Math.hypot(next.x - pos.x, next.z - pos.z) > arrival) break;
    remaining = remaining.slice(1);
  }
  const target = remaining[0];
  if (!target) return { move: { x: 0, z: 0 }, path: [] };
  const dx = target.x - pos.x;
  const dz = target.z - pos.z;
  const len = Math.hypot(dx, dz);
  return { move: { x: dx / len, z: dz / len }, path: [...remaining] };
}
