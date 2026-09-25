export type Vec3 = { x: number; y: number; z: number };
export type Box = { min: Vec3; max: Vec3 };

/** Only models at least this tall can hide Rosa from the camera. */
export const MIN_OCCLUDER_HEIGHT = 3;
/** How opaque an occluding model stays (a stipple of the model remains visible). */
export const OCCLUDED_OPACITY = 0.3;
export const FADE_RATE = 9;

/** True when the segment a..b passes through the box (slab method), with the box grown by `margin`. */
export function segmentHitsBox(a: Vec3, b: Vec3, box: Box, margin = 0): boolean {
  let t0 = 0;
  let t1 = 1;
  for (const axis of ['x', 'y', 'z'] as const) {
    const d = b[axis] - a[axis];
    const lo = box.min[axis] - margin;
    const hi = box.max[axis] + margin;
    if (Math.abs(d) < 1e-9) {
      if (a[axis] < lo || a[axis] > hi) return false;
      continue;
    }
    let near = (lo - a[axis]) / d;
    let far = (hi - a[axis]) / d;
    if (near > far) [near, far] = [far, near];
    t0 = Math.max(t0, near);
    t1 = Math.min(t1, far);
    if (t0 > t1) return false;
  }
  return true;
}

/** Moves an instance's opacity toward its target (fully visible, or the stipple when it hides Rosa). */
export function stepOpacity(current: number, occluding: boolean, dt: number): number {
  const target = occluding ? OCCLUDED_OPACITY : 1;
  const next = current + (target - current) * (1 - Math.exp(-FADE_RATE * dt));
  return Math.abs(next - target) < 0.01 ? target : next;
}
