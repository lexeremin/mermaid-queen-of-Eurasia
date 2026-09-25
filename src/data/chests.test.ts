import { describe, expect, it } from 'vitest';
import { CHEST_LOOT } from '@/data/chests';
import { ITEMS } from '@/data/items';
import { RED_SQUARE } from '@/data/maps/red-square';
import { addToBag, emptyBag } from '@/systems/inventory';

describe('chest loot', () => {
  it('has an entry for every chest on the map, and only those', () => {
    const ids = (RED_SQUARE.chests ?? []).map((c) => c.id).sort();
    expect(Object.keys(CHEST_LOOT).sort()).toEqual(ids);
  });

  it('holds real items, and each chest fits an empty bag', () => {
    for (const [id, loot] of Object.entries(CHEST_LOOT)) {
      let bag = emptyBag();
      for (const item of loot.items) {
        expect(ITEMS[item.id], `${id}: ${item.id}`).toBeDefined();
        const added = addToBag(bag, item.id, item.qty);
        expect(added.leftover, id).toBe(0);
        bag = added.bag;
      }
    }
  });

  it('goes potions, then gear, then a rare charm', () => {
    const kind = (id: string) => CHEST_LOOT[id]!.items.map((i) => ITEMS[i.id].kind);
    expect(kind('chest-hall').every((k) => k === 'consumable')).toBe(true);
    expect(kind('chest-platform')).toContain('equipment');
    const charm = CHEST_LOOT['chest-cellar']!.items.find((i) => ITEMS[i.id].kind === 'equipment')!;
    expect(ITEMS[charm.id].rarity).toBe('rare');
  });
});
