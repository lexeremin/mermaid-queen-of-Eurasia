import { describe, expect, it } from 'vitest';
import type { Entrance } from '@/data/maps/types';
import {
  BLOCK,
  VARIANTS,
  blockVariant,
  cellUv,
  isPaved,
  kerbEdges,
  rasterize,
} from '@/game/world/ground-grid';

const bounds = { minX: 0, maxX: 20, minZ: 0, maxZ: 20 };

describe('rasterize', () => {
  it('paves the cells of a rectangle and nothing else', () => {
    const grid = rasterize(bounds, [{ cx: 10, cz: 10, w: 6, d: 4 }], []);
    let paved = 0;
    for (const v of grid.paved) paved += v;
    expect(paved).toBe(24);
    expect(isPaved(grid, 10, 10)).toBe(true);
    expect(isPaved(grid, 4, 10)).toBe(false);
    expect(isPaved(grid, 16, 10)).toBe(false);
  });

  it('joins overlapping rectangles into one paved area', () => {
    const grid = rasterize(
      bounds,
      [
        { cx: 5, cz: 5, w: 6, d: 6 },
        { cx: 10, cz: 5, w: 6, d: 6 },
      ],
      [],
    );
    for (let i = 2; i < 13; i++) expect(isPaved(grid, i, 5), `cell ${i}`).toBe(true);
  });

  it('lays a lane along its centre line with the requested width, connecting two areas', () => {
    const grid = rasterize(
      bounds,
      [
        { cx: 3, cz: 3, w: 4, d: 4 },
        { cx: 17, cz: 3, w: 4, d: 4 },
      ],
      [
        {
          points: [
            [3, 3],
            [17, 3],
          ],
          width: 3,
        },
      ],
    );
    for (let i = 3; i < 17; i++) {
      for (const j of [2, 3, 4]) expect(isPaved(grid, i, j), `lane cell ${i},${j}`).toBe(true);
    }
    for (const i of [8, 10, 12]) {
      expect(isPaved(grid, i, 0)).toBe(false);
      expect(isPaved(grid, i, 7)).toBe(false);
    }
  });

  it('treats out-of-range cells as lawn', () => {
    const grid = rasterize(bounds, [{ cx: 10, cz: 10, w: 40, d: 40 }], []);
    expect(isPaved(grid, -1, 0)).toBe(false);
    expect(isPaved(grid, 0, 99)).toBe(false);
  });
});

describe('kerbEdges', () => {
  const grid = rasterize(bounds, [{ cx: 10, cz: 10, w: 4, d: 4 }], []);

  it('runs along the whole boundary of a paved block and nowhere else', () => {
    const edges = kerbEdges(grid);
    expect(edges).toHaveLength(16);
    for (const e of edges) expect(isPaved(grid, e.i, e.j)).toBe(true);
  });

  it('has no kerb between two paved cells, so joined areas are seamless', () => {
    const joined = rasterize(
      bounds,
      [
        { cx: 6, cz: 10, w: 4, d: 4 },
        { cx: 10, cz: 10, w: 4, d: 4 },
      ],
      [],
    );
    const edges = kerbEdges(joined);
    expect(edges).toHaveLength(24);
    expect(edges.some((e) => e.i === 7 && e.side === 'east')).toBe(false);
  });

  it('leaves the mouth of a gate open', () => {
    const lane = rasterize(
      bounds,
      [{ cx: 10, cz: 5, w: 12, d: 6 }],
      [
        {
          points: [
            [10, 8],
            [10, 16],
          ],
          width: 3,
        },
      ],
    );
    const gate: Entrance = {
      id: 'g',
      label: 'g',
      x: 10,
      z: 16,
      axis: 'z',
      width: 3.1,
      color: '#fff',
    };
    const closed = kerbEdges(lane).filter((e) => e.side === 'south' && e.j === 15);
    const open = kerbEdges(lane, [gate]).filter((e) => e.side === 'south' && e.j === 15);
    expect(closed.length).toBeGreaterThan(0);
    expect(open).toHaveLength(0);
  });
});

describe('paving variants', () => {
  const grid = rasterize({ minX: -40, maxX: 40, minZ: -40, maxZ: 40 }, [], []);

  it('are the same for every cell of a 4 x 4 block and differ between blocks', () => {
    const a = blockVariant(grid, 40, 40);
    for (let di = 0; di < BLOCK; di++)
      for (let dj = 0; dj < BLOCK; dj++) {
        expect(blockVariant(grid, 40 + di, 40 + dj)).toEqual(a);
      }
    const seen = new Set<string>();
    for (let bi = 0; bi < 12; bi++)
      for (let bj = 0; bj < 12; bj++) {
        const v = blockVariant(grid, bi * BLOCK, bj * BLOCK);
        seen.add(`${v.index}${v.flipX ? 'x' : ''}${v.flipZ ? 'z' : ''}`);
      }
    expect(seen.size).toBeGreaterThanOrEqual(VARIANTS * 2);
  });

  it('are deterministic', () => {
    expect(blockVariant(grid, 13, 27)).toEqual(blockVariant(grid, 13, 27));
    expect(cellUv(grid, 13, 27)).toEqual(cellUv(grid, 13, 27));
  });

  it('never repeat one variant for a long straight run of blocks', () => {
    let longest = 1;
    let run = 1;
    for (let b = 1; b < 60; b++) {
      const prev = blockVariant(grid, (b - 1) * BLOCK, 0);
      const cur = blockVariant(grid, b * BLOCK, 0);
      run = prev.index === cur.index && prev.flipX === cur.flipX ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    expect(longest).toBeLessThanOrEqual(8);
  });

  it('maps cells into the atlas, one unique texel patch per cell of a block', () => {
    const patches = new Set<string>();
    for (let a = 0; a < BLOCK; a++)
      for (let b = 0; b < BLOCK; b++) {
        const uv = cellUv(grid, 40 + a, 40 + b);
        for (const c of uv) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(1);
        }
        patches.add(uv.map((c) => c.toFixed(4)).join());
      }
    expect(patches.size).toBe(BLOCK * BLOCK);
  });
});
