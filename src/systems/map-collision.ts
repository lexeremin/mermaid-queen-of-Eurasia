import { footprintOf } from '@/data/assets';
import type { MapData } from '@/data/maps/types';
import {
  footprintToColliders,
  polylineToCapsules,
  type Collider,
  type CollisionWorld,
} from '@/systems/collision';

const RIVER_COLLIDER_INSET = 0.1;

export function buildCollisionWorld(map: MapData): CollisionWorld {
  const colliders: Collider[] = [];
  for (const placement of map.placements) {
    if (placement.collide === false) continue;
    const footprint = footprintOf(placement.asset);
    if (!footprint) continue;
    colliders.push(
      ...footprintToColliders(
        footprint,
        placement.x,
        placement.z,
        placement.rotY ?? 0,
        placement.scale ?? 1,
      ),
    );
  }
  const riverRadius = map.river.ribbon.width / 2 - RIVER_COLLIDER_INSET;
  for (const run of map.river.colliderRuns) colliders.push(...polylineToCapsules(run, riverRadius));
  colliders.push(...map.colliders);
  return { bounds: map.bounds, colliders };
}
