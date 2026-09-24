import { create } from 'zustand';
import type { Zone } from '@/systems/zones';

export type HeroForm = 'human' | 'mermaid';

export type GameState = {
  paused: boolean;
  inventoryOpen: boolean;
  dialogueOpen: boolean;
  downed: boolean;
  nearbyNpc: string | null;
  zone: Zone | null;
  form: HeroForm;
  setForm: (form: HeroForm) => void;
  setZone: (zone: Zone | null) => void;
  setDialogueOpen: (open: boolean) => void;
  setDowned: (downed: boolean) => void;
  setNearbyNpc: (id: string | null) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  toggleInventory: () => void;
  handleEscape: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  paused: false,
  inventoryOpen: false,
  dialogueOpen: false,
  downed: false,
  nearbyNpc: null,
  zone: null,
  setDialogueOpen: (dialogueOpen) => set({ dialogueOpen }),
  setDowned: (downed) => set({ downed }),
  setNearbyNpc: (nearbyNpc) => set({ nearbyNpc }),
  form: 'human',
  setForm: (form) => set({ form }),
  setZone: (zone) => set({ zone }),
  setPaused: (paused) => set(paused ? { paused, inventoryOpen: false } : { paused }),
  togglePause: () => set((s) => ({ paused: !s.paused, inventoryOpen: false })),
  toggleInventory: () =>
    set((s) => (s.paused || s.dialogueOpen ? s : { inventoryOpen: !s.inventoryOpen })),
  handleEscape: () => {
    if (get().downed) return;
    if (get().inventoryOpen) set({ inventoryOpen: false });
    else get().togglePause();
  },
}));

export function isSimRunning(
  state: Pick<GameState, 'paused' | 'inventoryOpen' | 'dialogueOpen' | 'downed'>,
): boolean {
  return !state.paused && !state.inventoryOpen && !state.dialogueOpen && !state.downed;
}
