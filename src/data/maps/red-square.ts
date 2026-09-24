import type { MapData, Placement, Point } from '@/data/maps/types';
import { mulberry32 } from '@/utils/random';

const HALF_PI = Math.PI / 2;

const BOUNDS = { minX: -16.5, maxX: 16.5, minZ: -24, maxZ: 28 };

const range = (from: number, to: number, step: number): number[] => {
  const values: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) values.push(v);
  return values;
};

// Everything below sits outside the walkable bounds, so it needs no collision.
const backdrop: Placement[] = [
  { asset: 'basil', x: 0, z: -31.5, collide: false },
  { asset: 'museum', x: 0, z: 33.5, rotY: Math.PI, collide: false },
  ...range(-30, 36, 6).map((z) => ({
    asset: 'kremlinWall' as const,
    x: -19,
    z,
    rotY: HALF_PI,
    collide: false,
  })),
  { asset: 'kremlinTower', x: -19, z: -4, rotY: HALF_PI, collide: false },
  { asset: 'kremlinTower', x: -19, z: -26, rotY: HALF_PI, scale: 0.7, collide: false },
  { asset: 'kremlinTower', x: -19, z: 26, rotY: HALF_PI, scale: 0.7, collide: false },
  ...range(-28, 28, 8).map((z) => ({
    asset: 'gum' as const,
    x: 21,
    z,
    rotY: -HALF_PI,
    collide: false,
  })),
];

const plaza: Placement[] = [
  { asset: 'archBridge', x: 0, z: -11 },
  { asset: 'gardenGate', x: -14.5, z: 14, rotY: HALF_PI },
  { asset: 'hut', x: -11, z: 23, rotY: HALF_PI },
  { asset: 'shop', x: 13, z: -4, rotY: -HALF_PI },
  { asset: 'shopHerbs', x: 13, z: 3, rotY: -HALF_PI },
  { asset: 'shop', x: 13, z: 10, rotY: -HALF_PI },
  { asset: 'shopHerbs', x: 13, z: 17, rotY: -HALF_PI },
  { asset: 'shopHerbs', x: -13, z: -4, rotY: HALF_PI },
  { asset: 'shop', x: -13, z: 3, rotY: HALF_PI },
  { asset: 'shopHerbs', x: -13, z: 8, rotY: HALF_PI },
  { asset: 'questBoard', x: 9, z: 18 },
  { asset: 'barrel', x: 13, z: -6.6 },
  { asset: 'crate', x: 13, z: 0 },
  { asset: 'barrel', x: 13, z: 6.6 },
  { asset: 'crate', x: 13.1, z: 13.6 },
  { asset: 'barrel', x: 13, z: 20 },
  { asset: 'crate', x: -13, z: -6.6 },
  { asset: 'barrel', x: -13, z: 0 },
  { asset: 'crate', x: -13, z: 5.6 },
  ...[-20, -4, 12].flatMap((z) => [
    { asset: 'lamppost' as const, x: -8, z },
    { asset: 'lamppost' as const, x: 8, z },
  ]),
  ...[-6.4, -15.6].flatMap((z) => [
    { asset: 'lamppost' as const, x: -3.4, z },
    { asset: 'lamppost' as const, x: 3.4, z },
  ]),
  { asset: 'lamppost', x: -8, z: 25 },
  { asset: 'lamppost', x: 8, z: 25 },
  { asset: 'firTub', x: -7, z: -22 },
  { asset: 'firTub', x: 7, z: -22 },
  { asset: 'firTub', x: -14.5, z: -16 },
  { asset: 'firTub', x: 14.5, z: -16 },
  { asset: 'firTub', x: -5, z: 26 },
  { asset: 'firTub', x: 5, z: 26 },
  { asset: 'firTub', x: 15, z: 24 },
  { asset: 'flowerbed', x: -6, z: -19 },
  { asset: 'flowerbed', x: 6, z: -19 },
  { asset: 'flowerbed', x: -6, z: 23 },
  { asset: 'flowerbed', x: 6, z: 23 },
];

const pickTree = (roll: number): 'linden' | 'birch' | 'spruce' =>
  roll < 0.45 ? 'linden' : roll < 0.7 ? 'birch' : 'spruce';

function forestBeyondTheWalls(): Placement[] {
  const random = mulberry32(11);
  const trees: Placement[] = [];
  while (trees.length < 170) {
    const x = (random() * 2 - 1) * 70;
    const z = (random() * 2 - 1) * 70;
    if (x > -24 && x < 26 && z > -40 && z < 37) continue;
    trees.push({
      asset: pickTree(random()),
      x,
      z,
      rotY: random() * Math.PI * 2,
      scale: 0.9 + random() * 0.8,
      collide: false,
    });
  }
  return trees;
}

const canalWest: Point[] = [
  [-19, -11],
  [-11, -11.7],
  [-4.1, -11],
];
const canalEast: Point[] = [
  [4.1, -11],
  [11, -10.4],
  [19, -11],
];

export const RED_SQUARE: MapData = {
  id: 'red-square',
  bounds: BOUNDS,
  spawn: { x: 0, z: 20 },
  placements: [...backdrop, ...plaza, ...forestBeyondTheWalls()],
  river: {
    ribbon: { points: [...canalWest, ...canalEast], width: 4 },
    iceWidth: 5.2,
    colliderRuns: [canalWest, canalEast],
  },
  paths: [],
  plaza: { cx: 0.25, cz: 3.5, w: 36.5, d: 61 },
  zones: [
    {
      id: 'garden-entrance',
      label: 'Alexander Garden',
      box: { cx: -15.6, cz: 14, hx: 0.9, hz: 2 },
    },
  ],
  colliders: [
    { kind: 'box', cx: -3.15, cz: -11, hx: 0.95, hz: 2.3 },
    { kind: 'box', cx: 3.15, cz: -11, hx: 0.95, hz: 2.3 },
  ],
};
