import { footprintOf } from '@/data/assets';
import { UNDERGROUND } from '@/data/maps/underground';
import { currentMap } from '@/game/world/current-map';
import { footprintToColliders, type Collider } from '@/systems/collision';
import { SURFACE_REGION, UNDERGROUND_REGION, regionSize, type Region } from '@/game/map/map-view';

/** Pixels per metre of the painted (static) map images. */
export const PAINT_SCALE = 6;

const COLORS = {
  ground: '#1d1610',
  plaza: '#5b4b38',
  path: '#7a6a4a',
  water: '#2f4d6b',
  ice: '#557792',
  solid: '#3a2b1c',
  solidEdge: '#8a6b3a',
  tree: '#3f5a34',
  wall: '#4a3a26',
};

const TREES = new Set(['linden', 'birch', 'spruce', 'firTub']);

const cache = new Map<Region['id'], HTMLCanvasElement>();

function polyline(
  ctx: CanvasRenderingContext2D,
  points: readonly (readonly [number, number])[],
  width: number,
  color: string,
  at: (x: number, z: number) => [number, number],
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width * PAINT_SCALE;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach(([x, z], i) => {
    const [px, py] = at(x, z);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

function fillCollider(
  ctx: CanvasRenderingContext2D,
  c: Collider,
  at: (x: number, z: number) => [number, number],
  fill: string,
  edge: string,
): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  if (c.kind === 'box') {
    const [x, y] = at(c.cx - c.hx, c.cz - c.hz);
    ctx.fillRect(x, y, c.hx * 2 * PAINT_SCALE, c.hz * 2 * PAINT_SCALE);
    ctx.strokeRect(x, y, c.hx * 2 * PAINT_SCALE, c.hz * 2 * PAINT_SCALE);
  } else if (c.kind === 'circle') {
    const [x, y] = at(c.x, c.z);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.5, c.r * PAINT_SCALE), 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintSurface(
  ctx: CanvasRenderingContext2D,
  at: (x: number, z: number) => [number, number],
): void {
  const r = SURFACE_REGION;
  for (const w of currentMap.waters) {
    polyline(ctx, w.ribbon.points, w.edgeWidth, COLORS.ice, at);
    polyline(ctx, w.ribbon.points, w.ribbon.width, COLORS.water, at);
  }
  ctx.fillStyle = COLORS.plaza;
  for (const p of currentMap.plazas) {
    const [x, y] = at(p.cx - p.w / 2, p.cz - p.d / 2);
    ctx.fillRect(x, y, p.w * PAINT_SCALE, p.d * PAINT_SCALE);
  }
  for (const f of currentMap.floors ?? []) {
    if (f.cz >= UNDERGROUND_REGION.minZ) continue;
    const [x, y] = at(f.cx - f.w / 2, f.cz - f.d / 2);
    ctx.fillStyle = COLORS.plaza;
    ctx.fillRect(x, y, f.w * PAINT_SCALE, f.d * PAINT_SCALE);
  }
  for (const ribbon of [...currentMap.paths, ...(currentMap.lanes ?? [])]) {
    polyline(ctx, ribbon.points, ribbon.width, COLORS.path, at);
  }
  // Trees first, then solid things on top.
  ctx.fillStyle = COLORS.tree;
  for (const p of currentMap.placements) {
    if (!TREES.has(p.asset) || p.x < r.minX || p.x > r.maxX || p.z < r.minZ || p.z > r.maxZ)
      continue;
    const [x, y] = at(p.x, p.z);
    ctx.beginPath();
    ctx.arc(x, y, 1.1 * PAINT_SCALE * (p.scale ?? 1) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  const solids: Collider[] = [];
  for (const p of currentMap.placements) {
    if (p.collide === false || TREES.has(p.asset) || p.asset === 'lamppost') continue;
    const footprint = footprintOf(p.asset);
    if (footprint)
      solids.push(...footprintToColliders(footprint, p.x, p.z, p.rotY ?? 0, p.scale ?? 1));
  }
  solids.push(...currentMap.colliders);
  for (const c of solids) {
    const z = c.kind === 'box' ? c.cz : c.kind === 'circle' ? c.z : 0;
    if (z >= UNDERGROUND_REGION.minZ - 6) continue;
    fillCollider(ctx, c, at, COLORS.solid, COLORS.solidEdge);
  }
}

function paintUnderground(
  ctx: CanvasRenderingContext2D,
  at: (x: number, z: number) => [number, number],
): void {
  for (const f of UNDERGROUND.floors) {
    if (f.w > 60) continue;
    const [x, y] = at(f.cx - f.w / 2, f.cz - f.d / 2);
    ctx.fillStyle = f.color;
    ctx.fillRect(x, y, f.w * PAINT_SCALE, f.d * PAINT_SCALE);
  }
  for (const c of UNDERGROUND.colliders) fillCollider(ctx, c, at, COLORS.wall, COLORS.solidEdge);
  ctx.fillStyle = '#c9b48a';
  for (const p of UNDERGROUND.placements) {
    if (p.asset !== 'ugColumn') continue;
    const [x, y] = at(p.x, p.z);
    ctx.beginPath();
    ctx.arc(x, y, 0.75 * PAINT_SCALE, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The static picture of a region (terrain, buildings, water), painted once at PAINT_SCALE pixels per metre. */
export function regionImage(region: Region): HTMLCanvasElement {
  const cached = cache.get(region.id);
  if (cached) return cached;
  const { w, d } = regionSize(region);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * PAINT_SCALE);
  canvas.height = Math.ceil(d * PAINT_SCALE);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const at = (x: number, z: number): [number, number] => [
      (x - region.minX) * PAINT_SCALE,
      (z - region.minZ) * PAINT_SCALE,
    ];
    if (region.id === 'surface') paintSurface(ctx, at);
    else paintUnderground(ctx, at);
  }
  cache.set(region.id, canvas);
  return canvas;
}
