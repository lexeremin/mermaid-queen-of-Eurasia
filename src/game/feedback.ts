import { useSettingsStore } from '@/store/settings-store';
import { pushNumber, stepNumbers, type FloatingNumber } from '@/systems/floating-numbers';
import { addTrauma, drainTrauma } from '@/systems/shake';
import { initialWeather, stepWeather, type Weather } from '@/systems/weather';

/** The small things that make hits feel like hits: floating numbers, screen shake, and the drizzle. */

/** Damage numbers on screen right now (drawn by `ui/DamageNumbers`). */
export const floating: FloatingNumber[] = [];
let nextId = 1;

export function showDamage(x: number, z: number, amount: number, kind: 'enemy' | 'player'): void {
  if (!useSettingsStore.getState().damageNumbers) return;
  pushNumber(floating, nextId++, x, z, amount, kind);
}

/** The camera shake in force right now. */
export const shake = { trauma: 0 };

export function shakeScreen(amount: number): void {
  if (!useSettingsStore.getState().shake) return;
  shake.trauma = addTrauma(shake.trauma, amount);
}

/** The drizzle: `rain` is 0 (dry) to 1. */
export const weather: { state: Weather } = { state: initialWeather() };

/** One frame of the world running: numbers float up, the shake settles, the weather turns. */
export function stepFeedback(dt: number, raining: boolean): void {
  stepNumbers(floating, dt);
  shake.trauma = drainTrauma(shake.trauma, dt);
  weather.state = stepWeather(weather.state, dt, raining, Math.random);
}

export function resetFeedback(): void {
  floating.length = 0;
  shake.trauma = 0;
}
