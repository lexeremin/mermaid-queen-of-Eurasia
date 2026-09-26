import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  BackSide,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  BoxGeometry,
  type BufferGeometry,
  type Group,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useDispose } from '@/game/assets/use-dispose';
import { useBoardMark } from '@/game/quest-marks';
import { currentMap } from '@/game/world/current-map';
import { useGameStore } from '@/store/game-store';

const GOLD = '#ffd23f';
const OUTLINE = '#2a1806';
/** How high above the ground the mark floats (the board itself is about two metres tall). */
const HEIGHT = 3.0;

/** A tapered bar over a dot. */
function exclamation(): BufferGeometry {
  const bar = new CylinderGeometry(0.13, 0.07, 0.62, 10).translate(0, 0.2, 0);
  const dot = new SphereGeometry(0.1, 10, 8).translate(0, -0.27, 0);
  return mergeGeometries([bar, dot])!;
}

/** A hook made of a three-quarter ring, a short stem and a dot. */
function question(): BufferGeometry {
  const hook = new TorusGeometry(0.19, 0.07, 8, 16, Math.PI * 1.45)
    .rotateZ(-Math.PI * 0.2)
    .translate(0, 0.28, 0);
  const stem = new BoxGeometry(0.14, 0.2, 0.14).translate(0.0, -0.02, 0);
  const dot = new SphereGeometry(0.09, 10, 8).translate(0, -0.27, 0);
  return mergeGeometries([hook, stem, dot])!;
}

/** Floats a golden mark above the notice board: `!` when there is a new quest to take, `?` when one is ready to hand in. */
export function QuestBoardMark() {
  const mark = useBoardMark();
  const underground = useGameStore((s) => s.underground);
  const group = useRef<Group>(null);
  const geometries = useMemo(() => ({ available: exclamation(), ready: question() }), []);
  useDispose(geometries.available);
  useDispose(geometries.ready);
  const board = useMemo(() => currentMap.placements.find((p) => p.asset === 'questBoard'), []);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = performance.now() / 1000;
    g.position.y = HEIGHT + Math.sin(t * 2.4) * 0.12;
    g.rotation.y = Math.sin(t * 1.3) * 0.4;
    g.scale.setScalar(1 + Math.sin(t * 4.8) * 0.04);
  });

  if (!board || !mark || underground) return null;
  const geometry = geometries[mark];
  return (
    <group ref={group} position={[board.x, HEIGHT, board.z]}>
      <mesh geometry={geometry} scale={1.55} renderOrder={6}>
        <meshBasicMaterial color={GOLD} />
      </mesh>
      {/* A dark rim behind it, so it reads against bright walls and grey cobbles alike. */}
      <mesh geometry={geometry} scale={1.85} renderOrder={5}>
        <meshBasicMaterial color={OUTLINE} side={BackSide} />
      </mesh>
    </group>
  );
}
