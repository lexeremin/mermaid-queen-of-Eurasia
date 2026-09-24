import { clamp } from '@/utils/math';

export const CAMERA_OFFSET: readonly [number, number, number] = [0, 11, 8];
export const CAMERA_FOV = 45;
export const CAMERA_DAMPING = 6;

const REFERENCE_ASPECT = 16 / 9;
const MAX_DISTANCE_SCALE = 2.5;

export function cameraPitchDegrees(
  offset: readonly [number, number, number] = CAMERA_OFFSET,
): number {
  return (Math.atan2(offset[1], Math.hypot(offset[0], offset[2])) * 180) / Math.PI;
}

export function cameraDistanceScale(aspect: number): number {
  if (!(aspect > 0)) return 1;
  return clamp(REFERENCE_ASPECT / aspect, 1, MAX_DISTANCE_SCALE);
}
