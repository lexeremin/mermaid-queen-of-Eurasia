import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { CAMERA_LOOK_AT, CAMERA_POSITION } from '@/game/camera';

const FOG_COLOR = '#0b1220';

export function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: CAMERA_POSITION, fov: 45, near: 0.1, far: 200 }}
      onCreated={({ camera }) => camera.lookAt(...CAMERA_LOOK_AT)}
    >
      <color attach="background" args={[FOG_COLOR]} />
      <fogExp2 attach="fog" args={[FOG_COLOR, 0.035]} />
      <hemisphereLight args={['#9db4d6', '#2a2118', 1.1]} />
      <directionalLight position={[8, 12, 6]} intensity={1.4} />

      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[60, 60]} />
        <meshLambertMaterial color="#cfd8e3" flatShading />
      </mesh>

      <mesh position={[0, 0.75, 0]}>
        <coneGeometry args={[0.8, 1.5, 5]} />
        <meshLambertMaterial color="#2f7d6f" flatShading />
      </mesh>
      <mesh position={[3, 0.5, -1]}>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshLambertMaterial color="#8a5a34" flatShading />
      </mesh>

      {import.meta.env.DEV && <Stats />}
    </Canvas>
  );
}
