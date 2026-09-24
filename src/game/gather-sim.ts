import { currentMap } from '@/game/world/current-map';
import { useGardenStore } from '@/store/garden-store';
import { createNodes, type GatherNode } from '@/systems/gathering';

/** Mutable gatherable state (herb regrowth clock and node readiness), read by the renderer every frame. */
export const gather: { nodes: GatherNode[]; time: number } = { nodes: [], time: 0 };

/** Rebuilds the nodes from the map and the saved garden state (herbs start ready, taken pearls stay gone). */
export function rebuildGather(): void {
  gather.time = 0;
  gather.nodes = createNodes(currentMap.gatherables ?? [], useGardenStore.getState().pearlsTaken);
}

rebuildGather();
