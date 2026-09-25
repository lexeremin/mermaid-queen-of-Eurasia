import { describe, expect, it } from 'vitest';
import { RED_SQUARE } from '@/data/maps/red-square';
import {
  EMBED,
  LONG_PIECE,
  MAX_STRETCH,
  MIN_STRETCH,
  SHORT_PIECE,
  assembleWallRun,
  fitSpan,
  type WallRun,
} from '@/data/maps/wall-runs';

const WALL_ASSETS = new Set(['kremlinWall', 'kremlinWallB', 'kremlinWallC', 'kremlinWallShort']);
const pieceLength = (asset: string) => (asset === 'kremlinWallShort' ? SHORT_PIECE : LONG_PIECE);

const run: WallRun = {
  from: { x: 0, z: 0 },
  to: { x: 0, z: 60 },
  rotY: 0,
  nodes: [
    { at: 8, half: 2 },
    { at: 40, half: 2.2 },
  ],
  seed: 5,
};

/** Distance along the run of a placed piece's start and end. */
const extent = (p: { x: number; z: number; asset: string; stretch?: number }) => {
  const len = pieceLength(p.asset) * (p.stretch ?? 1);
  return { start: p.z - len / 2, end: p.z + len / 2 };
};

describe('fitSpan', () => {
  it('covers any span of a metre or more with little stretching', () => {
    for (let span = 1; span <= 60; span += 0.37) {
      const fit = fitSpan(span);
      expect(fit, `span ${span}`).not.toBeNull();
      const total = fit!.counts.long * LONG_PIECE + fit!.counts.short * SHORT_PIECE;
      expect(total * fit!.stretch).toBeCloseTo(span, 6);
      expect(fit!.stretch).toBeGreaterThanOrEqual(MIN_STRETCH);
      expect(fit!.stretch).toBeLessThanOrEqual(MAX_STRETCH);
    }
  });

  it('skips spans too small to matter', () => {
    expect(fitSpan(0.5)).toBeNull();
  });

  it('prefers whole long pieces when they fit', () => {
    expect(fitSpan(24)).toEqual({ counts: { long: 4, short: 0 }, stretch: 1 });
  });
});

describe('assembleWallRun', () => {
  it('fills every span exactly: no gaps, and only a small embed into each tower', () => {
    const placed = assembleWallRun(run).sort((a, b) => a.z - b.z);
    const boxes = placed.map(extent);
    expect(boxes[0]!.start).toBeCloseTo(0, 6);
    expect(boxes[boxes.length - 1]!.end).toBeCloseTo(60, 6);
    const covered = (z: number) => boxes.some((b) => z >= b.start - 1e-6 && z <= b.end + 1e-6);
    for (let z = 0; z <= 60; z += 0.05) {
      const insideTower = (z > 6 && z < 10) || (z > 37.8 && z < 42.2);
      if (!insideTower) expect(covered(z), `gap at ${z}`).toBe(true);
    }
    for (const b of boxes) {
      expect(b.start).toBeGreaterThanOrEqual(-1e-6);
      expect(b.end).toBeLessThanOrEqual(60 + 1e-6);
      expect(
        b.end <= 8 - 2 + EMBED + 1e-6 ||
          b.start >= 8 + 2 - EMBED - 1e-6 ||
          (b.start >= 10 - EMBED - 1e-6 && b.end <= 37.8 + EMBED + 1e-6) ||
          b.start >= 42.2 - EMBED - 1e-6,
      ).toBe(true);
    }
  });

  it('never lays two pieces on top of each other', () => {
    const boxes = assembleWallRun(run)
      .map(extent)
      .sort((a, b) => a.start - b.start);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i]!.start).toBeGreaterThanOrEqual(boxes[i - 1]!.end - 1e-6);
    }
  });

  it('is deterministic for a seed and differs for another', () => {
    expect(assembleWallRun(run)).toEqual(assembleWallRun(run));
    const other = assembleWallRun({ ...run, seed: 6 })
      .map((p) => p.asset)
      .join();
    const same = assembleWallRun(run)
      .map((p) => p.asset)
      .join();
    expect(other).not.toBe(same);
  });

  it('never repeats the same long variant twice in a row and mixes the kit', () => {
    const placed = assembleWallRun({ ...run, to: { x: 0, z: 244 }, nodes: [], seed: 9 }).sort(
      (a, b) => a.z - b.z,
    );
    for (let i = 1; i < placed.length; i++) {
      if (placed[i]!.asset !== 'kremlinWallShort')
        expect(placed[i]!.asset).not.toBe(placed[i - 1]!.asset);
    }
    expect(
      new Set(placed.filter((p) => p.asset !== 'kremlinWallShort').map((p) => p.asset)).size,
    ).toBe(3);
  });

  it('keeps pieces on the run line with the requested rotation', () => {
    for (const p of assembleWallRun({ ...run, to: { x: 30, z: 0 }, nodes: [] })) {
      expect(p.z).toBe(0);
      expect(p.rotY).toBe(0);
      expect(p.collide).toBe(false);
    }
  });
});

describe('the Kremlin walls on the map', () => {
  const walls = RED_SQUARE.placements.filter((p) => WALL_ASSETS.has(p.asset));

  it('are all stretched by a modest amount', () => {
    expect(walls.length).toBeGreaterThan(20);
    for (const w of walls) {
      expect(w.stretch ?? 1).toBeGreaterThan(0.7);
      expect(w.stretch ?? 1).toBeLessThan(1.5);
    }
  });

  it('use every variant of the kit', () => {
    expect(new Set(walls.map((w) => w.asset)).size).toBe(4);
  });

  it('have a tower at the south-west corner beside the Resurrection Gate', () => {
    const corner = RED_SQUARE.placements.find(
      (p) => p.asset === 'kremlinTower' && p.z === 36 && p.x < 20,
    );
    expect(corner).toBeDefined();
  });
});
