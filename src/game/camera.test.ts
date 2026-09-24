import { describe, expect, it } from 'vitest';
import { cameraPitchDegrees } from '@/game/camera';

describe('cameraPitchDegrees', () => {
  it('keeps the fixed camera within the 50-60 degree top-down range', () => {
    const pitch = cameraPitchDegrees();
    expect(pitch).toBeGreaterThanOrEqual(50);
    expect(pitch).toBeLessThanOrEqual(60);
  });
});
