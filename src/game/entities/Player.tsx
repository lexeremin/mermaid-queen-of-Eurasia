import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { AnimationAction, Group } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS } from '@/data/assets';
import { applyRetroMaterial } from '@/game/assets/retro-material';
import { renderStats } from '@/game/render-stats';
import { getRenderPosition, sim } from '@/game/sim';
import { useMemo } from 'react';

const position = { x: 0, z: 0 };
const WALK_SPEED_THRESHOLD = 0.5;
const CROSSFADE_SECONDS = 0.18;

type Clip = 'idle' | 'walk';

export function Player() {
  const group = useRef<Group>(null);
  const model = useRef<Group>(null);
  const current = useRef<Clip | null>(null);

  const gltf = useGLTF(ASSETS.rosa.url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, model);

  useEffect(() => applyRetroMaterial(scene), [scene]);

  const play = (next: Clip) => {
    if (current.current === next) return;
    const incoming: AnimationAction | null | undefined = actions[next];
    const outgoing = current.current ? actions[current.current] : null;
    incoming?.reset().fadeIn(CROSSFADE_SECONDS).play();
    outgoing?.fadeOut(CROSSFADE_SECONDS);
    current.current = next;
    renderStats.clip = next;
  };

  useEffect(() => {
    play('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    getRenderPosition(position);
    g.position.set(position.x, 0, position.z);
    g.rotation.y = Math.atan2(sim.curr.facing.x, sim.curr.facing.z);

    const dx = sim.curr.pos.x - sim.prev.pos.x;
    const dz = sim.curr.pos.z - sim.prev.pos.z;
    const speed = Math.hypot(dx, dz) / Math.max(delta, 1e-4);
    play(speed > WALK_SPEED_THRESHOLD ? 'walk' : 'idle');
  });

  return (
    <group ref={group}>
      <group ref={model}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
