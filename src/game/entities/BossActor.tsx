import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Color, type Group, type Mesh, type MeshLambertMaterial, type Object3D } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS } from '@/data/assets';
import { ENEMIES } from '@/data/enemies';
import { getRetroMaterial } from '@/game/assets/retro-material';
import { BlindMark } from '@/game/entities/BlindMark';
import { combat } from '@/game/combat-sim';
import { BOSS } from '@/systems/boss';
import { smoothstep as smooth } from '@/utils/math';

const FLASH = new Color('#ffffff');
const RAISED = -2.4;
const DEF = ENEMIES.boss;

/** How far the stamp arm is raised for this moment of the current move: up during the windup, down at the impact. */
function armAngle(kind: string, t: number): number {
  const windup =
    kind === 'stomp'
      ? BOSS.stomp.windup
      : kind === 'stamp'
        ? BOSS.stamp.windup
        : kind === 'form'
          ? BOSS.form.windup
          : 0;
  if (windup > 0) {
    if (t < windup) return RAISED * smooth(t / windup);
    return RAISED * (1 - smooth(Math.min(1, (t - windup) / 0.14)));
  }
  if (kind === 'summon' || kind === 'storm') return RAISED * 0.85 * smooth(Math.min(1, t / 0.5));
  return 0;
}

/** Lord Bumazhnik: the same walk-in-place model, with the stamp arm raised and slammed to match his moves. */
export function BossActor({ index }: { index: number }) {
  const root = useRef<Group>(null);
  const yaw = useRef<Group>(null);
  const body = useRef<Group>(null);
  const arm = useRef<Object3D | null>(null);
  const mark = useRef<Group>(null);

  const gltf = useGLTF(ASSETS[DEF.asset].url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, body);
  const material = useMemo(() => {
    const m = getRetroMaterial().clone() as MeshLambertMaterial;
    m.emissive = new Color('#000000');
    return m;
  }, []);

  useEffect(() => {
    scene.traverse((child: Object3D) => {
      if ('isMesh' in child && child.isMesh) (child as Mesh).material = material;
    });
    arm.current = scene.getObjectByName('arm_stamp') ?? null;
  }, [scene, material]);

  useEffect(() => {
    actions.idle?.reset().play();
  }, [actions]);

  useFrame(() => {
    const enemy = combat.enemies[index];
    const g = root.current;
    const yawGroup = yaw.current;
    const b = body.current;
    if (!enemy || !g || !yawGroup || !b) return;
    const dead = enemy.state === 'dead';
    g.visible = !dead || enemy.deadFor < 1.2;
    g.position.set(enemy.pos.x, 0, enemy.pos.z);
    yawGroup.rotation.y = Math.atan2(enemy.facing.x, enemy.facing.z);

    const action = enemy.brain?.action ?? null;
    if (arm.current && action) arm.current.rotation.x += armAngle(action.kind, action.t);
    const deathScale = dead ? Math.max(0, 1 - enemy.deadFor * 0.85) : 1;
    const windup = action && action.t < 1 ? action.t : 0;
    b.scale.set(deathScale, deathScale * (1 + 0.04 * Math.min(1, windup)), deathScale);
    b.rotation.x = enemy.state === 'blinded' ? 0.12 : 0;
    material.emissive.copy(FLASH).multiplyScalar(Math.min(1, enemy.flash / 0.12) * 0.8);
    if (mark.current) mark.current.visible = enemy.state === 'blinded';
  });

  return (
    <group ref={root}>
      <group ref={yaw}>
        <group ref={body}>
          <primitive object={scene} />
        </group>
      </group>
      <group ref={mark} position={[0, DEF.markHeight, 0]} visible={false}>
        <BlindMark />
      </group>
    </group>
  );
}
