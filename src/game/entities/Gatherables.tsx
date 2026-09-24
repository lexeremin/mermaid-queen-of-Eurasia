import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  SphereGeometry,
  type InstancedMesh,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { gather } from '@/game/gather-sim';
import type { GatherKind } from '@/data/maps/types';

const MAX = 32;
const dummy = new Object3D();
const color = new Color();

const LEAF: Record<GatherKind, string> = {
  roseHip: '#4f9a55',
  moonMint: '#63c9a5',
  pearl: '#f2c6d8',
};
const FRUIT: Record<GatherKind, string> = {
  roseHip: '#f0506a',
  moonMint: '#e6fff7',
  pearl: '#fdf7ff',
};
const GROW_SECONDS = 0.7;

/** A little bush: three leaf cones. For a pearl this is the shell it sits on. */
function bushGeometry() {
  const cones = [0, 2.1, 4.2].map((a) => {
    const c = new ConeGeometry(0.22, 0.6, 5);
    c.translate(Math.cos(a) * 0.16, 0.3, Math.sin(a) * 0.16);
    return c;
  });
  return mergeGeometries(cones);
}

/** Herbs (they regrow) and hidden pearls (once), drawn as two instanced meshes. */
export function Gatherables() {
  const leaves = useRef<InstancedMesh>(null);
  const fruits = useRef<InstancedMesh>(null);
  const bush = useMemo(() => bushGeometry(), []);
  const shell = useMemo(() => new CylinderGeometry(0.3, 0.36, 0.1, 8), []);
  const berry = useMemo(() => new SphereGeometry(1, 8, 6), []);
  const leafMaterial = useMemo(() => new MeshLambertMaterial(), []);
  const fruitMaterial = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), []);
  const leavesForPearls = useRef<InstancedMesh>(null);

  useFrame(({ clock }) => {
    const l = leaves.current;
    const f = fruits.current;
    const shells = leavesForPearls.current;
    if (!l || !f || !shells) return;
    const t = clock.elapsedTime;
    let nBush = 0;
    let nFruit = 0;
    let nShell = 0;
    for (const node of gather.nodes) {
      const since = gather.time - node.readyAt;
      if (since < 0) continue;
      const grow = Math.min(1, since / GROW_SECONDS);
      const scale = grow * (2 - grow);
      if (node.kind === 'pearl') {
        dummy.position.set(node.pos.x, 0.06, node.pos.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        shells.setMatrixAt(nShell, dummy.matrix);
        shells.setColorAt(nShell++, color.set(LEAF.pearl));
        dummy.position.set(node.pos.x, 0.32 + Math.sin(t * 2 + node.pos.x) * 0.05, node.pos.z);
        dummy.scale.setScalar(0.2 * scale);
        dummy.updateMatrix();
        f.setMatrixAt(nFruit, dummy.matrix);
        f.setColorAt(nFruit++, color.set(FRUIT.pearl));
        continue;
      }
      dummy.position.set(node.pos.x, 0, node.pos.z);
      dummy.rotation.set(0, node.pos.x * 3.1, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      l.setMatrixAt(nBush, dummy.matrix);
      l.setColorAt(nBush++, color.set(LEAF[node.kind]));
      dummy.rotation.set(0, 0, 0);
      for (const [dx, dz, h] of [
        [0.12, 0.1, 0.5],
        [-0.14, 0.04, 0.42],
        [0.02, -0.15, 0.55],
      ] as const) {
        dummy.position.set(node.pos.x + dx * scale, h * scale, node.pos.z + dz * scale);
        dummy.scale.setScalar(0.075 * scale);
        dummy.updateMatrix();
        f.setMatrixAt(nFruit, dummy.matrix);
        f.setColorAt(nFruit++, color.set(FRUIT[node.kind]));
      }
    }
    l.count = nBush;
    f.count = nFruit;
    shells.count = nShell;
    for (const mesh of [l, f, shells]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={leaves} args={[bush, leafMaterial, MAX]} frustumCulled={false} />
      <instancedMesh
        ref={leavesForPearls}
        args={[shell, leafMaterial, MAX]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={fruits}
        args={[berry, fruitMaterial, MAX * 3]}
        frustumCulled={false}
        renderOrder={2}
      />
    </>
  );
}
