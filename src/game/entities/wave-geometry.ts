import { BufferGeometry, Color, Float32BufferAttribute } from 'three';

const DEEP = new Color('#1f8f86');
const MID = new Color('#6be3d1');
const FOAM = new Color('#f4fdff');

/** Cross-section of one breaking wave: radius (0..1), height in meters, color. */
const PROFILE: readonly { r: number; h: number; color: Color }[] = [
  { r: 0.66, h: 0, color: DEEP },
  { r: 0.8, h: 0.5, color: MID },
  { r: 0.92, h: 0.95, color: MID },
  { r: 0.985, h: 0.78, color: FOAM },
  { r: 1, h: 0.05, color: FOAM },
];

/**
 * A ring of sea waves around the origin (radius 1, heights in meters). The crest height wobbles
 * around the ring so it reads as rolling water, and the top edge is white foam. Scale x and z by
 * the radius and y by a height factor.
 */
export function createWaveGeometry(segments = 72, lobes = 11): BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const rows = PROFILE.length;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const wobble = 0.62 + 0.38 * Math.sin(a * lobes) + 0.1 * Math.sin(a * lobes * 2.3 + 1.2);
    for (const row of PROFILE) {
      positions.push(Math.cos(a) * row.r, row.h * wobble, Math.sin(a) * row.r);
      colors.push(row.color.r, row.color.g, row.color.b);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j;
      const b = (i + 1) * rows + j;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
