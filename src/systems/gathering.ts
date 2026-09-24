import type { GatherKind, Gatherable } from '@/data/maps/types';
import type { Vec2 } from '@/utils/vec2';

export const GATHER_RADIUS = 1.2;
export const HERB_REGROW_SECONDS = 90;

export type GatherNode = {
  id: string;
  kind: GatherKind;
  pos: Vec2;
  /** Gather time at which it can be picked; Infinity for a pearl already taken. */
  readyAt: number;
};

/** Builds node state from the map. Pearls already taken (saved) stay gone; herbs start ready. */
export function createNodes(
  gatherables: readonly Gatherable[],
  pearlsTaken: readonly string[],
): GatherNode[] {
  return gatherables.map((g) => ({
    id: g.id,
    kind: g.kind,
    pos: { x: g.x, z: g.z },
    readyAt: g.kind === 'pearl' && pearlsTaken.includes(g.id) ? Infinity : 0,
  }));
}

export const isReady = (node: GatherNode, time: number): boolean => node.readyAt <= time;

export type GatherStep = {
  collected: GatherNode[];
  /** Nodes in reach that could not be taken because the bag had no room. */
  blocked: GatherNode[];
};

/**
 * Picks everything in reach. `tryTake` returns true when the bag took the item. A herb regrows after
 * `HERB_REGROW_SECONDS`; a pearl is gone for good. Mutates the nodes.
 */
export function stepGathering(
  nodes: GatherNode[],
  player: Vec2,
  time: number,
  tryTake: (node: GatherNode) => boolean,
): GatherStep {
  const collected: GatherNode[] = [];
  const blocked: GatherNode[] = [];
  for (const node of nodes) {
    if (!isReady(node, time)) continue;
    if (Math.hypot(node.pos.x - player.x, node.pos.z - player.z) > GATHER_RADIUS) continue;
    if (!tryTake(node)) {
      blocked.push(node);
      continue;
    }
    node.readyAt = node.kind === 'pearl' ? Infinity : time + HERB_REGROW_SECONDS;
    collected.push(node);
  }
  return { collected, blocked };
}
