import { useEffect, useRef, useState } from 'react';
import { perf, perfEnabled } from '@/game/perf-probe';
import { useGameStore } from '@/store/game-store';
import { useProgressStore } from '@/store/progress-store';
import { useSettingsStore } from '@/store/settings-store';
import { resetFrameWindow, summarize } from '@/systems/frame-stats';
import { addHudTask } from '@/ui/hud-ticker';

type Memory = { usedJSHeapSize: number };

function report(): string {
  const s = summarize(perf.window);
  const memory = (performance as unknown as { memory?: Memory }).memory;
  const game = useGameStore.getState();
  const quality = useSettingsStore.getState().quality;
  const lines = [
    'Mermaid Queen perf report',
    `time ${new Date().toISOString()}`,
    `ua ${navigator.userAgent}`,
    `screen ${screen.width}x${screen.height} @${window.devicePixelRatio}, viewport ${innerWidth}x${innerHeight}, canvas ${perf.width}x${perf.height} @${perf.dpr.toFixed(2)}`,
    `gpu ${perf.gpu || '?'}`,
    `quality ${quality}, level ${useProgressStore.getState().level}, ${game.underground ? 'underground' : 'surface'}, zone ${game.zone?.id ?? '-'}`,
    `fps ${s.fps.toFixed(1)} (avg ${s.avgMs.toFixed(1)} ms, p95 ${s.p95Ms.toFixed(1)} ms, worst ${s.worstMs.toFixed(0)} ms)`,
    `stutters over 50 ms: ${s.spikes} in ${s.frames} frames (${s.seconds.toFixed(0)} s)`,
    `draw calls ${perf.calls}, triangles ${perf.triangles}, textures ${perf.textures}, geometries ${perf.geometries}`,
    memory ? `js heap ${(memory.usedJSHeapSize / 1048576).toFixed(0)} MB` : 'js heap n/a',
  ];
  return lines.join('\n');
}

/** A small panel with live numbers and a button that copies them as text (`?perf=1`). */
export function PerfOverlay() {
  const text = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!perfEnabled) return;
    let last = 0;
    return addHudTask(() => {
      const now = performance.now();
      if (now - last < 500 || !text.current) return;
      last = now;
      text.current.textContent = report().split('\n').slice(5).join('\n');
    });
  }, []);

  if (!perfEnabled) return null;

  const copy = () => {
    const body = report();
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(body).then(done, () => window.prompt('Copy this report', body));
    } else {
      window.prompt('Copy this report', body);
    }
  };

  return (
    <div className="perf-overlay">
      <pre ref={text} />
      <div className="perf-buttons">
        <button type="button" onClick={copy}>
          {copied ? 'Copied' : 'Copy report'}
        </button>
        <button type="button" onClick={() => resetFrameWindow(perf.window)}>
          Reset
        </button>
      </div>
    </div>
  );
}
