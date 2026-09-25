import { create } from 'zustand';
import type { Method, NpcEffect } from '@/data/dialogue-types';
import { useArchangelStore } from '@/store/archangel-store';
import { NPCS } from '@/data/npcs';
import type { DialogueContext } from '@/systems/dialogue';
import { clampRelationship } from '@/systems/relationship';

export type NpcRuntime = {
  relationship: number;
  used: readonly Method[];
  joined: boolean;
  /** Fights beside Rosa as a companion (only NPCs with a `companion` definition). */
  following: boolean;
};

type NpcState = {
  npcs: Readonly<Record<string, NpcRuntime>>;
  apply: (effect: NpcEffect) => void;
  hydrate: (saved: Readonly<Record<string, NpcRuntime>>) => void;
  reset: () => void;
};

const initial = (): Record<string, NpcRuntime> =>
  Object.fromEntries(
    NPCS.map((n) => [n.id, { relationship: n.initial, used: [], joined: false, following: false }]),
  );

export const useNpcStore = create<NpcState>((set) => ({
  npcs: initial(),
  reset: () => set({ npcs: initial() }),
  hydrate: (saved) => set({ npcs: { ...initial(), ...saved } }),
  apply: (effect) =>
    set((state) => {
      const current = state.npcs[effect.npc];
      if (!current) return state;
      let next: NpcRuntime;
      if (effect.type === 'relationship') {
        next = { ...current, relationship: clampRelationship(current.relationship + effect.delta) };
      } else if (effect.type === 'use') {
        next = current.used.includes(effect.method)
          ? current
          : { ...current, used: [...current.used, effect.method] };
      } else if (effect.type === 'follow') {
        next = { ...current, following: effect.value };
      } else {
        next = { ...current, joined: true };
      }
      return { npcs: { ...state.npcs, [effect.npc]: next } };
    }),
}));

export function npcContext(): DialogueContext {
  const npcs = () => useNpcStore.getState().npcs;
  return {
    relationship: (id) => npcs()[id]?.relationship ?? 0,
    methodUsed: (id, method) => npcs()[id]?.used.includes(method) ?? false,
    joined: (id) => npcs()[id]?.joined ?? false,
    following: (id) => npcs()[id]?.following ?? false,
    saved: (id) => useArchangelStore.getState().saved.includes(id),
  };
}
