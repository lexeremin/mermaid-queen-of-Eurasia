import { useEffect, useMemo, useRef, type PointerEvent } from 'react';
import { input, onInputReset } from '@/input/input-state';
import { joystickVector } from '@/input/joystick';
import { createPointerTracker } from '@/input/pointer-tracker';

const RADIUS = 60;

export function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const tracker = useMemo(() => createPointerTracker(), []);

  const update = (e: { clientX: number; clientY: number }) => {
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!base || !knob) return;
    const rect = base.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    input.stickMove = joystickVector(dx, dy, RADIUS);
    const len = Math.hypot(dx, dy);
    const clamped = Math.min(len, RADIUS);
    const kx = len === 0 ? 0 : (dx / len) * clamped;
    const ky = len === 0 ? 0 : (dy / len) * clamped;
    knob.style.transform = `translate(${kx}px, ${ky}px)`;
  };

  const settle = () => {
    tracker.reset();
    input.stickMove = { x: 0, z: 0 };
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
  };

  useEffect(() => {
    // Every way a finger can vanish: the element loses it, the window sees it end, the input is reset from
    // elsewhere (pause, backgrounding), or the stick itself unmounts while held.
    const onEnd = (e: globalThis.PointerEvent) => {
      if (tracker.up(e.pointerId)) settle();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0 && tracker.active !== null) settle();
    };
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    const offReset = onInputReset(settle);
    return () => {
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      offReset();
      settle();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={baseRef}
      className="joystick"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
        // A new touch always takes the stick over: an old one may have been lost without a release.
        tracker.down(e.pointerId);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // The pointer is already gone or capture is refused; the window listeners still see its end.
        }
        update(e);
      }}
      onPointerMove={(e) => {
        if (tracker.owns(e.pointerId)) update(e);
      }}
      onLostPointerCapture={(e) => {
        if (tracker.up(e.pointerId)) settle();
      }}
    >
      <div ref={knobRef} className="joystick-knob" />
    </div>
  );
}
