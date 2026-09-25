import { useEffect, useState } from 'react';
import { loadingProgress, useLoadingState } from '@/game/loading-state';
import { useGameStore } from '@/store/game-store';

const FADE_MS = 350;

function statusOf(sceneMounted: boolean, warmed: boolean, nav: boolean): string {
  if (!sceneMounted) return 'Gathering the square';
  if (!warmed) return 'Lighting the lanterns';
  if (!nav) return 'Learning the paths';
  return 'Ready';
}

/** Covers the game while it starts up; fades out when everything is ready. */
export function LoadingScreen() {
  const loading = useGameStore((s) => s.loading);
  const state = useLoadingState();
  const [shown, setShown] = useState(true);
  const [, tick] = useState(0);

  // The loader's numbers are a plain object: look at them a few times a second.
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 120);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = window.setTimeout(() => setShown(false), FADE_MS);
    return () => window.clearTimeout(t);
  }, [loading]);

  if (!shown) return null;
  const value = loadingProgress(state);
  return (
    <div className={loading ? 'loading-screen' : 'loading-screen out'} role="status">
      <h1 className="menu-title">
        Mermaid Queen <span>of Eurasia</span>
      </h1>
      <div className="loading-bar" aria-label={`Loading ${Math.round(value * 100)} percent`}>
        <div className="loading-fill" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <p className="loading-text">{statusOf(state.sceneMounted, state.warmed, state.navReady)}</p>
    </div>
  );
}
