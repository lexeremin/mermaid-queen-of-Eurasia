import palette from '../../tools/palette.json';

export const PALETTE = palette.colors;
export type PaletteColor = keyof typeof PALETTE;

export const PALETTE_NAMES = Object.keys(PALETTE) as PaletteColor[];
export const ATLAS = palette.atlas;

export type AtlasCell = { col: number; row: number };

export function atlasCell(name: PaletteColor): AtlasCell {
  const index = PALETTE_NAMES.indexOf(name);
  return { col: index % ATLAS.cols, row: Math.floor(index / ATLAS.cols) };
}
