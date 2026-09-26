import { useAnimations, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import type { Group } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS } from '@/data/assets';
import { applyRetroMaterial } from '@/game/assets/retro-material';
import { useShortScreen } from '@/ui/use-short-screen';

/** Rosa in mermaid form, idling and turning slowly. */
function Turntable() {
  const spin = useRef<Group>(null);
  const model = useRef<Group>(null);
  const gltf = useGLTF(ASSETS.rosaMermaid.url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, model);

  useEffect(() => applyRetroMaterial(scene), [scene]);
  useEffect(() => {
    actions.idle?.reset().play();
  }, [actions]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (spin.current) {
      spin.current.rotation.y = Math.sin(t * 0.7) * 0.65 + 0.25;
      spin.current.position.y = Math.sin(t * 1.4) * 0.05;
    }
  });

  return (
    <group ref={spin}>
      <group ref={model}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

/** The animated mermaid shown at the top of the menu (left out on a phone held sideways: no room, and no second WebGL context). */
export function MenuMermaid() {
  const short = useShortScreen();
  if (short) return null;
  return (
    <div className="menu-mermaid" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 1.25, 4.9], fov: 34 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: false }}
        onCreated={({ camera }) => camera.lookAt(0, 1.05, 0)}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[2, 3, 3]} intensity={1.5} color="#fff2e6" />
        <directionalLight position={[-3, 1, -2]} intensity={0.6} color="#7fc7ff" />
        <Suspense fallback={null}>
          <Turntable />
        </Suspense>
      </Canvas>
    </div>
  );
}
