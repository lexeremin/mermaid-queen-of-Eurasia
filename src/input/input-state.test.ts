import { describe, expect, it } from 'vitest';
import {
  clearPressed,
  consumePressed,
  createInputState,
  getMove,
  resetInput,
  setHeld,
} from '@/input/input-state';

describe('input state', () => {
  it('records a press only on the down edge', () => {
    const input = createInputState();
    setHeld(input, 'attack', true);
    setHeld(input, 'attack', true);
    expect(consumePressed(input, 'attack')).toBe(true);
    expect(consumePressed(input, 'attack')).toBe(false);
    expect(input.held.attack).toBe(true);
    setHeld(input, 'attack', false);
    setHeld(input, 'attack', true);
    expect(consumePressed(input, 'attack')).toBe(true);
  });

  it('clearPressed drops one-shot flags but keeps held', () => {
    const input = createInputState();
    setHeld(input, 'dash', true);
    clearPressed(input);
    expect(input.pressed.dash).toBe(false);
    expect(input.held.dash).toBe(true);
  });

  it('prefers the joystick over the keyboard when the stick is active', () => {
    const input = createInputState();
    input.keyMove = { x: 1, z: 0 };
    expect(getMove(input)).toEqual({ x: 1, z: 0 });
    input.stickMove = { x: 0, z: -0.5 };
    expect(getMove(input)).toEqual({ x: 0, z: -0.5 });
  });

  it('resetInput clears everything', () => {
    const input = createInputState();
    input.keyMove = { x: 1, z: 1 };
    setHeld(input, 'spell', true);
    resetInput(input);
    expect(input.keyMove).toEqual({ x: 0, z: 0 });
    expect(input.held.spell).toBe(false);
  });
});
