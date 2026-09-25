import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { assets, isLoadingDone, useLoadingState } from '@/game/loading-state';
import { navReady } from '@/game/world/nav';
import { useGameStore } from '@/store/game-store';

const MIN_SHOWN_MS = 500;
const startedAt = performance.now();

const frames = (n: number) =>
  new Promise<void>((resolve) => {
    const step = (left: number) =>
      left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
    step(n);
  });

/** Last child inside the Suspense: it mounts only once every model of the first scene has resolved. */
export function SceneReady() {
  const done = useLoadingState((s) => s.setSceneMounted);
  useEffect(() => done(), [done]);
  return null;
}

/**
 * Behind the loading screen: waits for the scene and the loaders to settle, compiles every shader and uploads the
 * textures (so the first playable frames do not stall), waits for the walk grid, then opens the game.
 */
export function LoadingGate() {
  const { gl, scene, camera } = useThree();
  const sceneMounted = useLoadingState((s) => s.sceneMounted);
  const setWarmed = useLoadingState((s) => s.setWarmed);
  const setWarmUnderground = useLoadingState((s) => s.setWarmUnderground);
  const setNavReady = useLoadingState((s) => s.setNavReady);

  useEffect(() => {
    void navReady.then(setNavReady);
  }, [setNavReady]);

  useEffect(() => {
    if (!sceneMounted) return;
    let cancelled = false;
    void (async () => {
      // Wait for every model and texture the loader knows about (polled: see `assets`).
      while (!assets.idle && !cancelled) await new Promise((r) => setTimeout(r, 100));
      const compile = async () => {
        try {
          await gl.compileAsync(scene, camera);
        } catch {
          // Compiling early is only an optimisation.
        }
      };
      await frames(2);
      // First with the underground's lights mounted (the seven-light variant), then without (the surface's three).
      await compile();
      await frames(1);
      setWarmUnderground(false);
      await frames(3);
      await compile();
      await frames(2);
      if (!cancelled) setWarmed();
    })();
    return () => {
      cancelled = true;
    };
  }, [sceneMounted, gl, scene, camera, setWarmed, setWarmUnderground]);

  useEffect(
    () =>
      useLoadingState.subscribe((state) => {
        if (!isLoadingDone(state)) return;
        const wait = Math.max(0, MIN_SHOWN_MS - (performance.now() - startedAt));
        window.setTimeout(() => useGameStore.getState().setLoading(false), wait);
      }),
    [],
  );
  return null;
}
