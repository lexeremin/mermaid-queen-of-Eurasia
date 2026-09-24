import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { getRenderPosition, sim } from '@/game/sim';

const position = { x: 0, z: 0 };

export function Player() {
  const ref = useRef<Group>(null);

  useFrame(() => {
    const group = ref.current;
    if (!group) return;
    getRenderPosition(position);
    group.position.set(position.x, 0, position.z);
    group.rotation.y = Math.atan2(sim.curr.facing.x, sim.curr.facing.z);
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.7, 0]}>
        <coneGeometry args={[0.5, 1.4, 6]} />
        <meshLambertMaterial color="#2f9c8a" flatShading />
      </mesh>
      <mesh position={[0, 0.9, 0.55]}>
        <boxGeometry args={[0.25, 0.25, 0.4]} />
        <meshLambertMaterial color="#f2c6d8" flatShading />
      </mesh>
    </group>
  );
}
