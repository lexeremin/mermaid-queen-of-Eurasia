import { describe, expect, it } from 'vitest';
import {
  COLLECT_RADIUS,
  DROP_DELAY,
  MAGNET_RADIUS,
  PICKUP_LIFE,
  scatter,
  stepPickups,
  type Pickup,
} from '@/systems/pickups';
import { mulberry32 } from '@/utils/random';

const pickup = (x: number, z: number, over: Partial<Pickup> = {}): Pickup => ({
  id: 1,
  item: 'healingTea',
  pos: { x, z },
  age: 0,
  collectAfter: 0,
  ...over,
});
const player = { x: 0, z: 0 };
const yes = () => true;

describe('pickups', () => {
  it('collects an item within reach and removes it', () => {
    const r = stepPickups([pickup(COLLECT_RADIUS - 0.1, 0)], player, 0.016, yes);
    expect(r.collected).toEqual(['healingTea']);
    expect(r.pickups).toHaveLength(0);
  });

  it('leaves far items alone', () => {
    const r = stepPickups([pickup(MAGNET_RADIUS + 2, 0)], player, 0.016, yes);
    expect(r.collected).toEqual([]);
    expect(r.pickups[0]?.pos.x).toBe(MAGNET_RADIUS + 2);
  });

  it('pulls items toward the player inside the magnet radius, then collects them', () => {
    let list = [pickup(MAGNET_RADIUS - 0.2, 0)];
    let collected = 0;
    for (let i = 0; i < 120 && collected === 0; i++) {
      const r = stepPickups(list, player, 1 / 60, yes);
      list = r.pickups;
      collected += r.collected.length;
      if (list[0]) expect(list[0].pos.x).toBeLessThan(MAGNET_RADIUS);
    }
    expect(collected).toBe(1);
  });

  it('keeps the item and reports it when the bag is full', () => {
    const r = stepPickups([pickup(0.5, 0)], player, 0.016, () => false);
    expect(r.collected).toEqual([]);
    expect(r.blocked).toEqual(['healingTea']);
    expect(r.pickups).toHaveLength(1);
  });

  it('a freshly dropped item is ignored until its delay passes', () => {
    let list = [pickup(0.2, 0, { collectAfter: DROP_DELAY })];
    for (let t = 0; t < DROP_DELAY - 0.1; t += 0.1)
      list = stepPickups(list, player, 0.1, yes).pickups;
    expect(list).toHaveLength(1);
    let collected = 0;
    for (let t = 0; t < 0.5; t += 0.1)
      collected += stepPickups(list, player, 0.1, yes).collected.length;
    expect(collected).toBeGreaterThan(0);
  });

  it('expires after its lifetime', () => {
    const r = stepPickups([pickup(20, 0, { age: PICKUP_LIFE - 0.01 })], player, 0.5, yes);
    expect(r.pickups).toHaveLength(0);
  });

  it('scatters drops on a ring around the death point without stacking them', () => {
    const spots = scatter({ x: 10, z: 10 }, 4, mulberry32(5));
    expect(spots).toHaveLength(4);
    for (const s of spots) {
      const d = Math.hypot(s.x - 10, s.z - 10);
      expect(d).toBeGreaterThanOrEqual(0.79);
      expect(d).toBeLessThanOrEqual(1.41);
    }
    for (let i = 0; i < spots.length; i++)
      for (let j = i + 1; j < spots.length; j++)
        expect(Math.hypot(spots[i]!.x - spots[j]!.x, spots[i]!.z - spots[j]!.z)).toBeGreaterThan(
          0.5,
        );
  });
});

describe('magnet with a full bag', () => {
  it('does not pull an item the bag cannot take, and still collects it later when there is room', () => {
    const no = () => false;
    let list = [pickup(MAGNET_RADIUS - 0.5, 0)];
    const startX = list[0]!.pos.x;
    for (let i = 0; i < 120; i++) list = stepPickups(list, player, 0.016, no, no).pickups;
    expect(list[0]?.pos.x).toBe(startX);
    for (let i = 0; i < 300 && list.length > 0; i++) {
      list = stepPickups(list, player, 0.016, yes, yes).pickups;
    }
    expect(list).toHaveLength(0);
  });

  it('only pulls the items that fit', () => {
    const fits = (item: string) => item === 'pearl';
    const a = { ...pickup(2.5, 0), item: 'pearl' as const };
    const b = { ...pickup(2.5, 1), id: 2, item: 'healingTea' as const };
    const r = stepPickups([a, b], player, 0.1, () => false, fits);
    expect(r.pickups.find((p) => p.id === a.id)!.pos.x).toBeLessThan(2.5);
    expect(r.pickups.find((p) => p.id === b.id)!.pos.x).toBe(2.5);
  });
});
