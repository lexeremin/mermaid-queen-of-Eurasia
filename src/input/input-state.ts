import { isZero, type Vec2 } from '@/utils/vec2';

export const ACTIONS = ['attack', 'blink', 'aura', 'spell', 'recall', 'form', 'interact'] as const;
export type Action = (typeof ACTIONS)[number];

export type InputState = {
  keyMove: Vec2;
  stickMove: Vec2;
  /** Left-click on the canvas in normalized device coordinates, consumed by the game loop. */
  click: { x: number; y: number; touch: boolean } | null;
  /** Where the mouse is over the canvas (normalized device coordinates), or null (touch, or off the canvas). */
  pointer: { x: number; y: number } | null;
  held: Record<Action, boolean>;
  pressed: Record<Action, boolean>;
  /** Fingers currently on the screen, and since when there have been none (ms, `performance.now`). */
  touches: number;
  noTouchSince: number;
  /** The attack action is held by the mouse (right button), not a finger. */
  mouseAttack: boolean;
  /** A real touch event has been seen, so `touches` can be trusted (some environments send pointer events only). */
  touchEvents: boolean;
};

function flags(): Record<Action, boolean> {
  return {
    attack: false,
    blink: false,
    aura: false,
    spell: false,
    recall: false,
    form: false,
    interact: false,
  };
}

export function createInputState(): InputState {
  return {
    keyMove: { x: 0, z: 0 },
    stickMove: { x: 0, z: 0 },
    click: null,
    pointer: null,
    held: flags(),
    pressed: flags(),
    touches: 0,
    noTouchSince: 0,
    mouseAttack: false,
    touchEvents: false,
  };
}

export function setHeld(input: InputState, action: Action, down: boolean): void {
  if (down && !input.held[action]) input.pressed[action] = true;
  input.held[action] = down;
}

export function consumePressed(input: InputState, action: Action): boolean {
  const was = input.pressed[action];
  input.pressed[action] = false;
  return was;
}

export function clearPressed(input: InputState): void {
  for (const action of ACTIONS) input.pressed[action] = false;
}

export function resetInput(input: InputState): void {
  input.keyMove = { x: 0, z: 0 };
  input.stickMove = { x: 0, z: 0 };
  input.click = null;
  input.pointer = null;
  input.held = flags();
  input.pressed = flags();
}

const resetListeners = new Set<() => void>();

/** Lets a control (stick, button) clear its own on-screen state when input is reset from elsewhere. */
export function onInputReset(listener: () => void): () => void {
  resetListeners.add(listener);
  return () => resetListeners.delete(listener);
}

/**
 * Drops everything a finger was holding (stick, held buttons, one-shot presses) but keeps the keyboard. Call it
 * whenever a release might have been missed: backgrounding, pausing, a panel opening over the controls.
 */
export function resetPointerInput(input: InputState): void {
  input.stickMove = { x: 0, z: 0 };
  input.held = flags();
  input.pressed = flags();
  input.mouseAttack = false;
  for (const listener of resetListeners) listener();
}

export type StaleInput = { stick: boolean; attack: boolean };

export const STALE_GRACE_MS = 150;

/**
 * Safety net: input that only a finger can hold (the stick, a touch-held attack) while no finger has been on the
 * screen for a moment is stale, whatever the events said.
 */
export function staleInput(input: InputState, now: number, graceMs = STALE_GRACE_MS): StaleInput {
  const idle = input.touchEvents && input.touches === 0 && now - input.noTouchSince > graceMs;
  return {
    stick: idle && !isZero(input.stickMove),
    attack: idle && input.held.attack && !input.mouseAttack,
  };
}

export function getMove(input: InputState): Vec2 {
  return isZero(input.stickMove) ? input.keyMove : input.stickMove;
}

export const input: InputState = createInputState();
