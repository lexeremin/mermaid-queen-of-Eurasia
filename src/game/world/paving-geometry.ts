import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { Entrance } from '@/data/maps/types';
import {
  CELL,
  cellUv,
  isPaved,
  kerbEdges,
  type Grid,
  type KerbEdge,
} from '@/game/world/ground-grid';

export const KERB_WIDTH = 0.32;
export const KERB_HEIGHT = 0.09;

/** One flat, textured quad per paved cell, with the UVs chosen by the block variant. */
export function buildPaving(grid: Grid, y: number): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j < grid.rows; j++) {
    for (let i = 0; i < grid.cols; i++) {
      if (!isPaved(grid, i, j)) continue;
      const x0 = grid.minX + i * CELL;
      const z0 = grid.minZ + j * CELL;
      const [u0, v0, u1, v1] = cellUv(grid, i, j);
      const base = positions.length / 3;
      positions.push(x0, y, z0, x0 + CELL, y, z0, x0 + CELL, y, z0 + CELL, x0, y, z0 + CELL);
      for (let k = 0; k < 4; k++) normals.push(0, 1, 0);
      uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
      indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  return g;
}

type Face = { corners: number[][]; normal: [number, number, number] };

function boxFaces(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Face[] {
  return [
    {
      corners: [
        [x0, y1, z0],
        [x0, y1, z1],
        [x1, y1, z1],
        [x1, y1, z0],
      ],
      normal: [0, 1, 0],
    },
    {
      corners: [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y1, z0],
        [x0, y1, z0],
      ],
      normal: [0, 0, -1],
    },
    {
      corners: [
        [x1, y0, z1],
        [x0, y0, z1],
        [x0, y1, z1],
        [x1, y1, z1],
      ],
      normal: [0, 0, 1],
    },
    {
      corners: [
        [x0, y0, z1],
        [x0, y0, z0],
        [x0, y1, z0],
        [x0, y1, z1],
      ],
      normal: [-1, 0, 0],
    },
    {
      corners: [
        [x1, y0, z0],
        [x1, y0, z1],
        [x1, y1, z1],
        [x1, y1, z0],
      ],
      normal: [1, 0, 0],
    },
  ];
}

const kerbBox = (
  grid: Grid,
  e: KerbEdge,
  y: number,
): [number, number, number, number, number, number] => {
  const x0 = grid.minX + e.i * CELL;
  const z0 = grid.minZ + e.j * CELL;
  const w = KERB_WIDTH;
  switch (e.side) {
    case 'west':
      return [x0, y, z0, x0 + w, y + KERB_HEIGHT, z0 + CELL];
    case 'east':
      return [x0 + CELL - w, y, z0, x0 + CELL, y + KERB_HEIGHT, z0 + CELL];
    case 'north':
      return [x0, y, z0, x0 + CELL, y + KERB_HEIGHT, z0 + w];
    case 'south':
      return [x0, y, z0 + CELL - w, x0 + CELL, y + KERB_HEIGHT, z0 + CELL];
  }
};

/** A low stone kerb along every exposed edge of the paving (entrance mouths stay open). */
export function buildKerb(grid: Grid, y: number, openings: readonly Entrance[]): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (const edge of kerbEdges(grid, openings)) {
    for (const face of boxFaces(...kerbBox(grid, edge, y))) {
      const base = positions.length / 3;
      for (const c of face.corners) {
        positions.push(c[0]!, c[1]!, c[2]!);
        normals.push(...face.normal);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  g.setIndex(indices);
  return g;
}
