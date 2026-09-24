import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { ATMOSPHERE } from '@/game/atmosphere';
import { RosaModel } from '@/game/entities/RosaModel';
import { getRenderPosition, sim } from '@/game/sim';
import { useGameStore } from '@/store/game-store';

const position = { x: 0, z: 0 };

export function Player() {
  const group = useRef<Group>(null);
  const form = useGameStore((s) => s.form);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    getRenderPosition(position);
    g.position.set(position.x, 0, position.z);
    g.rotation.y = Math.atan2(sim.curr.facing.x, sim.curr.facing.z);
  });

  return (
    <group ref={group}>
      <RosaModel key={form} form={form} />
      <pointLight
        color={ATMOSPHERE.rosaLight.color}
        intensity={ATMOSPHERE.rosaLight.intensity}
        distance={ATMOSPHERE.rosaLight.distance}
        position={[0, ATMOSPHERE.rosaLight.height, 0]}
      />
    </group>
  );
}
