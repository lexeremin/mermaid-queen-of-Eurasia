import { ITEMS, type EquipSlot, type ItemId } from '@/data/items';
import type { Equipment } from '@/systems/progression';

export const BAG_SIZE = 20;

export type Stack = { id: ItemId; qty: number };
export type Bag = (Stack | null)[];

export const emptyBag = (): Bag => Array.from({ length: BAG_SIZE }, () => null);

export type AddResult = { bag: Bag; added: number; leftover: number };

/** Adds items, topping up existing stacks first, then using empty slots. Never mutates. */
export function addToBag(bag: Bag, id: ItemId, qty = 1): AddResult {
  const next = bag.map((s) => (s ? { ...s } : null));
  const max = ITEMS[id].stack;
  let remaining = qty;
  for (const slot of next) {
    if (remaining <= 0) break;
    if (slot && slot.id === id && slot.qty < max) {
      const take = Math.min(max - slot.qty, remaining);
      slot.qty += take;
      remaining -= take;
    }
  }
  for (let i = 0; i < next.length && remaining > 0; i++) {
    if (next[i] === null) {
      const take = Math.min(max, remaining);
      next[i] = { id, qty: take };
      remaining -= take;
    }
  }
  return { bag: next, added: qty - remaining, leftover: remaining };
}

export function removeFromBag(
  bag: Bag,
  index: number,
  qty = 1,
): { bag: Bag; removed: Stack | null } {
  const slot = bag[index];
  if (!slot) return { bag, removed: null };
  const take = Math.min(qty, slot.qty);
  const next = bag.map((s) => (s ? { ...s } : null));
  const target = next[index];
  if (target) {
    target.qty -= take;
    if (target.qty <= 0) next[index] = null;
  }
  return { bag: next, removed: { id: slot.id, qty: take } };
}

export const countOf = (bag: Bag, id: ItemId): number =>
  bag.reduce((n, s) => (s && s.id === id ? n + s.qty : n), 0);

export const firstIndexOf = (bag: Bag, id: ItemId): number => bag.findIndex((s) => s?.id === id);

export const hasSpaceFor = (bag: Bag, id: ItemId): boolean => addToBag(bag, id, 1).leftover === 0;

export type EquipResult =
  | { ok: true; bag: Bag; equipment: Equipment }
  | { ok: false; reason: 'not-equipment' | 'bag-full' | 'empty' };

/** Equips the bag item at `index`. The previously equipped item goes to the freed bag slot. */
export function equipFromBag(bag: Bag, equipment: Equipment, index: number): EquipResult {
  const slot = bag[index];
  if (!slot) return { ok: false, reason: 'empty' };
  const def = ITEMS[slot.id];
  if (def.kind !== 'equipment') return { ok: false, reason: 'not-equipment' };
  const { bag: without } = removeFromBag(bag, index, 1);
  const previous = equipment[def.slot];
  let next = without;
  if (previous) {
    const added = addToBag(without, previous, 1);
    if (added.leftover > 0) return { ok: false, reason: 'bag-full' };
    next = added.bag;
  }
  return { ok: true, bag: next, equipment: { ...equipment, [def.slot]: slot.id } };
}

export function unequipToBag(bag: Bag, equipment: Equipment, slot: EquipSlot): EquipResult {
  const current = equipment[slot];
  if (!current) return { ok: false, reason: 'empty' };
  const added = addToBag(bag, current, 1);
  if (added.leftover > 0) return { ok: false, reason: 'bag-full' };
  return { ok: true, bag: added.bag, equipment: { ...equipment, [slot]: null } };
}
