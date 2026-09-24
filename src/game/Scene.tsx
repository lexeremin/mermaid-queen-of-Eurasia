import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { CameraRig } from '@/game/CameraRig';
import { CAMERA_FOV, CAMERA_OFFSET, BASE_FOG_DENSITY } from '@/game/camera';
import { GameLoop } from '@/game/GameLoop';
import { Player } from '@/game/entities/Player';

const FOG_COLOR = '#0b1220';

export function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [...CAMERA_OFFSET], fov: CAMERA_FOV, near: 0.1, far: 200 }}
    >
      <color attach="background" args={[FOG_COLOR]} />
      <fogExp2 attach="fog" args={[FOG_COLOR, BASE_FOG_DENSITY]} />
      <hemisphereLight args={['#9db4d6', '#2a2118', 1.1]} />
      <directionalLight position={[8, 12, 6]} intensity={1.4} />

      <GameLoop />
      <CameraRig />

      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[60, 60]} />
        <meshLambertMaterial color="#cfd8e3" flatShading />
      </mesh>
      <gridHelper args={[60, 20, '#6b7d95', '#8fa0b5']} position={[0, 0.01, 0]} />

      <mesh position={[3, 0.5, -1]}>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshLambertMaterial color="#8a5a34" flatShading />
      </mesh>
      <mesh position={[-5, 0.75, -4]}>
        <coneGeometry args={[0.8, 1.5, 5]} />
        <meshLambertMaterial color="#3a5f4a" flatShading />
      </mesh>

      <Player />

      {import.meta.env.DEV && <Stats />}
    </Canvas>
  );
}
