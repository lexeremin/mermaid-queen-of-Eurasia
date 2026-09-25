import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  CircleGeometry,
  DoubleSide,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
} from 'three';
import { combat } from '@/game/combat-sim';
import { HAZARD_LINGER } from '@/systems/hazards';

const CIRCLES = 12;
const RECTS = 8;
const Y = 0.1;

/** Red ground markings for the boss's telegraphed moves: they fill up until the hit lands, then flash. */
export function HazardMarks() {
  const circles = useRef<(Group | null)[]>([]);
  const rects = useRef<(Group | null)[]>([]);
  const fillGeometry = useMemo(() => new CircleGeometry(1, 40).rotateX(-Math.PI / 2), []);
  const edgeGeometry = useMemo(() => new RingGeometry(0.93, 1, 40).rotateX(-Math.PI / 2), []);
  const plane = useMemo(() => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);

  useFrame(() => {
    let nc = 0;
    let nr = 0;
    for (const h of combat.hazards) {
      const progress = Math.min(1, h.age / h.delay);
      const landed = h.age >= h.delay;
      const flash = landed ? Math.max(0, 1 - (h.age - h.delay) / HAZARD_LINGER) : 0;
      const holder = h.shape.kind === 'circle' ? circles.current[nc++] : rects.current[nr++];
      if (!holder) continue;
      holder.visible = true;
      holder.position.set(h.shape.x, Y, h.shape.z);
      const fill = holder.children[0] as Mesh;
      const edge = holder.children[1] as Mesh;
      const fillMaterial = fill.material as MeshBasicMaterial;
      const edgeMaterial = edge.material as MeshBasicMaterial;
      if (h.shape.kind === 'circle') {
        holder.rotation.y = 0;
        holder.scale.setScalar(h.shape.r);
        // The fill grows out from the middle; the outline is always the full size.
        fill.scale.setScalar(landed ? 1 : Math.max(0.05, progress));
        edge.visible = true;
      } else {
        holder.rotation.y = -h.shape.rot;
        holder.scale.set(h.shape.hx * 2, 1, h.shape.hz * 2);
        fill.scale.set(1, 1, 1);
        edge.visible = false;
      }
      fillMaterial.opacity = landed ? 0.75 * flash : 0.18 + 0.4 * progress;
      fillMaterial.color.set(landed ? '#fff1d6' : '#ff3b4d');
      edgeMaterial.opacity = landed ? flash : 0.85;
    }
    for (let i = nc; i < CIRCLES; i++) {
      const g = circles.current[i];
      if (g) g.visible = false;
    }
    for (let i = nr; i < RECTS; i++) {
      const g = rects.current[i];
      if (g) g.visible = false;
    }
  });

  const material = (color: string, opacity: number) => (
    <meshBasicMaterial
      color={color}
      transparent
      opacity={opacity}
      depthWrite={false}
      side={DoubleSide}
    />
  );

  return (
    <>
      {Array.from({ length: CIRCLES }, (_, i) => (
        <group
          key={`c${i}`}
          ref={(g) => {
            circles.current[i] = g;
          }}
          visible={false}
          renderOrder={7}
        >
          <mesh geometry={fillGeometry} renderOrder={7}>
            {material('#ff3b4d', 0.3)}
          </mesh>
          <mesh geometry={edgeGeometry} renderOrder={8}>
            {material('#ff9aa5', 0.85)}
          </mesh>
        </group>
      ))}
      {Array.from({ length: RECTS }, (_, i) => (
        <group
          key={`r${i}`}
          ref={(g) => {
            rects.current[i] = g;
          }}
          visible={false}
          renderOrder={7}
        >
          <mesh geometry={plane} position={[0, 0, 0]} renderOrder={7}>
            {material('#ff3b4d', 0.3)}
          </mesh>
          <mesh geometry={plane} visible={false} renderOrder={8}>
            {material('#ff9aa5', 0)}
          </mesh>
        </group>
      ))}
    </>
  );
}
