import { describe, expect, it } from 'vitest';
import {
  RECALL,
  cancelRecall,
  createRecall,
  isInterrupted,
  recallProgress,
  startRecall,
  stepRecall,
} from '@/systems/recall';

const calm = { moving: false, acting: false, hurt: false, downed: false };

describe('recall', () => {
  it('does nothing until started', () => {
    const r = createRecall();
    expect(stepRecall(r, 10)).toBe(false);
    expect(recallProgress(r)).toBe(0);
  });

  it('completes exactly once after the cast time', () => {
    const r = createRecall();
    startRecall(r);
    let done = 0;
    let t = 0;
    for (; t < RECALL.castTime - 0.1; t += 0.1) done += stepRecall(r, 0.1) ? 1 : 0;
    expect(done).toBe(0);
    expect(recallProgress(r)).toBeGreaterThan(0.9);
    for (let i = 0; i < 5; i++) done += stepRecall(r, 0.1) ? 1 : 0;
    expect(done).toBe(1);
    expect(r.active).toBe(false);
  });

  it('can be cancelled and restarts from zero', () => {
    const r = createRecall();
    startRecall(r);
    stepRecall(r, 2);
    cancelRecall(r);
    expect(recallProgress(r)).toBe(0);
    startRecall(r);
    expect(r.t).toBe(0);
  });

  it('is broken by moving, acting, damage and fainting, not by standing still', () => {
    expect(isInterrupted(calm)).toBe(false);
    for (const key of ['moving', 'acting', 'hurt', 'downed'] as const) {
      expect(isInterrupted({ ...calm, [key]: true }), key).toBe(true);
    }
  });
});
