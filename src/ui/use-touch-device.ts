import { useEffect, useState } from 'react';

function initialTouch(): boolean {
  if (typeof window === 'undefined') return false;
  const forced = new URLSearchParams(window.location.search).get('touch') === '1';
  return forced || window.matchMedia('(pointer: coarse)').matches;
}

export function useTouchDevice(): boolean {
  const [touch, setTouch] = useState(initialTouch);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') setTouch(true);
    };
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return touch;
}
