import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  type InstancedMesh,
} from 'three';
import { getPoolTexture, getShaftTexture } from '@/game/world/glow-textures';
import { currentMap } from '@/game/world/current-map';
import { sim } from '@/game/sim';

const GROUND_Y = 0.075;
/** How far from the doorway the floor pools sit on each side, and how far the chevrons travel. */
const CHEVRON_FROM = 7.2;
const CHEVRON_TO = 1.6;
const CHEVRONS_PER_SIDE = 3;
const VISIBLE_RANGE = 70;
const SHAFT_HEIGHT = 6.5;

const dummy = new Object3D();
const tint = new Color();

function chevronGeometry() {
  const shape = new Shape();
  shape.moveTo(0, 0.5);
  shape.lineTo(0.55, -0.1);
  shape.lineTo(0.55, -0.42);
  shape.lineTo(0, 0.08);
  shape.lineTo(-0.55, -0.42);
  shape.lineTo(-0.55, -0.1);
  shape.closePath();
  return new ShapeGeometry(shape).rotateX(-Math.PI / 2);
}

const additive = (map?: MeshBasicMaterial['map']) =>
  new MeshBasicMaterial({
    ...(map ? { map } : {}),
    color: '#ffffff',
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  });

/** Soft glow at every doorway and gate: floor pools, chevrons flowing inward, and a faint column of light. */
export function EntranceGlow() {
  const entrances = useMemo(() => currentMap.entrances ?? [], []);
  const pools = useRef<InstancedMesh>(null);
  const chevrons = useRef<InstancedMesh>(null);
  const shafts = useRef<InstancedMesh>(null);

  const poolGeometry = useMemo(() => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
  const shaftGeometry = useMemo(() => new PlaneGeometry(1, 1).translate(0, 0.5, 0), []);
  const chevronGeo = useMemo(() => chevronGeometry(), []);
  const poolMaterial = useMemo(() => additive(getPoolTexture()), []);
  const shaftMaterial = useMemo(() => additive(getShaftTexture()), []);
  const chevronMaterial = useMemo(() => additive(), []);
  const colors = useMemo(() => entrances.map((e) => new Color(e.color)), [entrances]);

  useFrame(({ clock }) => {
    const pm = pools.current;
    const cm = chevrons.current;
    const sm = shafts.current;
    if (!pm || !cm || !sm) return;
    const t = clock.elapsedTime;
    let np = 0;
    let nc = 0;
    let ns = 0;
    entrances.forEach((e, i) => {
      const base = colors[i];
      if (!base) return;
      const near = Math.hypot(e.x - sim.curr.pos.x, e.z - sim.curr.pos.z) < VISIBLE_RANGE;
      if (!near) return;
      const pulse = 0.62 + 0.38 * Math.sin(t * 1.9 + i * 1.3);
      const along = e.axis === 'x' ? { x: 1, z: 0 } : { x: 0, z: 1 };
      // GUM's plaza side is +x; its other side is the gallery, which is smaller. Gates open to plazas on both sides.
      const gum = e.axis === 'x';
      for (const side of [-1, 1]) {
        const inside = gum && side < 0;
        const reach = inside ? 3.4 : 6.6;
        const offset = inside ? 2.6 : 4.2;
        dummy.position.set(e.x + along.x * side * offset, GROUND_Y, e.z + along.z * side * offset);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(gum ? reach : e.width + 3, 1, gum ? e.width + 3 : reach);
        dummy.updateMatrix();
        pm.setMatrixAt(np, dummy.matrix);
        pm.setColorAt(np++, tint.copy(base).multiplyScalar(0.95 * pulse));
        for (let k = 0; k < CHEVRONS_PER_SIDE; k++) {
          const phase = (t * 0.7 + k / CHEVRONS_PER_SIDE + i * 0.17) % 1;
          const dist = CHEVRON_FROM - (CHEVRON_FROM - CHEVRON_TO) * phase;
          dummy.position.set(
            e.x + along.x * side * dist,
            GROUND_Y + 0.005,
            e.z + along.z * side * dist,
          );
          const inward = { x: -along.x * side, z: -along.z * side };
          dummy.rotation.set(0, Math.atan2(inward.x, inward.z), 0);
          dummy.scale.setScalar(0.95);
          dummy.updateMatrix();
          cm.setMatrixAt(nc, dummy.matrix);
          cm.setColorAt(nc++, tint.copy(base).multiplyScalar(Math.sin(Math.PI * phase) * 1.4));
        }
      }
      // A light column outside the doorway, where the camera can see it (GUM's doorway is edge-on to the camera).
      const bx = gum ? e.x + 3.2 : e.x;
      const width = gum ? 2.8 : e.width * 0.9;
      for (const turn of [0, Math.PI / 2]) {
        dummy.position.set(bx, 0.05, e.z);
        dummy.rotation.set(0, turn, 0);
        dummy.scale.set(width, SHAFT_HEIGHT, 1);
        dummy.updateMatrix();
        sm.setMatrixAt(ns, dummy.matrix);
        sm.setColorAt(ns++, tint.copy(base).multiplyScalar(0.7 + 0.4 * pulse));
      }
    });
    pm.count = np;
    cm.count = nc;
    sm.count = ns;
    for (const mesh of [pm, cm, sm]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  if (entrances.length === 0) return null;
  const n = entrances.length;
  return (
    <>
      <instancedMesh
        ref={pools}
        args={[poolGeometry, poolMaterial, n * 2]}
        frustumCulled={false}
        renderOrder={3}
      />
      <instancedMesh
        ref={chevrons}
        args={[chevronGeo, chevronMaterial, n * 2 * CHEVRONS_PER_SIDE]}
        frustumCulled={false}
        renderOrder={4}
      />
      <instancedMesh
        ref={shafts}
        args={[shaftGeometry, shaftMaterial, n * 2]}
        frustumCulled={false}
        renderOrder={5}
      />
    </>
  );
}
