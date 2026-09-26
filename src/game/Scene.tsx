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
import { SkillEffects } from '@/game/entities/SkillEffects';
import { CompanionActor } from '@/game/entities/CompanionActor';
import { DungeonProps } from '@/game/entities/DungeonProps';
import { EnemyActors } from '@/game/entities/EnemyActors';
import { SwimEffect } from '@/game/entities/SwimEffect';
import { RecallEffect } from '@/game/entities/RecallEffect';
import { HazardMarks } from '@/game/entities/HazardMarks';
import { Gatherables } from '@/game/entities/Gatherables';
import { Pickups } from '@/game/entities/Pickups';
import { Player } from '@/game/entities/Player';
import { MapScene } from '@/game/world/MapScene';
import { WeatherEffects } from '@/game/world/WeatherEffects';
import { Npcs } from '@/game/world/Npcs';
import { PerfProbe, perfEnabled } from '@/game/perf-probe';
import { RenderStatsProbe } from '@/game/RenderStatsProbe';
import { Suspense } from 'react';
import { useGameStore } from '@/store/game-store';
import { useGraphics, useGraphicsStore } from '@/store/graphics-store';
import { useSettingsStore } from '@/store/settings-store';

const ANTIALIAS =
  typeof window !== 'undefined' &&
  window.devicePixelRatio < 2 &&
  !window.matchMedia('(pointer: coarse)').matches;

export function Scene() {
  // Nothing moves behind a menu, the bag, the quest log or the full-screen map: stop drawing until they close.
  const frozen = useGameStore(
    (s) =>
      !s.loading &&
      (s.paused || s.welcomeOpen || s.inventoryOpen || !!s.questPanel || s.mapBlocking),
  );
  const graphics = useGraphics();
  const stepAuto = useGraphicsStore((g) => g.stepAuto);
  const auto = useSettingsStore((q) => q.quality === 'auto');
  return (
    <Canvas
      dpr={[1, graphics.dpr]}
      frameloop={frozen ? 'never' : 'always'}
      gl={{ stencil: true, antialias: ANTIALIAS }}
      camera={{ position: [...CAMERA_OFFSET], fov: CAMERA_FOV, near: 1, far: 200 }}
    >
      <color attach="background" args={[ATMOSPHERE.background]} />
      <fogExp2 attach="fog" args={[ATMOSPHERE.fogColor, ATMOSPHERE.fogDensity]} />
      {auto && (
        <PerformanceMonitor
          onDecline={() => stepAuto('down')}
          onIncline={() => stepAuto('up')}
          flipflops={3}
          bounds={(refresh) => (refresh > 100 ? [50, 90] : [40, 58])}
        />
      )}
      <AtmosphereRig />

      <GameLoop />
      <CameraRig />

      <Suspense fallback={null}>
        <MapScene />
        <WeatherEffects />
        <Npcs />
        <Player />
        <CompanionActor />
        <ClickMarker />
        <EnemyActors />
        <ActorRings />
        <Pickups />
        <Gatherables />
        <CombatEffects />
        <SkillEffects />
        <HazardMarks />
        <RecallEffect />
        <SwimEffect />
        <DungeonProps />
        <SceneReady />
      </Suspense>
      <LoadingGate />

      {perfEnabled && <PerfProbe />}
      {import.meta.env.DEV && (
        <>
          <Stats />
          <RenderStatsProbe />
        </>
      )}
    </Canvas>
  );
}
