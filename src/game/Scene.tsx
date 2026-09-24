import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { CameraRig } from '@/game/CameraRig';
import { ATMOSPHERE } from '@/game/atmosphere';
import { CAMERA_FOV, CAMERA_OFFSET } from '@/game/camera';
import { GameLoop } from '@/game/GameLoop';
import { ClickMarker } from '@/game/entities/ClickMarker';
import { CombatEffects } from '@/game/entities/CombatEffects';
import { EnemyActors } from '@/game/entities/EnemyActors';
import { Player } from '@/game/entities/Player';
import { MapScene } from '@/game/world/MapScene';
import { Npcs } from '@/game/world/Npcs';
import { RenderStatsProbe } from '@/game/RenderStatsProbe';
import { Suspense } from 'react';

export function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ stencil: true }}
      camera={{ position: [...CAMERA_OFFSET], fov: CAMERA_FOV, near: 1, far: 200 }}
    >
      <color attach="background" args={[ATMOSPHERE.background]} />
      <fogExp2 attach="fog" args={[ATMOSPHERE.fogColor, ATMOSPHERE.fogDensity]} />
      <hemisphereLight
        args={[
          ATMOSPHERE.hemisphere.sky,
          ATMOSPHERE.hemisphere.ground,
          ATMOSPHERE.hemisphere.intensity,
        ]}
      />
      <directionalLight
        position={ATMOSPHERE.sun.position}
        color={ATMOSPHERE.sun.color}
        intensity={ATMOSPHERE.sun.intensity}
      />

      <GameLoop />
      <CameraRig />

      <Suspense fallback={null}>
        <MapScene />
        <Npcs />
        <Player />
        <ClickMarker />
        <EnemyActors />
        <CombatEffects />
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
