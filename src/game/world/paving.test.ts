import { describe, expect, it } from 'vitest';
import { RED_SQUARE } from '@/data/maps/red-square';
import { isPaved, rasterize } from '@/game/world/ground-grid';

const grid = rasterize(RED_SQUARE.bounds, RED_SQUARE.plazas, RED_SQUARE.lanes ?? []);
const paved = (x: number, z: number) =>
  isPaved(grid, Math.floor((x - grid.minX) / 1), Math.floor((z - grid.minZ) / 1));

describe('paving on the map', () => {
  it('runs unbroken through the Resurrection Gate, from Red Square to Manezhnaya Square', () => {
    for (let z = 26; z <= 44; z += 0.5) {
      for (const dx of [-1.6, 0, 1.6]) expect(paved(9 + dx, z), `(${9 + dx}, ${z})`).toBe(true);
    }
  });

  it('runs unbroken from Manezhnaya Square along the lane and into the garden gate', () => {
    for (let x = 30; x <= 53; x += 0.5) expect(paved(x, 49), `along x=${x}`).toBe(true);
    for (let z = 38.6; z <= 49; z += 0.5) {
      for (const dx of [-1.5, 0, 1.5]) expect(paved(53 + dx, z), `(${53 + dx}, ${z})`).toBe(true);
    }
  });

  it('does not pave the lawn beyond the garden gate, where the gravel promenade takes over', () => {
    expect(paved(53, 36)).toBe(false);
    expect(paved(53, 10)).toBe(false);
  });

  it('keeps the two plazas as separate lawns elsewhere (no paving where there should be grass)', () => {
    expect(paved(-40, 0)).toBe(false);
    expect(paved(30, 90)).toBe(false);
    expect(paved(60, 46)).toBe(false);
  });
});
