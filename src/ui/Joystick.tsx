import { useRef, type PointerEvent } from 'react';
import { input } from '@/input/input-state';
import { joystickVector } from '@/input/joystick';

const RADIUS = 60;

export function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);

  const update = (e: PointerEvent<HTMLDivElement>) => {
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

  const release = () => {
    activePointer.current = null;
    input.stickMove = { x: 0, z: 0 };
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
  };

  return (
    <div
      ref={baseRef}
      className="joystick"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (activePointer.current !== null) return;
        activePointer.current = e.pointerId;
        input.pointerActive = false;
        input.aim = { x: 0, z: 0 };
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (e.pointerId === activePointer.current) update(e);
      }}
      onPointerUp={(e) => {
        if (e.pointerId === activePointer.current) release();
      }}
      onPointerCancel={(e) => {
        if (e.pointerId === activePointer.current) release();
      }}
    >
      <div ref={knobRef} className="joystick-knob" />
    </div>
  );
}
