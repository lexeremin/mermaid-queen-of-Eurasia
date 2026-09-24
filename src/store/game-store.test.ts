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
