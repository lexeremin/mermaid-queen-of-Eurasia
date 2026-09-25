import { resetPointerInput, type InputState } from '@/input/input-state';

type WatchedStore<S> = {
  getState: () => S;
  subscribe: (listener: (state: S) => void) => () => void;
};

/**
 * Resets finger-held input the moment the sim stops running (a panel, menu, dialogue or the map opened over the
 * controls), because the release of a held finger can no longer reach the controls that are about to unmount.
 */
export function attachInputReset<S>(
  store: WatchedStore<S>,
  input: InputState,
  isRunning: (state: S) => boolean,
): () => void {
  let was = isRunning(store.getState());
  return store.subscribe((state) => {
    const now = isRunning(state);
    if (was && !now) resetPointerInput(input);
    was = now;
  });
}
