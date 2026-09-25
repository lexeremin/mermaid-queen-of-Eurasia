import { DefaultLoadingManager } from 'three';
import { create } from 'zustand';

/** Which of the start-up steps behind the loading screen are done. */
type LoadingState = {
  /** Every model and texture of the first scene is committed to the screen. */
  sceneMounted: boolean;
  /** Shaders are compiled and textures uploaded. */
  warmed: boolean;
  /**
   * While true the underground's lights, floors and props are mounted (invisible, behind the loading screen) so the
   * shader variants for both light counts are compiled up front and going down the metro never hitches.
   */
  warmUnderground: boolean;
  setWarmUnderground: (on: boolean) => void;
  /** The walkability grid is filled. */
  navReady: boolean;
  setSceneMounted: () => void;
  setWarmed: () => void;
  setNavReady: () => void;
};

export const useLoadingState = create<LoadingState>((set) => ({
  sceneMounted: false,
  warmed: false,
  warmUnderground: true,
  setWarmUnderground: (warmUnderground) => set({ warmUnderground }),
  navReady: false,
  setSceneMounted: () => set({ sceneMounted: true }),
  setWarmed: () => set({ warmed: true }),
  setNavReady: () => set({ navReady: true }),
}));

/**
 * Follows three's shared loading manager (every GLB and texture goes through it). It is a plain object, not store
 * state: the manager reports from inside React renders (a texture is requested while a component renders), and
 * writing a store from there makes the still-suspended scene render again and again.
 */
export const assets = { loaded: 0, total: 0, idle: false };
DefaultLoadingManager.onStart = (_url, loaded, total) => {
  assets.loaded = loaded;
  assets.total = total;
  assets.idle = false;
};
DefaultLoadingManager.onProgress = (_url, loaded, total) => {
  assets.loaded = loaded;
  assets.total = total;
};
DefaultLoadingManager.onLoad = () => {
  assets.loaded = assets.total;
  assets.idle = true;
};

/**
 * Overall progress 0..1 for the bar: assets 60% (the loader's own progress until the scene is mounted), shader
 * warm-up 15%, walk grid 25%.
 */
export function loadingProgress(state: LoadingState): number {
  const loaded = assets.total > 0 ? assets.loaded / assets.total : 0;
  const a = state.sceneMounted ? 1 : Math.min(1, Math.max(0, loaded)) * 0.95;
  return 0.6 * a + 0.15 * (state.warmed ? 1 : 0) + 0.25 * (state.navReady ? 1 : 0);
}

export const isLoadingDone = (state: LoadingState): boolean =>
  state.sceneMounted && state.warmed && state.navReady;
