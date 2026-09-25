import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
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
import { getRenderPosition } from '@/game/sim';
import { useGraphics } from '@/store/graphics-store';
import { currentMap } from '@/game/world/current-map';
import { getPoolTexture } from '@/game/world/glow-textures';

/** Where the two lanterns hang on a lamppost, in its local space (metres). */
const LAMP_OFFSET_X = 0.65;
const LAMP_HEIGHT = 3.4;
const HALO_SIZE = 3.6;
const POOL_RADIUS = 4.2;
const WARM = new Color('#ffcf7a');
/** Only the lanterns near Rosa glow: big additive sprites are pure overdraw when far away or off screen. */
const GLOW_RANGE = 34;
const MAX_LAMPS = 18;
const REFRESH_S = 0.35;
const here = { x: 0, z: 0 };

type Lamp = { x: number; y: number; z: number };
type Post = { x: number; z: number; scale?: number };

/** Picks the nearest lanterns and writes them into the halo points and the ground pool instances. */
function refreshGlow(
  lamps: readonly Lamp[],
  posts: readonly Post[],
  halos: BufferGeometry,
  pools: InstancedMesh,
  dummy: Object3D,
  limit: number,
): void {
  getRenderPosition(here);
  // The nearest lanterns get their glow; the rest stay dark (they are off screen or fogged anyway).
  const near = lamps
    .map((l) => ({ l, d: Math.hypot(l.x - here.x, l.z - here.z) }))
    .filter((e) => e.d < GLOW_RANGE)
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.min(MAX_LAMPS, limit));
  const position = halos.getAttribute('position') as Float32BufferAttribute;
  near.forEach(({ l }, i) => position.setXYZ(i, l.x, l.y, l.z));
  position.needsUpdate = true;
  halos.setDrawRange(0, near.length);
  // The ground pools: one per post among the nearest.
  const seen = new Set<number>();
  let n = 0;
  for (const { l } of near) {
    const post = posts.findIndex((p) => Math.abs(p.x - l.x) < 1 && Math.abs(p.z - l.z) < 1);
    if (post < 0 || seen.has(post) || n >= MAX_LAMPS) continue;
    seen.add(post);
    const p = posts[post]!;
    dummy.position.set(p.x, 0.08, p.z);
    dummy.scale.setScalar(POOL_RADIUS * 2 * (p.scale ?? 1));
    dummy.updateMatrix();
    pools.setMatrixAt(n++, dummy.matrix);
  }
  pools.count = n;
  pools.instanceMatrix.needsUpdate = true;
}

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

  const posts = useMemo(() => currentMap.placements.filter((p) => p.asset === 'lamppost'), []);
  const halos = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(MAX_LAMPS * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);
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
    const mesh = new InstancedMesh(geometry, material, MAX_LAMPS);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = 3;
    return mesh;
  }, []);

  const glowLamps = useGraphics().glowLamps;
  const clock = useRef(REFRESH_S);
  const dummy = useMemo(() => new Object3D(), []);
  useFrame((_, delta) => {
    clock.current += delta;
    if (clock.current < REFRESH_S) return;
    clock.current = 0;
    refreshGlow(lamps, posts, halos, pools, dummy, glowLamps);
  });

  if (lamps.length === 0) return null;
  return (
    <>
      <points geometry={halos} material={haloMaterial} renderOrder={8} frustumCulled={false} />
      <primitive object={pools} />
    </>
  );
}
