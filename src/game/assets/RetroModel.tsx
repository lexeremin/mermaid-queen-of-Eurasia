import { useGLTF } from '@react-three/drei';
import { forwardRef, useLayoutEffect, useMemo } from 'react';
import type { Group } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS, type AssetId } from '@/data/assets';
import { applyRetroMaterial } from '@/game/assets/retro-material';

type Props = {
  id: AssetId;
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
};

export const RetroModel = forwardRef<Group, Props>(function RetroModel(
  { id, position, rotationY = 0, scale = 1 },
  ref,
) {
  const gltf = useGLTF(ASSETS[id].url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);

  useLayoutEffect(() => applyRetroMaterial(scene), [scene]);

  return (
    <group ref={ref} position={position} rotation-y={rotationY} scale={scale}>
      <primitive object={scene} />
    </group>
  );
});

for (const asset of Object.values(ASSETS)) useGLTF.preload(asset.url);
