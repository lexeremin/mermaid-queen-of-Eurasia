import type { MapData, Placement, Point, Ribbon } from '@/data/maps/types';
import { mulberry32 } from '@/utils/random';

// +x east, +z south, camera looks toward -z. Rotated 180° from real north so the camera looks
// toward St. Basil's: from the museum end, the Kremlin wall is on the right and GUM on the left.
// Route: Red Square -> Resurrection Gate -> Manezhnaya Square -> Alexander Garden, which lies on
// the far side of the Kremlin (outside its west wall).
const HALF_PI = Math.PI / 2;

const BOUNDS = { minX: -28, maxX: 62, minZ: -30, maxZ: 76 };

const GALLERY_X = -23.3;
const FACADE_X = -16.5;
const PORTALS_Z = [-18, 0, 18];
const PROMENADE_X = 53;

const range = (from: number, to: number, step: number): number[] => {
  const values: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) values.push(v);
  return values;
};

// Structures outside the walkable bounds or inside blocked areas need no collision.
const skyline: Placement[] = [
  { asset: 'basil', x: -3, z: -37, collide: false },
  { asset: 'museum', x: -4.5, z: 36.5, rotY: Math.PI, scale: 1.15, collide: false },
  { asset: 'kazan', x: -17, z: 36, rotY: Math.PI, collide: false },
  { asset: 'resurrectionGate', x: 9, z: 33.5, rotY: Math.PI },
  ...range(-33, 33, 6).map((z) => ({
    asset: 'kremlinWall' as const,
    x: 15,
    z,
    rotY: -HALF_PI,
    collide: false,
  })),
  ...range(18, 42, 6).map((x) => ({
    asset: 'kremlinWall' as const,
    x,
    z: 36,
    collide: false,
  })),
  ...range(-33, 33, 6).map((z) => ({
    asset: 'kremlinWall' as const,
    x: 44,
    z,
    rotY: HALF_PI,
    collide: false,
  })),
  { asset: 'kremlinInside', x: 27, z: -16, scale: 1.2, collide: false },
  { asset: 'kremlinInside', x: 28, z: 12, rotY: Math.PI, scale: 1.1, collide: false },
  { asset: 'kremlinTower', x: 44, z: 36, scale: 0.9 },
  { asset: 'kremlinTower', x: 44, z: 28, rotY: HALF_PI, scale: 0.95 },
  { asset: 'kremlinTower', x: 44, z: -10, rotY: HALF_PI, scale: 0.85 },
  { asset: 'manege', x: 72, z: 54, rotY: -HALF_PI, collide: false },
  { asset: 'gumFacade', x: 20, z: 84, rotY: Math.PI, collide: false },
  { asset: 'gumFacade', x: 38, z: 84, rotY: Math.PI, collide: false },
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

const redSquare: Placement[] = [
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

const manezhnaya: Placement[] = [
  { asset: 'fountain', x: 25, z: 56, scale: 1.4 },
  { asset: 'bench', x: 17, z: 56, rotY: HALF_PI },
  { asset: 'bench', x: 33, z: 56, rotY: -HALF_PI },
  { asset: 'bench', x: 25, z: 64, rotY: Math.PI },
  { asset: 'bench', x: 25, z: 48, rotY: 0 },
  ...[42, 60, 72].flatMap((z) => [
    { asset: 'lamppost' as const, x: 9, z },
    { asset: 'lamppost' as const, x: 41, z },
  ]),
  { asset: 'lamppost', x: 25, z: 42 },
  { asset: 'lamppost', x: 25, z: 72 },
  ...[
    [18, 45],
    [32, 45],
    [18, 68],
    [32, 68],
  ].map(([x, z]) => ({ asset: 'flowerbed' as const, x: x as number, z: z as number })),
  { asset: 'shop', x: 12.5, z: 52, rotY: HALF_PI },
  { asset: 'shopHerbs', x: 12.5, z: 60, rotY: HALF_PI },
  { asset: 'shop', x: 37.5, z: 52, rotY: -HALF_PI },
  { asset: 'shopHerbs', x: 37.5, z: 60, rotY: -HALF_PI },
  ...range(8, 44, 6).map((x) => ({ asset: 'linden' as const, x, z: 74.5 })),
  { asset: 'firTub', x: 7, z: 40 },
  { asset: 'firTub', x: 43, z: 40 },
];

const alexanderGarden: Placement[] = [
  { asset: 'gardenGate', x: PROMENADE_X, z: 40 },
  { asset: 'firTub', x: 49.8, z: 41.5 },
  { asset: 'firTub', x: 56.2, z: 41.5 },
  { asset: 'archBridge', x: 48, z: 28, rotY: HALF_PI },
  { asset: 'kutafya', x: 57.5, z: 28, rotY: -HALF_PI },
  { asset: 'grotto', x: 59.5, z: 8, rotY: -HALF_PI },
  { asset: 'obelisk', x: 49.5, z: 13 },
  ...range(-24, 16, 2).map((z) => ({ asset: 'hedge' as const, x: 46.8, z, rotY: HALF_PI })),
  ...[-24, -18, -12, -6, 0, 18].flatMap((z) => [
    { asset: 'linden' as const, x: 50, z },
    { asset: 'linden' as const, x: 56, z },
  ]),
  ...[-22, -10, 2].map((z) => ({ asset: 'spruce' as const, x: 47.8, z })),
  ...[-20, -8, 4, 16].flatMap((z) => [
    { asset: 'bench' as const, x: 51.3, z, rotY: HALF_PI },
    { asset: 'bench' as const, x: 54.7, z: z + 2, rotY: -HALF_PI },
  ]),
  ...[-26, -14, -2, 10].map((z) => ({ asset: 'lamppost' as const, x: 51.2, z })),
  ...[-20, -8, 4, 20].map((z) => ({ asset: 'lamppost' as const, x: 54.8, z })),
  { asset: 'flowerbed', x: 48.6, z: -15, rotY: HALF_PI },
  { asset: 'flowerbed', x: 58, z: -15, rotY: HALF_PI },
  { asset: 'flowerbed', x: 48.6, z: 3, rotY: HALF_PI },
  { asset: 'flowerbed', x: 58, z: -3, rotY: HALF_PI },
  { asset: 'flowerbed', x: 58.6, z: 20, rotY: HALF_PI },
];

const pickTree = (roll: number): 'linden' | 'birch' | 'spruce' =>
  roll < 0.45 ? 'linden' : roll < 0.7 ? 'birch' : 'spruce';

function surroundingTrees(): Placement[] {
  const random = mulberry32(11);
  const trees: Placement[] = [];
  while (trees.length < 200) {
    const x = (random() * 2 - 1) * 110;
    const z = (random() * 2 - 1) * 110;
    if (x > -36 && x < 80 && z > -60 && z < 92) continue;
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

const moskva: Ribbon = {
  points: [
    [-110, -54],
    [-30, -50],
    [30, -53],
    [110, -50],
  ],
  width: 14,
};
const pondLine = (z0: number, z1: number): Point[] => [
  [48, z0],
  [48, z1],
];

export const RED_SQUARE: MapData = {
  id: 'red-square',
  bounds: BOUNDS,
  spawn: { x: 0, z: 24 },
  placements: [
    ...skyline,
    ...kremlinTowers,
    ...gum,
    ...redSquare,
    ...manezhnaya,
    ...alexanderGarden,
    ...surroundingTrees(),
  ],
  waters: [
    { ribbon: moskva, edgeWidth: 16, colliderRuns: [] },
    {
      ribbon: { points: pondLine(21, 35), width: 3.4 },
      edgeWidth: 4.6,
      colliderRuns: [pondLine(21, 24.6), pondLine(31.4, 35)],
    },
  ],
  paths: [
    {
      points: [
        [PROMENADE_X, 42],
        [PROMENADE_X, 22],
        [PROMENADE_X, -28],
      ],
      width: 3.2,
    },
    {
      points: [
        [PROMENADE_X, 8],
        [57.6, 8],
      ],
      width: 2.4,
    },
    {
      points: [
        [36, 50],
        [46, 46],
        [PROMENADE_X, 43],
      ],
      width: 3,
    },
  ],
  plazas: [
    { cx: -6.5, cz: -1, w: 40, d: 70 },
    { cx: 25, cz: 56.75, w: 40, d: 40.5 },
  ],
  npcs: [
    { id: 'grisha', x: 7.7, z: 27.6, rotY: Math.PI },
    { id: 'tolik', x: 19, z: 54, rotY: HALF_PI },
    { id: 'lyoha', x: 55.8, z: -9.2, rotY: -HALF_PI },
    { id: 'mikhalych', x: 8.9, z: 4.8, rotY: -HALF_PI },
    { id: 'boris', x: -11.5, z: -3.6, rotY: HALF_PI },
    { id: 'sergei', x: 3.2, z: 18.6, rotY: 0 },
    { id: 'arkady', x: -20.8, z: 10.5, rotY: -HALF_PI },
    { id: 'kolya', x: 52.2, z: 6.5, rotY: HALF_PI },
  ],
  zones: [
    { id: 'gum', label: 'GUM', box: { cx: GALLERY_X, cz: 0, hx: 4.6, hz: 27 } },
    { id: 'manezh', label: 'Manezhnaya Square', box: { cx: 25, cz: 56.75, hx: 20, hz: 20 } },
    {
      id: 'alexander-garden',
      label: 'Alexander Garden',
      box: { cx: 53.8, cz: 10, hx: 8.2, hz: 40 },
    },
  ],
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
    // The Kremlin (walls, interior) between Red Square and the garden.
    { kind: 'box', cx: 29.3, cz: 3.65, hx: 16.1, hz: 33.65 },
    // Museum, Kazan Cathedral and everything behind them.
    { kind: 'box', cx: -12, cz: 53, hx: 16.5, hz: 23 },
  ],
};
