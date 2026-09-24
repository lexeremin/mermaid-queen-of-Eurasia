import { NPC_BY_ID } from '@/data/npcs';
import { NpcActor } from '@/game/entities/NpcActor';
import { currentMap } from '@/game/world/current-map';

export function Npcs() {
  return (
    <>
      {currentMap.npcs.map((spot) => {
        const def = NPC_BY_ID.get(spot.id);
        return def ? <NpcActor key={spot.id} def={def} spot={spot} /> : null;
      })}
    </>
  );
}
