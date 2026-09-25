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
import { poseTool, restPose, swingPose } from '@/game/entities/swing-pose';
import { TRIDENT_COMBO } from '@/systems/abilities';
import { hasWings } from '@/systems/skills';

const WALK_SPEED_THRESHOLD = 0.5;
const CROSSFADE_SECONDS = 0.18;
/** How far the trident slides along itself in a swing, so it is gripped near its butt end. */
const TRIDENT_SLIDE = 0.8;

type Clip = 'idle' | 'walk';

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
  const trident = useRef<{ node: Object3D; base: Vector3 } | null>(null);

  const gltf = useGLTF(ASSETS[ASSET_BY_FORM[form]].url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  const height = useMemo(() => heightOf(scene), [scene]);
  const crowned = useProgressStore((s) => hasWings(s.level)) && form === 'human';
  const { actions } = useAnimations(gltf.animations, root);

  useEffect(() => {
    applyHeroLook(scene);
    arm.current = scene.getObjectByName('arm_r') ?? null;
    const node = scene.getObjectByName('trident');
    trident.current = node ? { node, base: node.position.clone() } : null;
  }, [scene]);

  useEffect(() => {
    const idle = actions.idle;
    idle?.reset().fadeIn(CROSSFADE_SECONDS).play();
    current.current = 'idle';
    renderStats.clip = 'idle';
  }, [actions]);

  useFrame((_, delta) => {
    const kind = combat.swingKind;
    const total = TRIDENT_COMBO[kind]?.swing ?? TRIDENT_COMBO[0].swing;
    const pose = combat.swing > 0 ? swingPose(kind, 1 - combat.swing / total, 0) : restPose(0);
    if (arm.current) arm.current.rotation.x += pose.arm;
    if (trident.current) poseTool(trident.current.node, trident.current.base, pose, TRIDENT_SLIDE);
    if (root.current) {
      root.current.rotation.y = pose.twist;
      root.current.rotation.x = pose.lean;
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
