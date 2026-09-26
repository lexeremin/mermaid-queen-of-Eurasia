import { useSyncExternalStore } from 'react';

/** A phone held sideways: too short for the decorative parts of a menu. */
export const SHORT_SCREEN = '(max-height: 500px) and (orientation: landscape)';

const subscribe = (notify: () => void): (() => void) => {
  const query = window.matchMedia(SHORT_SCREEN);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
const snapshot = (): boolean => window.matchMedia(SHORT_SCREEN).matches;

export const useShortScreen = (): boolean => useSyncExternalStore(subscribe, snapshot, () => false);
