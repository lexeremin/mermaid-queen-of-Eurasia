import { useLayoutEffect, useMemo, useRef } from 'react';
import { MeshBasicMaterial, Object3D, PlaneGeometry, type InstancedMesh } from 'three';
import type { AssetId } from '@/data/assets';
import { currentMap } from '@/game/world/current-map';
import { getShadowTexture } from '@/game/world/shadow-texture';

/** Half-extents (x, z in the model's own frame) of the soft shadow under each small object. */
const SHADOW: Partial<Record<AssetId, readonly [number, number]>> = {
  linden: [2.1, 2.1],
  birch: [1.6, 1.6],
  spruce: [1.6, 1.6],
  firTub: [1.1, 1.1],
  lamppost: [0.75, 0.75],
  barrel: [0.75, 0.75],
  crate: [0.85, 0.85],
  shop: [1.9, 1.5],
  shopHerbs: [1.9, 1.5],
  bench: [1.3, 0.75],
  flowerbed: [1.7, 1.0],
  questBoard: [1.2, 0.8],
  obelisk: [2.0, 2.0],
  fountain: [2.4, 2.4],
  kiosk: [1.4, 1.4],
  hut: [3.2, 2.6],
  hedge: [1.35, 0.8],
};

const SHADOW_Y = 0.065;
const MARGIN = 6;

/** Soft contact shadows under props and trees, drawn as one instanced mesh. */
export function ContactShadows() {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: getShadowTexture(),
        color: '#03050a',
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
    [],
  );
  const items = useMemo(() => {
    const { bounds, placements } = currentMap;
    return placements.flatMap((p) => {
      const half = SHADOW[p.asset];
      if (!half) return [];
      if (p.x < bounds.minX - MARGIN || p.x > bounds.maxX + MARGIN) return [];
      if (p.z < bounds.minZ - MARGIN || p.z > bounds.maxZ + MARGIN) return [];
      const s = p.scale ?? 1;
      return [{ x: p.x, z: p.z, rotY: p.rotY ?? 0, sx: half[0] * 2 * s, sz: half[1] * 2 * s }];
    });
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new Object3D();
    items.forEach((it, i) => {
      dummy.position.set(it.x, SHADOW_Y, it.z);
      dummy.rotation.set(0, it.rotY, 0);
      dummy.scale.set(it.sx, 1, it.sz);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.count = items.length;
    m.instanceMatrix.needsUpdate = true;
  }, [items]);

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, Math.max(1, items.length)]}
      frustumCulled={false}
      renderOrder={1}
    />
  );
}
