import type { Object3D, Vector3 } from 'three';

/**
 * How a figure moves through one of the three swings of the auto-attack chain (see `TRIDENT_COMBO`).
 * All angles are radians. `arm` is added to the weapon arm's rotation about the shoulder (negative raises it forward),
 * `tool` is the weapon's own pitch (0 points up, half a turn forward is level and pointing ahead), `twist` turns the
 * whole body about the vertical (positive toward the figure's left), `lean` tips it forward, and `slide` is how far
 * the weapon is moved along itself so a long shaft is gripped by its end (0..1 of the figure's own maximum).
 */
export type SwingPose = { arm: number; tool: number; twist: number; lean: number; slide: number };

type Key = { t: number; arm: number; tool?: number; twist: number; lean: number; slide: number };

const LEVEL = Math.PI / 2 - 0.02;

/** Forehand: the weapon comes up on the right and sweeps across the front to the left. */
const FOREHAND: readonly Key[] = [
  { t: 0, arm: 0, twist: 0, lean: 0, slide: 0 },
  { t: 0.22, arm: -1.0, tool: LEVEL, twist: -0.95, lean: 0.03, slide: 1 },
  { t: 0.58, arm: -1.0, tool: LEVEL, twist: 0.9, lean: 0.1, slide: 1 },
  { t: 0.75, arm: -0.9, tool: LEVEL, twist: 0.8, lean: 0.08, slide: 1 },
  { t: 1, arm: 0, twist: 0, lean: 0, slide: 0 },
];

/** Backhand: from the left back across the front to the right, a little lower. */
const BACKHAND: readonly Key[] = [
  { t: 0, arm: 0, twist: 0, lean: 0, slide: 0 },
  { t: 0.22, arm: -0.8, tool: LEVEL + 0.18, twist: 0.95, lean: 0.06, slide: 1 },
  { t: 0.58, arm: -0.85, tool: LEVEL + 0.15, twist: -0.9, lean: 0.1, slide: 1 },
  { t: 0.75, arm: -0.8, tool: LEVEL + 0.1, twist: -0.8, lean: 0.08, slide: 1 },
  { t: 1, arm: 0, twist: 0, lean: 0, slide: 0 },
];

/** Finisher: the weapon goes up over the head and chops down and forward with the whole body behind it. */
const FINISHER: readonly Key[] = [
  { t: 0, arm: 0, twist: 0, lean: 0, slide: 0 },
  { t: 0.3, arm: -2.25, tool: -0.35, twist: -0.12, lean: -0.16, slide: 0.55 },
  { t: 0.5, arm: -0.35, tool: 1.55, twist: 0.06, lean: 0.36, slide: 0.55 },
  { t: 0.74, arm: -0.3, tool: 1.5, twist: 0.04, lean: 0.3, slide: 0.55 },
  { t: 1, arm: 0, twist: 0, lean: 0, slide: 0 },
];

const CHAIN: readonly (readonly Key[])[] = [FOREHAND, BACKHAND, FINISHER];

const smooth = (u: number): number => u * u * (3 - 2 * u);
const mix = (a: number, b: number, u: number): number => a + (b - a) * u;

/** The pose `t` (0..1) of the way through swing number `kind`; `restTool` is the weapon's pitch when not swinging. */
export function swingPose(kind: number, t: number, restTool: number): SwingPose {
  const keys = CHAIN[kind] ?? FOREHAND;
  const clamped = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < keys.length - 2 && clamped > (keys[i + 1]?.t ?? 1)) i++;
  const a = keys[i] ?? keys[0]!;
  const b = keys[i + 1] ?? a;
  const u = b.t > a.t ? smooth(Math.min(1, Math.max(0, (clamped - a.t) / (b.t - a.t)))) : 1;
  return {
    arm: mix(a.arm, b.arm, u),
    tool: mix(a.tool ?? restTool, b.tool ?? restTool, u),
    twist: mix(a.twist, b.twist, u),
    lean: mix(a.lean, b.lean, u),
    slide: mix(a.slide, b.slide, u),
  };
}

/** Where the weapon rests when not swinging, as a pose. */
export const restPose = (restTool: number): SwingPose => ({
  arm: 0,
  tool: restTool,
  twist: 0,
  lean: 0,
  slide: 0,
});

/**
 * Puts the weapon node into the pose: turned relative to the arm so its own pitch is `pose.tool`, and slid along
 * itself by `pose.slide * maxSlide` from its resting position `base`. The exported node sits at the centre of the
 * weapon's mesh, not in the hand, so it turns about `grip`: the hand's place, as an offset from the node in the
 * arm's frame at rest.
 */
export function poseTool(
  tool: Object3D,
  base: Vector3,
  grip: Vector3,
  pose: SwingPose,
  maxSlide: number,
): void {
  const pitch = pose.tool - pose.arm;
  const slide = pose.slide * maxSlide;
  const cos = Math.cos(pitch);
  const sin = Math.sin(pitch);
  // Turning about the grip moves the node by grip - R * grip.
  const turnedY = grip.y * cos - grip.z * sin;
  const turnedZ = grip.y * sin + grip.z * cos;
  tool.rotation.x = pitch;
  tool.position.set(
    base.x,
    base.y + grip.y - turnedY + cos * slide,
    base.z + grip.z - turnedZ + sin * slide,
  );
}
