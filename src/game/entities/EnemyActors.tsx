import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  Color,
  DoubleSide,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type MeshLambertMaterial,
  type Object3D,
} from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS } from '@/data/assets';
import { ENEMIES, type EnemyKind } from '@/data/enemies';
import { layerLevel } from '@/data/maps/underground';
import { useDungeonStore } from '@/store/dungeon-store';
import { combat } from '@/game/combat-sim';
import { getRetroMaterial } from '@/game/assets/retro-material';
import { BlindMark } from '@/game/entities/BlindMark';
import { BossActor } from '@/game/entities/BossActor';
import { defOf, maxHpOf, type Enemy } from '@/systems/enemy-ai';
import { currentMap } from '@/game/world/current-map';

const FLASH = new Color('#ffffff');
const BAR_WIDTH = 1.7;

function EnemyActor({ index, kind }: { index: number; kind: EnemyKind }) {
  const def = ENEMIES[kind];
  const root = useRef<Group>(null);
  const yaw = useRef<Group>(null);
  const body = useRef<Group>(null);
  const blindfold = useRef<Mesh>(null);
  const bar = useRef<Group>(null);
  const fill = useRef<Mesh>(null);
  const telegraph = useRef<Mesh>(null);
  const telegraphMaterial = useRef<MeshBasicMaterial>(null);
  const mark = useRef<Group>(null);

  const gltf = useGLTF(ASSETS[def.asset].url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  const material = useMemo(() => {
    const m = getRetroMaterial().clone() as MeshLambertMaterial;
    m.emissive = new Color('#000000');
    return m;
  }, []);

  useEffect(() => {
    scene.traverse((child: Object3D) => {
      if ('isMesh' in child && child.isMesh) (child as Mesh).material = material;
    });
  }, [scene, material]);

  useFrame(({ clock, camera }) => {
    const enemy: Enemy | undefined = combat.enemies[index];
    const g = root.current;
    const yawGroup = yaw.current;
    const b = body.current;
    if (!enemy || !g || !yawGroup || !b) return;
    const dead = enemy.state === 'dead';
    const blind = enemy.state === 'blinded';
    const t = clock.elapsedTime;

    g.visible = !enemy.dormant && (!dead || enemy.deadFor < 0.5);
    g.position.set(enemy.pos.x, 0, enemy.pos.z);
    yawGroup.rotation.y = Math.atan2(enemy.facing.x, enemy.facing.z);

    let lean = 0;
    let stretch = 1;
    if (enemy.state === 'windup') {
      const progress = 1 - enemy.timer / defOf(enemy).windup;
      lean = -0.35 * progress;
      stretch = 1 + 0.12 * progress;
    } else if (enemy.state === 'attack') {
      lean = 0.5;
      stretch = 0.92;
    } else if (enemy.state === 'stunned') lean = Math.sin(t * 40) * 0.12;
    else if (blind) lean = enemy.timer > 0 ? 0.55 : Math.sin(t * 6 + index) * 0.16;
    const deathScale = dead ? Math.max(0, 1 - enemy.deadFor * 2.2) : 1;
    b.position.y = Math.sin(t * 3 + index) * 0.03;
    b.rotation.x = lean;
    b.rotation.z = blind ? Math.sin(t * 4 + index) * 0.1 : 0;
    b.scale.set(deathScale, stretch * deathScale, deathScale);

    material.emissive.copy(FLASH).multiplyScalar(Math.min(1, enemy.flash / 0.12) * 0.8);

    if (blindfold.current) blindfold.current.visible = blind;

    const showBar = !dead && !enemy.dormant;
    if (bar.current && fill.current) {
      bar.current.visible = showBar;
      if (showBar) {
        bar.current.quaternion.copy(camera.quaternion);
        const f = Math.max(0.02, enemy.hp / maxHpOf(enemy));
        fill.current.scale.x = f;
        fill.current.position.x = -(BAR_WIDTH * (1 - f)) / 2;
      }
    }
    if (telegraph.current && telegraphMaterial.current) {
      const show = enemy.state === 'windup' && !def.ranged;
      telegraph.current.visible = show;
      if (show) {
        const progress = 1 - enemy.timer / def.windup;
        telegraph.current.scale.setScalar(def.attackRange);
        telegraphMaterial.current.opacity = 0.15 + 0.5 * progress;
      }
    }
    if (mark.current) mark.current.visible = blind;
  });

  const band = def.headRadius * 2 + 0.08;

  return (
    <group ref={root}>
      <group ref={yaw}>
        <group ref={body} scale={def.scale}>
          <primitive object={scene} />
          <mesh ref={blindfold} position={[0, def.headHeight, 0]} visible={false}>
            <boxGeometry args={[band, 0.15, band]} />
            <meshBasicMaterial color="#0b1220" />
          </mesh>
        </group>
      </group>
      <group ref={bar} position={[0, def.markHeight - 0.15, 0]} visible={false}>
        <mesh renderOrder={20}>
          <planeGeometry args={[BAR_WIDTH + 0.12, 0.3]} />
          <meshBasicMaterial color="#0b1220" depthTest={false} transparent opacity={0.9} />
        </mesh>
        <mesh ref={fill} position={[0, 0, 0.01]} renderOrder={21}>
          <planeGeometry args={[BAR_WIDTH, 0.2]} />
          <meshBasicMaterial color="#e3536b" depthTest={false} transparent />
        </mesh>
      </group>
      <mesh ref={telegraph} rotation-x={-Math.PI / 2} position={[0, 0.06, 0]} visible={false}>
        <circleGeometry args={[1, 28]} />
        <meshBasicMaterial
          ref={telegraphMaterial}
          color="#ff4d5e"
          transparent
          opacity={0.3}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <group ref={mark} position={[0, def.markHeight, 0]} visible={false}>
        <BlindMark />
      </group>
    </group>
  );
}

/** The monsters of the map (their index in `combat.enemies` is their index in the map), then those of the current layer. */
export function EnemyActors() {
  const layer = useDungeonStore((s) => s.layer);
  const level = layer > 0 ? layerLevel(layer) : null;
  const surface = currentMap.enemies.length;
  return (
    <>
      {currentMap.enemies.map((spawn, index) =>
        spawn.kind === 'boss' ? (
          <BossActor key={spawn.id} index={index} />
        ) : (
          <EnemyActor key={spawn.id} index={index} kind={spawn.kind} />
        ),
      )}
      {level && (
        // The layer's monsters are added after the map's, in order, when the layer is installed (see dungeon-sim).
        <group key={level.layer}>
          {level.enemies.map((spawn, i) =>
            spawn.kind === 'boss' ? (
              <BossActor key={spawn.id} index={surface + i} />
            ) : (
              <EnemyActor key={spawn.id} index={surface + i} kind={spawn.kind} />
            ),
          )}
        </group>
      )}
    </>
  );
}
