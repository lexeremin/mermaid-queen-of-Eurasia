import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, Stats } from '@react-three/drei';
import { LoadingGate, SceneReady } from '@/game/LoadingGate';
import { AtmosphereRig } from '@/game/AtmosphereRig';
import { CameraRig } from '@/game/CameraRig';
import { ATMOSPHERE } from '@/game/atmosphere';
import { CAMERA_FOV, CAMERA_OFFSET } from '@/game/camera';
import { GameLoop } from '@/game/GameLoop';
import { ActorRings } from '@/game/entities/ActorRings';
import { ClickMarker } from '@/game/entities/ClickMarker';
import { CombatEffects } from '@/game/entities/CombatEffects';
import { CompanionActor } from '@/game/entities/CompanionActor';
import { DungeonProps } from '@/game/entities/DungeonProps';
import { EnemyActors } from '@/game/entities/EnemyActors';
import { RecallEffect } from '@/game/entities/RecallEffect';
import { HazardMarks } from '@/game/entities/HazardMarks';
import { Gatherables } from '@/game/entities/Gatherables';
import { Pickups } from '@/game/entities/Pickups';
import { Player } from '@/game/entities/Player';
import { MapScene } from '@/game/world/MapScene';
import { Npcs } from '@/game/world/Npcs';
import { RenderStatsProbe } from '@/game/RenderStatsProbe';
import { Suspense, useState } from 'react';
import { useGameStore } from '@/store/game-store';

const TOUCH = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
/** Phones render at most 1.5x; big retina screens get 2x but no multisampling (it is 4x the fill work). */
const MAX_DPR = TOUCH ? 1.5 : 2;
const ANTIALIAS = typeof window !== 'undefined' && window.devicePixelRatio < 2 && !TOUCH;

export function Scene() {
  // Nothing moves behind a menu, the bag, the quest log or the full-screen map: stop drawing until they close.
  const frozen = useGameStore(
    (s) =>
      !s.loading &&
      (s.paused || s.welcomeOpen || s.inventoryOpen || !!s.questPanel || s.mapBlocking),
  );
  const [dpr, setDpr] = useState(MAX_DPR);
  return (
    <Canvas
      dpr={[1, dpr]}
      frameloop={frozen ? 'never' : 'always'}
      gl={{ stencil: true, antialias: ANTIALIAS }}
      camera={{ position: [...CAMERA_OFFSET], fov: CAMERA_FOV, near: 1, far: 200 }}
    >
      <color attach="background" args={[ATMOSPHERE.background]} />
      <fogExp2 attach="fog" args={[ATMOSPHERE.fogColor, ATMOSPHERE.fogDensity]} />
      <PerformanceMonitor onDecline={() => setDpr(1)} flipflops={2} />
      <AtmosphereRig />

      <GameLoop />
      <CameraRig />

      <Suspense fallback={null}>
        <MapScene />
        <Npcs />
        <Player />
        <CompanionActor />
        <ClickMarker />
        <EnemyActors />
        <ActorRings />
        <Pickups />
        <Gatherables />
        <CombatEffects />
        <HazardMarks />
        <RecallEffect />
        <DungeonProps />
        <SceneReady />
      </Suspense>
      <LoadingGate />

      {import.meta.env.DEV && (
        <>
          <Stats />
          <RenderStatsProbe />
        </>
      )}
    </Canvas>
  );
}
