import type { Shape } from '@/data/types';

export const ATLAS_URL = '/assets/atlas/palette_atlas.png';

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
  izba: { url: '/assets/bld/bld_izba.glb', clips: [], footprint: [box(2.2, 1.9)] },
  shop: { url: '/assets/bld/bld_shop.glb', clips: [], footprint: [box(1.95, 1.55)] },
  shopHerbs: { url: '/assets/bld/bld_shop_herbs.glb', clips: [], footprint: [box(1.95, 1.55)] },
  hut: { url: '/assets/bld/bld_hut.glb', clips: [], footprint: [box(1.7, 1.45)] },
  bridge: {
    url: '/assets/bld/bld_bridge.glb',
    clips: [],
    footprint: [box(0.12, 3.2, -1.15), box(0.12, 3.2, 1.15)],
  },
  gate: {
    url: '/assets/bld/bld_gate.glb',
    clips: [],
    footprint: [circle(0.4, -1.9), circle(0.4, 1.9)],
  },
  questBoard: { url: '/assets/prop/prop_questboard.glb', clips: [], footprint: [box(1.1, 0.25)] },
  fence: { url: '/assets/prop/prop_fence.glb', clips: [], footprint: [box(1.0, 0.12)] },
  well: { url: '/assets/prop/prop_well.glb', clips: [], footprint: [circle(0.95)] },
  lantern: { url: '/assets/prop/prop_lantern.glb', clips: [], footprint: [circle(0.2)] },
  barrel: { url: '/assets/prop/prop_barrel.glb', clips: [], footprint: [circle(0.42)] },
  crate: { url: '/assets/prop/prop_crate.glb', clips: [], footprint: [box(0.47, 0.47)] },
  logs: { url: '/assets/prop/prop_logs.glb', clips: [], footprint: [box(0.65, 0.8)] },
  spruce: { url: '/assets/tree/tree_spruce.glb', clips: [], footprint: [circle(0.45)] },
  birch: { url: '/assets/tree/tree_birch.glb', clips: [], footprint: [circle(0.35)] },
} as const satisfies Record<string, AssetDef>;

export type AssetId = keyof typeof ASSETS;

export function footprintOf(id: AssetId): readonly Shape[] | undefined {
  const def: AssetDef = ASSETS[id];
  return def.footprint;
}
