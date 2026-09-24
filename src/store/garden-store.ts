import { create } from 'zustand';

export type GardenSnapshot = {
  /** Ids of hidden pearls already taken (each can be taken once ever). */
  pearlsTaken: string[];
  /** The shrine's one-time gift (Pearl Trident and two pearls) was given. */
  shrineGift: boolean;
};

export const defaultGarden = (): GardenSnapshot => ({ pearlsTaken: [], shrineGift: false });

type GardenState = GardenSnapshot & {
  takePearl: (id: string) => void;
  giveShrineGift: () => void;
  hydrate: (snapshot: GardenSnapshot) => void;
  reset: () => void;
};

export const useGardenStore = create<GardenState>((set, get) => ({
  ...defaultGarden(),
  takePearl: (id) => {
    if (!get().pearlsTaken.includes(id)) set({ pearlsTaken: [...get().pearlsTaken, id] });
  },
  giveShrineGift: () => set({ shrineGift: true }),
  hydrate: (snapshot) => set({ ...snapshot }),
  reset: () => set({ ...defaultGarden() }),
}));
