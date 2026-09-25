import { describe, expect, it } from 'vitest';
import { Object3D, Vector3 } from 'three';
import { poseTool, restPose, swingPose } from '@/game/entities/swing-pose';

describe('swing poses', () => {
  it('start and end at rest, whichever swing it is', () => {
    for (const kind of [0, 1, 2]) {
      expect(swingPose(kind, 0, 1.05)).toEqual(restPose(1.05));
      expect(swingPose(kind, 1, 1.05)).toEqual(restPose(1.05));
      expect(swingPose(kind, -3, 0)).toEqual(restPose(0));
      expect(swingPose(kind, 9, 0)).toEqual(restPose(0));
    }
  });

  it('forehand and backhand sweep the body in opposite directions across the front', () => {
    const forehand = [0.2, 0.5].map((t) => swingPose(0, t, 0).twist);
    const backhand = [0.2, 0.5].map((t) => swingPose(1, t, 0).twist);
    expect(forehand[0]).toBeLessThan(0);
    expect(forehand[1]).toBeGreaterThan(0);
    expect(backhand[0]).toBeGreaterThan(0);
    expect(backhand[1]).toBeLessThan(0);
  });

  it('holds the weapon level and forward in the slashes', () => {
    for (const kind of [0, 1]) {
      const mid = swingPose(kind, 0.4, 0);
      expect(mid.tool).toBeGreaterThan(1.4);
      expect(mid.arm).toBeLessThan(-0.7);
    }
  });

  it('lifts the weapon high and then chops down and forward in the finisher', () => {
    const up = swingPose(2, 0.3, 0);
    const down = swingPose(2, 0.5, 0);
    expect(up.arm).toBeLessThan(-2);
    expect(up.tool).toBeLessThan(0);
    expect(down.tool).toBeGreaterThan(1.4);
    expect(down.lean).toBeGreaterThan(up.lean);
  });

  it('moves smoothly: no jump larger than a fraction of a radian between neighbouring frames', () => {
    for (const kind of [0, 1, 2]) {
      let last = swingPose(kind, 0, 0);
      for (let t = 0.01; t <= 1; t += 0.01) {
        const now = swingPose(kind, t, 0);
        expect(Math.abs(now.arm - last.arm)).toBeLessThan(0.25);
        expect(Math.abs(now.twist - last.twist)).toBeLessThan(0.25);
        last = now;
      }
    }
  });

  it('poses a weapon node relative to the arm and slides it along itself', () => {
    const node = new Object3D();
    const base = new Vector3(0, -0.5, 0.1);
    const noGrip = new Vector3(0, 0, 0);
    poseTool(node, base, noGrip, swingPose(0, 0.4, 0), 0.8);
    expect(node.rotation.x).toBeCloseTo(swingPose(0, 0.4, 0).tool - swingPose(0, 0.4, 0).arm);
    expect(node.position.distanceTo(base)).toBeCloseTo(0.8, 5);
    poseTool(node, base, noGrip, restPose(0), 0.8);
    expect(node.position.distanceTo(base)).toBe(0);
    expect(node.rotation.x).toBe(0);
  });

  it('turns the weapon about the hand, which stays where it was', () => {
    const node = new Object3D();
    const base = new Vector3(0, -0.14, 0.06);
    const grip = new Vector3(0, -0.52, 0);
    for (const pitch of [0.4, 1.05, 2.3]) {
      poseTool(node, base, grip, { arm: 0, tool: pitch, twist: 0, lean: 0, slide: 0 }, 0);
      // The grip point of the weapon, carried along with the node's turn and position.
      const hand = grip.clone().applyEuler(node.rotation).add(node.position);
      expect(hand.distanceTo(base.clone().add(grip))).toBeLessThan(1e-9);
    }
  });
});
