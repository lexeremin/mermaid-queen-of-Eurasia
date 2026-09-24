import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSETS } from '@/data/assets';
import type { NpcDef } from '@/data/npcs';
import type { NpcSpot } from '@/data/maps/types';
import { applyRetroMaterial } from '@/game/assets/retro-material';
import { combat } from '@/game/combat-sim';
import { HeartBuff } from '@/game/entities/HeartBuff';
import { sim } from '@/game/sim';
import { useNpcStore } from '@/store/npc-store';
import { showsHeart } from '@/systems/relationship';
import { turnToward } from '@/systems/movement';

const LOOK_RANGE = 6;
const TURN_RATE = 4;

export function NpcActor({ def, spot }: { def: NpcDef; spot: NpcSpot }) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const facing = useRef({ x: Math.sin(spot.rotY), z: Math.cos(spot.rotY) });
  const gltf = useGLTF(ASSETS[def.asset].url);
  const scene = useMemo(() => clone(gltf.scene) as Group, [gltf.scene]);
  const phase = useMemo(() => (spot.x * 12.9898 + spot.z * 78.233) % 6.28, [spot]);
  const heart = useNpcStore((s) => {
    const n = s.npcs[def.id];
    return n ? showsHeart(n.relationship, n.joined) : false;
  });

  const [charmed, setCharmed] = useState(false);

  useEffect(() => applyRetroMaterial(scene), [scene]);

  useFrame(({ clock }, delta) => {
    const g = root.current;
    const b = body.current;
    if (!g || !b) return;
    const dx = sim.curr.pos.x - spot.x;
    const dz = sim.curr.pos.z - spot.z;
    const near = Math.hypot(dx, dz) < LOOK_RANGE;
    const want = near ? { x: dx, z: dz } : { x: Math.sin(spot.rotY), z: Math.cos(spot.rotY) };
    const len = Math.hypot(want.x, want.z) || 1;
    facing.current = turnToward(
      facing.current,
      { x: want.x / len, z: want.z / len },
      TURN_RATE * delta,
    );
    g.rotation.y = Math.atan2(facing.current.x, facing.current.z);
    const isCharmed = (combat.charmed[def.id] ?? 0) > combat.time;
    if (isCharmed !== charmed) setCharmed(isCharmed);
    const t = clock.elapsedTime * 1.6 + phase;
    b.position.y = Math.sin(t) * 0.012;
    b.rotation.z = Math.sin(t * 0.5) * 0.015;
  });

  return (
    <group ref={root} position={[spot.x, 0, spot.z]}>
      <group ref={body}>
        <primitive object={scene} />
      </group>
      {(heart || charmed) && <HeartBuff />}
    </group>
  );
}
