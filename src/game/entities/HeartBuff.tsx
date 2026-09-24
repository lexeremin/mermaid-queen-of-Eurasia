import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { ExtrudeGeometry, Shape, type Group } from 'three';

function heartGeometry(): ExtrudeGeometry {
  const s = new Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.32);
  s.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5);
  return new ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false, curveSegments: 6 });
}

/** Floating heart above a mesmerized man's head. */
export function HeartBuff() {
  const ref = useRef<Group>(null);
  const geometry = useMemo(() => heartGeometry(), []);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.position.y = 2.75 + Math.sin(t * 2.2) * 0.1;
    g.rotation.y = t * 1.6;
    g.scale.setScalar(0.42 + Math.sin(t * 5) * 0.03);
  });

  return (
    <group ref={ref} position={[0, 2.75, 0]}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#ff5c8a" />
      </mesh>
    </group>
  );
}
