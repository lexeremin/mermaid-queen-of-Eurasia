import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  Float32BufferAttribute,
  type Group,
  MeshLambertMaterial,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS } from '@/data/assets';
import { UNDERGROUND } from '@/data/maps/underground';
import { applyRetroMaterial } from '@/game/assets/retro-material';
import { currentMap } from '@/game/world/current-map';
import { useDungeonStore } from '@/store/dungeon-store';
import { useGameStore } from '@/store/game-store';

useGLTF.preload(ASSETS.ugGate.url);

const GATE_RISE = 3.9;
const GATE_RATE = 2.4;

/** The boss gate: a shut door across the corridor that sinks into the floor once it is opened. */
function BossGate() {
  const root = useRef<Group>(null);
  const rise = useRef(0);
  const gltf = useGLTF(ASSETS.ugGate.url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  useEffect(() => {
    applyRetroMaterial(scene);
  }, [scene]);
  useEffect(() => {
    // Already open when the save loads: no animation.
    rise.current = useDungeonStore.getState().gateOpen ? GATE_RISE : 0;
  }, []);

  useFrame((_, delta) => {
    const g = root.current;
    if (!g) return;
    const open = useDungeonStore.getState().gateOpen;
    const target = open ? GATE_RISE : 0;
    rise.current +=
      Math.sign(target - rise.current) *
      Math.min(Math.abs(target - rise.current), GATE_RATE * delta);
    g.position.y = -rise.current;
    g.visible = rise.current < GATE_RISE - 0.01;
  });

  return (
    <group ref={root} position={[UNDERGROUND.gate.x, 0, UNDERGROUND.gate.z]}>
      <primitive object={scene} />
    </group>
  );
}

/** A box with one colour baked into its vertices, so a whole chest merges into a couple of draw calls. */
function coloredBox(
  size: [number, number, number],
  at: [number, number, number],
  hex: string,
): BufferGeometry {
  const g = new BoxGeometry(...size).translate(...at);
  const color = new Color(hex);
  const count = g.getAttribute('position').count;
  const colors: number[] = [];
  for (let i = 0; i < count; i++) colors.push(color.r, color.g, color.b);
  g.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return g;
}

const CHEST_BASE = mergeGeometries([
  coloredBox([1.0, 0.55, 0.65], [0, 0.275, 0], '#7a4a2b'),
  coloredBox([0.16, 0.6, 0.7], [-0.3, 0.3, 0], '#d9a441'),
  coloredBox([0.16, 0.6, 0.7], [0.3, 0.3, 0], '#d9a441'),
])!;
/** The lid is built around its hinge (the back bottom edge) so it can swing open. */
const CHEST_LID = mergeGeometries([
  coloredBox([1.04, 0.22, 0.69], [0, 0.11, 0.32], '#8c5733'),
  coloredBox([0.18, 0.2, 0.06], [0, 0.02, 0.68], '#ffd36e'),
])!;
const CHEST_MATERIAL = new MeshLambertMaterial({ vertexColors: true });

function Chest({ id, x, z, facing }: { id: string; x: number; z: number; facing: number }) {
  const lid = useRef<Group>(null);
  const open = useRef(0);
  const taken = useDungeonStore((s) => s.cachesTaken.includes(id));

  useFrame((_, delta) => {
    const l = lid.current;
    if (!l) return;
    open.current = Math.min(1, Math.max(0, open.current + (taken ? 1 : -1) * delta * 3));
    l.rotation.x = -open.current * 1.2;
  });

  return (
    <group position={[x, 0, z]} rotation-y={facing}>
      <mesh geometry={CHEST_BASE} material={CHEST_MATERIAL} />
      <group ref={lid} position={[0, 0.55, -0.32]}>
        <mesh geometry={CHEST_LID} material={CHEST_MATERIAL} />
      </group>
    </group>
  );
}

/** Underground extras that are not plain placements: the treasure chests and the boss gate. */
export function DungeonProps() {
  const underground = useGameStore((s) => s.underground);
  // Nothing here is worth drawing, or even keeping alive, while Rosa is on the surface.
  if (!underground) return null;
  return (
    <>
      <BossGate />
      {(currentMap.chests ?? []).map((c) => (
        <Chest key={c.id} id={c.id} x={c.x} z={c.z} facing={0} />
      ))}
    </>
  );
}
