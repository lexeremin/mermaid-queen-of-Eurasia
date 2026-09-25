import { create } from 'zustand';

export type DungeonSnapshot = {
  /** The Chief Registrar's Stamp has been found (stays true even after it is used on the gate). */
  stampFound: boolean;
  /** The boss gate has been opened for good. */
  gateOpen: boolean;
  bossDefeated: boolean;
  /** Ids of the chests already opened (each can be opened once ever). */
  cachesTaken: string[];
};

export const defaultDungeon = (): DungeonSnapshot => ({
  stampFound: false,
  gateOpen: false,
  bossDefeated: false,
  cachesTaken: [],
});

type DungeonState = DungeonSnapshot & {
  findStamp: () => void;
  openGate: () => void;
  defeatBoss: () => void;
  takeCache: (id: string) => void;
  hydrate: (snapshot: DungeonSnapshot) => void;
  reset: () => void;
};

export const useDungeonStore = create<DungeonState>((set, get) => ({
  ...defaultDungeon(),
  findStamp: () => set({ stampFound: true }),
  openGate: () => set({ gateOpen: true }),
  defeatBoss: () => set({ bossDefeated: true }),
  takeCache: (id) => {
    if (!get().cachesTaken.includes(id)) set({ cachesTaken: [...get().cachesTaken, id] });
  },
  hydrate: (snapshot) => set({ ...snapshot, cachesTaken: [...snapshot.cachesTaken] }),
  reset: () => set({ ...defaultDungeon() }),
}));
