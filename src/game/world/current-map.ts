import { RED_SQUARE } from '@/data/maps/red-square';
import { buildCollisionWorld } from '@/systems/map-collision';

export const currentMap = RED_SQUARE;
export const currentWorld = buildCollisionWorld(currentMap);
