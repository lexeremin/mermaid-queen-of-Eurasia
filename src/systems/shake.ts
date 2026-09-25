/** Screen shake as "trauma" that builds up with each shock and drains away (the shake grows with its square). */
export const MAX_TRAUMA = 1;
export const TRAUMA_DRAIN = 1.5;
/** Camera offset in metres at full trauma. */
export const MAX_OFFSET = 0.32;

export const addTrauma = (trauma: number, amount: number): number =>
  Math.min(MAX_TRAUMA, Math.max(0, trauma + amount));

export const drainTrauma = (trauma: number, dt: number): number =>
  Math.max(0, trauma - TRAUMA_DRAIN * dt);

/** A smooth, never-repeating-looking wobble from a few sines (no random numbers, so it is testable). */
export function shakeOffset(trauma: number, time: number): { x: number; y: number } {
  const power = trauma * trauma;
  return {
    x: MAX_OFFSET * power * (Math.sin(time * 41.3) * 0.6 + Math.sin(time * 27.1 + 1.7) * 0.4),
    y: MAX_OFFSET * power * (Math.sin(time * 37.9 + 0.6) * 0.6 + Math.sin(time * 23.3 + 2.9) * 0.4),
  };
}

/** How much a hurt to Rosa shakes the screen: a little for a scratch, more for a heavy blow. */
export const traumaForHurt = (damage: number): number => Math.min(0.55, 0.16 + damage / 120);
