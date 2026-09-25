import { create } from 'zustand';
import { STARTER_EQUIPMENT, type EquipSlot, type ItemId } from '@/data/items';
import {
  addToStash,
  emptyBag,
  emptyKeepsakes,
  equipFromBag,
  removeFromBag,
  unequipToBag,
  type AddResult,
  type Bag,
  type EquipResult,
  type Keepsakes,
} from '@/systems/inventory';
import { useGameStore } from '@/store/game-store';
import type { Form } from '@/systems/abilities';
import { addXp, computeStats, type Equipment, type PlayerStats } from '@/systems/progression';

export type ProgressSnapshot = {
  level: number;
  xp: number;
  awarded: string[];
  bag: Bag;
  /** Transformations unlocked (the human form is always available). */
  forms: Form[];
  /** Quest items (pearls...): counted, but they take no bag slot. */
  keepsakes: Keepsakes;
  equipment: Equipment;
};

export const starterEquipment = (): Equipment => ({ ...STARTER_EQUIPMENT });

export const defaultProgress = (): ProgressSnapshot => ({
  level: 1,
  xp: 0,
  awarded: [],
  bag: emptyBag(),
  forms: [],
  keepsakes: emptyKeepsakes(),
  equipment: starterEquipment(),
});

type ProgressState = ProgressSnapshot & {
  /** Adds XP; returns the number of levels gained. */
  gainXp: (amount: number) => number;
  /** Awards `amount` XP once per `key`, ever. Returns false if already awarded. */
  award: (key: string, amount: number) => { awarded: boolean; levelsGained: number };
  setBag: (bag: Bag) => void;
  setStash: (bag: Bag, keepsakes: Keepsakes) => void;
  unlockForm: (form: Form) => void;
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
  setStash: (bag, keepsakes) => set({ bag, keepsakes }),
  unlockForm: (form) => {
    if (!get().forms.includes(form)) set({ forms: [...get().forms, form] });
  },

  addItem: (id, qty = 1) => {
    const { bag, keepsakes } = get();
    const result = addToStash({ bag, keepsakes }, id, qty);
    if (result.added > 0) set({ bag: result.bag, keepsakes: result.keepsakes });
    return { bag: result.bag, added: result.added, leftover: result.leftover };
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

export const selectStats = (
  s: Pick<ProgressSnapshot, 'level' | 'equipment'> & { form?: Form },
): PlayerStats => computeStats(s.level, s.equipment, s.form);

export const currentStats = (): PlayerStats =>
  selectStats({ ...useProgressStore.getState(), form: useGameStore.getState().form });
