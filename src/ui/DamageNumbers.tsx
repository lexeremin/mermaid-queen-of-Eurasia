import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { cameraRef } from '@/game/camera-ref';
import { floating } from '@/game/feedback';
import { MAX_NUMBERS, opacity, rise } from '@/systems/floating-numbers';
import { addHudTask } from '@/ui/hud-ticker';

const point = new Vector3();
const HEIGHT = { enemy: 2.3, big: 2.3, player: 1.9 } as const;

/** Floating damage numbers over the world: one small pool of elements, moved every frame without re-rendering. */
export function DamageNumbers() {
  const pool = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const tick = () => {
      const camera = cameraRef.camera;
      const width = window.innerWidth;
      const height = window.innerHeight;
      for (let i = 0; i < MAX_NUMBERS; i++) {
        const el = pool.current[i];
        if (!el) continue;
        const n = floating[i];
        if (!n || !camera) {
          if (el.style.display !== 'none') el.style.display = 'none';
          continue;
        }
        point.set(n.x + n.drift * 0.6, HEIGHT[n.kind] + rise(n.age, n.life), n.z).project(camera);
        if (point.z > 1) {
          el.style.display = 'none';
          continue;
        }
        el.style.display = 'block';
        if (el.textContent !== n.text) el.textContent = n.text;
        el.dataset.kind = n.kind;
        el.style.opacity = String(opacity(n.age, n.life));
        el.style.transform = `translate(${((point.x + 1) / 2) * width}px, ${((1 - point.y) / 2) * height}px) translate(-50%, -100%)`;
      }
    };
    return addHudTask(tick);
  }, []);

  return (
    <div className="damage-numbers" aria-hidden>
      {Array.from({ length: MAX_NUMBERS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            pool.current[i] = el;
          }}
          style={{ display: 'none' }}
        />
      ))}
    </div>
  );
}
