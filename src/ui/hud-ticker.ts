import { useEffect } from 'react';

/** One shared animation-frame loop for every HUD element that reads the game state each frame. */
const tasks = new Set<(now: number) => void>();
let raf = 0;

function loop(now: number): void {
  for (const task of tasks) task(now);
  raf = tasks.size > 0 ? requestAnimationFrame(loop) : 0;
}

export function addHudTask(task: (now: number) => void): () => void {
  tasks.add(task);
  if (raf === 0) raf = requestAnimationFrame(loop);
  return () => {
    tasks.delete(task);
    if (tasks.size === 0 && raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/** Runs `task` on the shared frame loop while the component is mounted. */
export function useHudTask(task: (now: number) => void, deps: readonly unknown[] = []): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => addHudTask(task), deps);
}
