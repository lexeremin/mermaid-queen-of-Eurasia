import type { Vec2 } from '@/utils/vec2';

/** A telegraphed danger zone on the ground: an enemy marks it, and it lands a moment later. */
export type HazardShape =
  | { kind: 'circle'; x: number; z: number; r: number }
  /** An oriented rectangle: `rot` turns its long (hx) axis from +x toward +z. */
  | { kind: 'rect'; x: number; z: number; hx: number; hz: number; rot: number };

export type Hazard = {
  id: number;
  shape: HazardShape;
  /** Seconds from being marked until it lands. */
  delay: number;
  age: number;
  damage: number;
  /** Already landed (damage applied). */
  hit: boolean;
};

export type HazardSpec = Pick<Hazard, 'shape' | 'delay' | 'damage'>;

/** How long a landed hazard stays on screen as a flash. */
export const HAZARD_LINGER = 0.35;

/** Whether a circle of `radius` at `p` overlaps the shape. */
export function overlapsHazard(shape: HazardShape, p: Vec2, radius: number): boolean {
  if (shape.kind === 'circle') {
    return Math.hypot(p.x - shape.x, p.z - shape.z) <= shape.r + radius;
  }
  const dx = p.x - shape.x;
  const dz = p.z - shape.z;
  const cos = Math.cos(shape.rot);
  const sin = Math.sin(shape.rot);
  const along = dx * cos + dz * sin;
  const across = -dx * sin + dz * cos;
  return Math.abs(along) <= shape.hx + radius && Math.abs(across) <= shape.hz + radius;
}

/**
 * Ages every hazard by `dt`. Returns those that landed during this step (their damage is due now) and drops the
 * ones whose flash is over. Mutates the hazards' `age` and `hit`.
 */
export function stepHazards(
  hazards: readonly Hazard[],
  dt: number,
): { landed: Hazard[]; remaining: Hazard[] } {
  const landed: Hazard[] = [];
  const remaining: Hazard[] = [];
  for (const h of hazards) {
    h.age += dt;
    if (!h.hit && h.age >= h.delay) {
      h.hit = true;
      landed.push(h);
    }
    if (h.age < h.delay + HAZARD_LINGER) remaining.push(h);
  }
  return { landed, remaining };
}
