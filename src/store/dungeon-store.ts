import { create } from 'zustand';

/** What is saved of the underground. */
export type DungeonSnapshot = {
  /** Every monster of the three halls has been defeated at least once (a quest milestone). */
  hallsCleared: boolean;
  bossDefeated: boolean;
  /** Ids of the chests already opened (each can be opened once ever). */
  cachesTaken: string[];
};

export const defaultDungeon = (): DungeonSnapshot => ({
  hallsCleared: false,
  bossDefeated: false,
  cachesTaken: [],
});

type DungeonState = DungeonSnapshot & {
  /**
   * The boss gate is open right now. Not saved: it opens when the halls are cleared and shuts again when Rosa
   * leaves and re-enters (the halls refill), unless the boss is already beaten.
   */
  gateOpen: boolean;
  clearHalls: () => void;
  openGate: () => void;
  closeGate: () => void;
  defeatBoss: () => void;
  takeCache: (id: string) => void;
  hydrate: (snapshot: DungeonSnapshot) => void;
  reset: () => void;
};

export const useDungeonStore = create<DungeonState>((set, get) => ({
  ...defaultDungeon(),
  gateOpen: false,
  clearHalls: () => set({ hallsCleared: true }),
  openGate: () => set({ gateOpen: true }),
  closeGate: () => set({ gateOpen: get().bossDefeated }),
  defeatBoss: () => set({ bossDefeated: true, gateOpen: true }),
  takeCache: (id) => {
    if (!get().cachesTaken.includes(id)) set({ cachesTaken: [...get().cachesTaken, id] });
  },
  hydrate: (snapshot) =>
    set({ ...snapshot, cachesTaken: [...snapshot.cachesTaken], gateOpen: snapshot.bossDefeated }),
  reset: () => set({ ...defaultDungeon(), gateOpen: false }),
}));
