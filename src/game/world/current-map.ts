import { VILLAGE } from '@/data/maps/village';
import { buildCollisionWorld } from '@/systems/map-collision';

export const currentMap = VILLAGE;
export const currentWorld = buildCollisionWorld(currentMap);
