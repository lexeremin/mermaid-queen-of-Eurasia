import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  Color,
  DoubleSide,
  type InstancedMesh,
  Object3D,
  RingGeometry,
  SphereGeometry,
  type Mesh,
  type MeshBasicMaterial,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { combat } from '@/game/combat-sim';
import { sim } from '@/game/sim';
import { AURA, TRIDENT } from '@/systems/abilities';
import type { Effect } from '@/systems/combat';

const POOL = 6;
const NOTES_PER_RING = 8;
const NOTE_COLORS = ['#ff9fb8', '#ffe28f', '#f4d0df'].map((c) => new Color(c));
const dummy = new Object3D();

const yawOf = (dir: { x: number; z: number }): number => Math.atan2(-dir.z, dir.x);
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

function noteGeometry() {
  const head = new SphereGeometry(0.13, 6, 4);
  head.scale(1.3, 0.9, 1);
  const stem = new BoxGeometry(0.04, 0.46, 0.04);
  stem.translate(0.14, 0.23, 0);
  const flag = new BoxGeometry(0.16, 0.06, 0.04);
  flag.translate(0.21, 0.44, 0);
  return mergeGeometries([head, stem, flag]);
}

type Pool = { mesh: Mesh | null; material: MeshBasicMaterial | null };

export function CombatEffects() {
  const arcs = useMemo<Pool[]>(
    () => Array.from({ length: POOL }, () => ({ mesh: null, material: null })),
    [],
  );
  const rings = useMemo<Pool[]>(
    () => Array.from({ length: POOL }, () => ({ mesh: null, material: null })),
    [],
  );
  const streaks = useMemo<Pool[]>(
    () => Array.from({ length: POOL }, () => ({ mesh: null, material: null })),
    [],
  );
  const puffs = useMemo<Pool[]>(
    () => Array.from({ length: POOL }, () => ({ mesh: null, material: null })),
    [],
  );
  const shots = useMemo<(Mesh | null)[]>(() => Array.from({ length: 12 }, () => null), []);
  const notes = useRef<InstancedMesh>(null);
  const auraDisc = useRef<Mesh>(null);
  const auraMaterial = useRef<MeshBasicMaterial>(null);

  const arcGeometry = useMemo(() => {
    const half = TRIDENT.halfAngle;
    return new RingGeometry(0.25, 1, 20, 1, -half, half * 2).rotateX(-Math.PI / 2);
  }, []);
  const ringGeometry = useMemo(() => new RingGeometry(0.8, 1, 40).rotateX(-Math.PI / 2), []);
  const puffGeometry = useMemo(() => new SphereGeometry(1, 8, 6), []);
  const noteGeo = useMemo(() => noteGeometry(), []);
  const waveGeometry = useMemo(
    () => new RingGeometry(0.3, 0.42, 12, 1, -0.9, 1.8).rotateX(-Math.PI / 2),
    [],
  );

  useEffect(() => {
    const mesh = notes.current;
    if (!mesh) return;
    for (let i = 0; i < AURA.rings * NOTES_PER_RING; i++) {
      mesh.setColorAt(
        i,
        NOTE_COLORS[Math.floor(i / NOTES_PER_RING) % NOTE_COLORS.length] ?? NOTE_COLORS[0]!,
      );
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame(() => {
    const byType: Record<string, Effect[]> = { arc: [], ring: [], streak: [], puff: [] };
    for (const fx of combat.effects) byType[fx.type]?.push(fx);

    const place = (
      pool: Pool[],
      list: Effect[],
      apply: (m: Mesh, mat: MeshBasicMaterial, fx: Effect, t: number) => void,
    ) => {
      pool.forEach((slot, i) => {
        const fx = list[i];
        if (!slot.mesh || !slot.material) return;
        slot.mesh.visible = fx !== undefined;
        if (fx) apply(slot.mesh, slot.material, fx, fx.age / fx.life);
      });
    };
    place(arcs, byType.arc ?? [], (m, mat, fx, t) => {
      m.position.set(fx.x, 0.12, fx.z);
      m.rotation.y = yawOf(fx.dir);
      m.scale.setScalar(fx.size * (0.7 + 0.3 * easeOut(t)));
      mat.opacity = 0.8 * (1 - t);
    });
    place(rings, byType.ring ?? [], (m, mat, fx, t) => {
      m.position.set(fx.x, 0.1, fx.z);
      m.scale.setScalar(Math.max(0.1, fx.size * easeOut(Math.min(1, t * 1.6))));
      mat.opacity = 0.85 * (1 - t);
    });
    place(streaks, byType.streak ?? [], (m, mat, fx, t) => {
      m.position.set(fx.x + (fx.dir.x * fx.size) / 2, 0.5, fx.z + (fx.dir.z * fx.size) / 2);
      m.rotation.y = yawOf(fx.dir);
      m.scale.set(fx.size, 1, 0.5 * (1 - t));
      mat.opacity = 0.55 * (1 - t);
    });
    place(puffs, byType.puff ?? [], (m, mat, fx, t) => {
      m.position.set(fx.x, 0.6, fx.z);
      m.scale.setScalar(fx.size * (0.4 + 0.9 * easeOut(t)));
      mat.opacity = 0.7 * (1 - t);
    });

    const projectiles = combat.projectiles;
    shots.forEach((mesh, i) => {
      const p = projectiles[i];
      if (!mesh) return;
      mesh.visible = p !== undefined;
      if (p) {
        mesh.position.set(p.pos.x, 1.0, p.pos.z);
        mesh.rotation.y = yawOf({ x: p.vel.x, z: p.vel.z });
        mesh.scale.setScalar(0.9 + p.age * 1.4);
      }
    });

    const notesMesh = notes.current;
    const disc = auraDisc.current;
    const aura = combat.aura;
    if (notesMesh) {
      const total = AURA.rings * NOTES_PER_RING;
      if (aura.active) {
        const progress = aura.t / AURA.duration;
        const radius = AURA.maxRadius * Math.min(1, progress);
        const fade = progress > 0.8 ? Math.max(0, (1 - progress) / 0.2) : 1;
        let index = 0;
        for (let ring = 0; ring < AURA.rings; ring++) {
          const r = Math.max(0.6, radius - ring * 1.7);
          const spin = aura.t * (ring % 2 === 0 ? 2.2 : -2.6);
          for (let k = 0; k < NOTES_PER_RING; k++) {
            const a = spin + (k / NOTES_PER_RING) * Math.PI * 2 + ring * 0.4;
            dummy.position.set(
              sim.curr.pos.x + Math.cos(a) * r,
              0.9 + ring * 0.28 + Math.sin(aura.t * 6 + k) * 0.12,
              sim.curr.pos.z + Math.sin(a) * r,
            );
            dummy.rotation.set(0, -a, Math.sin(aura.t * 5 + k) * 0.35);
            dummy.scale.setScalar(fade);
            dummy.updateMatrix();
            notesMesh.setMatrixAt(index++, dummy.matrix);
          }
        }
        notesMesh.count = total;
      } else {
        notesMesh.count = 0;
      }
      notesMesh.instanceMatrix.needsUpdate = true;
    }
    if (disc && auraMaterial.current) {
      disc.visible = aura.active;
      if (aura.active) {
        const progress = aura.t / AURA.duration;
        disc.position.set(sim.curr.pos.x, 0.09, sim.curr.pos.z);
        disc.scale.setScalar(Math.max(0.1, AURA.maxRadius * Math.min(1, progress)));
        auraMaterial.current.opacity = 0.55 * (1 - progress);
      }
    }
  });

  const slot = (pool: Pool[], i: number) => ({
    mesh: (m: Mesh | null) => {
      const entry = pool[i];
      if (entry) entry.mesh = m;
    },
    material: (m: MeshBasicMaterial | null) => {
      const entry = pool[i];
      if (entry) entry.material = m;
    },
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => {
        const s = slot(arcs, i);
        return (
          <mesh key={`arc${i}`} ref={s.mesh} geometry={arcGeometry} visible={false} renderOrder={4}>
            <meshBasicMaterial
              ref={s.material}
              color="#ffb8cc"
              transparent
              depthWrite={false}
              side={DoubleSide}
            />
          </mesh>
        );
      })}
      {Array.from({ length: POOL }, (_, i) => {
        const s = slot(rings, i);
        return (
          <mesh
            key={`ring${i}`}
            ref={s.mesh}
            geometry={ringGeometry}
            visible={false}
            renderOrder={4}
          >
            <meshBasicMaterial
              ref={s.material}
              color="#6be3d1"
              transparent
              depthWrite={false}
              side={DoubleSide}
            />
          </mesh>
        );
      })}
      {Array.from({ length: POOL }, (_, i) => {
        const s = slot(streaks, i);
        return (
          <mesh key={`streak${i}`} ref={s.mesh} visible={false} renderOrder={4}>
            <boxGeometry args={[1, 0.9, 1]} />
            <meshBasicMaterial ref={s.material} color="#f4d0df" transparent depthWrite={false} />
          </mesh>
        );
      })}
      {Array.from({ length: POOL }, (_, i) => {
        const s = slot(puffs, i);
        return (
          <mesh
            key={`puff${i}`}
            ref={s.mesh}
            geometry={puffGeometry}
            visible={false}
            renderOrder={4}
          >
            <meshBasicMaterial ref={s.material} color="#ece0c0" transparent depthWrite={false} />
          </mesh>
        );
      })}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh
          key={`shot${i}`}
          ref={(m) => {
            shots[i] = m;
          }}
          geometry={waveGeometry}
          visible={false}
        >
          <meshBasicMaterial color="#ffcf5a" side={DoubleSide} transparent opacity={0.9} />
        </mesh>
      ))}
      <instancedMesh
        ref={notes}
        args={[noteGeo, undefined, AURA.rings * NOTES_PER_RING]}
        frustumCulled={false}
      >
        <meshBasicMaterial />
      </instancedMesh>
      <mesh ref={auraDisc} geometry={ringGeometry} visible={false} renderOrder={3}>
        <meshBasicMaterial
          ref={auraMaterial}
          color="#ff9fb8"
          transparent
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </>
  );
}
