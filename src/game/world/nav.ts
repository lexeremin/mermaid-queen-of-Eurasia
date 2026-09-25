import { currentWorld } from '@/game/world/current-map';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid } from '@/systems/pathfinding';

export const nav = createNavGrid(currentWorld, PLAYER_RADIUS, 0.5);

/** The walkability cache fills itself in short slices as soon as the game starts; the loading screen waits for it. */
export const navReady: Promise<void> = nav.prewarm();
