import type { MapData, Placement, Point } from '@/data/maps/types';
import { mulberry32 } from '@/utils/random';

const HALF_PI = Math.PI / 2;

const BOUNDS = { minX: -30, maxX: 30, minZ: -30, maxZ: 28 };

const fenceRun = (x: number, z: number, count: number, rotY: number): Placement[] =>
  Array.from({ length: count }, (_, i) => ({
    asset: 'fence' as const,
    x: rotY === 0 ? x + i * 2 : x,
    z: rotY === 0 ? z : z + i * 2,
    rotY,
  }));

const buildings: Placement[] = [
  { asset: 'izba', x: -11, z: -7 },
  { asset: 'izba', x: 10, z: -8 },
  { asset: 'izba', x: -17, z: 4, rotY: HALF_PI },
  { asset: 'izba', x: 17, z: 6, rotY: -HALF_PI },
  { asset: 'izba', x: -9, z: 15, rotY: Math.PI },
  { asset: 'izba', x: 9, z: 16, rotY: Math.PI },
  { asset: 'shop', x: 9.5, z: 2, rotY: -HALF_PI },
  { asset: 'shopHerbs', x: -9.5, z: 2.5, rotY: HALF_PI },
  { asset: 'hut', x: 0, z: 21, rotY: Math.PI },
  { asset: 'bridge', x: 0, z: -14 },
  { asset: 'gate', x: 0, z: -26 },
];

const props: Placement[] = [
  { asset: 'well', x: 0, z: 2 },
  { asset: 'questBoard', x: -5.5, z: -2 },
  { asset: 'barrel', x: 9.5, z: 4.6 },
  { asset: 'crate', x: 9.5, z: -0.6 },
  { asset: 'barrel', x: -9.5, z: 5.2 },
  { asset: 'crate', x: -9.5, z: 0 },
  { asset: 'crate', x: -9.3, z: -0.6 },
  { asset: 'logs', x: 14.3, z: -6.5 },
  { asset: 'logs', x: -15.6, z: -6 },
  { asset: 'lantern', x: 4.5, z: 7 },
  { asset: 'lantern', x: -4.5, z: 7 },
  { asset: 'lantern', x: 2.6, z: -10 },
  { asset: 'lantern', x: -2.6, z: -10 },
  { asset: 'lantern', x: 3.2, z: -24 },
  { asset: 'lantern', x: -3.2, z: -24 },
  ...fenceRun(-21, 9, 4, 0),
  ...fenceRun(14, 10.5, 3, 0),
  ...fenceRun(-15, -10.5, 3, 0),
  ...fenceRun(-4, 17, 2, HALF_PI),
  ...fenceRun(4, 17, 2, HALF_PI),
];

const interiorTrees: Placement[] = [
  [-8, -20, 'spruce'],
  [-14, -23, 'spruce'],
  [-21, -18, 'birch'],
  [9, -21, 'spruce'],
  [15, -24, 'birch'],
  [22, -19, 'spruce'],
  [-6, -28, 'spruce'],
  [7, -27, 'spruce'],
  [-25, -6, 'spruce'],
  [-23, 14, 'birch'],
  [24, -4, 'spruce'],
  [23, 16, 'spruce'],
  [-15, 22, 'spruce'],
  [14, 23, 'birch'],
  [-27, 22, 'spruce'],
  [27, 24, 'spruce'],
  [-26, -25, 'spruce'],
  [26, -26, 'spruce'],
  [-4, 26, 'spruce'],
  [5, 25, 'birch'],
].map(([x, z, asset], i) => ({
  asset: asset as 'spruce' | 'birch',
  x: x as number,
  z: z as number,
  scale: 0.95 + (i % 4) * 0.1,
}));

function forestRing(): Placement[] {
  const random = mulberry32(4);
  const trees: Placement[] = [];
  while (trees.length < 220) {
    const x = (random() * 2 - 1) * 46;
    const z = -46 + random() * 90;
    const insideWalkable = Math.abs(x) < 31.5 && z > -31.5 && z < 29.5;
    if (insideWalkable) continue;
    trees.push({
      asset: random() < 0.22 ? 'birch' : 'spruce',
      x,
      z,
      rotY: random() * Math.PI * 2,
      scale: 0.85 + random() * 0.6,
      collide: false,
    });
  }
  return trees;
}

const riverLeft: Point[] = [
  [-46, -13],
  [-30, -14.5],
  [-20, -13.2],
  [-10, -14.6],
  [-3.1, -14],
];
const riverRight: Point[] = [
  [3.1, -14],
  [10, -14.6],
  [20, -13.4],
  [30, -14.8],
  [46, -13.5],
];

export const VILLAGE: MapData = {
  id: 'village',
  bounds: BOUNDS,
  spawn: { x: 3, z: 13 },
  placements: [...buildings, ...props, ...interiorTrees, ...forestRing()],
  river: {
    ribbon: { points: [...riverLeft, ...riverRight], width: 4 },
    iceWidth: 5.2,
    colliderRuns: [riverLeft, riverRight],
  },
  paths: [
    {
      points: [
        [3, 13],
        [1, 9],
        [0, 5],
      ],
      width: 2.2,
    },
    {
      points: [
        [0, -1],
        [0, -11],
        [0, -17],
        [0, -25],
      ],
      width: 2.4,
    },
    {
      points: [
        [-4.5, 2.5],
        [-8, 2.5],
      ],
      width: 2,
    },
    {
      points: [
        [4.5, 2],
        [8, 2],
      ],
      width: 2,
    },
    {
      points: [
        [-4, -3],
        [-9, -5.5],
        [-11, -6],
      ],
      width: 1.8,
    },
    {
      points: [
        [4, -3],
        [9, -6],
        [10, -6.5],
      ],
      width: 1.8,
    },
    {
      points: [
        [0, 9],
        [0, 19.5],
      ],
      width: 2.2,
    },
  ],
  square: { x: 0, z: 2, r: 4.6 },
  zones: [
    { id: 'forest-entrance', label: 'Forest path', box: { cx: 0, cz: -28.6, hx: 2.2, hz: 1.5 } },
  ],
  colliders: [
    { kind: 'box', cx: -2.2, cz: -14, hx: 1.05, hz: 2.3 },
    { kind: 'box', cx: 2.2, cz: -14, hx: 1.05, hz: 2.3 },
  ],
};
