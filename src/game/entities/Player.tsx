import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { Group } from 'three';
import { ATMOSPHERE } from '@/game/atmosphere';
import { RosaModel } from '@/game/entities/RosaModel';
import { combat } from '@/game/combat-sim';
import { getRenderPosition, sim } from '@/game/sim';
import { useGameStore } from '@/store/game-store';
import { DASH } from '@/systems/abilities';

const position = { x: 0, z: 0 };

/** Body scale during a dash: she vanishes at the start and pops back in at the end (a water teleport). */
export function dashScale(t: number): number {
  if (t < 0.3) return Math.max(0.001, 1 - t / 0.3);
  if (t <= 0.7) return 0.001;
  return Math.min(1.12, ((t - 0.7) / 0.3) * 1.12 + 0.001);
}

export function Player() {
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const form = useGameStore((s) => s.form);
  const [singing, setSinging] = useState(false);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    getRenderPosition(position);
    g.position.set(position.x, 0, position.z);
    g.rotation.y = Math.atan2(sim.curr.facing.x, sim.curr.facing.z);
    const mermaidNow = combat.mermaid > 0;
    if (mermaidNow !== singing) setSinging(mermaidNow);
    if (body.current) {
      const s = combat.dash.active ? dashScale(combat.dash.t / DASH.duration) : 1;
      body.current.scale.setScalar(s);
    }
  });

  const shown = singing ? 'mermaid' : form;

  return (
    <group ref={group}>
      <group ref={body}>
        <RosaModel key={shown} form={shown} />
      </group>
      <pointLight
        color={ATMOSPHERE.rosaLight.color}
        intensity={ATMOSPHERE.rosaLight.intensity}
        distance={ATMOSPHERE.rosaLight.distance}
        position={[0, ATMOSPHERE.rosaLight.height, 0]}
      />
    </group>
  );
}
