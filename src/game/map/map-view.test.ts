import { describe, expect, it } from 'vitest';
import { UNDERGROUND } from '@/data/maps/underground';
import { RED_SQUARE } from '@/data/maps/red-square';
import {
  SURFACE_REGION,
  UNDERGROUND_REGION,
  fitRegion,
  regionFor,
  toScreen,
} from '@/game/map/map-view';

describe('map view', () => {
  it('centres the view point on the canvas and keeps north (-z) up and east (+x) right', () => {
    const view = { cx: 10, cz: 20, scale: 4, width: 200, height: 100 };
    expect(toScreen(view, 10, 20)).toEqual({ x: 100, y: 50 });
    expect(toScreen(view, 11, 20).x).toBeGreaterThan(100);
    expect(toScreen(view, 10, 19).y).toBeLessThan(50);
  });

  it('fits a whole region inside the canvas with a margin', () => {
    const view = fitRegion(SURFACE_REGION, 800, 600, 20);
    const a = toScreen(view, SURFACE_REGION.minX, SURFACE_REGION.minZ);
    const b = toScreen(view, SURFACE_REGION.maxX, SURFACE_REGION.maxZ);
    expect(a.x).toBeGreaterThanOrEqual(20 - 1e-6);
    expect(a.y).toBeGreaterThanOrEqual(20 - 1e-6);
    expect(b.x).toBeLessThanOrEqual(780 + 1e-6);
    expect(b.y).toBeLessThanOrEqual(580 + 1e-6);
  });

  it('picks the surface or the underground by where Rosa stands', () => {
    expect(regionFor(24).id).toBe('surface');
    expect(regionFor(UNDERGROUND.arrival.z).id).toBe('underground');
  });

  it('the regions cover everything that matters', () => {
    for (const e of RED_SQUARE.entrances ?? []) {
      expect(e.x).toBeGreaterThan(SURFACE_REGION.minX);
      expect(e.x).toBeLessThan(SURFACE_REGION.maxX);
      expect(e.z).toBeGreaterThan(SURFACE_REGION.minZ);
      expect(e.z).toBeLessThan(SURFACE_REGION.maxZ);
    }
    for (const f of UNDERGROUND.floors.filter((floor) => floor.w < 60)) {
      expect(f.cx - f.w / 2).toBeGreaterThanOrEqual(UNDERGROUND_REGION.minX);
      expect(f.cx + f.w / 2).toBeLessThanOrEqual(UNDERGROUND_REGION.maxX);
      expect(f.cz - f.d / 2).toBeGreaterThanOrEqual(UNDERGROUND_REGION.minZ);
      expect(f.cz + f.d / 2).toBeLessThanOrEqual(UNDERGROUND_REGION.maxZ);
    }
  });
});
