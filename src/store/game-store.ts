import { create } from 'zustand';
import type { Zone } from '@/systems/zones';

export type HeroForm = 'human' | 'mermaid';
export type PlaceId = 'board' | 'shrine' | 'metro-down' | 'metro-up' | 'boss-door';
export type QuestPanel = 'log' | 'board' | null;

export type GameState = {
  paused: boolean;
  inventoryOpen: boolean;
  /** Quest panel: the read-only log, or the notice board where quests are accepted and claimed. */
  questPanel: QuestPanel;
  dialogueOpen: boolean;
  downed: boolean;
  nearbyNpc: string | null;
  /** The notice board or shrine Rosa is close enough to use, if any. */
  nearPlace: PlaceId | null;
  zone: Zone | null;
  /** Rosa is in the Moscow underground region (drives the mood, the lights and what is drawn). */
  underground: boolean;
  /** A fade between the surface and the underground is running; the world waits. */
  transitioning: boolean;
  form: HeroForm;
  setForm: (form: HeroForm) => void;
  setZone: (zone: Zone | null) => void;
  setUnderground: (underground: boolean) => void;
  setTransitioning: (transitioning: boolean) => void;
  setDialogueOpen: (open: boolean) => void;
  setDowned: (downed: boolean) => void;
  setNearbyNpc: (id: string | null) => void;
  setNearPlace: (place: PlaceId | null) => void;
  openQuestPanel: (panel: 'log' | 'board') => void;
  closeQuestPanel: () => void;
  toggleQuestLog: () => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  toggleInventory: () => void;
  handleEscape: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  paused: false,
  inventoryOpen: false,
  questPanel: null,
  dialogueOpen: false,
  downed: false,
  nearbyNpc: null,
  nearPlace: null,
  zone: null,
  underground: false,
  transitioning: false,
  setUnderground: (underground) => set({ underground }),
  setTransitioning: (transitioning) => set({ transitioning }),
  setDialogueOpen: (dialogueOpen) => set({ dialogueOpen }),
  setDowned: (downed) => set({ downed }),
  setNearbyNpc: (nearbyNpc) => set({ nearbyNpc }),
  setNearPlace: (nearPlace) => set({ nearPlace }),
  openQuestPanel: (questPanel) =>
    set((s) => (s.paused || s.dialogueOpen || s.downed ? s : { questPanel, inventoryOpen: false })),
  closeQuestPanel: () => set({ questPanel: null }),
  toggleQuestLog: () =>
    set((s) => {
      if (s.paused || s.dialogueOpen || s.downed) return s;
      return s.questPanel ? { questPanel: null } : { questPanel: 'log', inventoryOpen: false };
    }),
  form: 'human',
  setForm: (form) => set({ form }),
  setZone: (zone) => set({ zone }),
  setPaused: (paused) =>
    set(paused ? { paused, inventoryOpen: false, questPanel: null } : { paused }),
  togglePause: () => set((s) => ({ paused: !s.paused, inventoryOpen: false, questPanel: null })),
  toggleInventory: () =>
    set((s) =>
      s.paused || s.dialogueOpen ? s : { inventoryOpen: !s.inventoryOpen, questPanel: null },
    ),
  handleEscape: () => {
    if (get().downed) return;
    if (get().questPanel) set({ questPanel: null });
    else if (get().inventoryOpen) set({ inventoryOpen: false });
    else get().togglePause();
  },
}));

export function isSimRunning(
  state: Pick<
    GameState,
    'paused' | 'inventoryOpen' | 'questPanel' | 'dialogueOpen' | 'downed' | 'transitioning'
  >,
): boolean {
  return (
    !state.paused &&
    !state.inventoryOpen &&
    !state.questPanel &&
    !state.dialogueOpen &&
    !state.downed &&
    !state.transitioning
  );
}
