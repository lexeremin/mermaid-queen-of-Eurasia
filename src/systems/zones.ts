import type { Vec2 } from '@/utils/vec2';

export type Zone = {
  id: string;
  label: string;
  box: { cx: number; cz: number; hx: number; hz: number };
};

export function zoneAt(zones: readonly Zone[], pos: Vec2): Zone | null {
  for (const zone of zones) {
    const { cx, cz, hx, hz } = zone.box;
    if (Math.abs(pos.x - cx) <= hx && Math.abs(pos.z - cz) <= hz) return zone;
  }
  return null;
}
