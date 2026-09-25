import { describe, expect, it } from 'vitest';
import { attachInputReset } from '@/input/input-reset';
import {
  STALE_GRACE_MS,
  createInputState,
  onInputReset,
  resetPointerInput,
  setHeld,
  staleInput,
} from '@/input/input-state';

function fakeStore(initial: { running: boolean }) {
  let state = initial;
  const listeners = new Set<(s: typeof state) => void>();
  return {
    getState: () => state,
    subscribe: (l: (s: typeof state) => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    set(next: typeof state) {
      state = next;
      for (const l of listeners) l(state);
    },
  };
}

describe('resetPointerInput', () => {
  it('drops the stick, held buttons and presses but keeps the keyboard', () => {
    const input = createInputState();
    input.stickMove = { x: 1, z: 0.5 };
    input.keyMove = { x: -1, z: 0 };
    setHeld(input, 'attack', true);
    setHeld(input, 'blink', true);
    resetPointerInput(input);
    expect(input.stickMove).toEqual({ x: 0, z: 0 });
    expect(input.held.attack).toBe(false);
    expect(input.pressed.blink).toBe(false);
    expect(input.keyMove).toEqual({ x: -1, z: 0 });
  });

  it('tells the controls, so their knobs and pointer ids reset too', () => {
    let calls = 0;
    const off = onInputReset(() => (calls += 1));
    resetPointerInput(createInputState());
    off();
    resetPointerInput(createInputState());
    expect(calls).toBe(1);
  });
});

describe('attachInputReset', () => {
  it('resets when the sim stops running (a panel opens over the held stick), not when it starts', () => {
    const input = createInputState();
    const store = fakeStore({ running: true });
    attachInputReset(store, input, (s) => s.running);
    input.stickMove = { x: 1, z: 0 };
    store.set({ running: false });
    expect(input.stickMove).toEqual({ x: 0, z: 0 });
    input.stickMove = { x: 0, z: 1 };
    store.set({ running: true });
    expect(input.stickMove).toEqual({ x: 0, z: 1 });
  });

  it('stops listening when detached', () => {
    const input = createInputState();
    const store = fakeStore({ running: true });
    const detach = attachInputReset(store, input, (s) => s.running);
    detach();
    input.stickMove = { x: 1, z: 0 };
    store.set({ running: false });
    expect(input.stickMove).toEqual({ x: 1, z: 0 });
  });
});

describe('staleInput watchdog', () => {
  it('does nothing until real touch events have been seen (pointer-only environments)', () => {
    const input = createInputState();
    input.stickMove = { x: 1, z: 0 };
    expect(staleInput(input, 99999).stick).toBe(false);
  });

  it('flags a stick that is deflected with no finger on the screen', () => {
    const input = createInputState();
    input.touchEvents = true;
    input.stickMove = { x: 1, z: 0 };
    input.noTouchSince = 1000;
    expect(staleInput(input, 1000 + STALE_GRACE_MS - 10).stick).toBe(false);
    expect(staleInput(input, 1000 + STALE_GRACE_MS + 10).stick).toBe(true);
  });

  it('leaves a stick alone while a finger is down', () => {
    const input = createInputState();
    input.touchEvents = true;
    input.stickMove = { x: 1, z: 0 };
    input.touches = 1;
    input.noTouchSince = 0;
    expect(staleInput(input, 99999).stick).toBe(false);
  });

  it('flags a finger-held attack, but never a mouse-held one', () => {
    const input = createInputState();
    input.touchEvents = true;
    setHeld(input, 'attack', true);
    input.noTouchSince = 0;
    expect(staleInput(input, 1000).attack).toBe(true);
    input.mouseAttack = true;
    expect(staleInput(input, 1000).attack).toBe(false);
  });
});
