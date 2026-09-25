import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, MeshBasicMaterial, Object3D, PlaneGeometry, type InstancedMesh } from 'three';
import { combat } from '@/game/combat-sim';
import { sim } from '@/game/sim';
import { currentMap } from '@/game/world/current-map';
import { getRingTexture } from '@/game/world/glow-textures';
import { useNpcStore } from '@/store/npc-store';
import { defOf } from '@/systems/enemy-ai';

const RING_Y = 0.09;
const NPC_RADIUS = 0.85;
const ENEMY_MARGIN = 0.5;
const COMPANION_RADIUS = 0.75;
const VISIBLE_RANGE = 40;
const MAX_NPC = 16;
const MAX_ENEMY = 32;

const dummy = new Object3D();

function ringMaterial(color: string) {
  return new MeshBasicMaterial({
    map: getRingTexture(),
    color: new Color(color),
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false,
  });
}

function place(mesh: InstancedMesh, index: number, x: number, z: number, radius: number) {
  dummy.position.set(x, RING_Y, z);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.setScalar(radius * 2);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

/** Hitbox circles on the ground: green under friendly people (and her companion), red under enemies. */
export function ActorRings() {
  const friendly = useRef<InstancedMesh>(null);
  const hostile = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
  const green = useMemo(() => ringMaterial('#5dff8f'), []);
  const red = useMemo(() => ringMaterial('#ff4d4d'), []);

  useFrame(() => {
    const g = friendly.current;
    const r = hostile.current;
    if (!g || !r) return;
    const px = sim.curr.pos.x;
    const pz = sim.curr.pos.z;
    const near = (x: number, z: number) => Math.hypot(x - px, z - pz) <= VISIBLE_RANGE;

    let ng = 0;
    const npcs = useNpcStore.getState().npcs;
    for (const spot of [...currentMap.npcs, ...(currentMap.archangels ?? [])]) {
      if (npcs[spot.id]?.following || !near(spot.x, spot.z) || ng >= MAX_NPC) continue;
      place(g, ng++, spot.x, spot.z, NPC_RADIUS);
    }
    const c = combat.companion;
    if (c && ng < MAX_NPC) {
      const a = sim.alpha;
      place(
        g,
        ng++,
        c.prev.x + (c.pos.x - c.prev.x) * a,
        c.prev.z + (c.pos.z - c.prev.z) * a,
        COMPANION_RADIUS,
      );
    }
    g.count = ng;

    let nr = 0;
    for (const e of combat.enemies) {
      if (e.state === 'dead' || e.dormant || !near(e.pos.x, e.pos.z) || nr >= MAX_ENEMY) continue;
      place(r, nr++, e.pos.x, e.pos.z, defOf(e).radius + ENEMY_MARGIN);
    }
    r.count = nr;

    g.instanceMatrix.needsUpdate = true;
    r.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh
        ref={friendly}
        args={[geometry, green, MAX_NPC]}
        frustumCulled={false}
        renderOrder={6}
      />
      <instancedMesh
        ref={hostile}
        args={[geometry, red, MAX_ENEMY]}
        frustumCulled={false}
        renderOrder={6}
      />
    </>
  );
}
