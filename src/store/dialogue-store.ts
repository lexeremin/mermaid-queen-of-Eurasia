import { create } from 'zustand';
import type { DialogueTree } from '@/data/dialogue-types';
import { NPC_BY_ID } from '@/data/npcs';
import { buildPersuasionTree } from '@/data/persuasion';
import { useGameStore } from '@/store/game-store';
import { npcContext, useNpcStore } from '@/store/npc-store';
import { advance, resolveNode } from '@/systems/dialogue';

export type ActiveDialogue = { npcId: string; nodeId: string };

type DialogueState = {
  active: ActiveDialogue | null;
  open: (npcId: string) => void;
  /** Pick a choice (menu) or continue (line: null). */
  choose: (index: number | null) => void;
  close: () => void;
};

const trees = new Map<string, DialogueTree>();

export function treeFor(npcId: string): DialogueTree | null {
  const cached = trees.get(npcId);
  if (cached) return cached;
  const npc = NPC_BY_ID.get(npcId);
  if (!npc) return null;
  const tree = buildPersuasionTree(npc);
  trees.set(npcId, tree);
  return tree;
}

export const useDialogueStore = create<DialogueState>((set, get) => ({
  active: null,

  open: (npcId) => {
    const tree = treeFor(npcId);
    const resolved = tree ? resolveNode(tree, tree.start, npcContext()) : null;
    if (!resolved) return;
    useGameStore.getState().setDialogueOpen(true);
    set({ active: { npcId, nodeId: resolved.id } });
  },

  choose: (index) => {
    const { active } = get();
    if (!active) return;
    const tree = treeFor(active.npcId);
    const node = tree?.nodes[active.nodeId];
    if (!tree || !node) return;
    const step = advance(node, index);
    for (const effect of step.effects) useNpcStore.getState().apply(effect);
    const next = resolveNode(tree, step.next, npcContext());
    if (!next) {
      get().close();
      return;
    }
    set({ active: { npcId: active.npcId, nodeId: next.id } });
  },

  close: () => {
    useGameStore.getState().setDialogueOpen(false);
    set({ active: null });
  },
}));
