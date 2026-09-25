import { create } from 'zustand';
import { MAX_LAYER } from '@/data/maps/underground';

/** What is saved of the underground. */
export type DungeonSnapshot = {
  /** Every monster of a layer has been defeated at least once (a quest milestone). */
  hallsCleared: boolean;
  /** The first boss (layer 10) has been defeated at least once (a quest milestone). */
  bossDefeated: boolean;
  /** Ids of the chests already opened (each can be opened once ever), like `L12-c1`. */
  cachesTaken: string[];
  /** The layer Rosa is in (0 on the surface). */
  layer: number;
  /** The deepest layer she has reached. */
  deepest: number;
  /** The boss layers whose reward has been paid (the boss comes back each visit, the reward does not). */
  bossLayers: number[];
};

export const defaultDungeon = (): DungeonSnapshot => ({
  hallsCleared: false,
  bossDefeated: false,
  cachesTaken: [],
  layer: 0,
  deepest: 0,
  bossLayers: [],
});

type DungeonState = DungeonSnapshot & {
  /**
   * The boss gate is open right now. Not saved: it opens when the layer's monsters are down and shuts again when
   * Rosa leaves and re-enters (the layer is made again).
   */
  gateOpen: boolean;
  /** Every monster of this layer is down (not saved: a layer's monsters come back when it is entered again). */
  layerCleared: boolean;
  clearHalls: () => void;
  openGate: () => void;
  closeGate: () => void;
  setLayerCleared: () => void;
  /** Rosa is now in this layer (0: on the surface). Remembers the deepest one and shuts the gate. */
  setLayer: (layer: number) => void;
  /** A boss layer's reward has been paid. The first boss counts for the quest. */
  payBoss: (layer: number) => void;
  takeCache: (id: string) => void;
  hydrate: (snapshot: DungeonSnapshot) => void;
  reset: () => void;
};

const clampLayer = (layer: number): number => Math.max(0, Math.min(MAX_LAYER, Math.floor(layer)));

export const useDungeonStore = create<DungeonState>((set, get) => ({
  ...defaultDungeon(),
  gateOpen: false,
  layerCleared: false,
  clearHalls: () => set({ hallsCleared: true }),
  openGate: () => set({ gateOpen: true }),
  closeGate: () => set({ gateOpen: false }),
  setLayerCleared: () => set({ layerCleared: true }),
  setLayer: (layer) => {
    const next = clampLayer(layer);
    set({
      layer: next,
      deepest: Math.max(get().deepest, next),
      gateOpen: false,
      layerCleared: false,
    });
  },
  payBoss: (layer) =>
    set({
      bossDefeated: true,
      bossLayers: get().bossLayers.includes(layer)
        ? get().bossLayers
        : [...get().bossLayers, layer],
    }),
  takeCache: (id) => {
    if (!get().cachesTaken.includes(id)) set({ cachesTaken: [...get().cachesTaken, id] });
  },
  hydrate: (snapshot) =>
    set({
      ...snapshot,
      cachesTaken: [...snapshot.cachesTaken],
      bossLayers: [...snapshot.bossLayers],
      gateOpen: false,
      layerCleared: false,
    }),
  reset: () => set({ ...defaultDungeon(), gateOpen: false, layerCleared: false }),
}));
