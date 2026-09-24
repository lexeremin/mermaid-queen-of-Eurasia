import type { Shape } from '@/data/types';

export const ATLAS_URL = '/assets/atlas/palette_atlas.png';
export const COBBLE_URL = '/assets/atlas/cobble_tile.png';
export const GRASS_URL = '/assets/atlas/grass_tile.png';

type AssetDef = {
  url: string;
  clips: readonly string[];
  /** Collision footprint in asset-local coordinates (rotation 0, scale 1). */
  footprint?: readonly Shape[];
};

const box = (hx: number, hz: number, x = 0, z = 0): Shape => ({ kind: 'box', x, z, hx, hz });
const circle = (r: number, x = 0, z = 0): Shape => ({ kind: 'circle', x, z, r });

export const ASSETS = {
  rosa: { url: '/assets/char/char_rosa.glb', clips: ['idle', 'walk'] },
  rosaMermaid: { url: '/assets/char/char_rosa_mermaid.glb', clips: ['idle', 'walk'] },
  basil: { url: '/assets/lmk/lmk_basil.glb', clips: [], footprint: [box(6.7, 5.2)] },
  kremlinWall: { url: '/assets/bld/bld_kremlin_wall.glb', clips: [], footprint: [box(3.0, 1.2)] },
  kremlinTower: { url: '/assets/bld/bld_kremlin_tower.glb', clips: [], footprint: [box(2.2, 2.2)] },
  gumFacade: {
    url: '/assets/bld/bld_gum_facade.glb',
    clips: [],
    footprint: [box(3.35, 2.5, -5.65), box(3.35, 2.5, 5.65)],
  },
  gumTurret: { url: '/assets/bld/bld_gum_turret.glb', clips: [], footprint: [box(1.7, 1.7)] },
  gumWall: { url: '/assets/bld/bld_gum_wall.glb', clips: [], footprint: [box(9, 0.85)] },
  gumRibs: { url: '/assets/bld/bld_gum_ribs.glb', clips: [] },
  gumBridge: { url: '/assets/bld/bld_gum_bridge.glb', clips: [] },
  kazan: { url: '/assets/bld/bld_kazan.glb', clips: [], footprint: [box(3.7, 3.7)] },
  resurrectionGate: {
    url: '/assets/bld/bld_resurrection_gate.glb',
    clips: [],
    footprint: [box(1.45, 1.45, -3.5), box(1.45, 1.45, 3.5)],
  },
  kremlinInside: { url: '/assets/lmk/lmk_kremlin_inside.glb', clips: [] },
  kutafya: { url: '/assets/bld/bld_kutafya.glb', clips: [], footprint: [circle(2.8)] },
  manege: { url: '/assets/bld/bld_manege.glb', clips: [], footprint: [box(11, 4.5)] },
  grotto: { url: '/assets/bld/bld_grotto.glb', clips: [], footprint: [box(6.2, 1.7)] },
  museum: { url: '/assets/bld/bld_museum.glb', clips: [], footprint: [box(7.2, 2.7)] },
  archBridge: {
    url: '/assets/bld/bld_arch_bridge.glb',
    clips: [],
    footprint: [box(0.3, 3.2, -1.9), box(0.3, 3.2, 1.9)],
  },
  gardenGate: {
    url: '/assets/bld/bld_garden_gate.glb',
    clips: [],
    footprint: [circle(0.55, -2.1), circle(0.55, 2.1)],
  },
  hut: { url: '/assets/bld/bld_hut.glb', clips: [], footprint: [box(1.7, 1.45)] },
  shop: { url: '/assets/bld/bld_shop.glb', clips: [], footprint: [box(1.95, 1.55)] },
  shopHerbs: { url: '/assets/bld/bld_shop_herbs.glb', clips: [], footprint: [box(1.95, 1.55)] },
  questBoard: { url: '/assets/prop/prop_questboard.glb', clips: [], footprint: [box(1.1, 0.25)] },
  obelisk: { url: '/assets/prop/prop_obelisk.glb', clips: [], footprint: [circle(1.3)] },
  hedge: { url: '/assets/prop/prop_hedge.glb', clips: [], footprint: [box(1.0, 0.35)] },
  fountain: { url: '/assets/prop/prop_fountain.glb', clips: [], footprint: [circle(2.75)] },
  kiosk: { url: '/assets/prop/prop_kiosk.glb', clips: [], footprint: [box(0.95, 0.95)] },
  bench: { url: '/assets/prop/prop_bench.glb', clips: [], footprint: [box(0.95, 0.3)] },
  lamppost: { url: '/assets/prop/prop_lamppost.glb', clips: [], footprint: [circle(0.28)] },
  firTub: { url: '/assets/prop/prop_fir_tub.glb', clips: [], footprint: [circle(0.6)] },
  barrel: { url: '/assets/prop/prop_barrel.glb', clips: [], footprint: [circle(0.42)] },
  crate: { url: '/assets/prop/prop_crate.glb', clips: [], footprint: [box(0.47, 0.47)] },
  spruce: { url: '/assets/tree/tree_spruce.glb', clips: [], footprint: [circle(0.45)] },
  linden: { url: '/assets/tree/tree_linden.glb', clips: [], footprint: [circle(0.45)] },
  flowerbed: { url: '/assets/prop/prop_flowerbed.glb', clips: [], footprint: [box(1.2, 0.6)] },
  birch: { url: '/assets/tree/tree_birch.glb', clips: [], footprint: [circle(0.35)] },
} as const satisfies Record<string, AssetDef>;

export type AssetId = keyof typeof ASSETS;

export function footprintOf(id: AssetId): readonly Shape[] | undefined {
  const def: AssetDef = ASSETS[id];
  return def.footprint;
}
