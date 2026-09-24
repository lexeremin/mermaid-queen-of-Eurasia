import { describe, expect, it } from 'vitest';
import { buildRibbon, mergeRibbons } from '@/game/world/ribbon';

function upwardFacing(mesh: { positions: number[]; indices: number[] }): boolean {
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const v = (n: number) => {
      const i = (mesh.indices[t + n] ?? 0) * 3;
      return [
        mesh.positions[i] ?? 0,
        mesh.positions[i + 1] ?? 0,
        mesh.positions[i + 2] ?? 0,
      ] as const;
    };
    const [a, b, c] = [v(0), v(1), v(2)];
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
    const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]] as const;
    const normalY = e1[2] * e2[0] - e1[0] * e2[2];
    if (normalY <= 0) return false;
  }
  return true;
}

describe('buildRibbon', () => {
  const points = [
    [0, 0],
    [4, 0],
    [8, 2],
  ] as const;

  it('makes two vertices per point and two triangles per segment', () => {
    const mesh = buildRibbon(points, 2, 0.03);
    expect(mesh.positions).toHaveLength(points.length * 2 * 3);
    expect(mesh.indices).toHaveLength((points.length - 1) * 6);
  });

  it('is `width` wide, at height y, and faces up', () => {
    const mesh = buildRibbon(points, 2, 0.03);
    const width = Math.hypot(
      (mesh.positions[0] ?? 0) - (mesh.positions[3] ?? 0),
      (mesh.positions[2] ?? 0) - (mesh.positions[5] ?? 0),
    );
    expect(width).toBeCloseTo(2);
    for (let i = 1; i < mesh.positions.length; i += 3) expect(mesh.positions[i]).toBe(0.03);
    expect(upwardFacing(mesh)).toBe(true);
  });

  it('still faces up when the line runs in other directions', () => {
    const mesh = buildRibbon(
      [
        [0, 0],
        [0, -6],
        [-3, -9],
      ],
      1.5,
      0,
    );
    expect(upwardFacing(mesh)).toBe(true);
  });

  it('merges ribbons with correct index offsets', () => {
    const a = buildRibbon(
      [
        [0, 0],
        [1, 0],
      ],
      1,
      0,
    );
    const b = buildRibbon(
      [
        [5, 5],
        [6, 5],
      ],
      1,
      0,
    );
    const merged = mergeRibbons([a, b]);
    expect(merged.positions).toHaveLength(a.positions.length + b.positions.length);
    expect(Math.min(...merged.indices.slice(a.indices.length))).toBe(4);
  });
});
