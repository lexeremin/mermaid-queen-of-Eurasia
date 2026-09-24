import { describe, expect, it } from 'vitest';
import { createFixedStepper } from '@/game/fixed-step';

describe('createFixedStepper', () => {
  it('runs whole steps and returns the interpolation alpha', () => {
    const stepper = createFixedStepper(0.1, 5);
    let steps = 0;
    const alpha = stepper.advance(0.25, () => steps++);
    expect(steps).toBe(2);
    expect(alpha).toBeCloseTo(0.5);
  });

  it('carries the remainder into the next frame', () => {
    const stepper = createFixedStepper(0.1, 5);
    let steps = 0;
    stepper.advance(0.06, () => steps++);
    stepper.advance(0.06, () => steps++);
    expect(steps).toBe(1);
  });

  it('clamps huge frame times to maxStepsPerFrame', () => {
    const stepper = createFixedStepper(0.1, 3);
    let steps = 0;
    stepper.advance(10, () => steps++);
    expect(steps).toBeLessThanOrEqual(3);
  });

  it('reset drops the accumulated time', () => {
    const stepper = createFixedStepper(0.1, 5);
    stepper.advance(0.09, () => undefined);
    stepper.reset();
    let steps = 0;
    stepper.advance(0.05, () => steps++);
    expect(steps).toBe(0);
  });
});
