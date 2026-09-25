import { useEffect, useRef } from 'react';
import { drawMap } from '@/game/map/map-draw';
import { fitRegion, regionFor } from '@/game/map/map-view';
import { sim } from '@/game/sim';
import { useGameStore } from '@/store/game-store';

const dpr = () => Math.min(2, window.devicePixelRatio || 1);

/** A small map that follows Rosa. Tapping or clicking it opens the full map. */
export function MiniMap({ touch }: { touch: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = touch ? 88 : 200;
  const toggleMap = useGameStore((s) => s.toggleMap);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ratio = dpr();
    el.width = size * ratio;
    el.height = size * ratio;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const tick = () => {
      const pos = sim.curr.pos;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawMap(
        ctx,
        { cx: pos.x, cz: pos.z, scale: touch ? 2.2 : 3.4, width: size, height: size },
        regionFor(pos.z),
        { labels: false, enemyRange: 45, marker: touch ? 3 : 4 },
      );
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [size, touch]);

  return (
    <button
      type="button"
      className={touch ? 'minimap minimap-touch' : 'minimap'}
      aria-label="Open map"
      title="Map (M / Tab)"
      onClick={() => toggleMap(touch)}
    >
      <canvas ref={canvas} style={{ width: size, height: size }} />
    </button>
  );
}

/** The full map over the screen. On desktop the world keeps running underneath; on touch it is a full screen. */
export function MapOverlay({ touch }: { touch: boolean }) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const toggleMap = useGameStore((s) => s.toggleMap);
  const region = regionFor(sim.curr.pos.z);

  useEffect(() => {
    const box = holder.current;
    const el = canvas.current;
    if (!box || !el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const tick = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      const ratio = dpr();
      if (el.width !== Math.round(w * ratio) || el.height !== Math.round(h * ratio)) {
        el.width = Math.round(w * ratio);
        el.height = Math.round(h * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const current = regionFor(sim.curr.pos.z);
      const view = fitRegion(current, w, h, touch ? 20 : 36);
      drawMap(ctx, view, current, { labels: true, enemyRange: 30, marker: touch ? 4 : 5 });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [touch]);

  return (
    <div className={touch ? 'map-overlay map-overlay-touch' : 'map-overlay'}>
      <div className="map-title">{region.label}</div>
      <div ref={holder} className="map-holder">
        <canvas ref={canvas} />
      </div>
      {touch && (
        <button type="button" className="hud-btn primary map-close" onClick={() => toggleMap(true)}>
          Close
        </button>
      )}
    </div>
  );
}
