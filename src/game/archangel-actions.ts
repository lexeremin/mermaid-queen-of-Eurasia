import { playSfx } from '@/audio/sfx';
import { ARCHANGEL_BY_ID, ARCHANGEL_COUNT } from '@/data/archangels';
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
