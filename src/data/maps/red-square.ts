import type { MapData, Placement } from '@/data/maps/types';
import { mulberry32 } from '@/utils/random';

// +x east, +z south, camera looks toward -z. Rotated 180° from real north so the camera looks
// toward St. Basil's: from the museum end, the Kremlin wall is on the right and GUM on the left.
const HALF_PI = Math.PI / 2;

const BOUNDS = { minX: -28, maxX: 13.2, minZ: -30, maxZ: 30 };

const GALLERY_X = -23.3;
const FACADE_X = -16.5;
const PORTALS_Z = [-18, 0, 18];

const range = (from: number, to: number, step: number): number[] => {
  const values: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) values.push(v);
  return values;
};

// Structures outside the walkable bounds need no collision.
const skyline: Placement[] = [
  { asset: 'basil', x: -3, z: -37, collide: false },
  { asset: 'museum', x: -4.5, z: 36.5, rotY: Math.PI, scale: 1.15, collide: false },
  { asset: 'kazan', x: -17, z: 36, rotY: Math.PI, collide: false },
  { asset: 'resurrectionGate', x: 9, z: 33.5, rotY: Math.PI, collide: false },
  ...range(-33, 39, 6).map((z) => ({
    asset: 'kremlinWall' as const,
    x: 15,
    z,
    rotY: -HALF_PI,
    collide: false,
  })),
  { asset: 'kremlinInside', x: 27, z: -16, scale: 1.2, collide: false },
  { asset: 'kremlinInside', x: 28, z: 12, rotY: Math.PI, scale: 1.1, collide: false },
];

const kremlinTowers: Placement[] = [
  { asset: 'kremlinTower', x: 15, z: -29, rotY: -HALF_PI },
  { asset: 'kremlinTower', x: 15, z: -2, rotY: -HALF_PI, scale: 0.8 },
  { asset: 'kremlinTower', x: 15, z: 29, rotY: -HALF_PI, scale: 0.85 },
];

const gum: Placement[] = [
  ...PORTALS_Z.map((z) => ({ asset: 'gumFacade' as const, x: FACADE_X, z, rotY: HALF_PI })),
  { asset: 'gumTurret', x: FACADE_X, z: -28.5, rotY: HALF_PI },
  { asset: 'gumTurret', x: FACADE_X, z: 28.5, rotY: HALF_PI },
  ...PORTALS_Z.map((z) => ({ asset: 'gumWall' as const, x: -28.4, z, rotY: HALF_PI })),
  { asset: 'gumWall', x: GALLERY_X, z: -27.9, scale: 0.5 },
  { asset: 'gumWall', x: GALLERY_X, z: 27.9, rotY: Math.PI, scale: 0.5 },
  ...range(-24, 24, 6).map((z) => ({
    asset: 'gumRibs' as const,
    x: GALLERY_X,
    z,
    rotY: HALF_PI,
    collide: false,
  })),
  { asset: 'gumBridge', x: GALLERY_X, z: -11, rotY: HALF_PI, collide: false },
  { asset: 'gumBridge', x: GALLERY_X, z: 11, rotY: HALF_PI, collide: false },
  { asset: 'fountain', x: GALLERY_X, z: 0 },
  ...[-16, -8, 8, 16].map((z) => ({ asset: 'kiosk' as const, x: GALLERY_X, z })),
  ...[-13, -5, 5, 13].map((z) => ({ asset: 'bench' as const, x: -19.9, z, rotY: -HALF_PI })),
  { asset: 'flowerbed', x: -26.4, z: -13, rotY: HALF_PI },
  { asset: 'flowerbed', x: -26.4, z: 13, rotY: HALF_PI },
];

const plaza: Placement[] = [
  { asset: 'hut', x: -9, z: 25, rotY: Math.PI },
  ...[-14, -6, 2, 10].map((z, i) => ({
    asset: i % 2 ? ('shopHerbs' as const) : ('shop' as const),
    x: 6.5,
    z,
    rotY: -HALF_PI,
  })),
  ...[-13.5, -6, 6, 13.5].map((z, i) => ({
    asset: i % 2 ? ('shop' as const) : ('shopHerbs' as const),
    x: -6.5,
    z,
    rotY: HALF_PI,
  })),
  { asset: 'questBoard', x: -3, z: 18 },
  { asset: 'barrel', x: 6.5, z: -9.6 },
  { asset: 'crate', x: 6.5, z: -1.6 },
  { asset: 'barrel', x: 6.5, z: 6 },
  { asset: 'crate', x: -6.5, z: -9.6 },
  { asset: 'barrel', x: -6.5, z: 0 },
  { asset: 'crate', x: -6.5, z: 9.6 },
  ...[-24, -12, 0, 12, 24].flatMap((z) => [
    { asset: 'lamppost' as const, x: -10, z },
    { asset: 'lamppost' as const, x: 9.8, z },
  ]),
  { asset: 'firTub', x: -9, z: -26 },
  { asset: 'firTub', x: 9, z: -26 },
  ...[-24, -8, 8].map((z) => ({ asset: 'flowerbed' as const, x: 0, z })),
  ...[12, -8, 0, 8, -14, 18, 24].map((z) => ({ asset: 'spruce' as const, x: 12, z })),
  { asset: 'bench', x: 12.3, z: -12, rotY: -HALF_PI },
  { asset: 'bench', x: 12.3, z: -4, rotY: -HALF_PI },
  { asset: 'bench', x: 12.3, z: 14, rotY: -HALF_PI },
];

const pickTree = (roll: number): 'linden' | 'birch' | 'spruce' =>
  roll < 0.45 ? 'linden' : roll < 0.7 ? 'birch' : 'spruce';

function surroundingTrees(): Placement[] {
  const random = mulberry32(11);
  const trees: Placement[] = [];
  while (trees.length < 170) {
    const x = (random() * 2 - 1) * 90;
    const z = (random() * 2 - 1) * 90;
    if (x > -36 && x < 48 && z > -60 && z < 46) continue;
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

const GALLERY_FLOOR = '#a89f8f';

export const RED_SQUARE: MapData = {
  id: 'red-square',
  bounds: BOUNDS,
  spawn: { x: 0, z: 24 },
  placements: [...skyline, ...kremlinTowers, ...gum, ...plaza, ...surroundingTrees()],
  river: {
    ribbon: {
      points: [
        [-90, -54],
        [-30, -50],
        [30, -53],
        [90, -50],
      ],
      width: 14,
    },
    iceWidth: 16,
    colliderRuns: [],
  },
  paths: [],
  plaza: { cx: -6.5, cz: -1, w: 40, d: 70 },
  zones: [{ id: 'gum', label: 'GUM', box: { cx: GALLERY_X, cz: 0, hx: 4.6, hz: 27 } }],
  floors: [
    { cx: GALLERY_X, cz: 0, w: 9, d: 55, color: GALLERY_FLOOR, y: 0.04 },
    ...PORTALS_Z.map((z) => ({ cx: FACADE_X, cz: z, w: 5, d: 4.6, color: GALLERY_FLOOR, y: 0.04 })),
  ],
  glass: [{ cx: GALLERY_X, cz: 0, w: 9.4, d: 55, y: 10.9 }],
  lights: [
    { x: GALLERY_X, y: 6.5, z: -12, color: '#ffd9a8', intensity: 60, distance: 24 },
    { x: GALLERY_X, y: 6.5, z: 12, color: '#ffd9a8', intensity: 60, distance: 24 },
  ],
  colliders: [
    { kind: 'box', cx: GALLERY_X, cz: -28.6, hx: 4.7, hz: 1.7 },
    { kind: 'box', cx: GALLERY_X, cz: 28.6, hx: 4.7, hz: 1.7 },
  ],
};
