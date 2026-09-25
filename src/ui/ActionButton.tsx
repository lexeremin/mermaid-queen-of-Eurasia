import { useEffect, useMemo, type CSSProperties } from 'react';
import { input, onInputReset, setHeld, type Action } from '@/input/input-state';
import { createPointerTracker } from '@/input/pointer-tracker';
import type { AbilityId } from '@/systems/abilities';
import { CooldownSweep } from '@/ui/CombatHud';
import { useGameStore } from '@/store/game-store';
import { useProgressStore } from '@/store/progress-store';
import { UNLOCK_LEVEL, isUnlocked } from '@/systems/skills';
import { AbilityIcon } from '@/ui/icons';

const ABILITY_OF: Record<Action, AbilityId | undefined> = {
  attack: 'attack',
  blink: 'blink',
  aura: 'aura',
  spell: 'spell',
  recall: undefined,
  form: undefined,
  interact: undefined,
};

type Props = { action: Action; label: string; size: number; style: CSSProperties };

export function ActionButton({ action, label, size, style }: Props) {
  const form = useGameStore((s) => s.form);
  const level = useProgressStore((s) => s.level);
  const ability = ABILITY_OF[action];
  const locked = ability !== undefined && !isUnlocked(ability, level);
  const tracker = useMemo(() => createPointerTracker(), []);
  const release = () => {
    tracker.reset();
    setHeld(input, action, false);
  };

  useEffect(() => {
    const onEnd = (e: PointerEvent) => {
      if (tracker.up(e.pointerId)) setHeld(input, action, false);
    };
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    const offReset = onInputReset(() => tracker.reset());
    return () => {
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      offReset();
      tracker.reset();
      setHeld(input, action, false);
    };
  }, [action, tracker]);

  return (
    <button
      type="button"
      className={locked ? 'action-btn locked' : 'action-btn'}
      style={{ width: size, height: size, ...style }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        tracker.down(e.pointerId);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Already gone; the window listeners still see it end.
        }
        setHeld(input, action, true);
      }}
      onLostPointerCapture={(e) => {
        if (tracker.up(e.pointerId)) release();
      }}
    >
      {ABILITY_OF[action] && (
        <AbilityIcon id={ABILITY_OF[action]} size={Math.round(size * 0.46)} form={form} />
      )}
      <span className="action-label">
        {locked && ability
          ? `LV ${UNLOCK_LEVEL[ability]}`
          : action === 'aura' && form === 'mermaid'
            ? 'TIDE'
            : label}
      </span>
      {ABILITY_OF[action] && <CooldownSweep id={ABILITY_OF[action]} />}
    </button>
  );
}
