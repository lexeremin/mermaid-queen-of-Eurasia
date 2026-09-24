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
  /** Uses the asset footprint for collision. Defaults to true. */
  collide?: boolean;
};

export type Ribbon = { points: readonly Point[]; width: number };

/** A river or pond: drawn as a ribbon with a wider bank edge; collider runs are capsule chains. */
export type Water = {
  ribbon: Ribbon;
  edgeWidth: number;
  colliderRuns: readonly (readonly Point[])[];
};

export type NpcSpot = { id: string; x: number; z: number; rotY: number };

export type EnemySpawn = { id: string; kind: EnemyKind; x: number; z: number };

export type MapData = {
  id: string;
  bounds: Bounds;
  spawn: Vec2;
  placements: readonly Placement[];
  waters: readonly Water[];
  paths: readonly Ribbon[];
  /** Cobblestone rectangles: center and size. */
  plazas: readonly { cx: number; cz: number; w: number; d: number }[];
  zones: readonly Zone[];
  npcs: readonly NpcSpot[];
  enemies: readonly EnemySpawn[];
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
