import { footprintOf } from '@/data/assets';
import type { MapData } from '@/data/maps/types';
import {
  footprintToColliders,
  polylineToCapsules,
  type Collider,
  type CollisionWorld,
} from '@/systems/collision';

const WATER_COLLIDER_INSET = 0.1;
const NPC_COLLIDER_RADIUS = 0.5;

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
  // Water is not solid: these are the swim zones (stepping into one turns Rosa into a mermaid).
  const waterColliders: Collider[] = [];
  for (const water of map.waters) {
    const radius = water.ribbon.width / 2 - WATER_COLLIDER_INSET;
    for (const run of water.swimRuns) waterColliders.push(...polylineToCapsules(run, radius));
  }
  colliders.push(...map.colliders);
  for (const npc of [...map.npcs, ...(map.archangels ?? []), ...(map.locals ?? [])])
    colliders.push({ kind: 'circle', x: npc.x, z: npc.z, r: NPC_COLLIDER_RADIUS });
  return { bounds: map.bounds, colliders, water: waterColliders };
}
