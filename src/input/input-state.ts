import { isZero, type Vec2 } from '@/utils/vec2';

export const ACTIONS = ['attack', 'dash', 'aura', 'spell', 'teleport', 'interact'] as const;
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
};

function flags(): Record<Action, boolean> {
  return {
    attack: false,
    dash: false,
    aura: false,
    spell: false,
    teleport: false,
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

export function getMove(input: InputState): Vec2 {
  return isZero(input.stickMove) ? input.keyMove : input.stickMove;
}

export const input: InputState = createInputState();
