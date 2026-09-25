import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { DoubleSide, RingGeometry, type Mesh, type MeshBasicMaterial } from 'three';
import { swim } from '@/game/form-sim';
import { getRenderPosition } from '@/game/sim';

const RINGS = 4;
const SPAWN_EVERY = 0.42;
const LIFE = 1.7;
const position = { x: 0, z: 0 };

/** Ripples spreading from Rosa while she swims: a new ring every moment, growing and fading. Hidden on land. */
export function SwimEffect() {
  const meshes = useRef<(Mesh | null)[]>([]);
  const ages = useRef<number[]>(Array.from({ length: RINGS }, () => LIFE));
  const origins = useRef(Array.from({ length: RINGS }, () => ({ x: 0, z: 0 })));
  const next = useRef(0);
  const clock = useRef(SPAWN_EVERY);
  const geometry = useMemo(() => new RingGeometry(0.85, 1, 32).rotateX(-Math.PI / 2), []);

  useFrame((_, delta) => {
    getRenderPosition(position);
    if (swim.active) {
      clock.current += delta;
      if (clock.current >= SPAWN_EVERY) {
        clock.current = 0;
        const i = next.current++ % RINGS;
        ages.current[i] = 0;
        origins.current[i] = { x: position.x, z: position.z };
      }
    }
    for (let i = 0; i < RINGS; i++) {
      const mesh = meshes.current[i];
      if (!mesh) continue;
      ages.current[i] = (ages.current[i] ?? LIFE) + delta;
      const age = ages.current[i] ?? LIFE;
      mesh.visible = age < LIFE;
      if (!mesh.visible) continue;
      const t = age / LIFE;
      const o = origins.current[i]!;
      mesh.position.set(o.x, 0.09, o.z);
      mesh.scale.setScalar(0.5 + 2.4 * t);
      (mesh.material as MeshBasicMaterial).opacity = 0.7 * (1 - t);
    }
  });

  return (
    <>
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          geometry={geometry}
          visible={false}
          renderOrder={8}
        >
          <meshBasicMaterial
            color="#dff6ff"
            transparent
            opacity={0.6}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}
