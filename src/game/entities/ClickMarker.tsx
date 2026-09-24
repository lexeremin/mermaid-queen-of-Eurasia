import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { sim } from '@/game/sim';

/** Ring at the click-to-move destination while Rosa is walking there. */
export function ClickMarker() {
  const ref = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const destination = sim.path[sim.path.length - 1];
    mesh.visible = destination !== undefined;
    if (!destination) return;
    mesh.position.set(destination.x, 0.08, destination.z);
    mesh.scale.setScalar(1 + Math.sin(clock.elapsedTime * 7) * 0.12);
  });

  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} visible={false} renderOrder={5}>
      <ringGeometry args={[0.32, 0.5, 20]} />
      <meshBasicMaterial color="#ff9fb8" transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}
