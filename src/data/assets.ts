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
  gum: { url: '/assets/bld/bld_gum.glb', clips: [], footprint: [box(4.1, 2.6)] },
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
