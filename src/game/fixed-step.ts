export type FixedStepper = {
  advance: (dt: number, step: (stepSeconds: number) => void) => number;
  reset: () => void;
};

export function createFixedStepper(stepSeconds: number, maxStepsPerFrame: number): FixedStepper {
  let accumulator = 0;
  return {
    advance(dt, step) {
      accumulator += Math.min(Math.max(dt, 0), stepSeconds * maxStepsPerFrame);
      while (accumulator >= stepSeconds) {
        step(stepSeconds);
        accumulator -= stepSeconds;
      }
      return accumulator / stepSeconds;
    },
    reset() {
      accumulator = 0;
    },
  };
}
