import { playSfx } from '@/audio/sfx';
import { combat } from '@/game/combat-sim';
import { sim } from '@/game/sim';
import { track } from '@/net/stats';
import { useGameStore } from '@/store/game-store';
import { useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { pushEffect } from '@/systems/combat';

/** Seconds' worth of pause between two switches. */
export const FORM_COOLDOWN_MS = 2000;
let lastSwitch = -Infinity;

export const mermaidUnlocked = (): boolean => useProgressStore.getState().forms.includes('mermaid');

/**
 * Swimming. Stepping into water (a pond end, the river) turns Rosa into a mermaid on the spot, and she becomes human
 * again a moment after she leaves it, unless she chose the mermaid form herself. Fountains are not water.
 */
export const swim = { active: false, t: 0, ripple: 0 };
const LEAVE_DELAY = 0.45;
let sinceLeft = 0;
let byWater = false;

/** Called every fixed step with whether Rosa is standing in water. */
export function stepWater(inWater: boolean, dt: number): void {
  const game = useGameStore.getState();
  swim.t = inWater ? swim.t + dt : 0;
  if (inWater) {
    sinceLeft = 0;
    if (!swim.active) {
      swim.active = true;
      splash();
    }
    if (game.form === 'human') {
      byWater = true;
      game.setForm('mermaid');
      splash();
      const toasts = useToastStore.getState();
      toasts.push('The water turns you into a mermaid', 'info');
    }
    return;
  }
  if (!swim.active) return;
  sinceLeft += dt;
  if (sinceLeft < LEAVE_DELAY) return;
  swim.active = false;
  if (byWater && game.form === 'mermaid') {
    byWater = false;
    game.setForm('human');
    splash();
  }
}

function splash(): void {
  pushEffect(combat, 'bubbles', sim.curr.pos.x, sim.curr.pos.z, { x: 0, z: 1 }, 0.9, 1.5);
  playSfx('splash');
}

/** True while Rosa's form came from the water (she cannot leave it by pressing F while swimming). */
export const swimming = (): boolean => swim.active;

export type SwitchResult = 'switched' | 'locked' | 'busy';

/** F: between human and mermaid. Needs the form unlocked; not while fainted, fading, or too soon after a switch. */
export function toggleForm(now: number = performance.now()): SwitchResult {
  if (!mermaidUnlocked()) return 'locked';
  const game = useGameStore.getState();
  if (combat.downed || swim.active || now - lastSwitch < FORM_COOLDOWN_MS) return 'busy';
  lastSwitch = now;
  byWater = false;
  const next = game.form === 'human' ? 'mermaid' : 'human';
  game.setForm(next);
  pushEffect(combat, 'bubbles', sim.curr.pos.x, sim.curr.pos.z, { x: 0, z: 1 }, 0.9, 1.3);
  playSfx('bubbles');
  useToastStore.getState().push(next === 'mermaid' ? 'Mermaid form' : 'Human form', 'info');
  track('form_switched', { form: next });
  return 'switched';
}

/** The quest reward: the mermaid form is Rosa's from now on. */
export function unlockMermaid(): void {
  if (mermaidUnlocked()) return;
  useProgressStore.getState().unlockForm('mermaid');
  useToastStore.getState().announce('MERMAID QUEEN', 'FORM UNLOCKED');
  useToastStore
    .getState()
    .push('Press F to change form. Tidal Song and swimming are yours.', 'info');
  track('form_unlocked', { form: 'mermaid' });
}

export const resetFormClock = (): void => {
  lastSwitch = -Infinity;
  swim.active = false;
  swim.t = 0;
  sinceLeft = 0;
  byWater = false;
};
