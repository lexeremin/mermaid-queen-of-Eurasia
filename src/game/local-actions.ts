import { LOCAL_BY_ID, LOCAL_MEET_XP } from '@/data/locals';
import { awardOnce } from '@/game/progress-actions';
import { requestSave } from '@/save/save-requests';
import { useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { addAllToStash } from '@/systems/inventory';

/** Talking to a local for the first time earns a little XP, once ever. */
export function meetLocal(id: string): void {
  const def = LOCAL_BY_ID.get(id);
  if (def) awardOnce(`meet:${id}`, LOCAL_MEET_XP, `Met ${def.name}`);
}

/** The local's gift, once ever: if the bag has no room, nothing is handed over and they will offer it again. */
export function receiveGift(id: string): boolean {
  const gift = LOCAL_BY_ID.get(id)?.gift;
  const key = `gift:${id}`;
  const progress = useProgressStore.getState();
  if (!gift || progress.awarded.includes(key)) return false;
  const next = addAllToStash({ bag: progress.bag, keepsakes: progress.keepsakes }, [
    { id: gift.item, qty: gift.qty },
  ]);
  if (!next) {
    useToastStore.getState().push('Make room in your bag for their gift', 'warn');
    return false;
  }
  progress.setStash(next.bag, next.keepsakes);
  progress.award(key, 0);
  useToastStore.getState().push(gift.line, 'item');
  requestSave();
  return true;
}
