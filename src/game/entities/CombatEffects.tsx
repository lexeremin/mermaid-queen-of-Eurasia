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
import { createWaveGeometry } from '@/game/entities/wave-geometry';
import { AURA, TRIDENT } from '@/systems/abilities';
import type { Effect } from '@/systems/combat';

const POOL = 6;
/** Enemy projectiles on screen at once (a paper storm sends two rings of twelve). */
const MAX_SHOTS = 48;
const WAVE_SLOTS = 3;
const WAVE_LAYERS = 3;
const BUBBLES_PER_BURST = 14;
const MAX_BURSTS = 6;
const NOTES_PER_RING = 8;
const NOTE_COLORS = ['#ff9fb8', '#ffe28f', '#f4d0df'].map((c) => new Color(c));
const dummy = new Object3D();

const rand = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

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
  const waves = useMemo<Pool[]>(
    () => Array.from({ length: WAVE_SLOTS * WAVE_LAYERS }, () => ({ mesh: null, material: null })),
    [],
  );
  const bubbles = useRef<InstancedMesh>(null);
  const puffs = useMemo<Pool[]>(
    () => Array.from({ length: POOL }, () => ({ mesh: null, material: null })),
    [],
  );
  const shots = useRef<InstancedMesh>(null);
  const notes = useRef<InstancedMesh>(null);
  const auraDisc = useRef<Mesh>(null);
  const auraMaterial = useRef<MeshBasicMaterial>(null);

  const arcGeometry = useMemo(() => {
    const half = TRIDENT.halfAngle;
    return new RingGeometry(0.25, 1, 20, 1, -half, half * 2).rotateX(-Math.PI / 2);
  }, []);
  const ringGeometry = useMemo(() => new RingGeometry(0.8, 1, 40).rotateX(-Math.PI / 2), []);
  const waveRingGeometry = useMemo(() => createWaveGeometry(), []);
  const bubbleGeometry = useMemo(() => new SphereGeometry(1, 6, 5), []);
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
    const byType: Record<string, Effect[]> = { arc: [], wave: [], bubbles: [], puff: [] };
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
    const waveEffects = byType.wave ?? [];
    waves.forEach((slot, i) => {
      const fx = waveEffects[Math.floor(i / WAVE_LAYERS)];
      const layer = i % WAVE_LAYERS;
      if (!slot.mesh || !slot.material) return;
      slot.mesh.visible = false;
      if (!fx) return;
      const t = (fx.age - layer * 0.07) / (fx.life - 0.3);
      if (t <= 0 || t >= 1) return;
      const radius = Math.max(0.3, fx.size * (1 - layer * 0.16) * easeOut(Math.min(1, t * 1.25)));
      slot.mesh.visible = true;
      slot.mesh.position.set(fx.x, 0.02, fx.z);
      slot.mesh.rotation.y = layer * 0.5;
      slot.mesh.scale.set(radius, (1 - layer * 0.18) * (1 - t * 0.5), radius);
      slot.material.opacity = 0.92 * (1 - t * t);
    });
    place(puffs, byType.puff ?? [], (m, mat, fx, t) => {
      m.position.set(fx.x, 0.6, fx.z);
      m.scale.setScalar(fx.size * (0.4 + 0.9 * easeOut(t)));
      mat.opacity = 0.7 * (1 - t);
    });

    const bubbleMesh = bubbles.current;
    if (bubbleMesh) {
      let n = 0;
      const bursts = (byType.bubbles ?? []).slice(0, MAX_BURSTS);
      for (const fx of bursts) {
        const t = fx.age / fx.life;
        for (let k = 0; k < BUBBLES_PER_BURST; k++) {
          const seed = fx.id * 31 + k * 7.3;
          const angle = rand(seed) * Math.PI * 2;
          const reach = fx.size * (0.25 + 0.75 * rand(seed + 1)) * easeOut(Math.min(1, t * 1.6));
          const rise = (0.3 + 1.7 * rand(seed + 2)) * t;
          const size = (0.08 + 0.15 * rand(seed + 3)) * (1 - t * t * t);
          dummy.position.set(
            fx.x + Math.cos(angle) * reach + Math.sin(t * 9 + k) * 0.05,
            0.25 + rise,
            fx.z + Math.sin(angle) * reach,
          );
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(Math.max(0.001, size));
          dummy.updateMatrix();
          bubbleMesh.setMatrixAt(n++, dummy.matrix);
        }
      }
      bubbleMesh.count = n;
      bubbleMesh.instanceMatrix.needsUpdate = true;
    }

    const projectiles = combat.projectiles;
    const shotMesh = shots.current;
    if (shotMesh) {
      let n = 0;
      for (const p of projectiles) {
        if (n >= MAX_SHOTS) break;
        dummy.position.set(p.pos.x, 1.0, p.pos.z);
        dummy.rotation.set(0, yawOf({ x: p.vel.x, z: p.vel.z }), 0);
        dummy.scale.setScalar(0.9 + p.age * 1.4);
        dummy.updateMatrix();
        shotMesh.setMatrixAt(n++, dummy.matrix);
      }
      shotMesh.count = n;
      shotMesh.instanceMatrix.needsUpdate = true;
    }

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
      {Array.from({ length: WAVE_SLOTS * WAVE_LAYERS }, (_, i) => {
        const s = slot(waves, i);
        return (
          <mesh
            key={`wave${i}`}
            ref={s.mesh}
            geometry={waveRingGeometry}
            visible={false}
            renderOrder={4}
          >
            <meshBasicMaterial
              ref={s.material}
              vertexColors
              transparent
              depthWrite={false}
              side={DoubleSide}
            />
          </mesh>
        );
      })}
      <instancedMesh
        ref={bubbles}
        args={[bubbleGeometry, undefined, MAX_BURSTS * BUBBLES_PER_BURST]}
        frustumCulled={false}
        renderOrder={5}
      >
        <meshBasicMaterial color="#8fe9ff" transparent opacity={0.85} depthWrite={false} />
      </instancedMesh>
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
      <instancedMesh ref={shots} args={[waveGeometry, undefined, MAX_SHOTS]} frustumCulled={false}>
        <meshBasicMaterial color="#ffcf5a" side={DoubleSide} transparent opacity={0.9} />
      </instancedMesh>
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
