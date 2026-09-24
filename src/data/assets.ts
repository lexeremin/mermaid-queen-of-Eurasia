export const ATLAS_URL = '/assets/atlas/palette_atlas.png';

export const ASSETS = {
  rosa: { url: '/assets/char/char_rosa.glb', clips: ['idle', 'walk'] },
  izba: { url: '/assets/bld/bld_izba.glb', clips: [] },
  spruce: { url: '/assets/tree/tree_spruce.glb', clips: [] },
} as const;

export type AssetId = keyof typeof ASSETS;
