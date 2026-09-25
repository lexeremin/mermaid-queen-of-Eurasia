import type { Camera } from 'three';

/** The game camera, for HTML that has to follow things in the world (damage numbers). */
export const cameraRef: { camera: Camera | null } = { camera: null };
