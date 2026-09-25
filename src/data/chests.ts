import type { ItemId } from '@/data/items';

export type ChestLoot = { label: string; items: readonly { id: ItemId; qty: number }[] };

/** What each underground chest holds (opened once ever): potions, then gear, then a rare charm. */
export const CHEST_LOOT: Readonly<Record<string, ChestLoot>> = {
  'chest-hall': {
    label: 'Ticket Hall chest',
    items: [
      { id: 'healingTea', qty: 3 },
      { id: 'coldKvass', qty: 3 },
    ],
  },
  'chest-platform': {
    label: 'Platform Hall chest',
    items: [
      { id: 'silverTrident', qty: 1 },
      { id: 'pearl', qty: 2 },
    ],
  },
  'chest-cellar': {
    label: 'Records Cellar chest',
    items: [
      { id: 'songbirdWhistle', qty: 1 },
      { id: 'healingTea', qty: 2 },
    ],
  },
};
