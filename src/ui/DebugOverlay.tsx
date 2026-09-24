import { useEffect, useRef } from 'react';
import { renderStats } from '@/game/render-stats';
import { sim } from '@/game/sim';
import { ACTIONS, getMove, input } from '@/input/input-state';
import { useGameStore } from '@/store/game-store';

export function DebugOverlay() {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const move = getMove(input);
        const { paused, inventoryOpen, zone } = useGameStore.getState();
        const held = ACTIONS.filter((a) => input.held[a]).join(',') || '-';
        el.textContent = [
          `pos  ${sim.curr.pos.x.toFixed(2)}, ${sim.curr.pos.z.toFixed(2)}`,
          `face ${sim.curr.facing.x.toFixed(2)}, ${sim.curr.facing.z.toFixed(2)}`,
          `move ${move.x.toFixed(2)}, ${move.z.toFixed(2)}`,
          `aim  ${input.aim.x.toFixed(2)}, ${input.aim.z.toFixed(2)}`,
          `held ${held}`,
          `paused ${paused} inv ${inventoryOpen} zone ${zone?.id ?? '-'}`,
          `draw ${renderStats.calls} tris ${renderStats.triangles}`,
          `clip ${renderStats.clip} tailZ ${renderStats.tailZ.toFixed(3)}`,
        ].join('\n');
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <pre ref={ref} className="debug-overlay" />;
}
