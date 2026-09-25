import { beforeEach, describe, expect, it } from 'vitest';
import { isSimRunning, useGameStore } from '@/store/game-store';

const state = () => useGameStore.getState();

describe('game store', () => {
  beforeEach(() =>
    useGameStore.setState({ paused: false, inventoryOpen: false, questPanel: null }),
  );

  it('runs the sim only when not paused and no panel is open', () => {
    expect(isSimRunning(state())).toBe(true);
    state().togglePause();
    expect(isSimRunning(state())).toBe(false);
    state().togglePause();
    state().toggleInventory();
    expect(isSimRunning(state())).toBe(false);
  });

  it('ESC closes the inventory first, then toggles pause', () => {
    state().toggleInventory();
    state().handleEscape();
    expect(state().inventoryOpen).toBe(false);
    expect(state().paused).toBe(false);
    state().handleEscape();
    expect(state().paused).toBe(true);
    state().handleEscape();
    expect(state().paused).toBe(false);
  });

  it('cannot open the inventory while paused, and pausing closes it', () => {
    state().setPaused(true);
    state().toggleInventory();
    expect(state().inventoryOpen).toBe(false);
    state().setPaused(false);
    state().toggleInventory();
    state().setPaused(true);
    expect(state().inventoryOpen).toBe(false);
  });

  it('the quest panel stops the sim, closes with ESC, and excludes the bag', () => {
    state().openQuestPanel('board');
    expect(isSimRunning(state())).toBe(false);
    state().toggleInventory();
    expect(state().questPanel).toBeNull();
    expect(state().inventoryOpen).toBe(true);
    state().toggleQuestLog();
    expect(state().questPanel).toBe('log');
    expect(state().inventoryOpen).toBe(false);
    state().handleEscape();
    expect(state().questPanel).toBeNull();
    expect(state().paused).toBe(false);
  });

  it('cannot open the quest panel while paused or fainted', () => {
    state().setPaused(true);
    state().openQuestPanel('log');
    expect(state().questPanel).toBeNull();
    state().setPaused(false);
    state().setDowned(true);
    state().toggleQuestLog();
    expect(state().questPanel).toBeNull();
    state().setDowned(false);
  });
});

describe('welcome screen and controls popup', () => {
  beforeEach(() =>
    useGameStore.setState({
      paused: false,
      inventoryOpen: false,
      questPanel: null,
      welcomeOpen: false,
      controlsOpen: false,
    }),
  );

  it('the welcome screen stops the sim until the game begins', () => {
    state().setWelcomeOpen(true);
    expect(isSimRunning(state())).toBe(false);
    state().setWelcomeOpen(false);
    expect(isSimRunning(state())).toBe(true);
  });

  it('ESC does not skip the welcome screen, but closes the controls popup on top of it', () => {
    state().setWelcomeOpen(true);
    state().handleEscape();
    expect(state().welcomeOpen).toBe(true);
    expect(state().paused).toBe(false);
    state().setControlsOpen(true);
    state().handleEscape();
    expect(state().controlsOpen).toBe(false);
    expect(state().welcomeOpen).toBe(true);
  });

  it('ESC closes the controls popup from the pause menu first, then the menu', () => {
    state().setPaused(true);
    state().setControlsOpen(true);
    state().handleEscape();
    expect(state().controlsOpen).toBe(false);
    expect(state().paused).toBe(true);
    state().handleEscape();
    expect(state().paused).toBe(false);
  });
});

describe('menu popups', () => {
  it('ESC closes the newest popup first: new game, then settings, then the menu', () => {
    state().setPaused(true);
    state().setSettingsOpen(true);
    state().setControlsOpen(true);
    state().handleEscape();
    expect(state().controlsOpen).toBe(false);
    expect(state().settingsOpen).toBe(true);
    state().setNewGameOpen(true);
    state().handleEscape();
    expect(state().newGameOpen).toBe(false);
    expect(state().settingsOpen).toBe(true);
    state().handleEscape();
    expect(state().settingsOpen).toBe(false);
    expect(state().paused).toBe(true);
    state().handleEscape();
    expect(state().paused).toBe(false);
  });
});

describe('map overlay', () => {
  beforeEach(() =>
    useGameStore.setState({
      paused: false,
      welcomeOpen: false,
      dialogueOpen: false,
      downed: false,
      inventoryOpen: false,
      questPanel: null,
      mapOpen: false,
      mapBlocking: false,
    }),
  );

  it('on desktop the world keeps running behind the map; on touch it waits', () => {
    state().toggleMap(false);
    expect(state().mapOpen).toBe(true);
    expect(isSimRunning(state())).toBe(true);
    state().toggleMap(false);
    expect(state().mapOpen).toBe(false);
    state().toggleMap(true);
    expect(isSimRunning(state())).toBe(false);
    state().toggleMap(true);
    expect(isSimRunning(state())).toBe(true);
  });

  it('ESC closes it, and opening the bag or the quest log replaces it', () => {
    state().toggleMap(true);
    state().handleEscape();
    expect(state().mapOpen).toBe(false);
    expect(state().mapBlocking).toBe(false);
    state().toggleMap(false);
    state().toggleInventory();
    expect(state().mapOpen).toBe(false);
    expect(state().inventoryOpen).toBe(true);
  });

  it('does not open over the pause menu, the welcome screen, a dialogue or when fainted', () => {
    for (const key of ['paused', 'welcomeOpen', 'dialogueOpen', 'downed'] as const) {
      useGameStore.setState({ [key]: true });
      state().toggleMap(false);
      expect(state().mapOpen, key).toBe(false);
      useGameStore.setState({ [key]: false });
    }
  });
});
