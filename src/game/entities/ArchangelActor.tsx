import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, CanvasTexture, DoubleSide, type Group, type Mesh } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { ArchangelDef } from '@/data/archangels';
import { ASSETS } from '@/data/assets';
import type { NpcSpot } from '@/data/maps/types';
import { applyRetroMaterial } from '@/game/assets/retro-material';
import { HeartBuff } from '@/game/entities/HeartBuff';
import { sim } from '@/game/sim';
import { useArchangelStore } from '@/store/archangel-store';
import { turnToward } from '@/systems/movement';

const LOOK_RANGE = 7;
const TURN_RATE = 4;
const HOVER = 0.28;
const HAPPY_SECONDS = 4.5;
const CROSSFADE = 0.25;

let beamTexture: CanvasTexture | undefined;

/** A faint golden shimmer that rises from a lost child, so a curious player can spot them from afar. */
function getBeamTexture(): CanvasTexture {
  if (!beamTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 128;
    const c = canvas.getContext('2d');
    if (c) {
      const g = c.createLinearGradient(0, 128, 0, 0);
      g.addColorStop(0, 'rgba(255,224,138,0.85)');
      g.addColorStop(0.5, 'rgba(255,224,138,0.28)');
      g.addColorStop(1, 'rgba(255,224,138,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 32, 128);
      const h = c.createLinearGradient(0, 0, 32, 0);
      h.addColorStop(0, 'rgba(0,0,0,1)');
      h.addColorStop(0.5, 'rgba(0,0,0,0)');
      h.addColorStop(1, 'rgba(0,0,0,1)');
      c.globalCompositeOperation = 'destination-out';
      c.fillStyle = h;
      c.fillRect(0, 0, 32, 128);
    }
    beamTexture = new CanvasTexture(canvas);
  }
  return beamTexture;
}

function LostGlow() {
  const mesh = useRef<Mesh>(null);
  useFrame(({ camera, clock }) => {
    const m = mesh.current;
    if (!m) return;
    m.quaternion.copy(camera.quaternion);
    m.scale.set(1 + 0.12 * Math.sin(clock.elapsedTime * 2.4), 1, 1);
  });
  return (
    <mesh ref={mesh} position={[0, 3.6, 0]} renderOrder={5}>
      <planeGeometry args={[1.5, 6.5]} />
      <meshBasicMaterial
        map={getBeamTexture()}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        fog={false}
        opacity={0.8}
      />
    </mesh>
  );
}

/** A winged child: hovers, flaps, turns toward Rosa, and bursts into a happy flutter the moment she is saved. */
export function ArchangelActor({ def, spot }: { def: ArchangelDef; spot: NpcSpot }) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const model = useRef<Group>(null);
  const facing = useRef({ x: Math.sin(spot.rotY), z: Math.cos(spot.rotY) });
  const gltf = useGLTF(ASSETS[def.asset].url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, model);
  const saved = useArchangelStore((s) => s.saved.includes(def.id));
  const wasSaved = useRef(saved);
  const phase = useMemo(() => (spot.x * 12.9898 + spot.z * 78.233) % 6.28, [spot]);

  useEffect(() => applyRetroMaterial(scene), [scene]);

  useEffect(() => {
    actions.idle?.reset().fadeIn(CROSSFADE).play();
  }, [actions]);

  useEffect(() => {
    if (saved && !wasSaved.current) {
      actions.idle?.fadeOut(CROSSFADE);
      actions.happy?.reset().fadeIn(CROSSFADE).play();
      const timer = window.setTimeout(() => {
        actions.happy?.fadeOut(CROSSFADE);
        actions.idle?.reset().fadeIn(CROSSFADE).play();
      }, HAPPY_SECONDS * 1000);
      wasSaved.current = saved;
      return () => window.clearTimeout(timer);
    }
    wasSaved.current = saved;
    return undefined;
  }, [saved, actions]);

  useFrame(({ clock }, delta) => {
    const g = root.current;
    const b = body.current;
    if (!g || !b) return;
    const dx = sim.curr.pos.x - spot.x;
    const dz = sim.curr.pos.z - spot.z;
    const near = Math.hypot(dx, dz) < LOOK_RANGE;
    const want = near ? { x: dx, z: dz } : { x: Math.sin(spot.rotY), z: Math.cos(spot.rotY) };
    const len = Math.hypot(want.x, want.z) || 1;
    facing.current = turnToward(
      facing.current,
      { x: want.x / len, z: want.z / len },
      TURN_RATE * delta,
    );
    g.rotation.y = Math.atan2(facing.current.x, facing.current.z);
    b.position.y = HOVER + Math.sin(clock.elapsedTime * 1.8 + phase) * 0.05;
  });

  return (
    <group ref={root} position={[spot.x, 0, spot.z]}>
      <group ref={body}>
        <group ref={model}>
          <primitive object={scene} />
        </group>
      </group>
      {saved ? <HeartBuff y={1.9} /> : <LostGlow />}
    </group>
  );
}
