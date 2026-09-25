import { ARCHANGELS } from '@/data/archangels';
import { NPC_BY_ID } from '@/data/npcs';
import { ArchangelActor } from '@/game/entities/ArchangelActor';
import { NpcActor } from '@/game/entities/NpcActor';
import { currentMap } from '@/game/world/current-map';
import { useNpcStore } from '@/store/npc-store';

export function Npcs() {
  const npcs = useNpcStore((s) => s.npcs);
  return (
    <>
      {currentMap.npcs.map((spot) => {
        const def = NPC_BY_ID.get(spot.id);
        if (npcs[spot.id]?.following) return null;
        return def ? <NpcActor key={spot.id} def={def} spot={spot} /> : null;
      })}
      {(currentMap.archangels ?? []).map((spot) => {
        const def = ARCHANGELS.find((a) => a.id === spot.id);
        return def ? <ArchangelActor key={spot.id} def={def} spot={spot} /> : null;
      })}
    </>
  );
}
