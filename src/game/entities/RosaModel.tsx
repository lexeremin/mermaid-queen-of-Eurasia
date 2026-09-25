import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Box3, Vector3, type Group, type Object3D } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS } from '@/data/assets';
import { applyHeroLook } from '@/game/assets/xray';
import { combat } from '@/game/combat-sim';
import { renderStats } from '@/game/render-stats';
import { sim } from '@/game/sim';
import type { HeroForm } from '@/store/game-store';
import { HolyCrown } from '@/game/entities/HolyCrown';
import { useProgressStore } from '@/store/progress-store';
import { SWING_TIME } from '@/systems/abilities';
import { hasWings } from '@/systems/skills';

const WALK_SPEED_THRESHOLD = 0.5;
const CROSSFADE_SECONDS = 0.18;

type Clip = 'idle' | 'walk';

const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Extra rotation of the trident arm (radians around its shoulder) during a swing: a short wind-up
 * that lifts the trident back, a fast overhead slash that ends with the tips pointing forward,
 * then a recovery. `t` runs 0..1 over the swing.
 */
export function swingAngle(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  if (t < 0.25) return lerp(0, -0.55, smooth(t / 0.25));
  if (t < 0.55) return lerp(-0.55, 1.75, smooth((t - 0.25) / 0.3));
  return lerp(1.75, 0, smooth((t - 0.55) / 0.45));
}

/** Standing height of a figure, from its bounding box (1.75 m when it has none). */
function heightOf(model: Object3D): number {
  const size = new Box3().setFromObject(model).getSize(new Vector3());
  return size.y > 0.5 && size.y < 4 ? size.y : 1.75;
}

const ASSET_BY_FORM = { human: 'rosa', mermaid: 'rosaMermaid' } as const;

export function RosaModel({ form }: { form: HeroForm }) {
  const root = useRef<Group>(null);
  const current = useRef<Clip | null>(null);
  const arm = useRef<Object3D | null>(null);

  const gltf = useGLTF(ASSETS[ASSET_BY_FORM[form]].url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  const height = useMemo(() => heightOf(scene), [scene]);
  const crowned = useProgressStore((s) => hasWings(s.level)) && form === 'human';
  const { actions } = useAnimations(gltf.animations, root);

  useEffect(() => {
    applyHeroLook(scene);
    arm.current = scene.getObjectByName('arm_r') ?? null;
  }, [scene]);

  useEffect(() => {
    const idle = actions.idle;
    idle?.reset().fadeIn(CROSSFADE_SECONDS).play();
    current.current = 'idle';
    renderStats.clip = 'idle';
  }, [actions]);

  useFrame((_, delta) => {
    if (arm.current && combat.swing > 0) {
      arm.current.rotation.x += swingAngle(1 - combat.swing / SWING_TIME);
    }
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
      {crowned && <HolyCrown height={height} />}
    </group>
  );
}
