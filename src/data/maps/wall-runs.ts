import type { AssetId } from '@/data/assets';
import type { Placement } from '@/data/maps/types';
import { mulberry32 } from '@/utils/random';

/** Lengths of the wall pieces in the kit (metres), before stretching. */
export const LONG_PIECE = 6;
export const SHORT_PIECE = 3;
/** Wall pieces reach this far into a tower so no seam or gap shows at the joint. */
export const EMBED = 0.15;
const MIN_SPAN = 0.9;
/** Even a tiny span gets a (squeezed) short piece rather than a gap. */
export const MIN_STRETCH = 0.3;
export const MAX_STRETCH = 1.7;

/** A wall kit: 6 m variants that share one profile and differ only in their surface details, plus a 3 m piece. */
export type WallKit = {
  long: readonly { asset: AssetId; weight: number }[];
  short: AssetId;
};

export const KREMLIN_KIT: WallKit = {
  long: [
    { asset: 'kremlinWall', weight: 5 },
    { asset: 'kremlinWallB', weight: 2 },
    { asset: 'kremlinWallC', weight: 2 },
  ],
  short: 'kremlinWallShort',
};

/** Dark brick walls of the Moscow underground. */
export const UNDERGROUND_KIT: WallKit = {
  long: [
    { asset: 'ugWall', weight: 4 },
    { asset: 'ugWallB', weight: 3 },
    { asset: 'ugWallC', weight: 2 },
  ],
  short: 'ugWallShort',
};

/** A tower, corner or gate that a wall run butts into: its centre along the run and half its width along the run. */
export type RunNode = { at: number; half: number };

export type WallRun = {
  /** Where the run starts (an axis-aligned run: only one of x and z changes). */
  from: { x: number; z: number };
  to: { x: number; z: number };
  /** Model rotation used for this run (decides which face is the front). */
  rotY: number;
  nodes: readonly RunNode[];
  seed: number;
};

export type Piece = { length: number; long: boolean };

/**
 * Chooses how many long and short pieces cover `span` with the least stretching. Returns the pieces (in a
 * pleasant order) and the stretch to apply so they add up to exactly `span`.
 */
export function fitSpan(
  span: number,
): { counts: { long: number; short: number }; stretch: number } | null {
  if (span < MIN_SPAN) return null;
  let best: { long: number; short: number; stretch: number } | null = null;
  for (let long = 0; long <= Math.ceil(span / LONG_PIECE); long++) {
    for (let short = 0; short <= 2; short++) {
      const total = long * LONG_PIECE + short * SHORT_PIECE;
      if (total === 0) continue;
      const stretch = span / total;
      if (stretch < MIN_STRETCH || stretch > MAX_STRETCH) continue;
      const better =
        !best ||
        Math.abs(Math.log(stretch)) < Math.abs(Math.log(best.stretch)) - 1e-9 ||
        (Math.abs(Math.abs(Math.log(stretch)) - Math.abs(Math.log(best.stretch))) <= 1e-9 &&
          short < best.short);
      if (better) best = { long, short, stretch };
    }
  }
  return best ? { counts: { long: best.long, short: best.short }, stretch: best.stretch } : null;
}

/** Turns one wall run into placements: every span between nodes is filled exactly, with varied pieces. */
export function assembleWallRun(run: WallRun, kit: WallKit = KREMLIN_KIT): Placement[] {
  const dx = run.to.x - run.from.x;
  const dz = run.to.z - run.from.z;
  const length = Math.hypot(dx, dz);
  const dir = { x: dx / length, z: dz / length };
  const random = mulberry32(run.seed);
  const nodes = [...run.nodes].sort((a, b) => a.at - b.at);

  const spans: { start: number; end: number }[] = [];
  let cursor = 0;
  let cursorIsNode = false;
  for (const node of nodes) {
    spans.push({ start: cursorIsNode ? cursor - EMBED : cursor, end: node.at - node.half + EMBED });
    cursor = node.at + node.half;
    cursorIsNode = true;
  }
  spans.push({ start: cursorIsNode ? cursor - EMBED : cursor, end: length });

  const placements: Placement[] = [];
  let previous: AssetId | '' = '';
  for (const span of spans) {
    const fit = fitSpan(span.end - span.start);
    if (!fit) continue;
    const pieces: Piece[] = [
      ...Array.from({ length: fit.counts.long }, () => ({ length: LONG_PIECE, long: true })),
      ...Array.from({ length: fit.counts.short }, () => ({ length: SHORT_PIECE, long: false })),
    ];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j]!, pieces[i]!];
    }
    let offset = span.start;
    for (const piece of pieces) {
      const asset: AssetId = piece.long ? pickLong(kit, random, previous) : kit.short;
      previous = asset;
      const stretched = piece.length * fit.stretch;
      const mid = offset + stretched / 2;
      placements.push({
        asset,
        x: run.from.x + dir.x * mid,
        z: run.from.z + dir.z * mid,
        rotY: run.rotY,
        stretch: fit.stretch,
        collide: false,
      });
      offset += stretched;
    }
  }
  return placements;
}

function pickLong(kit: WallKit, random: () => number, previous: AssetId | ''): AssetId {
  const options = kit.long.filter((v) => v.asset !== previous);
  const total = options.reduce((sum, v) => sum + v.weight, 0);
  let roll = random() * total;
  for (const v of options) {
    roll -= v.weight;
    if (roll <= 0) return v.asset;
  }
  return options[options.length - 1]!.asset;
}
