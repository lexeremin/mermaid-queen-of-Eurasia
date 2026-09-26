/** Frame-time bookkeeping for the on-device report (`?perf=1`): a rolling window plus totals since the last reset. */
export type FrameWindow = {
  /** The most recent frame times in milliseconds (a ring buffer). */
  times: number[];
  next: number;
  filled: number;
  /** Since the start or the last reset. */
  frames: number;
  spikes: number;
  worst: number;
  seconds: number;
};

/** A frame slower than this counts as a stutter (about three frames at 60 fps). */
export const SPIKE_MS = 50;
/** A gap longer than this is a pause (a menu, a background tab), not a frame: it is left out. */
export const PAUSE_MS = 1000;

export function createFrameWindow(size = 240): FrameWindow {
  return {
    times: new Array<number>(size).fill(0),
    next: 0,
    filled: 0,
    frames: 0,
    spikes: 0,
    worst: 0,
    seconds: 0,
  };
}

export function recordFrame(w: FrameWindow, ms: number): void {
  if (!Number.isFinite(ms) || ms < 0 || ms > PAUSE_MS) return;
  w.times[w.next] = ms;
  w.next = (w.next + 1) % w.times.length;
  w.filled = Math.min(w.times.length, w.filled + 1);
  w.frames += 1;
  w.seconds += ms / 1000;
  if (ms > SPIKE_MS) w.spikes += 1;
  if (ms > w.worst) w.worst = ms;
}

export function resetFrameWindow(w: FrameWindow): void {
  w.times.fill(0);
  w.next = 0;
  w.filled = 0;
  w.frames = 0;
  w.spikes = 0;
  w.worst = 0;
  w.seconds = 0;
}

export type FrameSummary = {
  /** Frames per second over the window. */
  fps: number;
  avgMs: number;
  /** The frame time that 95% of the window's frames were faster than. */
  p95Ms: number;
  worstMs: number;
  spikes: number;
  frames: number;
  seconds: number;
};

export function summarize(w: FrameWindow): FrameSummary {
  const recent = w.times.slice(0, w.filled).sort((a, b) => a - b);
  const avgMs = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  const p95Ms =
    recent.length > 0
      ? (recent[Math.min(recent.length - 1, Math.floor(recent.length * 0.95))] ?? 0)
      : 0;
  return {
    fps: avgMs > 0 ? 1000 / avgMs : 0,
    avgMs,
    p95Ms,
    worstMs: w.worst,
    spikes: w.spikes,
    frames: w.frames,
    seconds: w.seconds,
  };
}
