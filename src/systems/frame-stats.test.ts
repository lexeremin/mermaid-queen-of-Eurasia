import { describe, expect, it } from 'vitest';
import {
  PAUSE_MS,
  SPIKE_MS,
  createFrameWindow,
  recordFrame,
  resetFrameWindow,
  summarize,
} from '@/systems/frame-stats';

describe('frame stats', () => {
  it('reports the frame rate and the slow tail of a steady run', () => {
    const w = createFrameWindow(100);
    for (let i = 0; i < 100; i++) recordFrame(w, i % 20 === 0 ? 40 : 16);
    const s = summarize(w);
    expect(s.frames).toBe(100);
    expect(s.avgMs).toBeCloseTo(17.2, 5);
    expect(s.fps).toBeCloseTo(1000 / 17.2, 5);
    expect(s.p95Ms).toBe(40);
    expect(s.worstMs).toBe(40);
    expect(s.spikes).toBe(0);
    expect(s.seconds).toBeCloseTo(1.72, 5);
  });

  it('counts stutters and remembers the worst frame after the window moves on', () => {
    const w = createFrameWindow(10);
    recordFrame(w, SPIKE_MS + 30);
    for (let i = 0; i < 30; i++) recordFrame(w, 16);
    const s = summarize(w);
    expect(s.spikes).toBe(1);
    expect(s.worstMs).toBe(SPIKE_MS + 30);
    expect(s.avgMs).toBe(16);
    expect(s.frames).toBe(31);
  });

  it('ignores nonsense and long pauses, and resets', () => {
    const w = createFrameWindow(10);
    recordFrame(w, NaN);
    recordFrame(w, -5);
    recordFrame(w, Infinity);
    recordFrame(w, PAUSE_MS + 1);
    expect(summarize(w).frames).toBe(0);
    recordFrame(w, 20);
    resetFrameWindow(w);
    expect(summarize(w)).toEqual({
      fps: 0,
      avgMs: 0,
      p95Ms: 0,
      worstMs: 0,
      spikes: 0,
      frames: 0,
      seconds: 0,
    });
  });
});
