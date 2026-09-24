import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Matrix4, Object3D, type BufferGeometry, type InstancedMesh } from 'three';
import { ASSETS, type AssetId } from '@/data/assets';
import { getRetroMaterial } from '@/game/assets/retro-material';

export type Transform = { x: number; z: number; rotY?: number; scale?: number };

type MeshSource = { geometry: BufferGeometry; matrix: Matrix4 };

const dummy = new Object3D();
const combined = new Matrix4();

function InstancedPart({
  source,
  transforms,
}: {
  source: MeshSource;
  transforms: readonly Transform[];
}) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    transforms.forEach((t, i) => {
      dummy.position.set(t.x, 0, t.z);
      dummy.rotation.set(0, t.rotY ?? 0, 0);
      dummy.scale.setScalar(t.scale ?? 1);
      dummy.updateMatrix();
      combined.multiplyMatrices(dummy.matrix, source.matrix);
      mesh.setMatrixAt(i, combined);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [source, transforms]);

  return (
    <instancedMesh
      ref={ref}
      args={[source.geometry, getRetroMaterial(), transforms.length]}
      key={transforms.length}
    />
  );
}

/** One draw call per mesh in the asset, however many copies are placed. */
export function InstancedModel({
  id,
  transforms,
}: {
  id: AssetId;
  transforms: readonly Transform[];
}) {
  const gltf = useGLTF(ASSETS[id].url);
  const sources = useMemo(() => {
    const list: MeshSource[] = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((object) => {
      if ('isMesh' in object && object.isMesh) {
        list.push({
          geometry: (object as unknown as { geometry: BufferGeometry }).geometry,
          matrix: object.matrixWorld.clone(),
        });
      }
    });
    return list;
  }, [gltf.scene]);

  return (
    <>
      {sources.map((source, i) => (
        <InstancedPart key={i} source={source} transforms={transforms} />
      ))}
    </>
  );
}

for (const asset of Object.values(ASSETS)) useGLTF.preload(asset.url);
