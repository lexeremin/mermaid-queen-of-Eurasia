import {
  BufferGeometry,
  Color,
  ConeGeometry,
  Float32BufferAttribute,
  RingGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const paint = (geometry: BufferGeometry, colorAt: (x: number, y: number, z: number) => Color) => {
  const p = geometry.getAttribute('position');
  const colors: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const c = colorAt(p.getX(i), p.getY(i), p.getZ(i));
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
};

const DEEP = new Color('#1f8f86');
const MID = new Color('#6be3d1');
const FOAM = new Color('#f4fdff');

/** Cross-section of a crest, from the back (r 0.55) to the front edge (r 1): height in metres and color. */
const CREST: readonly { r: number; h: number; color: Color }[] = [
  { r: 0.55, h: 0, color: DEEP },
  { r: 0.72, h: 0.55, color: MID },
  { r: 0.88, h: 1.0, color: MID },
  { r: 0.97, h: 0.8, color: FOAM },
  { r: 1, h: 0.06, color: FOAM },
];

/**
 * The sea wave of the level-20 trident: a curved wall of water (radius 1, front pointing along +x), tallest in the
 * middle and lower toward the tips, with a foamy top edge. Scale it by the radius; y by a height factor.
 */
export function createCrestGeometry(half = 0.95, segments = 18): BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const rows = CREST.length;
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const a = -half + u * half * 2;
    const taper = Math.pow(Math.cos((u - 0.5) * Math.PI), 0.7);
    const ripple = 0.85 + 0.15 * Math.sin(u * Math.PI * 7);
    for (const row of CREST) {
      positions.push(Math.cos(a) * row.r, row.h * taper * ripple, Math.sin(a) * row.r);
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

/**
 * One ray of light: flat, starting at the origin and running along +x for 1 metre, wide and bright at the root and
 * a thin dim thread at the tip (it is drawn additively, so dark means transparent).
 */
export function createBeamGeometry(): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute([0, 0, -0.5, 0, 0, 0.5, 1, 0, 0.12, 1, 0, -0.12], 3),
  );
  const root = new Color('#fff6c8');
  const tip = new Color('#3a2a0c');
  geometry.setAttribute(
    'color',
    new Float32BufferAttribute(
      [root, root, tip, tip].flatMap((c) => [c.r, c.g, c.b]),
      3,
    ),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  return geometry;
}

/** A small shark (about a metre long, nose along +x): grey-blue back, pale belly, dorsal fin, tail and side fins. */
export function createSharkGeometry(): BufferGeometry {
  const back = new Color('#6b93ab');
  const belly = new Color('#e6f3f7');
  const fin = new Color('#557b93');
  const body = new SphereGeometry(0.5, 8, 6);
  body.scale(1, 0.34, 0.3);
  paint(body, (_x, y) => (y < -0.02 ? belly : back));
  const nose = new ConeGeometry(0.16, 0.3, 6);
  nose.rotateZ(-Math.PI / 2);
  nose.translate(0.55, 0, 0);
  nose.scale(1, 1, 1);
  paint(nose, (_x, y) => (y < 0 ? belly : back));
  const tail = new ConeGeometry(0.2, 0.42, 4);
  tail.rotateZ(Math.PI / 2);
  tail.scale(1, 1, 0.25);
  tail.translate(-0.66, 0.06, 0);
  paint(tail, () => fin);
  const dorsal = new ConeGeometry(0.11, 0.34, 3);
  dorsal.rotateZ(-0.35);
  dorsal.scale(1, 1, 0.3);
  dorsal.translate(0.0, 0.25, 0);
  paint(dorsal, () => fin);
  const sideL = new ConeGeometry(0.07, 0.3, 3);
  sideL.rotateX(Math.PI / 2 + 0.5);
  sideL.translate(0.2, -0.08, 0.2);
  paint(sideL, () => fin);
  const sideR = new ConeGeometry(0.07, 0.3, 3);
  sideR.rotateX(-Math.PI / 2 - 0.5);
  sideR.translate(0.2, -0.08, -0.2);
  paint(sideR, () => fin);
  // Merging needs every part to have the same attributes.
  const parts = [body, nose, tail, dorsal, sideL, sideR].map((g) => {
    g.deleteAttribute('uv');
    return g;
  });
  const merged = mergeGeometries(parts);
  return merged ?? body;
}

/**
 * The sigil of the arcane blast, all in one geometry (radius 1, flat): an outer ring, an inner ring and an
 * eight-pointed star between them, in three shades of violet. One draw call, drawn additively.
 */
export function createSigilGeometry(points = 8): BufferGeometry {
  const outer = new RingGeometry(0.9, 1, 48).rotateX(-Math.PI / 2);
  const inner = new RingGeometry(0.48, 0.56, 40).rotateX(-Math.PI / 2);
  const shape = new Shape();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 0.82 : 0.36;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  const star = new ShapeGeometry(shape).rotateX(-Math.PI / 2);
  const parts = [
    paint(outer, () => new Color('#b08cff')),
    paint(inner, () => new Color('#efe4ff')),
    paint(star, () => new Color('#8f6bdc')),
  ];
  for (const g of parts) {
    g.deleteAttribute('normal');
    g.deleteAttribute('uv');
  }
  return mergeGeometries(parts) ?? outer;
}

/** One swirling arm of foam (radius 1): it winds out from the centre and thins to a point, fading toward the centre. */
export function createSpiralGeometry(steps = 14): BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const dark = new Color('#0d2f36');
  const bright = new Color('#e9fdff');
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * Math.PI * 1.4;
    const r = 0.12 + 0.88 * t;
    const half = 0.16 * (1 - t) + 0.02;
    const c = dark.clone().lerp(bright, t);
    for (const side of [-1, 1]) {
      const rr = r + side * half;
      positions.push(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      colors.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < steps; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}

const FEATHER_ROOT = new Color('#ffffff');
const FEATHER_TIP = new Color('#ffe7a0');
const HALO = new Color('#ffd54f');

/** One feather: a flat leaf-shaped blade with its base at the origin, pointing along +y, white going to pale gold. */
function feather(length: number, width: number, angle: number, back: number, x: number, y: number) {
  const leaf = new Shape();
  leaf.moveTo(0, 0);
  leaf.quadraticCurveTo(width * 1.3, length * 0.5, 0, length);
  leaf.quadraticCurveTo(-width * 1.3, length * 0.5, 0, 0);
  const g = new ShapeGeometry(leaf, 4);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  paint(g, (_x, gy) =>
    FEATHER_ROOT.clone().lerp(FEATHER_TIP, Math.min(1, Math.max(0, gy / length)) ** 1.5),
  );
  // Fan it outward (to +x for the right wing, mirrored later) and sweep it back a little.
  g.rotateZ(-angle);
  g.rotateX(-back);
  g.translate(x, y, 0);
  return g;
}

/**
 * Holy wings and a halo for Rosa at level 60, sized for a figure 1.75 m tall (scale it for others): two swept-back
 * wings of three rows of feathers, and a thin gold ring floating above the head. One geometry, one draw call.
 */
export function createHolyGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const rows = [
    // Outer flight feathers first, then two shorter rows laid over their bases.
    { count: 8, from: 0.6, to: 1.25, a0: 0.15, a1: 1.75, width: 0.16, lift: 0 },
    { count: 7, from: 0.42, to: 0.8, a0: 0.3, a1: 1.6, width: 0.16, lift: 0.04 },
    { count: 5, from: 0.26, to: 0.42, a0: 0.5, a1: 1.5, width: 0.15, lift: 0.08 },
  ];
  for (const side of [1, -1]) {
    rows.forEach((row, r) => {
      for (let i = 0; i < row.count; i++) {
        const u = i / (row.count - 1);
        const angle = row.a0 + (row.a1 - row.a0) * u;
        const length = row.from + (row.to - row.from) * Math.sin(u * Math.PI * 0.5);
        const g = feather(length, row.width, angle, 0.18 + r * 0.05, 0.1, 1.3 - r * 0.02);
        g.translate(0, 0, r * 0.012 + row.lift * 0.1);
        if (side < 0) g.scale(-1, 1, 1);
        parts.push(g);
      }
    });
  }
  const ring = new TorusGeometry(0.27, 0.03, 6, 28).rotateX(Math.PI / 2).translate(0, 1.98, 0);
  ring.deleteAttribute('uv');
  paint(ring, () => HALO);
  parts.push(ring);
  for (const g of parts) {
    g.deleteAttribute('normal');
    g.deleteAttribute('uv');
  }
  return mergeGeometries(parts) ?? ring;
}
