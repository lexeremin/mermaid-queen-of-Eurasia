import { create } from 'zustand';
import type { Zone } from '@/systems/zones';

export type HeroForm = 'human' | 'mermaid';

export type GameState = {
  paused: boolean;
  inventoryOpen: boolean;
  zone: Zone | null;
  form: HeroForm;
  setForm: (form: HeroForm) => void;
  setZone: (zone: Zone | null) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  toggleInventory: () => void;
  handleEscape: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  paused: false,
  inventoryOpen: false,
  zone: null,
  form: 'human',
  setForm: (form) => set({ form }),
  setZone: (zone) => set({ zone }),
  setPaused: (paused) => set(paused ? { paused, inventoryOpen: false } : { paused }),
  togglePause: () => set((s) => ({ paused: !s.paused, inventoryOpen: false })),
  toggleInventory: () => set((s) => (s.paused ? s : { inventoryOpen: !s.inventoryOpen })),
  handleEscape: () => {
    if (get().inventoryOpen) set({ inventoryOpen: false });
    else get().togglePause();
  },
}));

export function isSimRunning(state: Pick<GameState, 'paused' | 'inventoryOpen'>): boolean {
  return !state.paused && !state.inventoryOpen;
}
