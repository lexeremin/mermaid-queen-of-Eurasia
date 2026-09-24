import { create } from 'zustand';

/** Whole-number health and mana for the HUD; updated only when a displayed value changes. */
type CombatHud = {
  hp: number;
  mana: number;
  set: (hp: number, mana: number) => void;
};

export const useCombatStore = create<CombatHud>((set, get) => ({
  hp: 100,
  mana: 100,
  set: (hp, mana) => {
    const h = Math.ceil(hp);
    const m = Math.floor(mana);
    if (h !== get().hp || m !== get().mana) set({ hp: h, mana: m });
  },
}));
