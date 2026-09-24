import { describe, expect, it } from 'vitest';
import { cameraDistanceScale, cameraPitchDegrees } from '@/game/camera';

describe('camera', () => {
  it('keeps the fixed camera within the 50-60 degree top-down range', () => {
    const pitch = cameraPitchDegrees();
    expect(pitch).toBeGreaterThanOrEqual(50);
    expect(pitch).toBeLessThanOrEqual(60);
  });

  it('does not zoom in beyond the 16:9 reference on wide screens', () => {
    expect(cameraDistanceScale(16 / 9)).toBe(1);
    expect(cameraDistanceScale(21 / 9)).toBe(1);
  });

  it('pulls the camera back on portrait screens, within a cap', () => {
    const portrait = cameraDistanceScale(375 / 812);
    expect(portrait).toBeGreaterThan(1.5);
    expect(portrait).toBeLessThanOrEqual(2.5);
    expect(cameraDistanceScale(0)).toBe(1);
  });
});
