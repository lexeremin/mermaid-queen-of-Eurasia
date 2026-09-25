import { create } from 'zustand';
import type { Zone } from '@/systems/zones';

export type HeroForm = 'human' | 'mermaid';
export type PlaceId = 'board' | 'shrine' | 'metro-down' | 'metro-up';
export type QuestPanel = 'log' | 'board' | null;

export type GameState = {
  paused: boolean;
  inventoryOpen: boolean;
  /** Quest panel: the read-only log, or the notice board where quests are accepted and claimed. */
  questPanel: QuestPanel;
  dialogueOpen: boolean;
  /** The loading screen: assets, the first scene commit, shader compile and the walk grid are not ready yet. */
  loading: boolean;
  setLoading: (loading: boolean) => void;
  /** The welcome screen of a brand new game. */
  welcomeOpen: boolean;
  /** The keybindings popup (opened from the menu or the welcome screen). */
  controlsOpen: boolean;
  /** Menu popups: settings, and the "start a new game?" confirmation. */
  settingsOpen: boolean;
  newGameOpen: boolean;
  /** The map overlay. On touch it is a blocking screen (`mapBlocking`); on desktop the world keeps running. */
  mapOpen: boolean;
  mapBlocking: boolean;
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
  setWelcomeOpen: (open: boolean) => void;
  setControlsOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setNewGameOpen: (open: boolean) => void;
  toggleMap: (blocking: boolean) => void;
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
  loading: false,
  setLoading: (loading) => set({ loading }),
  welcomeOpen: false,
  controlsOpen: false,
  settingsOpen: false,
  newGameOpen: false,
  mapOpen: false,
  mapBlocking: false,
  downed: false,
  nearbyNpc: null,
  nearPlace: null,
  zone: null,
  underground: false,
  transitioning: false,
  setUnderground: (underground) => set({ underground }),
  setTransitioning: (transitioning) => set({ transitioning }),
  setDialogueOpen: (dialogueOpen) => set({ dialogueOpen }),
  setWelcomeOpen: (welcomeOpen) => set({ welcomeOpen, controlsOpen: false }),
  setControlsOpen: (controlsOpen) => set({ controlsOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setNewGameOpen: (newGameOpen) => set({ newGameOpen }),
  toggleMap: (blocking) =>
    set((s) => {
      if (s.paused || s.welcomeOpen || s.dialogueOpen || s.downed) return s;
      if (s.mapOpen) return { mapOpen: false, mapBlocking: false };
      return { mapOpen: true, mapBlocking: blocking, inventoryOpen: false, questPanel: null };
    }),
  setDowned: (downed) => set({ downed }),
  setNearbyNpc: (nearbyNpc) => set({ nearbyNpc }),
  setNearPlace: (nearPlace) => set({ nearPlace }),
  openQuestPanel: (questPanel) =>
    set((s) => (s.paused || s.dialogueOpen || s.downed ? s : { questPanel, inventoryOpen: false })),
  closeQuestPanel: () => set({ questPanel: null }),
  toggleQuestLog: () =>
    set((s) => {
      if (s.paused || s.dialogueOpen || s.downed) return s;
      return s.questPanel
        ? { questPanel: null }
        : { questPanel: 'log', inventoryOpen: false, mapOpen: false, mapBlocking: false };
    }),
  form: 'human',
  setForm: (form) => set({ form }),
  setZone: (zone) => set({ zone }),
  setPaused: (paused) =>
    set(
      paused
        ? { paused, inventoryOpen: false, questPanel: null, mapOpen: false, mapBlocking: false }
        : { paused },
    ),
  togglePause: () =>
    set((s) => ({
      paused: !s.paused,
      inventoryOpen: false,
      questPanel: null,
      mapOpen: false,
      mapBlocking: false,
    })),
  toggleInventory: () =>
    set((s) =>
      s.paused || s.dialogueOpen
        ? s
        : { inventoryOpen: !s.inventoryOpen, questPanel: null, mapOpen: false, mapBlocking: false },
    ),
  handleEscape: () => {
    if (get().downed) return;
    if (get().controlsOpen) set({ controlsOpen: false });
    else if (get().newGameOpen) set({ newGameOpen: false });
    else if (get().settingsOpen) set({ settingsOpen: false });
    else if (get().welcomeOpen) return;
    else if (get().mapOpen) set({ mapOpen: false, mapBlocking: false });
    else if (get().questPanel) set({ questPanel: null });
    else if (get().inventoryOpen) set({ inventoryOpen: false });
    else get().togglePause();
  },
}));

export function isSimRunning(
  state: Pick<
    GameState,
    | 'paused'
    | 'inventoryOpen'
    | 'questPanel'
    | 'dialogueOpen'
    | 'downed'
    | 'transitioning'
    | 'welcomeOpen'
    | 'mapBlocking'
    | 'loading'
  >,
): boolean {
  return (
    !state.paused &&
    !state.inventoryOpen &&
    !state.questPanel &&
    !state.dialogueOpen &&
    !state.downed &&
    !state.transitioning &&
    !state.welcomeOpen &&
    !state.mapBlocking &&
    !state.loading
  );
}
