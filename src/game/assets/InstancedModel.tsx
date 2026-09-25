import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  Box3,
  InstancedBufferAttribute,
  Matrix4,
  Object3D,
  type BufferGeometry,
  type InstancedMesh,
} from 'three';
import { ASSETS, type AssetId } from '@/data/assets';
import { HERO_OCCLUSION_HOLD_MS, heroOcclusion } from '@/game/assets/hero-occlusion';
import { getRetroMaterial } from '@/game/assets/retro-material';
import { getRenderPosition } from '@/game/sim';
import {
  MIN_OCCLUDER_HEIGHT,
  segmentHitsBox,
  stepOpacity,
  type Box,
  type Vec3,
} from '@/systems/occlusion';

export type Transform = { x: number; z: number; rotY?: number; scale?: number; stretch?: number };

type MeshSource = { geometry: BufferGeometry; matrix: Matrix4 };

const dummy = new Object3D();
const combined = new Matrix4();
const box3 = new Box3();
const playerPos = { x: 0, z: 0 };
const eye: Vec3 = { x: 0, y: 0, z: 0 };
const target: Vec3 = { x: 0, y: 1.1, z: 0 };
/** Only models within this distance (metres, on the ground) of Rosa are tested for hiding her. */
const OCCLUSION_MARGIN = 0.4;

type FadeState = { opacity: Float32Array; boxes: Box[]; attribute: InstancedBufferAttribute };

function InstancedPart({
  source,
  transforms,
}: {
  source: MeshSource;
  transforms: readonly Transform[];
}) {
  const ref = useRef<InstancedMesh>(null);
  const fade = useRef<FadeState | null>(null);
  const candidates = useRef<number[]>([]);
  const tickCount = useRef(0);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    source.geometry.computeBoundingBox();
    const local = source.geometry.boundingBox;
    const boxes: Box[] = [];
    transforms.forEach((t, i) => {
      dummy.position.set(t.x, 0, t.z);
      dummy.rotation.set(0, t.rotY ?? 0, 0);
      const scale = t.scale ?? 1;
      dummy.scale.set(scale * (t.stretch ?? 1), scale, scale);
      dummy.updateMatrix();
      combined.multiplyMatrices(dummy.matrix, source.matrix);
      mesh.setMatrixAt(i, combined);
      if (local) {
        box3.copy(local).applyMatrix4(combined);
        boxes.push({
          min: { x: box3.min.x, y: box3.min.y, z: box3.min.z },
          max: { x: box3.max.x, y: box3.max.y, z: box3.max.z },
        });
      }
    });
    const opacity = new Float32Array(transforms.length).fill(1);
    const attribute = new InstancedBufferAttribute(opacity, 1);
    source.geometry.setAttribute('instanceFade', attribute);
    // Only models that are tall in the world (not in their own, possibly quantized, units) can hide Rosa.
    const tall = boxes.some((b) => b.max.y - b.min.y >= MIN_OCCLUDER_HEIGHT);
    fade.current = tall ? { opacity, boxes, attribute } : null;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [source, transforms]);

  useFrame((state, delta) => {
    const f = fade.current;
    if (!f) return;
    getRenderPosition(playerPos);
    target.x = playerPos.x;
    target.z = playerPos.z;
    eye.x = state.camera.position.x;
    eye.y = state.camera.position.y;
    eye.z = state.camera.position.z;
    // Only boxes near the line from the camera to Rosa (or still faded) can matter: pick them every few frames,
    // then test just those each frame.
    if ((tickCount.current++ & 3) === 0) {
      const list = candidates.current;
      list.length = 0;
      const ex = eye.x;
      const ez = eye.z;
      const sx = target.x - ex;
      const sz = target.z - ez;
      const lengthSq = sx * sx + sz * sz;
      for (let i = 0; i < f.boxes.length; i++) {
        const box = f.boxes[i];
        if (!box) continue;
        if ((f.opacity[i] ?? 1) < 1) {
          list.push(i);
          continue;
        }
        const cx = (box.min.x + box.max.x) / 2;
        const cz = (box.min.z + box.max.z) / 2;
        const t =
          lengthSq === 0
            ? 0
            : Math.max(0, Math.min(1, ((cx - ex) * sx + (cz - ez) * sz) / lengthSq));
        const reach =
          (Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2) * 1.5 + OCCLUSION_MARGIN + 2;
        if (Math.hypot(cx - (ex + sx * t), cz - (ez + sz * t)) < reach) list.push(i);
      }
    }
    let changed = false;
    for (const i of candidates.current) {
      const box = f.boxes[i];
      if (!box) continue;
      const occluding = segmentHitsBox(eye, target, box, OCCLUSION_MARGIN);
      if (occluding) heroOcclusion.until = performance.now() + HERO_OCCLUSION_HOLD_MS;
      const current = f.opacity[i] ?? 1;
      const next = stepOpacity(current, occluding, delta);
      if (next !== current) {
        f.opacity[i] = next;
        changed = true;
      }
    }
    if (changed) f.attribute.needsUpdate = true;
  });

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
