import { ARCHANGELS } from '@/data/archangels';
import type { MapData, Placement, Point, Ribbon } from '@/data/maps/types';
import { assembleWallRun, type WallRun } from '@/data/maps/wall-runs';
import { mulberry32 } from '@/utils/random';

// +x east, +z south, camera looks toward -z. Rotated 180° from real north so the camera looks
// toward St. Basil's: from the museum end, the Kremlin wall is on the right and GUM on the left.
// Route: Red Square -> Resurrection Gate -> Manezhnaya Square -> Alexander Garden, which lies on
// the far side of the Kremlin (outside its west wall).
const HALF_PI = Math.PI / 2;

// The surface ends at z = 76; the Moscow underground lives in a distant region below z = 100 (see underground.ts; its layers are generated and
// swapped in at run time, so none of it is part of this map),
// with a solid block between so nothing on the surface can walk into it.
// The river Moskva lies north of the garden's end; Rosa reaches it by the garden path and can swim in it.
const BOUNDS = { minX: -28, maxX: 62, minZ: -64, maxZ: 200 };
/** The metro pavilion on Manezhnaya Square: the way down. Its mouth faces south, toward the camera. */
export const METRO = { x: 25, z: 65.5, rotY: 0, door: { x: 25, z: 69.4 } };

const GALLERY_X = -23.3;
const FACADE_X = -16.5;
const PORTALS_Z = [-18, 0, 18];
const PROMENADE_X = 53;

const range = (from: number, to: number, step: number): number[] => {
  const values: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) values.push(v);
  return values;
};

// The Kremlin's wall is assembled from a kit: each run is filled exactly between its towers, corners and the
// gate, with varied pieces (see wall-runs.ts). Tower half-widths are 2.2 x the tower's scale.
const CORNER_TOWER = { x: 16.2, z: 36 };
const KREMLIN_RUNS: WallRun[] = [
  {
    // West side along Red Square, from the far end down to the corner tower beside the Resurrection Gate.
    from: { x: 15, z: -36 },
    to: { x: 15, z: 36 },
    rotY: -HALF_PI,
    nodes: [
      { at: 7, half: 2.2 },
      { at: 34, half: 1.76 },
      { at: 65, half: 1.87 },
      { at: 72, half: 2.2 },
    ],
    seed: 101,
  },
  {
    // South side, along Manezhnaya Square, from the corner tower to the south-east tower.
    from: { x: CORNER_TOWER.x, z: CORNER_TOWER.z },
    to: { x: 44, z: 36 },
    rotY: 0,
    nodes: [
      { at: 0, half: 2.2 },
      { at: 27.8, half: 1.98 },
    ],
    seed: 202,
  },
  {
    // East side, along the Alexander Garden.
    from: { x: 44, z: 36 },
    to: { x: 44, z: -36 },
    rotY: HALF_PI,
    nodes: [
      { at: 0, half: 1.98 },
      { at: 8, half: 2.09 },
      { at: 46, half: 1.87 },
    ],
    seed: 303,
  },
];
const kremlinWalls: Placement[] = KREMLIN_RUNS.flatMap((run) => assembleWallRun(run));

// Structures outside the walkable bounds or inside blocked areas need no collision.
const skyline: Placement[] = [
  { asset: 'basil', x: -3, z: -37, collide: false },
  { asset: 'museum', x: -4.5, z: 36.5, rotY: Math.PI, scale: 1.15, collide: false },
  { asset: 'kazan', x: -17, z: 36, rotY: Math.PI, collide: false },
  { asset: 'resurrectionGate', x: 9, z: 33.5, rotY: Math.PI },
  ...kremlinWalls,
  { asset: 'kremlinInside', x: 27, z: -16, scale: 1.2, collide: false },
  { asset: 'kremlinInside', x: 28, z: 12, rotY: Math.PI, scale: 1.1, collide: false },
  { asset: 'kremlinTower', x: CORNER_TOWER.x, z: CORNER_TOWER.z, rotY: -HALF_PI },
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
  // The GUM side keeps clear of the portal axes (z = -18, 0, 18) so nothing stands in a doorway.
  ...[-24, -12, -6, 6, 12, 24].map((z) => ({ asset: 'lamppost' as const, x: -10, z })),
  ...[-24, -12, 0, 12, 24].map((z) => ({ asset: 'lamppost' as const, x: 9.8, z })),
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
  { asset: 'metroEntrance', x: METRO.x, z: METRO.z, rotY: METRO.rotY },
  { asset: 'bench', x: 25, z: 48, rotY: 0 },
  // Nothing stands on the axis of the Resurrection Gate (x = 9), so the west row starts further in.
  ...[50, 62, 72].map((z) => ({ asset: 'lamppost' as const, x: 9, z })),
  ...[42, 60, 72].map((z) => ({ asset: 'lamppost' as const, x: 41, z })),
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

// The hidden Pearl Shrine: a hedge nook in the north-east corner with a 1.6 m gap on its south side.
const SHRINE = { x: 59.4, z: -27.5 };
const shrineNook: Placement[] = [
  { asset: 'shrine', x: SHRINE.x, z: SHRINE.z },
  ...[-28.7, -26.7, -24.7].map((z) => ({ asset: 'hedge' as const, x: 56.5, z, rotY: HALF_PI })),
  // The nook's north side (the garden path now continues north to the river).
  ...[57.6, 59.4, 61.2].map((x) => ({ asset: 'hedge' as const, x, z: -30.2 })),
  { asset: 'hedge', x: 57.6, z: -23.5 },
  { asset: 'hedge', x: 61.2, z: -23.5 },
];

const alexanderGarden: Placement[] = [
  ...shrineNook,
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
  ...[-26, -14, -2, 10, -34, -40].map((z) => ({ asset: 'lamppost' as const, x: 51.2, z })),
  ...[-33, -38, -42].flatMap((z) => [
    { asset: 'linden' as const, x: 49, z },
    { asset: 'linden' as const, x: 57.5, z },
  ]),
  { asset: 'bench', x: 51.4, z: -37, rotY: HALF_PI },
  { asset: 'bench', x: 54.6, z: -41, rotY: -HALF_PI },
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
    if (x > -36 && x < 80 && z > -60 && z < 230) continue;
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
    { ribbon: moskva, edgeWidth: 16, swimRuns: [moskva.points] },
    {
      ribbon: { points: pondLine(21, 35), width: 3.4 },
      edgeWidth: 4.6,
      // The two ends of the pond; the middle is under the Trinity Bridge.
      swimRuns: [pondLine(21, 24.6), pondLine(31.4, 35)],
    },
  ],
  paths: [
    {
      points: [
        [PROMENADE_X, 38.4],
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
    // The garden path runs on north to the river bank.
    {
      points: [
        [PROMENADE_X, -28],
        [PROMENADE_X, -41],
      ],
      width: 3.2,
    },
  ],
  plazas: [
    { cx: -6.5, cz: -1, w: 41, d: 70 },
    { cx: 25, cz: 56.75, w: 40, d: 40.5 },
    // Paving through and around the Resurrection Gate, joining Red Square to Manezhnaya Square.
    { cx: 9.25, cz: 35.25, w: 8.5, d: 3.6 },
  ],
  lanes: [
    {
      // From Manezhnaya Square's east edge, then straight up to the garden gate; the paving runs right into it.
      // Straight, cell-aligned legs give clean kerbs on the 1 m paving grid (4 cells wide, centred on the gate).
      points: [
        [43, 49],
        [PROMENADE_X, 49],
        [PROMENADE_X, 38.4],
      ],
      width: 3.6,
    },
  ],
  npcs: [
    { id: 'grisha', x: 4.2, z: 11.5, rotY: Math.PI * 0.85 },
    { id: 'tolik', x: 19, z: 54, rotY: HALF_PI },
    { id: 'lyoha', x: 55.8, z: -9.2, rotY: -HALF_PI },
    { id: 'mikhalych', x: 2.6, z: 21.4, rotY: 0.35 },
    { id: 'boris', x: -11.5, z: -3.6, rotY: HALF_PI },
    { id: 'sergei', x: -3.4, z: 5.5, rotY: HALF_PI * 0.8 },
    { id: 'arkady', x: -20.8, z: 10.5, rotY: -HALF_PI },
    { id: 'kolya', x: 52.2, z: 6.5, rotY: HALF_PI },
  ],
  archangels: ARCHANGELS.map((a) => ({ id: a.id, ...a.spot })),
  enemies: [
    { id: 'tycoon-basil', kind: 'tycoon', x: -3, z: -26 },
    { id: 'speaker-basil', kind: 'speaker', x: 4, z: -21 },
    { id: 'tycoon-manezh', kind: 'tycoon', x: 14, z: 70 },
    { id: 'demagogue-manezh', kind: 'demagogue', x: 33, z: 63.5 },
    { id: 'speaker-manezh', kind: 'speaker', x: 36, z: 46 },
    { id: 'tycoon-garden-1', kind: 'tycoon', x: 52, z: -25 },
    { id: 'demagogue-garden', kind: 'demagogue', x: 53.5, z: -23.5 },
    { id: 'tycoon-garden-2', kind: 'tycoon', x: 52, z: 20 },
    { id: 'tycoon-garden-3', kind: 'tycoon', x: 60, z: 22.5 },
    { id: 'demagogue-garden-2', kind: 'demagogue', x: 60.5, z: 16.5 },
    { id: 'speaker-garden-1', kind: 'speaker', x: 50, z: -20 },
    { id: 'tycoon-garden-4', kind: 'tycoon', x: 49.5, z: -27.5 },
    { id: 'speaker-garden-2', kind: 'speaker', x: 55.5, z: 24 },
    { id: 'speaker-shrine', kind: 'speaker', x: 57.6, z: -21.2 },
    { id: 'demagogue-shrine', kind: 'demagogue', x: 60.6, z: -21 },
  ],
  entrances: [
    ...PORTALS_Z.map((z) => ({
      id: `gum-portal-${z}`,
      label: 'GUM',
      x: FACADE_X,
      z,
      axis: 'x' as const,
      width: 4.6,
      color: '#ffd58a',
    })),
    {
      id: 'resurrection-gate',
      label: 'Manezhnaya Square',
      x: 9,
      z: 33.5,
      axis: 'z',
      width: 4.4,
      color: '#ffb59a',
    },
    {
      id: 'garden-gate',
      label: 'Alexander Garden',
      x: PROMENADE_X,
      z: 40,
      axis: 'z',
      width: 3.1,
      color: '#9fffd0',
    },
  ],
  gatherables: [
    { id: 'rose-1', kind: 'roseHip', x: 50, z: -14 },
    { id: 'rose-2', kind: 'roseHip', x: 57, z: -13.2 },
    { id: 'rose-3', kind: 'roseHip', x: 49.6, z: 4.4 },
    { id: 'rose-4', kind: 'roseHip', x: 56.4, z: -2 },
    { id: 'rose-5', kind: 'roseHip', x: 57, z: 19.4 },
    { id: 'rose-6', kind: 'roseHip', x: 52.4, z: -24.5 },
    { id: 'mint-1', kind: 'moonMint', x: 48.2, z: -5.6 },
    { id: 'mint-2', kind: 'moonMint', x: 48.4, z: 8.8 },
    { id: 'mint-3', kind: 'moonMint', x: 50.6, z: 22.6 },
    { id: 'mint-4', kind: 'moonMint', x: 56, z: -19 },
    { id: 'mint-5', kind: 'moonMint', x: 60, z: -8 },
    { id: 'mint-6', kind: 'moonMint', x: 60.4, z: -1.4 },
    { id: 'pearl-1', kind: 'pearl', x: 57, z: 15.6 },
    { id: 'pearl-2', kind: 'pearl', x: 52.6, z: 13.6 },
    { id: 'pearl-3', kind: 'pearl', x: 61, z: -11 },
    { id: 'pearl-4', kind: 'pearl', x: 48.3, z: -27.5 },
    { id: 'pearl-5', kind: 'pearl', x: 61, z: 23.6 },
    // At the two ends of the pond, in the water.
    { id: 'pearl-6', kind: 'pearl', x: 48, z: 22.6 },
    { id: 'pearl-7', kind: 'pearl', x: 48, z: 33.4 },
  ],
  zones: [
    { id: 'pearl-shrine', label: 'Pearl Shrine', box: { cx: 59.3, cz: -27, hx: 2.7, hz: 3.2 } },
    { id: 'gum', label: 'GUM', box: { cx: GALLERY_X, cz: 0, hx: 4.6, hz: 27 } },
    { id: 'manezh', label: 'Manezhnaya Square', box: { cx: 25, cz: 56.75, hx: 20, hz: 20 } },
    {
      id: 'alexander-garden',
      label: 'Alexander Garden',
      box: { cx: 53.8, cz: 3, hx: 8.2, hz: 47 },
    },
    { id: 'moskva', label: 'Moskva River', box: { cx: 17, cz: -52, hx: 46, hz: 8.5 } },
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
    // Land north of Red Square and beyond the river: not part of the map (only the garden path leads to the water).
    { kind: 'box', cx: 9, cz: -38, hx: 37.5, hz: 8 },
    { kind: 'box', cx: 17, cz: -66, hx: 46, hz: 4 },
    // Solid ground between the surface and the underground region.
    { kind: 'box', cx: 17, cz: 88, hx: 46, hz: 12 },
  ],
};
