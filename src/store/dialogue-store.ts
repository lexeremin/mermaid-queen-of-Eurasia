import { create } from 'zustand';
import type { DialogueTree } from '@/data/dialogue-types';
import { ARCHANGEL_BY_ID, buildArchangelTree } from '@/data/archangels';
import { NPC_BY_ID } from '@/data/npcs';
import { buildPersuasionTree } from '@/data/persuasion';
import { saveArchangel } from '@/game/archangel-actions';
import { meetLocal, receiveGift } from '@/game/local-actions';
import { LOCAL_BY_ID, buildLocalTree } from '@/data/locals';
import { combat } from '@/game/combat-sim';
import { useGameStore } from '@/store/game-store';
import { npcContext, useNpcStore } from '@/store/npc-store';
import { useToastStore } from '@/store/toast-store';
import { advance, charmBonus, resolveNode } from '@/systems/dialogue';

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
  const child = ARCHANGEL_BY_ID.get(npcId);
  const local = LOCAL_BY_ID.get(npcId);
  const npc = NPC_BY_ID.get(npcId);
  if (!child && !local && !npc) return null;
  const tree = child
    ? buildArchangelTree(child)
    : local
      ? buildLocalTree(local)
      : buildPersuasionTree(npc!);
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
    for (const effect of step.effects) {
      if (effect.type === 'save') {
        saveArchangel(effect.child);
        continue;
      }
      if (effect.type === 'meet') {
        meetLocal(effect.who);
        continue;
      }
      if (effect.type === 'gift') {
        receiveGift(effect.who);
        continue;
      }
      const charmed = (combat.charmed[active.npcId] ?? 0) > combat.time;
      useNpcStore.getState().apply(charmed ? charmBonus(effect) : effect);
      if (effect.type === 'follow') {
        const name = NPC_BY_ID.get(effect.npc)?.name ?? 'He';
        useToastStore
          .getState()
          .push(
            effect.value ? `${name} follows you and fights beside you` : `${name} waits here`,
            'info',
          );
      }
    }
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
