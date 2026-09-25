import { playSfx } from '@/audio/sfx';
import { ARCHANGEL_BY_ID, ARCHANGEL_COUNT, ARCHANGEL_HINTS, nearbyHint } from '@/data/archangels';
import { currentMap } from '@/game/world/current-map';
import { track } from '@/net/stats';
import { useArchangelStore } from '@/store/archangel-store';
import { useToastStore } from '@/store/toast-store';

/** Saves one archangel: state, happy sounds and toasts. Saving the same child twice does nothing. */
export function saveArchangel(id: string): boolean {
  const def = ARCHANGEL_BY_ID.get(id);
  const store = useArchangelStore.getState();
  if (!def || store.saved.includes(id)) return false;
  store.save(id);
  playSfx('joy');
  const toast = useToastStore.getState();
  const count = useArchangelStore.getState().saved.length;
  toast.push(`${def.name} is safe! (${count}/${ARCHANGEL_COUNT} archangels)`, 'xp');
  if (count === ARCHANGEL_COUNT) toast.push('All three archangels are home.', 'info');
  track('archangel_saved', { id, count });
  return true;
}

const hinted = new Set<string>();

/** Call every frame with Rosa's position: a soft chime and a line the first time she comes near a lost child. */
export function stepArchangelHints(pos: { x: number; z: number }): void {
  const id = nearbyHint(
    currentMap.archangels ?? [],
    pos,
    useArchangelStore.getState().saved,
    hinted,
  );
  if (!id) return;
  hinted.add(id);
  playSfx('loot');
  useToastStore.getState().push(ARCHANGEL_HINTS[id]!.text, 'info');
}

/** A new game forgets which hints were given. */
export function resetArchangelHints(): void {
  hinted.clear();
}
