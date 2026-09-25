import type { CSSProperties } from 'react';
import { input, setHeld, type Action } from '@/input/input-state';
import type { AbilityId } from '@/systems/abilities';
import { CooldownSweep } from '@/ui/CombatHud';
import { AbilityIcon } from '@/ui/icons';

const ABILITY_OF: Record<Action, AbilityId | undefined> = {
  attack: 'attack',
  blink: 'blink',
  aura: 'aura',
  spell: 'spell',
  recall: undefined,
  interact: undefined,
};

type Props = { action: Action; label: string; size: number; style: CSSProperties };

export function ActionButton({ action, label, size, style }: Props) {
  const release = () => setHeld(input, action, false);
  return (
    <button
      type="button"
      className="action-btn"
      style={{ width: size, height: size, ...style }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setHeld(input, action, true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {ABILITY_OF[action] && <AbilityIcon id={ABILITY_OF[action]} size={Math.round(size * 0.46)} />}
      <span className="action-label">{label}</span>
      {ABILITY_OF[action] && <CooldownSweep id={ABILITY_OF[action]} />}
    </button>
  );
}
