import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Group, Object3D } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS, type AssetId } from '@/data/assets';
import { NPC_BY_ID } from '@/data/npcs';
import { applyRetroMaterial } from '@/game/assets/retro-material';
import { combat } from '@/game/combat-sim';
import { renderStats } from '@/game/render-stats';
import { SIM_STEP, sim } from '@/game/sim';
import { swingAngle } from '@/game/entities/RosaModel';
import { useNpcStore } from '@/store/npc-store';
import { COMPANION } from '@/systems/companion';
import { turnToward } from '@/systems/movement';

const WALK_SPEED_THRESHOLD = 0.5;
const TURN_RATE = 14;
const IDLE_GRACE_SECONDS = 0.15;
const CROSSFADE_SECONDS = 0.18;

type Clip = 'idle' | 'walk';

/** The sword-carrying version of an NPC who fights beside Rosa. Position and swing come from `combat.companion`. */
function CompanionModel({ asset }: { asset: AssetId }) {
  const root = useRef<Group>(null);
  const model = useRef<Group>(null);
  const arm = useRef<Object3D | null>(null);
  const current = useRef<Clip | null>(null);
  const facing = useRef<{ x: number; z: number } | null>(null);
  const stillFor = useRef(0);

  const gltf = useGLTF(ASSETS[asset].url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, model);

  useEffect(() => {
    applyRetroMaterial(scene);
    arm.current = scene.getObjectByName('arm_sword') ?? null;
  }, [scene]);

  useEffect(() => {
    actions.idle?.reset().fadeIn(CROSSFADE_SECONDS).play();
    current.current = 'idle';
  }, [actions]);

  useFrame((_, delta) => {
    const g = root.current;
    const c = combat.companion;
    if (!g) return;
    g.visible = c !== null;
    if (!c) {
      facing.current = null;
      return;
    }
    const a = sim.alpha;
    g.position.set(c.prev.x + (c.pos.x - c.prev.x) * a, 0, c.prev.z + (c.pos.z - c.prev.z) * a);
    facing.current = turnToward(facing.current ?? c.facing, c.facing, TURN_RATE * delta);
    g.rotation.y = Math.atan2(facing.current.x, facing.current.z);
    if (arm.current && c.swing > 0) {
      arm.current.rotation.x += swingAngle(1 - c.swing / COMPANION.swingTime);
    }
    const speed = Math.hypot(c.pos.x - c.prev.x, c.pos.z - c.prev.z) / SIM_STEP;
    stillFor.current = speed > WALK_SPEED_THRESHOLD ? 0 : stillFor.current + delta;
    const next: Clip = stillFor.current > IDLE_GRACE_SECONDS ? 'idle' : 'walk';
    if (current.current === next) return;
    actions[next]?.reset().fadeIn(CROSSFADE_SECONDS).play();
    if (current.current) actions[current.current]?.fadeOut(CROSSFADE_SECONDS);
    current.current = next;
    renderStats.companionClip = next;
  });

  return (
    <group ref={root} visible={false}>
      <group ref={model}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

export function CompanionActor() {
  const followingId = useNpcStore(
    (s) => Object.entries(s.npcs).find(([, n]) => n.following)?.[0] ?? null,
  );
  const asset = followingId ? NPC_BY_ID.get(followingId)?.companion?.asset : undefined;
  return asset ? <CompanionModel key={followingId} asset={asset} /> : null;
}
