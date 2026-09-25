import type { Object3D, Vector3 } from 'three';

/**
 * How a figure moves through one of the three swings of the auto-attack chain (see `TRIDENT_COMBO`).
 * All angles are radians. `arm` is added to the weapon arm's rotation about the shoulder (negative raises it forward),
 * `roll` swings the arm out to the side (negative outward, away from the body), `tool` is the weapon's own pitch
 * (0 points up, half a turn forward is level and pointing ahead), `twist` turns the whole body about the vertical
 * (positive toward the figure's left), `lean` tips it forward, and `slide` is how far the weapon is moved along
 * itself so a long shaft is gripped by its end (0..1 of the figure's own maximum).
 */
export type SwingPose = {
  arm: number;
  roll: number;
  tool: number;
  twist: number;
  lean: number;
  slide: number;
};

/** How a figure stands when not swinging: the arm's angle and the weapon's pitch. */
export type Rest = { arm: number; tool: number };

/** Which set of swings: the trident's level sweeps and chop, or the sword's diagonal cuts. */
export type SwingStyle = 'trident' | 'sword';

/** A key of a swing; `arm` and `tool` left out mean the resting values. */
type Key = {
  t: number;
  arm?: number;
  roll?: number;
  tool?: number;
  twist: number;
  lean: number;
  slide: number;
};

const LEVEL = Math.PI / 2 - 0.02;

/** Forehand: the weapon comes up on the right and sweeps across the front to the left. */
const FOREHAND: readonly Key[] = [
  { t: 0, twist: 0, lean: 0, slide: 0 },
  { t: 0.22, arm: -1.0, tool: LEVEL, twist: -0.95, lean: 0.03, slide: 1 },
  { t: 0.58, arm: -1.0, tool: LEVEL, twist: 0.9, lean: 0.1, slide: 1 },
  { t: 0.75, arm: -0.9, tool: LEVEL, twist: 0.8, lean: 0.08, slide: 1 },
  { t: 1, twist: 0, lean: 0, slide: 0 },
];

/** Backhand: from the left back across the front to the right, a little lower. */
const BACKHAND: readonly Key[] = [
  { t: 0, twist: 0, lean: 0, slide: 0 },
  { t: 0.22, arm: -0.8, tool: LEVEL + 0.18, twist: 0.95, lean: 0.06, slide: 1 },
  { t: 0.58, arm: -0.85, tool: LEVEL + 0.15, twist: -0.9, lean: 0.1, slide: 1 },
  { t: 0.75, arm: -0.8, tool: LEVEL + 0.1, twist: -0.8, lean: 0.08, slide: 1 },
  { t: 1, twist: 0, lean: 0, slide: 0 },
];

/** Finisher: the weapon goes up over the head and chops down and forward with the whole body behind it. */
const FINISHER: readonly Key[] = [
  { t: 0, twist: 0, lean: 0, slide: 0 },
  { t: 0.3, arm: -2.25, tool: -0.35, twist: -0.12, lean: -0.16, slide: 0.55 },
  { t: 0.5, arm: -0.35, tool: 1.55, twist: 0.06, lean: 0.36, slide: 0.55 },
  { t: 0.74, arm: -0.3, tool: 1.5, twist: 0.04, lean: 0.3, slide: 0.55 },
  { t: 1, twist: 0, lean: 0, slide: 0 },
];

/** The sword's first cut: raised high on the right, brought down across the body to the low left. */
const CUT_DOWN: readonly Key[] = [
  { t: 0, twist: 0, lean: 0, slide: 0 },
  { t: 0.24, arm: -2.3, roll: -0.55, tool: 0.35, twist: -0.4, lean: -0.05, slide: 0 },
  { t: 0.56, arm: -0.75, roll: 0.55, tool: 1.35, twist: 0.5, lean: 0.2, slide: 0 },
  { t: 0.75, arm: -0.7, roll: 0.5, tool: 1.3, twist: 0.45, lean: 0.16, slide: 0 },
  { t: 1, twist: 0, lean: 0, slide: 0 },
];

/** The second cut: back up from the low left, rising across the body to the high right. */
const CUT_UP: readonly Key[] = [
  { t: 0, twist: 0, lean: 0, slide: 0 },
  { t: 0.24, arm: -0.5, roll: 0.65, tool: 1.4, twist: 0.5, lean: 0.12, slide: 0 },
  { t: 0.56, arm: -2.0, roll: -0.5, tool: 0.5, twist: -0.5, lean: 0.0, slide: 0 },
  { t: 0.75, arm: -1.9, roll: -0.45, tool: 0.5, twist: -0.45, lean: 0.0, slide: 0 },
  { t: 1, twist: 0, lean: 0, slide: 0 },
];

/** The sword's finisher: lifted overhead and brought down straight, with a step of weight behind it. */
const CHOP: readonly Key[] = [
  { t: 0, twist: 0, lean: 0, slide: 0 },
  { t: 0.3, arm: -2.7, tool: -0.15, twist: -0.1, lean: -0.22, slide: 0 },
  { t: 0.5, arm: -0.6, tool: 1.5, twist: 0.05, lean: 0.42, slide: 0 },
  { t: 0.74, arm: -0.55, tool: 1.45, twist: 0.04, lean: 0.34, slide: 0 },
  { t: 1, twist: 0, lean: 0, slide: 0 },
];

const CHAINS: Record<SwingStyle, readonly (readonly Key[])[]> = {
  trident: [FOREHAND, BACKHAND, FINISHER],
  sword: [CUT_DOWN, CUT_UP, CHOP],
};

const smooth = (u: number): number => u * u * (3 - 2 * u);
const mix = (a: number, b: number, u: number): number => (u >= 1 ? b : a + (b - a) * u) + 0;

/** The pose `t` (0..1) of the way through swing number `kind` of a chain, starting and ending in `rest`. */
export function swingPose(
  kind: number,
  t: number,
  rest: Rest,
  style: SwingStyle = 'trident',
): SwingPose {
  const chain = CHAINS[style];
  const keys = chain[kind] ?? chain[0]!;
  const clamped = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < keys.length - 2 && clamped > (keys[i + 1]?.t ?? 1)) i++;
  const a = keys[i] ?? keys[0]!;
  const b = keys[i + 1] ?? a;
  const u = b.t > a.t ? smooth(Math.min(1, Math.max(0, (clamped - a.t) / (b.t - a.t)))) : 1;
  return {
    arm: mix(a.arm ?? rest.arm, b.arm ?? rest.arm, u),
    roll: mix(a.roll ?? 0, b.roll ?? 0, u),
    tool: mix(a.tool ?? rest.tool, b.tool ?? rest.tool, u),
    twist: mix(a.twist, b.twist, u),
    lean: mix(a.lean, b.lean, u),
    slide: mix(a.slide, b.slide, u),
  };
}

/** The pose of standing still. */
export const restPose = (rest: Rest): SwingPose => ({
  arm: rest.arm,
  roll: 0,
  tool: rest.tool,
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
