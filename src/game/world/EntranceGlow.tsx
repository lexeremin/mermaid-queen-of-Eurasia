import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Color,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  type InstancedMesh,
} from 'three';
import { sim } from '@/game/sim';
import { currentMap } from '@/game/world/current-map';
import { getPoolTexture } from '@/game/world/glow-textures';

const GROUND_Y = 0.075;
const VISIBLE_RANGE = 70;
/** How far the pool reaches along the way through, on each side of the doorway. */
const REACH_OUTSIDE = 6.2;
const REACH_GUM_INSIDE = 3.4;
const SIDE_MARGIN = 3;

const dummy = new Object3D();
const tint = new Color();

/** One soft pool of light per entrance, spanning both sides of the doorway as a single glow. */
export function EntranceGlow() {
  const entrances = useMemo(() => currentMap.entrances ?? [], []);
  const pools = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: getPoolTexture(),
        color: '#ffffff',
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  const colors = useMemo(() => entrances.map((e) => new Color(e.color)), [entrances]);

  useFrame(({ clock }) => {
    const mesh = pools.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    let n = 0;
    entrances.forEach((e, i) => {
      const base = colors[i];
      if (!base) return;
      if (Math.hypot(e.x - sim.curr.pos.x, e.z - sim.curr.pos.z) > VISIBLE_RANGE) return;
      // GUM's plaza is on +x and its gallery on -x; the gates open onto plazas on both sides.
      const gum = e.axis === 'x';
      const back = gum ? REACH_GUM_INSIDE : REACH_OUTSIDE;
      const length = back + REACH_OUTSIDE;
      const shift = (REACH_OUTSIDE - back) / 2;
      const across = e.width + SIDE_MARGIN;
      dummy.position.set(e.x + (gum ? shift : 0), GROUND_Y, e.z + (gum ? 0 : shift));
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(gum ? length : across, 1, gum ? across : length);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      mesh.setColorAt(
        n++,
        tint.copy(base).multiplyScalar(0.7 + 0.25 * Math.sin(t * 1.6 + i * 1.3)),
      );
    });
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (entrances.length === 0) return null;
  return (
    <instancedMesh
      ref={pools}
      args={[geometry, material, entrances.length]}
      frustumCulled={false}
      renderOrder={3}
    />
  );
}
