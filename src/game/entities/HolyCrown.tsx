import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { DoubleSide, type Group } from 'three';
import { createHolyGeometry } from '@/game/entities/skill-geometry';

/** The height the holy geometry was made for. */
const MODEL_HEIGHT = 1.75;

/** The wings and halo Rosa wears at level 60 (human form). They sway and the halo drifts a little. */
export function HolyCrown({ height }: { height: number }) {
  const group = useRef<Group>(null);
  const geometry = useMemo(() => createHolyGeometry(), []);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = performance.now() / 1000;
    g.position.y = Math.sin(t * 1.6) * 0.03;
    g.rotation.y = Math.sin(t * 0.8) * 0.04;
    g.scale.x = (height / MODEL_HEIGHT) * (1 + Math.sin(t * 2.2) * 0.035);
  });

  const scale = height / MODEL_HEIGHT;
  return (
    <group ref={group} scale={[scale, scale, scale]}>
      {/* Behind her back: the figure looks toward +z. */}
      <mesh geometry={geometry} position={[0, 0, -0.16]} frustumCulled={false}>
        <meshBasicMaterial vertexColors side={DoubleSide} />
      </mesh>
    </group>
  );
}
