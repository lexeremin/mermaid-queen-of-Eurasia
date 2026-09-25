import { playSfx } from '@/audio/sfx';
import { combat } from '@/game/combat-sim';
import { sim } from '@/game/sim';
import { currentWorld } from '@/game/world/current-map';
import { nav } from '@/game/world/nav';
import { track } from '@/net/stats';
import { useGameStore } from '@/store/game-store';
import { useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { pushEffect } from '@/systems/combat';
import type { Collider } from '@/systems/collision';

/** Seconds' worth of pause between two switches. */
export const FORM_COOLDOWN_MS = 2000;
let lastSwitch = -Infinity;

export const mermaidUnlocked = (): boolean => useProgressStore.getState().forms.includes('mermaid');

/**
 * The mermaid swims: while she is one the water colliders (the garden pond) are out of the world, so she can
 * cross it; as a human they are back. The walk grid follows.
 */
export function syncWaterToForm(form: 'human' | 'mermaid'): void {
  const water = currentWorld.water ?? [];
  if (water.length === 0) return;
  const colliders = currentWorld.colliders as Collider[];
  const present = colliders.includes(water[0]!);
  if (form === 'mermaid' && present) {
    for (const c of water) {
      const i = colliders.indexOf(c);
      if (i >= 0) colliders.splice(i, 1);
    }
    nav.reset();
  } else if (form === 'human' && !present) {
    colliders.push(...water);
    nav.reset();
  }
}

useGameStore.subscribe((state, prev) => {
  if (state.form !== prev.form) syncWaterToForm(state.form);
});
syncWaterToForm(useGameStore.getState().form);

export type SwitchResult = 'switched' | 'locked' | 'busy';

/** F: between human and mermaid. Needs the form unlocked; not while fainted, fading, or too soon after a switch. */
export function toggleForm(now: number = performance.now()): SwitchResult {
  if (!mermaidUnlocked()) return 'locked';
  const game = useGameStore.getState();
  if (combat.downed || game.transitioning || now - lastSwitch < FORM_COOLDOWN_MS) return 'busy';
  lastSwitch = now;
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
};
