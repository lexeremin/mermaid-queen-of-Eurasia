import { isBossKind } from '@/data/enemies';
import { isUnderground, layerLevel } from '@/data/maps/underground';
import { METRO } from '@/data/maps/red-square';
import { combat } from '@/game/combat-sim';
import { PAINT_SCALE, regionImage } from '@/game/map/map-paint';
import { SURFACE_LABELS, toScreen, type MapView, type Region } from '@/game/map/map-view';
import { getRenderPosition, sim } from '@/game/sim';
import { currentMap } from '@/game/world/current-map';
import { useDungeonStore } from '@/store/dungeon-store';
import { useArchangelStore } from '@/store/archangel-store';
import { useNpcStore } from '@/store/npc-store';
import { defOf } from '@/systems/enemy-ai';

const position = { x: 0, z: 0 };
const GOLD = '#e8c66a';

export type DrawOptions = {
  /** Draw place names (the full map). */
  labels: boolean;
  /** Monsters farther than this from Rosa stay hidden. */
  enemyRange: number;
  /** Size of the markers in pixels. */
  marker: number;
};

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#120d09';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#120d09';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  ctx.font = `700 ${size}px Georgia, 'Palatino Linotype', serif`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(12,8,5,0.9)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#f0d99a';
  ctx.fillText(text, x, y);
}

/** Draws the region's map, then everything that moves or matters on it, into `ctx` for the given view. */
export function drawMap(
  ctx: CanvasRenderingContext2D,
  view: MapView,
  region: Region,
  opts: DrawOptions,
): void {
  getRenderPosition(position);
  ctx.clearRect(0, 0, view.width, view.height);
  const image = regionImage(region);
  const k = view.scale / PAINT_SCALE;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(
    view.width / 2 - (view.cx - region.minX) * view.scale,
    view.height / 2 - (view.cz - region.minZ) * view.scale,
  );
  ctx.scale(k, k);
  ctx.drawImage(image, 0, 0);
  ctx.restore();

  const m = opts.marker;
  const underground = region.id === 'underground';
  const layer = useDungeonStore.getState().layer;
  const level = underground ? layerLevel(Math.max(1, layer)) : null;

  if (opts.labels) {
    if (underground) {
      for (const zone of level?.zones ?? []) {
        if (zone.id === 'underground') continue;
        const p = toScreen(view, zone.box.cx, zone.box.cz);
        label(ctx, zone.label, p.x, p.y, Math.max(11, m * 1.5));
      }
    } else {
      for (const l of SURFACE_LABELS) {
        const p = toScreen(view, l.x, l.z);
        label(ctx, l.text, p.x, p.y, Math.max(11, m * 1.5));
      }
    }
  }

  // Ways in and out.
  if (underground) {
    const up = toScreen(view, level!.stairsUp.x, level!.stairsUp.z - 1.5);
    diamond(ctx, up.x, up.y, m, '#8fc0f0');
    const down = toScreen(view, level!.stairsDown.x, level!.stairsDown.z + 1.5);
    diamond(ctx, down.x, down.y, m, '#f0c08f');
    const dungeon = useDungeonStore.getState();
    if (level!.gate) {
      const g = toScreen(view, level!.gate.x, level!.gate.z);
      ctx.fillStyle = dungeon.gateOpen ? '#6bbf6b' : '#d94a4a';
      ctx.fillRect(g.x - m * 1.4, g.y - m * 0.35, m * 2.8, m * 0.7);
    }
    const taken = dungeon.cachesTaken;
    for (const chest of level!.chests) {
      if (taken.includes(chest.id)) continue;
      const p = toScreen(view, chest.x, chest.z);
      ctx.fillStyle = GOLD;
      ctx.fillRect(p.x - m * 0.6, p.y - m * 0.5, m * 1.2, m);
    }
  } else {
    for (const e of currentMap.entrances ?? []) {
      const p = toScreen(view, e.x, e.z);
      diamond(ctx, p.x, p.y, m, e.color);
    }
    const metro = toScreen(view, METRO.door.x, METRO.door.z);
    diamond(ctx, metro.x, metro.y, m * 1.15, '#8fc0f0');
    for (const p of currentMap.placements) {
      if (p.asset !== 'questBoard' && p.asset !== 'shrine') continue;
      const s = toScreen(view, p.x, p.z);
      diamond(ctx, s.x, s.y, m * 0.8, '#d9a8ff');
    }
  }

  if (!underground) {
    const following = useNpcStore.getState().npcs;
    for (const n of currentMap.npcs) {
      if (following[n.id]?.following) continue;
      const p = toScreen(view, n.x, n.z);
      dot(ctx, p.x, p.y, m * 0.7, '#5dff8f');
    }
    for (const n of currentMap.locals ?? []) {
      const p = toScreen(view, n.x, n.z);
      dot(ctx, p.x, p.y, m * 0.6, '#9fe8b0');
    }
    // The hidden archangels only appear on the map once they are saved.
    const saved = useArchangelStore.getState().saved;
    for (const n of currentMap.archangels ?? []) {
      if (!saved.includes(n.id)) continue;
      const p = toScreen(view, n.x, n.z);
      dot(ctx, p.x, p.y, m * 0.7, '#ffe08a');
    }
  }
  const c = combat.companion;
  if (c) {
    const p = toScreen(view, c.pos.x, c.pos.z);
    dot(ctx, p.x, p.y, m * 0.7, '#ffe08a');
  }
  for (const e of combat.enemies) {
    if (e.state === 'dead' || e.dormant) continue;
    if (isUnderground(e.pos) !== underground) continue;
    if (Math.hypot(e.pos.x - position.x, e.pos.z - position.z) > opts.enemyRange) continue;
    const p = toScreen(view, e.pos.x, e.pos.z);
    dot(
      ctx,
      p.x,
      p.y,
      m * (isBossKind(e.kind) ? 1.3 : 0.6) * (defOf(e).radius > 1 ? 1.2 : 1),
      '#ff4d4d',
    );
  }

  // Rosa: a gold arrow pointing the way she faces.
  const p = toScreen(view, position.x, position.z);
  const f = sim.curr.facing;
  const len = Math.hypot(f.x, f.z) || 1;
  const fx = f.x / len;
  const fz = f.z / len;
  const r = m * 1.5;
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = '#120d09';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(p.x + fx * r, p.y + fz * r);
  ctx.lineTo(p.x - fx * r * 0.7 - fz * r * 0.7, p.y - fz * r * 0.7 + fx * r * 0.7);
  ctx.lineTo(p.x - fx * r * 0.3, p.y - fz * r * 0.3);
  ctx.lineTo(p.x - fx * r * 0.7 + fz * r * 0.7, p.y - fz * r * 0.7 - fx * r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Underground: which layer this is, in the top-left corner.
  if (underground && layer > 0) {
    const text = `Depth ${layer}`;
    const size = Math.max(11, m * 2.4);
    ctx.font = `bold ${size}px serif`;
    const w = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(18, 13, 9, 0.78)';
    ctx.fillRect(4, 4, w + 10, size + 6);
    ctx.fillStyle = GOLD;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(text, 9, 7);
  }
}
