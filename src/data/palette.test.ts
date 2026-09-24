import { describe, expect, it } from 'vitest';
import { ATLAS, atlasCell, PALETTE, PALETTE_NAMES } from '@/data/palette';

describe('palette', () => {
  it('has valid, unique hex colors within the 32-color budget', () => {
    const values = Object.values(PALETTE);
    expect(values.length).toBeLessThanOrEqual(32);
    for (const hex of values) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(values).size).toBe(values.length);
  });

  it('fits every color in the atlas grid with power-of-two dimensions', () => {
    const slots = (ATLAS.width / ATLAS.cell) * (ATLAS.height / ATLAS.cell);
    expect(PALETTE_NAMES.length).toBeLessThanOrEqual(slots);
    expect(ATLAS.cols * ATLAS.cell).toBe(ATLAS.width);
    for (const n of [ATLAS.width, ATLAS.height]) expect(n & (n - 1)).toBe(0);
  });

  it('gives every color its own atlas cell', () => {
    const cells = new Set(PALETTE_NAMES.map((n) => `${atlasCell(n).col},${atlasCell(n).row}`));
    expect(cells.size).toBe(PALETTE_NAMES.length);
  });
});
