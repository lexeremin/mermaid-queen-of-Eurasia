import { NPC_BY_ID } from '@/data/npcs';
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
    </>
  );
}
