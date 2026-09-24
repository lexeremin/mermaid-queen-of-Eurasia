import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { SphereGeometry, type Group } from 'three';

/** Floating crossed-out eye: the blind debuff shown above an enemy's head. Always faces the camera. */
export function BlindMark() {
  const ref = useRef<Group>(null);
  const eye = useMemo(() => new SphereGeometry(0.36, 10, 6).scale(1.5, 0.95, 0.35), []);
  const pupil = useMemo(() => new SphereGeometry(0.16, 8, 6).scale(1, 1, 0.5), []);

  useFrame(({ clock, camera }) => {
    const g = ref.current;
    if (!g) return;
    g.quaternion.copy(camera.quaternion);
    const t = clock.elapsedTime;
    g.position.y = Math.sin(t * 2.6) * 0.08;
    g.scale.setScalar(0.85 + Math.sin(t * 5) * 0.04);
  });

  return (
    <group ref={ref}>
      <mesh geometry={eye}>
        <meshBasicMaterial color="#f1e9dc" />
      </mesh>
      <mesh geometry={pupil} position={[0, 0, 0.1]}>
        <meshBasicMaterial color="#0b1220" />
      </mesh>
      <mesh position={[0, 0, 0.22]} rotation-z={-0.7}>
        <boxGeometry args={[1.35, 0.13, 0.08]} />
        <meshBasicMaterial color="#e3243d" />
      </mesh>
    </group>
  );
}
