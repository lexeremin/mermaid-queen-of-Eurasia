import { normalize, type Vec2 } from '@/utils/vec2';
import {
  resetInput,
  resetPointerInput,
  setHeld,
  type Action,
  type InputState,
} from '@/input/input-state';

const MOVE_CODES = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
} as const;

const ALL_MOVE_CODES: ReadonlySet<string> = new Set(Object.values(MOVE_CODES).flat());

const ACTION_CODES: Readonly<Record<string, Action>> = {
  Space: 'attack',
  ShiftLeft: 'blink',
  ShiftRight: 'blink',
  KeyQ: 'aura',
  KeyR: 'spell',
  KeyT: 'recall',
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
  onQuests: () => void;
  onMap: () => void;
  onQuickUse: (slot: 0 | 1) => void;
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
    if (e.code === 'KeyM' || e.code === 'Tab') {
      e.preventDefault();
      if (!e.repeat) handlers.onMap();
      return;
    }
    if (e.code === 'KeyJ') {
      if (!e.repeat) handlers.onQuests();
      return;
    }
    if (e.code === 'Digit1' || e.code === 'Digit2') {
      if (!e.repeat) handlers.onQuickUse(e.code === 'Digit1' ? 0 : 1);
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
    if (!(e.target instanceof HTMLCanvasElement)) return;
    const touch = e.pointerType === 'touch';
    if (e.pointerType === 'mouse' && e.button === 2) {
      input.mouseAttack = true;
      setHeld(input, 'attack', true);
      return;
    }
    if (e.button !== 0) return;
    const rect = e.target.getBoundingClientRect();
    input.click = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      touch,
    };
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !(e.target instanceof HTMLCanvasElement)) {
      if (e.pointerType !== 'mouse') input.pointer = null;
      return;
    }
    const rect = e.target.getBoundingClientRect();
    input.pointer = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
  };
  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button === 2) {
      input.mouseAttack = false;
      setHeld(input, 'attack', false);
    }
  };
  const onContextMenu = (e: Event) => {
    if (e.target instanceof HTMLCanvasElement) e.preventDefault();
  };
  const onTouches = (e: TouchEvent) => {
    input.touchEvents = true;
    input.touches = e.touches.length;
    if (e.touches.length === 0) input.noTouchSince = performance.now();
  };
  const onBlur = () => {
    heldKeys.clear();
    resetInput(input);
    resetPointerInput(input);
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('touchstart', onTouches, { passive: true });
  window.addEventListener('touchend', onTouches, { passive: true });
  window.addEventListener('touchcancel', onTouches, { passive: true });
  window.addEventListener('blur', onBlur);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('touchstart', onTouches);
    window.removeEventListener('touchend', onTouches);
    window.removeEventListener('touchcancel', onTouches);
    window.removeEventListener('blur', onBlur);
  };
}
