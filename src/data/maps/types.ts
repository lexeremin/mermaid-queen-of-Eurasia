import type { AssetId } from '@/data/assets';
import type { EnemyKind } from '@/data/enemies';
import type { Bounds, Collider } from '@/systems/collision';
import type { Zone } from '@/systems/zones';
import type { Vec2 } from '@/utils/vec2';

export type Point = readonly [x: number, z: number];

export type Placement = {
  asset: AssetId;
  x: number;
  z: number;
  /** Radians about Y (three.js convention: +90° turns +Z, south, toward +X, east). */
  rotY?: number;
  scale?: number;
  /** Extra scale along the model's long (local x) axis only, used to fit wall pieces exactly between two points. */
  stretch?: number;
  /** Uses the asset footprint for collision. Defaults to true. */
  collide?: boolean;
};

export type Ribbon = { points: readonly Point[]; width: number };

/**
 * A river or pond: drawn as a ribbon with a wider bank edge. `swimRuns` are the polylines along which it can be
 * swum (with the ribbon's half width as the radius): stepping into one turns Rosa into a mermaid. A bridge deck
 * over the water is left out of them.
 */
export type Water = {
  ribbon: Ribbon;
  edgeWidth: number;
  swimRuns: readonly (readonly Point[])[];
};

export type NpcSpot = { id: string; x: number; z: number; rotY: number };

/** A doorway or gate Rosa can walk through to another area. `axis` is the direction of travel through it. */
export type Entrance = {
  id: string;
  label: string;
  x: number;
  z: number;
  axis: 'x' | 'z';
  /** Clear width of the opening in metres. */
  width: number;
  /** Glow color. */
  color: string;
};

export type GatherKind = 'roseHip' | 'moonMint' | 'pearl';

/** A herb plant (regrows) or a hidden pearl (taken once ever). */
export type Gatherable = { id: string; kind: GatherKind; x: number; z: number };

export type EnemySpawn = {
  id: string;
  kind: EnemyKind;
  x: number;
  z: number;
  /** Waits out of the fight until something (the boss) wakes it. */
  dormant?: boolean;
  /** Part of an instance (the underground): never refills on its own, only when Rosa leaves and re-enters. */
  instanced?: boolean;
  /** Toughness multiplier (the underground gets stronger with depth). */
  power?: number;
};

export type MapData = {
  id: string;
  bounds: Bounds;
  spawn: Vec2;
  placements: readonly Placement[];
  waters: readonly Water[];
  paths: readonly Ribbon[];
  /** Cobblestone rectangles: center and size. */
  plazas: readonly { cx: number; cz: number; w: number; d: number }[];
  /** Paved lanes: cobbles laid along a centre line (a way between two paved areas, or to a gate). */
  lanes?: readonly Ribbon[];
  zones: readonly Zone[];
  npcs: readonly NpcSpot[];
  /** The hidden archangel children (see data/archangels.ts). They talk like NPCs but are not persuadable. */
  archangels?: readonly NpcSpot[];
  /** Ordinary people of the square (see data/locals.ts): good company, not recruitable. */
  locals?: readonly NpcSpot[];
  enemies: readonly EnemySpawn[];
  gatherables?: readonly Gatherable[];
  entrances?: readonly Entrance[];
  /** Colored ground rectangles (e.g. interior floors). */
  floors?: readonly { cx: number; cz: number; w: number; d: number; color: string; y?: number }[];
  /** Translucent glass roofs. */
  glass?: readonly { cx: number; cz: number; w: number; d: number; y: number }[];
  lights?: readonly {
    x: number;
    y: number;
    z: number;
    color: string;
    intensity: number;
    distance: number;
  }[];
  colliders: readonly Collider[];
};
