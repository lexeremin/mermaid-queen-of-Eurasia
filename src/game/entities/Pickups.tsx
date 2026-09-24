import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, MeshBasicMaterial, Object3D, OctahedronGeometry, type InstancedMesh } from 'three';
import { ITEMS } from '@/data/items';
import { loot } from '@/game/loot-sim';
import { PICKUP_LIFE } from '@/systems/pickups';

const MAX_VISIBLE = 64;
const BLINK_FROM = PICKUP_LIFE - 8;
const dummy = new Object3D();
const tint = new Color();

/** Ground loot as spinning, bobbing gems tinted by item color. One instanced draw call. */
export function Pickups() {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => {
    const g = new OctahedronGeometry(0.24, 0);
    g.scale(1, 1.35, 1);
    return g;
  }, []);
  const material = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), []);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const list = loot.pickups;
    const count = Math.min(list.length, MAX_VISIBLE);
    for (let i = 0; i < count; i++) {
      const p = list[i];
      if (!p) continue;
      const blink = p.age > BLINK_FROM && Math.floor(p.age * 6) % 2 === 0;
      const scale = blink ? 0.001 : 1;
      dummy.position.set(p.pos.x, 0.55 + Math.sin(t * 3 + p.id) * 0.1, p.pos.z);
      dummy.rotation.set(0, t * 2.2 + p.id, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, tint.set(ITEMS[p.item].color));
    }
    m.count = count;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, MAX_VISIBLE]}
      frustumCulled={false}
      renderOrder={2}
    />
  );
}
