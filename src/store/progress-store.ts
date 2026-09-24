import { create } from 'zustand';
import { STARTER_EQUIPMENT, type EquipSlot, type ItemId } from '@/data/items';
import {
  addToBag,
  emptyBag,
  equipFromBag,
  removeFromBag,
  unequipToBag,
  type AddResult,
  type Bag,
  type EquipResult,
} from '@/systems/inventory';
import { addXp, computeStats, type Equipment, type PlayerStats } from '@/systems/progression';

export type ProgressSnapshot = {
  level: number;
  xp: number;
  awarded: string[];
  bag: Bag;
  equipment: Equipment;
};

export const starterEquipment = (): Equipment => ({ ...STARTER_EQUIPMENT });

export const defaultProgress = (): ProgressSnapshot => ({
  level: 1,
  xp: 0,
  awarded: [],
  bag: emptyBag(),
  equipment: starterEquipment(),
});

type ProgressState = ProgressSnapshot & {
  /** Adds XP; returns the number of levels gained. */
  gainXp: (amount: number) => number;
  /** Awards `amount` XP once per `key`, ever. Returns false if already awarded. */
  award: (key: string, amount: number) => { awarded: boolean; levelsGained: number };
  setBag: (bag: Bag) => void;
  addItem: (id: ItemId, qty?: number) => AddResult;
  removeAt: (index: number, qty?: number) => void;
  equip: (index: number) => EquipResult;
  unequip: (slot: EquipSlot) => EquipResult;
  hydrate: (snapshot: ProgressSnapshot) => void;
  reset: () => void;
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...defaultProgress(),

  gainXp: (amount) => {
    const { level, xp } = get();
    const result = addXp({ level, xp }, amount);
    set({ level: result.progress.level, xp: result.progress.xp });
    return result.levelsGained;
  },

  award: (key, amount) => {
    if (get().awarded.includes(key)) return { awarded: false, levelsGained: 0 };
    set({ awarded: [...get().awarded, key] });
    return { awarded: true, levelsGained: get().gainXp(amount) };
  },

  setBag: (bag) => set({ bag }),

  addItem: (id, qty = 1) => {
    const result = addToBag(get().bag, id, qty);
    if (result.added > 0) set({ bag: result.bag });
    return result;
  },

  removeAt: (index, qty = 1) => set({ bag: removeFromBag(get().bag, index, qty).bag }),

  equip: (index) => {
    const result = equipFromBag(get().bag, get().equipment, index);
    if (result.ok) set({ bag: result.bag, equipment: result.equipment });
    return result;
  },

  unequip: (slot) => {
    const result = unequipToBag(get().bag, get().equipment, slot);
    if (result.ok) set({ bag: result.bag, equipment: result.equipment });
    return result;
  },

  hydrate: (snapshot) => set({ ...snapshot }),
  reset: () => set({ ...defaultProgress() }),
}));

export const selectStats = (s: Pick<ProgressSnapshot, 'level' | 'equipment'>): PlayerStats =>
  computeStats(s.level, s.equipment);

export const currentStats = (): PlayerStats => selectStats(useProgressStore.getState());
