import { create } from 'zustand';

export type ArchangelSnapshot = {
  /** Ids of the archangels already saved. */
  saved: string[];
};

export const defaultArchangels = (): ArchangelSnapshot => ({ saved: [] });

type ArchangelState = ArchangelSnapshot & {
  save: (id: string) => void;
  hydrate: (snapshot: ArchangelSnapshot) => void;
  reset: () => void;
};

export const useArchangelStore = create<ArchangelState>((set, get) => ({
  ...defaultArchangels(),
  save: (id) => {
    if (!get().saved.includes(id)) set({ saved: [...get().saved, id] });
  },
  hydrate: (snapshot) => set({ saved: [...snapshot.saved] }),
  reset: () => set({ ...defaultArchangels() }),
}));
