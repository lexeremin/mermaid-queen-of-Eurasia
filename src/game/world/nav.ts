import { currentWorld } from '@/game/world/current-map';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid } from '@/systems/pathfinding';

export const nav = createNavGrid(currentWorld, PLAYER_RADIUS, 0.5);

if (typeof window !== 'undefined') {
  window.setTimeout(() => void nav.prewarm(), 800);
}
