import { normalize, type Vec2 } from '@/utils/vec2';
import { resetInput, setHeld, type Action, type InputState } from '@/input/input-state';

const MOVE_CODES = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
} as const;

const ALL_MOVE_CODES: ReadonlySet<string> = new Set(Object.values(MOVE_CODES).flat());

const ACTION_CODES: Readonly<Record<string, Action>> = {
  Space: 'dash',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyQ: 'aura',
  KeyR: 'spell',
  KeyE: 'interact',
};

export function keysToMove(held: ReadonlySet<string>): Vec2 {
  const any = (codes: readonly string[]) => codes.some((code) => held.has(code));
  return normalize({
    x: (any(MOVE_CODES.right) ? 1 : 0) - (any(MOVE_CODES.left) ? 1 : 0),
    z: (any(MOVE_CODES.down) ? 1 : 0) - (any(MOVE_CODES.up) ? 1 : 0),
  });
}

export type KeyboardHandlers = {
  onEscape: () => void;
  onInventory: () => void;
};

export function attachKeyboardMouse(input: InputState, handlers: KeyboardHandlers): () => void {
  const heldKeys = new Set<string>();

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      if (!e.repeat) handlers.onEscape();
      return;
    }
    if (e.code === 'KeyI') {
      if (!e.repeat) handlers.onInventory();
      return;
    }
    const action = ACTION_CODES[e.code];
    if (action) {
      e.preventDefault();
      setHeld(input, action, true);
    }
    if (ALL_MOVE_CODES.has(e.code)) {
      e.preventDefault();
      heldKeys.add(e.code);
      input.keyMove = keysToMove(heldKeys);
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const action = ACTION_CODES[e.code];
    if (action) setHeld(input, action, false);
    if (ALL_MOVE_CODES.has(e.code)) {
      heldKeys.delete(e.code);
      input.keyMove = keysToMove(heldKeys);
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button === 0 && e.target instanceof HTMLCanvasElement) {
      setHeld(input, 'attack', true);
    }
  };
  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button === 0) setHeld(input, 'attack', false);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') input.pointerActive = true;
  };
  const onContextMenu = (e: Event) => {
    if (e.target instanceof HTMLCanvasElement) e.preventDefault();
  };
  const onBlur = () => {
    heldKeys.clear();
    resetInput(input);
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('blur', onBlur);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('blur', onBlur);
  };
}
