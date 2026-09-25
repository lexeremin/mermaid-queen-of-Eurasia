import { UG_MIN_Z } from '@/data/maps/underground';

/** A rectangle of the world that one map image covers. */
export type Region = {
  id: 'surface' | 'underground';
  label: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export const SURFACE_REGION: Region = {
  id: 'surface',
  label: 'Red Square district',
  minX: -30,
  maxX: 64,
  minZ: -66,
  maxZ: 78,
};

export const UNDERGROUND_REGION: Region = {
  id: 'underground',
  label: 'Moscow underground',
  minX: 9,
  maxX: 41,
  minZ: 98,
  maxZ: 196,
};

export const regionFor = (z: number): Region =>
  z >= UG_MIN_Z ? UNDERGROUND_REGION : SURFACE_REGION;

export const regionSize = (r: Region): { w: number; d: number } => ({
  w: r.maxX - r.minX,
  d: r.maxZ - r.minZ,
});

/** How the map is drawn to a canvas: the world point at the canvas centre and pixels per metre. */
export type MapView = { cx: number; cz: number; scale: number; width: number; height: number };

export const toScreen = (view: MapView, x: number, z: number): { x: number; y: number } => ({
  x: view.width / 2 + (x - view.cx) * view.scale,
  y: view.height / 2 + (z - view.cz) * view.scale,
});

/** The view that shows a whole region inside a canvas, with a margin in pixels. */
export function fitRegion(region: Region, width: number, height: number, margin = 24): MapView {
  const { w, d } = regionSize(region);
  const scale = Math.max(1, Math.min((width - margin * 2) / w, (height - margin * 2) / d));
  return {
    cx: (region.minX + region.maxX) / 2,
    cz: (region.minZ + region.maxZ) / 2,
    scale,
    width,
    height,
  };
}

/** Names drawn on the full map. */
export const SURFACE_LABELS: readonly { text: string; x: number; z: number }[] = [
  { text: 'Red Square', x: -3.5, z: -3 },
  { text: "St. Basil's", x: -3, z: -24 },
  { text: 'GUM', x: -23.3, z: 8 },
  { text: 'Kremlin', x: 29, z: 4 },
  { text: 'Manezhnaya Square', x: 25, z: 48 },
  { text: 'Alexander Garden', x: 54, z: 4 },
  { text: 'Pearl Shrine', x: 59, z: -22 },
  { text: 'Moskva River', x: 17, z: -52 },
];
