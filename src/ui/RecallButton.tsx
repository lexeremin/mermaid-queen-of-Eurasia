import { useEffect, useRef } from 'react';
import { recall, toggleRecall } from '@/game/recall-sim';
import { useGameStore } from '@/store/game-store';
import { combat } from '@/game/combat-sim';
import { sim } from '@/game/sim';
import { recallProgress } from '@/systems/recall';
import { UiIcon } from '@/ui/icons';

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A small round icon, not part of the main skill bar: channel Recall to return to Red Square (T). */
export function RecallButton({ touch }: { touch: boolean }) {
  const ring = useRef<SVGCircleElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const blocked = useGameStore(
    (s) =>
      s.paused ||
      s.inventoryOpen ||
      !!s.questPanel ||
      s.dialogueOpen ||
      s.downed ||
      s.transitioning,
  );

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = recallProgress(recall);
      if (ring.current) ring.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - p));
      if (button.current) button.current.dataset.casting = recall.active ? '1' : '0';
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <button
      ref={button}
      type="button"
      className="recall-btn"
      disabled={blocked}
      title="Recall (T): channel for 3 s, without moving, to return to Red Square"
      aria-label="Recall to Red Square"
      onClick={() => {
        if (!recall.active) sim.path = [];
        toggleRecall(!combat.downed);
      }}
    >
      <svg className="recall-ring" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={RADIUS} className="recall-ring-back" />
        <circle
          ref={ring}
          cx="22"
          cy="22"
          r={RADIUS}
          className="recall-ring-fill"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
        />
      </svg>
      <UiIcon id="recall" size={26} />
      {!touch && <kbd>T</kbd>}
    </button>
  );
}
