import { describe, expect, it } from 'vitest';
import {
  approachPoint,
  nearestTalkable,
  npcAtPoint,
  npcUnderRay,
  TALK_RANGE,
  type Spot,
} from '@/systems/interaction';

const spots: Spot[] = [
  { id: 'a', x: 0, z: 0 },
  { id: 'b', x: 10, z: 0 },
];

describe('interaction', () => {
  it('finds the nearest NPC in talking range only', () => {
    expect(nearestTalkable(spots, { x: 1, z: 1 })?.id).toBe('a');
    expect(nearestTalkable(spots, { x: 5, z: 0 })).toBeNull();
    expect(nearestTalkable(spots, { x: 9, z: 0 })?.id).toBe('b');
  });

  it('picks the NPC under a click', () => {
    expect(npcAtPoint(spots, { x: 10.5, z: 0.5 })?.id).toBe('b');
    expect(npcAtPoint(spots, { x: 4, z: 0 })).toBeNull();
  });

  it('approaches from the player side, inside talking range', () => {
    const point = approachPoint(spots[0]!, { x: 20, z: 0 });
    expect(point.x).toBeGreaterThan(0);
    expect(Math.hypot(point.x, point.z)).toBeLessThan(TALK_RANGE);
  });
  it('picks the NPC whose body the camera ray passes through, not the ground behind him', () => {
    const cameraAt = { x: 0, y: 11, z: 8 };
    const aim = (tx: number, ty: number, tz: number) => {
      const len = Math.hypot(tx - cameraAt.x, ty - cameraAt.y, tz - cameraAt.z);
      return {
        origin: cameraAt,
        dir: { x: (tx - cameraAt.x) / len, y: (ty - cameraAt.y) / len, z: (tz - cameraAt.z) / len },
      };
    };
    const npcs: Spot[] = [{ id: 'n', x: 0, z: -6 }];
    expect(npcUnderRay(npcs, aim(0, 1.0, -6))?.id).toBe('n');
    expect(npcUnderRay(npcs, aim(0, 1.9, -6))?.id).toBe('n');
    expect(npcUnderRay(npcs, aim(0, 0, -6))?.id).toBe('n');
    expect(npcUnderRay(npcs, aim(3, 0, -6))).toBeNull();
    expect(npcUnderRay(npcs, aim(0, 0, -13))).toBeNull();
  });
});
