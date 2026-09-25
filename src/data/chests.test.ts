import { describe, expect, it } from 'vitest';
import { chestLoot } from '@/data/chests';
import { ITEMS } from '@/data/items';
import { MAX_LAYER, generateLayer } from '@/data/maps/underground';
import { addToBag, emptyBag } from '@/systems/inventory';

const ids = Array.from({ length: MAX_LAYER }, (_, i) => [`L${i + 1}-c1`, `L${i + 1}-c2`]).flat();

describe('chest loot', () => {
  it('is known for every chest of every layer, and for nothing else', () => {
    for (const id of ids) expect(chestLoot(id), id).not.toBeNull();
    for (const bad of ['chest-hall', 'L0-c1', 'L101-c1', 'L5-c', 'L5-c12', 'x', '']) {
      expect(chestLoot(bad), bad).toBeNull();
    }
  });

  it('gives a generated chest what its id says, every time', () => {
    for (const n of [1, 10, 55, 100]) {
      for (const chest of generateLayer(n).chests) expect(chestLoot(chest.id)).not.toBeNull();
    }
    expect(chestLoot('L12-c1')).toEqual(chestLoot('L12-c1'));
    expect(chestLoot('L12-c1')).not.toEqual(chestLoot('L13-c1'));
  });

  it('holds real items, and each chest fits an empty bag', () => {
    for (const id of ids) {
      let bag = emptyBag();
      for (const item of chestLoot(id)!.items) {
        expect(ITEMS[item.id], `${id}: ${item.id}`).toBeDefined();
        const added = addToBag(bag, item.id, item.qty);
        expect(added.leftover, id).toBe(0);
        bag = added.bag;
      }
    }
  });

  it('always has potions, and deeper chests hold better gear', () => {
    const gear = (id: string) =>
      chestLoot(id)!.items.filter((i) => ITEMS[i.id].kind === 'equipment');
    for (const id of ids) {
      expect(chestLoot(id)!.items.some((i) => i.id === 'healingTea')).toBe(true);
    }
    const rare = (from: number, to: number) =>
      ids
        .filter((id) => {
          const layer = Number(/^L(\d+)/.exec(id)![1]);
          return layer >= from && layer <= to;
        })
        .flatMap((id) => gear(id))
        .filter((i) => ITEMS[i.id].rarity === 'rare').length;
    expect(rare(1, 20)).toBeLessThan(rare(81, 100));
    expect(ids.some((id) => gear(id).length > 0)).toBe(true);
  });
});
