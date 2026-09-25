import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  CylinderGeometry,
  DoubleSide,
  RingGeometry,
  type Group,
  type Mesh,
} from 'three';
import { recall } from '@/game/recall-sim';
import { getRenderPosition } from '@/game/sim';
import { recallProgress } from '@/systems/recall';

const position = { x: 0, z: 0 };

/** While Recall is channelled: a bright ring tightens around Rosa and a column of light rises. */
export function RecallEffect() {
  const root = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const column = useRef<Mesh>(null);
  const ringGeometry = useMemo(() => new RingGeometry(0.85, 1, 40).rotateX(-Math.PI / 2), []);
  const columnGeometry = useMemo(() => new CylinderGeometry(0.9, 0.9, 1, 20, 1, true), []);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    g.visible = recall.active;
    if (!recall.active) return;
    const p = recallProgress(recall);
    getRenderPosition(position);
    g.position.set(position.x, 0, position.z);
    if (ring.current) {
      ring.current.scale.setScalar(2.4 - 1.5 * p);
      ring.current.rotation.y = clock.elapsedTime * 3;
    }
    if (column.current) {
      const height = 0.4 + 3.2 * p;
      column.current.scale.set(0.5 + 0.6 * (1 - p), height, 0.5 + 0.6 * (1 - p));
      column.current.position.y = height / 2;
      column.current.rotation.y = -clock.elapsedTime * 2;
    }
  });

  return (
    <group ref={root} visible={false}>
      <mesh ref={ring} geometry={ringGeometry} position={[0, 0.12, 0]} renderOrder={9}>
        <meshBasicMaterial
          color="#bfe4ff"
          transparent
          opacity={0.9}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh ref={column} geometry={columnGeometry} renderOrder={9}>
        <meshBasicMaterial
          color="#8fc8ff"
          transparent
          opacity={0.32}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}
