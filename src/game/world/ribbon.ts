import type { Point } from '@/data/maps/types';

export type RibbonMesh = { positions: number[]; indices: number[] };

/** Flat strip of `width` following a polyline, lying at height `y`, facing up. */
export function buildRibbon(points: readonly Point[], width: number, y: number): RibbonMesh {
  const positions: number[] = [];
  const indices: number[] = [];
  const half = width / 2;
  points.forEach((point, i) => {
    const prev = points[Math.max(0, i - 1)] ?? point;
    const next = points[Math.min(points.length - 1, i + 1)] ?? point;
    const dx = next[0] - prev[0];
    const dz = next[1] - prev[1];
    const len = Math.hypot(dx, dz) || 1;
    const px = dz / len;
    const pz = -dx / len;
    positions.push(
      point[0] + px * half,
      y,
      point[1] + pz * half,
      point[0] - px * half,
      y,
      point[1] - pz * half,
    );
    if (i < points.length - 1) {
      const l0 = i * 2;
      const r0 = l0 + 1;
      const l1 = l0 + 2;
      const r1 = l0 + 3;
      indices.push(l0, r0, l1, r0, r1, l1);
    }
  });
  return { positions, indices };
}

export function mergeRibbons(ribbons: readonly RibbonMesh[]): RibbonMesh {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const ribbon of ribbons) {
    const offset = positions.length / 3;
    positions.push(...ribbon.positions);
    indices.push(...ribbon.indices.map((i) => i + offset));
  }
  return { positions, indices };
}
