import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Group } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS } from '@/data/assets';
import { applyRetroMaterial } from '@/game/assets/retro-material';
import { renderStats } from '@/game/render-stats';
import { sim } from '@/game/sim';
import type { HeroForm } from '@/store/game-store';

const WALK_SPEED_THRESHOLD = 0.5;
const CROSSFADE_SECONDS = 0.18;

type Clip = 'idle' | 'walk';

const ASSET_BY_FORM = { human: 'rosa', mermaid: 'rosaMermaid' } as const;

export function RosaModel({ form }: { form: HeroForm }) {
  const root = useRef<Group>(null);
  const current = useRef<Clip | null>(null);

  const gltf = useGLTF(ASSETS[ASSET_BY_FORM[form]].url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, root);

  useEffect(() => applyRetroMaterial(scene), [scene]);

  useEffect(() => {
    const idle = actions.idle;
    idle?.reset().fadeIn(CROSSFADE_SECONDS).play();
    current.current = 'idle';
    renderStats.clip = 'idle';
  }, [actions]);

  useFrame((_, delta) => {
    const dx = sim.curr.pos.x - sim.prev.pos.x;
    const dz = sim.curr.pos.z - sim.prev.pos.z;
    const speed = Math.hypot(dx, dz) / Math.max(delta, 1e-4);
    const next: Clip = speed > WALK_SPEED_THRESHOLD ? 'walk' : 'idle';
    if (current.current === next) return;
    actions[next]?.reset().fadeIn(CROSSFADE_SECONDS).play();
    if (current.current) actions[current.current]?.fadeOut(CROSSFADE_SECONDS);
    current.current = next;
    renderStats.clip = next;
  });

  return (
    <group ref={root}>
      <primitive object={scene} />
    </group>
  );
}
