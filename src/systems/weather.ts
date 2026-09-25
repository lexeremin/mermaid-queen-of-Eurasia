/** Drizzle comes and goes: clear spells and rainy spells, with a slow fade between them. */
export type Weather = {
  /** How hard it drizzles right now, 0 to 1 (0 is dry). */
  rain: number;
  /** What it is fading toward. */
  target: 0 | 1;
  /** Seconds until the weather turns. */
  left: number;
};

export const FADE_SECONDS = 8;
export const CLEAR_SPELL: readonly [number, number] = [90, 240];
export const RAIN_SPELL: readonly [number, number] = [40, 120];

export const initialWeather = (): Weather => ({ rain: 0, target: 0, left: 60 });

const between = (range: readonly [number, number], roll: number): number =>
  range[0] + (range[1] - range[0]) * roll;

/**
 * One step: the timer runs down, the weather turns when it hits zero, and the rain eases toward its target.
 * `enabled` false (the setting, or being underground) dries everything up. `random` returns [0, 1).
 */
export function stepWeather(
  w: Weather,
  dt: number,
  enabled: boolean,
  random: () => number,
): Weather {
  let { target, left } = w;
  left -= dt;
  if (left <= 0) {
    target = target === 0 ? 1 : 0;
    left = between(target === 1 ? RAIN_SPELL : CLEAR_SPELL, random());
  }
  const goal = enabled ? target : 0;
  const speed = (enabled ? 1 : 3) / FADE_SECONDS;
  const rain = w.rain + Math.sign(goal - w.rain) * Math.min(Math.abs(goal - w.rain), speed * dt);
  return { rain, target, left };
}
