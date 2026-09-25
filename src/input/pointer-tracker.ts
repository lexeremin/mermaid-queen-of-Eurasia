/**
 * Follows the one pointer (finger) that owns a control. A new press always takes over from an old one, because a
 * fresh touch proves the old one is gone (its release may never have arrived: pause, unmount, iOS gestures).
 */
export type PointerTracker = {
  /** Claims the control for `id`; returns the id it replaced, if any. */
  down: (id: number) => number | null;
  /** Whether `id` is the pointer that owns the control. */
  owns: (id: number) => boolean;
  /** Releases the control if `id` owns it. Returns true if it did. */
  up: (id: number) => boolean;
  reset: () => void;
  readonly active: number | null;
};

export function createPointerTracker(): PointerTracker {
  let active: number | null = null;
  return {
    down(id) {
      const previous = active;
      active = id;
      return previous;
    },
    owns: (id) => active === id,
    up(id) {
      if (active !== id) return false;
      active = null;
      return true;
    },
    reset() {
      active = null;
    },
    get active() {
      return active;
    },
  };
}
