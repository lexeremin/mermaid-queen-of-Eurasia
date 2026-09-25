import { describe, expect, it } from 'vitest';
import { Object3D, Vector3 } from 'three';
import { poseTool, restPose, swingPose, type Rest } from '@/game/entities/swing-pose';

const UPRIGHT: Rest = { arm: 0, tool: 0 };
const READY: Rest = { arm: -0.6, tool: 0.3 };

describe('swing poses', () => {
  it('start and end at rest, whichever swing and style it is', () => {
    for (const style of ['trident', 'sword'] as const) {
      for (const rest of [UPRIGHT, READY]) {
        for (const kind of [0, 1, 2]) {
          expect(swingPose(kind, 0, rest, style)).toEqual(restPose(rest));
          expect(swingPose(kind, 1, rest, style)).toEqual(restPose(rest));
          expect(swingPose(kind, -3, rest, style)).toEqual(restPose(rest));
          expect(swingPose(kind, 9, rest, style)).toEqual(restPose(rest));
        }
      }
    }
  });

  it('forehand and backhand sweep the body in opposite directions across the front', () => {
    const forehand = [0.2, 0.5].map((t) => swingPose(0, t, UPRIGHT).twist);
    const backhand = [0.2, 0.5].map((t) => swingPose(1, t, UPRIGHT).twist);
    expect(forehand[0]).toBeLessThan(0);
    expect(forehand[1]).toBeGreaterThan(0);
    expect(backhand[0]).toBeGreaterThan(0);
    expect(backhand[1]).toBeLessThan(0);
  });

  it('holds the trident level and forward in the slashes', () => {
    for (const kind of [0, 1]) {
      const mid = swingPose(kind, 0.4, UPRIGHT);
      expect(mid.tool).toBeGreaterThan(1.4);
      expect(mid.arm).toBeLessThan(-0.7);
    }
  });

  it('lifts the weapon high and then chops down and forward in both finishers', () => {
    for (const style of ['trident', 'sword'] as const) {
      const up = swingPose(2, 0.3, READY, style);
      const down = swingPose(2, 0.5, READY, style);
      expect(up.arm).toBeLessThan(-2);
      expect(up.tool).toBeLessThan(0.1);
      expect(down.tool).toBeGreaterThan(1.4);
      expect(down.lean).toBeGreaterThan(up.lean);
    }
  });

  it("the sword's cuts are diagonal: the arm goes from one side across to the other while it comes down or up", () => {
    const start = swingPose(0, 0.24, READY, 'sword');
    const end = swingPose(0, 0.56, READY, 'sword');
    expect(start.roll).toBeLessThan(0);
    expect(end.roll).toBeGreaterThan(0);
    expect(start.arm).toBeLessThan(end.arm - 1);
    const rising = [swingPose(1, 0.24, READY, 'sword'), swingPose(1, 0.56, READY, 'sword')];
    expect(rising[0]!.roll).toBeGreaterThan(0);
    expect(rising[1]!.roll).toBeLessThan(0);
    expect(rising[1]!.arm).toBeLessThan(rising[0]!.arm - 1);
  });

  it("differs between Rosa's trident and Sasha's sword", () => {
    for (const kind of [0, 1, 2]) {
      const a = JSON.stringify(swingPose(kind, 0.4, READY, 'trident'));
      const b = JSON.stringify(swingPose(kind, 0.4, READY, 'sword'));
      expect(a).not.toBe(b);
    }
  });

  it('moves smoothly: no jump larger than a fraction of a radian between neighbouring frames', () => {
    for (const style of ['trident', 'sword'] as const) {
      for (const kind of [0, 1, 2]) {
        let last = swingPose(kind, 0, READY, style);
        for (let t = 0.01; t <= 1; t += 0.01) {
          const now = swingPose(kind, t, READY, style);
          expect(Math.abs(now.arm - last.arm)).toBeLessThan(0.3);
          expect(Math.abs(now.roll - last.roll)).toBeLessThan(0.3);
          expect(Math.abs(now.twist - last.twist)).toBeLessThan(0.25);
          last = now;
        }
      }
    }
  });

  it('poses a weapon node relative to the arm and slides it along itself', () => {
    const node = new Object3D();
    const base = new Vector3(0, -0.5, 0.1);
    const noGrip = new Vector3(0, 0, 0);
    const pose = swingPose(0, 0.4, UPRIGHT);
    poseTool(node, base, noGrip, pose, 0.8);
    expect(node.rotation.x).toBeCloseTo(pose.tool - pose.arm);
    expect(node.position.distanceTo(base)).toBeCloseTo(0.8, 5);
    poseTool(node, base, noGrip, restPose(UPRIGHT), 0.8);
    expect(node.position.distanceTo(base)).toBe(0);
    expect(node.rotation.x).toBe(0);
  });

  it('turns the weapon about the hand, which stays where it was', () => {
    const node = new Object3D();
    const base = new Vector3(0, -0.14, 0.06);
    const grip = new Vector3(0, -0.52, 0);
    for (const pitch of [0.4, 1.05, 2.3]) {
      poseTool(node, base, grip, { ...restPose(UPRIGHT), tool: pitch }, 0);
      const hand = grip.clone().applyEuler(node.rotation).add(node.position);
      expect(hand.distanceTo(base.clone().add(grip))).toBeLessThan(1e-9);
    }
  });
});
