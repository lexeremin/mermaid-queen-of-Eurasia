export const CAMERA_POSITION: [number, number, number] = [0, 11, 8];
export const CAMERA_LOOK_AT: [number, number, number] = [0, 0, 0];

export function cameraPitchDegrees(
  position: readonly [number, number, number] = CAMERA_POSITION,
  target: readonly [number, number, number] = CAMERA_LOOK_AT,
): number {
  const horizontal = Math.hypot(position[0] - target[0], position[2] - target[2]);
  const vertical = position[1] - target[1];
  return (Math.atan2(vertical, horizontal) * 180) / Math.PI;
}
