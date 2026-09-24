import { describe, expect, it } from 'vitest';
import {
  BAG_SIZE,
  addToBag,
  countOf,
  emptyBag,
  equipFromBag,
  firstIndexOf,
  hasSpaceFor,
  removeFromBag,
  unequipToBag,
} from '@/systems/inventory';
import type { Equipment } from '@/systems/progression';

const gear: Equipment = { weapon: 'trident', outfit: 'tweedJacket', charm: null };

describe('bag', () => {
  it('stacks up to the item limit and overflows into a new slot', () => {
    let bag = emptyBag();
    bag = addToBag(bag, 'healingTea', 9).bag;
    const r = addToBag(bag, 'healingTea', 3);
    expect(r.added).toBe(3);
    expect(r.bag.filter((s) => s?.id === 'healingTea').map((s) => s?.qty)).toEqual([9, 3]);
    expect(countOf(r.bag, 'healingTea')).toBe(12);
  });

  it('does not mutate the input bag', () => {
    const bag = addToBag(emptyBag(), 'pearl', 2).bag;
    const snapshot = JSON.stringify(bag);
    addToBag(bag, 'pearl', 5);
    removeFromBag(bag, 0, 1);
    expect(JSON.stringify(bag)).toBe(snapshot);
  });

  it('reports leftovers when the bag is full', () => {
    let bag = emptyBag();
    for (let i = 0; i < BAG_SIZE; i++)
      bag = addToBag(bag, i % 2 ? 'silverTrident' : 'rainCloak', 1).bag;
    const r = addToBag(bag, 'healingTea', 4);
    expect(r.added).toBe(0);
    expect(r.leftover).toBe(4);
    expect(hasSpaceFor(bag, 'healingTea')).toBe(false);
    expect(hasSpaceFor(emptyBag(), 'healingTea')).toBe(true);
  });

  it('a partly full stack still takes items when the bag is otherwise full', () => {
    let bag = emptyBag();
    for (let i = 0; i < BAG_SIZE - 1; i++) bag = addToBag(bag, 'silverTrident', 1).bag;
    bag = addToBag(bag, 'healingTea', 4).bag;
    expect(hasSpaceFor(bag, 'healingTea')).toBe(true);
    expect(addToBag(bag, 'healingTea', 5).leftover).toBe(0);
  });

  it('removes one at a time and clears empty slots', () => {
    const bag = addToBag(emptyBag(), 'coldKvass', 2).bag;
    const a = removeFromBag(bag, 0);
    expect(a.removed).toEqual({ id: 'coldKvass', qty: 1 });
    expect(a.bag[0]?.qty).toBe(1);
    const b = removeFromBag(a.bag, 0);
    expect(b.bag[0]).toBeNull();
    expect(removeFromBag(b.bag, 0).removed).toBeNull();
    expect(firstIndexOf(a.bag, 'coldKvass')).toBe(0);
    expect(firstIndexOf(a.bag, 'pearl')).toBe(-1);
  });
});

describe('equipping', () => {
  it('equips from the bag and returns the old item to the bag', () => {
    const bag = addToBag(emptyBag(), 'silverTrident', 1).bag;
    const r = equipFromBag(bag, gear, 0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.equipment.weapon).toBe('silverTrident');
      expect(countOf(r.bag, 'trident')).toBe(1);
      expect(countOf(r.bag, 'silverTrident')).toBe(0);
    }
  });

  it('fills an empty slot without touching the bag otherwise', () => {
    const bag = addToBag(emptyBag(), 'roseBrooch', 1).bag;
    const r = equipFromBag(bag, gear, 0);
    expect(r.ok && r.equipment.charm).toBe('roseBrooch');
    expect(r.ok && r.bag.every((s) => s === null)).toBe(true);
  });

  it('swaps even when the bag is otherwise full (the freed slot is reused)', () => {
    let bag = emptyBag();
    for (let i = 0; i < BAG_SIZE; i++) bag = addToBag(bag, 'silverTrident', 1).bag;
    expect(equipFromBag(bag, gear, 0).ok).toBe(true);
  });

  it('refuses non-equipment and empty slots', () => {
    const bag = addToBag(emptyBag(), 'healingTea', 1).bag;
    expect(equipFromBag(bag, gear, 0)).toEqual({ ok: false, reason: 'not-equipment' });
    expect(equipFromBag(bag, gear, 5)).toEqual({ ok: false, reason: 'empty' });
  });

  it('unequips into the bag, or refuses when it is full', () => {
    const ok = unequipToBag(emptyBag(), gear, 'weapon');
    expect(ok.ok && ok.equipment.weapon).toBeNull();
    expect(ok.ok && countOf(ok.bag, 'trident')).toBe(1);
    let full = emptyBag();
    for (let i = 0; i < BAG_SIZE; i++) full = addToBag(full, 'silverTrident', 1).bag;
    expect(unequipToBag(full, gear, 'weapon')).toEqual({ ok: false, reason: 'bag-full' });
    expect(unequipToBag(emptyBag(), gear, 'charm')).toEqual({ ok: false, reason: 'empty' });
  });
});
