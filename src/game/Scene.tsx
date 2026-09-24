import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { CameraRig } from '@/game/CameraRig';
import { CAMERA_FOV, CAMERA_OFFSET, BASE_FOG_DENSITY } from '@/game/camera';
import { GameLoop } from '@/game/GameLoop';
import { Player } from '@/game/entities/Player';
import { MapScene } from '@/game/world/MapScene';
import { RenderStatsProbe } from '@/game/RenderStatsProbe';
import { Suspense } from 'react';

const FOG_COLOR = '#0b1220';

export function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [...CAMERA_OFFSET], fov: CAMERA_FOV, near: 1, far: 200 }}
    >
      <color attach="background" args={[FOG_COLOR]} />
      <fogExp2 attach="fog" args={[FOG_COLOR, BASE_FOG_DENSITY]} />
      <hemisphereLight args={['#9db4d6', '#2a2118', 1.1]} />
      <directionalLight position={[8, 12, 6]} intensity={1.4} />

      <GameLoop />
      <CameraRig />

      <Suspense fallback={null}>
        <MapScene />
        <Player />
      </Suspense>

      {import.meta.env.DEV && (
        <>
          <Stats />
          <RenderStatsProbe />
        </>
      )}
    </Canvas>
  );
}
