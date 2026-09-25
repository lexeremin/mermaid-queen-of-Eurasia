import { ARCHANGEL_BY_ID } from '@/data/archangels';
import { NPC_BY_ID } from '@/data/npcs';

export type Speaker = { id: string; name: string; title: string; accent: string };

/** Anyone Rosa can talk to: the people of the square and the archangel children. */
export function speakerOf(id: string): Speaker | undefined {
  return NPC_BY_ID.get(id) ?? ARCHANGEL_BY_ID.get(id);
}
