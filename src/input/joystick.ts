import type { Vec2 } from '@/utils/vec2';

export const JOYSTICK_DEADZONE = 0.12;

export function joystickVector(
  dx: number,
  dy: number,
  radius: number,
  deadzone: number = JOYSTICK_DEADZONE,
): Vec2 {
  const len = Math.hypot(dx, dy);
  if (len === 0 || radius <= 0) return { x: 0, z: 0 };
  const magnitude = Math.min(len / radius, 1);
  if (magnitude < deadzone) return { x: 0, z: 0 };
  const scaled = (magnitude - deadzone) / (1 - deadzone);
  return { x: (dx / len) * scaled, z: (dy / len) * scaled };
}
