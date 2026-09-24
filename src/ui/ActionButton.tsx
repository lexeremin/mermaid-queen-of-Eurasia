import type { CSSProperties } from 'react';
import { input, setHeld, type Action } from '@/input/input-state';

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
      {label}
    </button>
  );
}
