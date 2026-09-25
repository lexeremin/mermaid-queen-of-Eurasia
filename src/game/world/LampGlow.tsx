import { useMemo } from 'react';
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  InstancedMesh,
  Object3D,
  PlaneGeometry,
  MeshBasicMaterial,
  PointsMaterial,
} from 'three';
import { currentMap } from '@/game/world/current-map';
import { getPoolTexture } from '@/game/world/glow-textures';

/** Where the two lanterns hang on a lamppost, in its local space (metres). */
const LAMP_OFFSET_X = 0.65;
const LAMP_HEIGHT = 3.4;
const HALO_SIZE = 3.6;
const POOL_RADIUS = 4.2;
const WARM = new Color('#ffcf7a');

/** Warm halos around the lanterns and a soft pool of light on the ground beneath (two draw calls in all). */
export function LampGlow() {
  const lamps = useMemo(() => {
    const out: { x: number; y: number; z: number }[] = [];
    for (const p of currentMap.placements) {
      if (p.asset !== 'lamppost') continue;
      const s = p.scale ?? 1;
      const a = p.rotY ?? 0;
      for (const side of [-1, 1]) {
        const lx = side * LAMP_OFFSET_X * s;
        out.push({ x: p.x + lx * Math.cos(a), y: LAMP_HEIGHT * s, z: p.z - lx * Math.sin(a) });
      }
    }
    return out;
  }, []);

  const halos = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute(
      'position',
      new Float32BufferAttribute(
        lamps.flatMap((l) => [l.x, l.y, l.z]),
        3,
      ),
    );
    return g;
  }, [lamps]);
  const haloMaterial = useMemo(
    () =>
      new PointsMaterial({
        map: getPoolTexture(),
        color: WARM,
        size: HALO_SIZE,
        sizeAttenuation: true,
        transparent: true,
        opacity: 1,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  const pools = useMemo(() => {
    const geometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const material = new MeshBasicMaterial({
      map: getPoolTexture(),
      color: WARM,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    // One pool per lamppost, midway between its two lanterns' footing.
    const posts = currentMap.placements.filter((p) => p.asset === 'lamppost');
    const mesh = new InstancedMesh(geometry, material, posts.length);
    const dummy = new Object3D();
    posts.forEach((p, i) => {
      dummy.position.set(p.x, 0.08, p.z);
      dummy.scale.setScalar(POOL_RADIUS * 2 * (p.scale ?? 1));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.frustumCulled = false;
    mesh.renderOrder = 3;
    return mesh;
  }, []);

  if (lamps.length === 0) return null;
  return (
    <>
      <points geometry={halos} material={haloMaterial} renderOrder={8} />
      <primitive object={pools} />
    </>
  );
}
