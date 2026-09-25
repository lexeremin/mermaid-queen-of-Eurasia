import { useFrame } from '@react-three/fiber';
import { heroIsOccluded } from '@/game/assets/hero-occlusion';
import { setXrayVisible } from '@/game/assets/xray';
import { useRef, useState } from 'react';
import type { Group } from 'three';
import { ATMOSPHERE } from '@/game/atmosphere';
import { RosaModel } from '@/game/entities/RosaModel';
import { combat } from '@/game/combat-sim';
import { getRenderPosition, sim } from '@/game/sim';
import { useGameStore } from '@/store/game-store';
import { BLINK } from '@/systems/abilities';

const position = { x: 0, z: 0 };

/** Body scale after a blink: she pops back in a little oversize and settles. */
export function blinkScale(t: number): number {
  return Math.min(1.15, 0.05 + t * 1.3 + Math.sin(Math.min(1, t) * Math.PI) * 0.1);
}

export function Player() {
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const form = useGameStore((s) => s.form);
  const [singing, setSinging] = useState(false);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    setXrayVisible(heroIsOccluded(performance.now()));
    getRenderPosition(position);
    g.position.set(position.x, 0, position.z);
    g.rotation.y = Math.atan2(sim.curr.facing.x, sim.curr.facing.z);
    const mermaidNow = combat.mermaid > 0;
    if (mermaidNow !== singing) setSinging(mermaidNow);
    if (body.current) {
      const s = combat.blink > 0 ? blinkScale(1 - combat.blink / BLINK.pop) : 1;
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
