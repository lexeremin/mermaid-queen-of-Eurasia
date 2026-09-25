import { describe, expect, it } from 'vitest';
import {
  FADE_RATE,
  OCCLUDED_OPACITY,
  segmentHitsBox,
  stepOpacity,
  type Box,
} from '@/systems/occlusion';

const box: Box = { min: { x: -2, y: 0, z: -2 }, max: { x: 2, y: 10, z: 2 } };

describe('segmentHitsBox', () => {
  it('hits when the line of sight passes through the box', () => {
    expect(segmentHitsBox({ x: 0, y: 11, z: 8 }, { x: 0, y: 1, z: -6 }, box)).toBe(true);
  });

  it('misses a box beside the line of sight, above it, or behind either end', () => {
    expect(segmentHitsBox({ x: 6, y: 11, z: 8 }, { x: 6, y: 1, z: -6 }, box)).toBe(false);
    expect(segmentHitsBox({ x: 0, y: 30, z: 8 }, { x: 0, y: 12, z: -6 }, box)).toBe(false);
    expect(segmentHitsBox({ x: 0, y: 11, z: 20 }, { x: 0, y: 1, z: 8 }, box)).toBe(false);
    expect(segmentHitsBox({ x: 0, y: 11, z: -20 }, { x: 0, y: 1, z: -8 }, box)).toBe(false);
  });

  it('hits when Rosa stands inside the box', () => {
    expect(segmentHitsBox({ x: 0, y: 11, z: 8 }, { x: 0, y: 1, z: 0 }, box)).toBe(true);
  });

  it('handles axis-parallel segments and the margin', () => {
    expect(segmentHitsBox({ x: 0, y: 5, z: 8 }, { x: 0, y: 5, z: -8 }, box)).toBe(true);
    expect(segmentHitsBox({ x: 2.4, y: 5, z: 8 }, { x: 2.4, y: 5, z: -8 }, box)).toBe(false);
    expect(segmentHitsBox({ x: 2.4, y: 5, z: 8 }, { x: 2.4, y: 5, z: -8 }, box, 0.5)).toBe(true);
  });
});

describe('stepOpacity', () => {
  it('fades toward the stipple while occluding and back to solid otherwise', () => {
    let o = 1;
    for (let i = 0; i < 60; i++) o = stepOpacity(o, true, 1 / 60);
    expect(o).toBe(OCCLUDED_OPACITY);
    for (let i = 0; i < 60; i++) o = stepOpacity(o, false, 1 / 60);
    expect(o).toBe(1);
  });

  it('moves smoothly, never overshoots, and takes about a third of a second', () => {
    let o = 1;
    let previous = 1;
    let frames = 0;
    while (o !== OCCLUDED_OPACITY && frames < 200) {
      o = stepOpacity(o, true, 1 / 60);
      expect(o).toBeLessThanOrEqual(previous);
      expect(o).toBeGreaterThanOrEqual(OCCLUDED_OPACITY);
      previous = o;
      frames++;
    }
    expect(frames / 60).toBeLessThan(1.2);
    expect(frames / 60).toBeGreaterThan(3 / FADE_RATE / 2);
  });
});
