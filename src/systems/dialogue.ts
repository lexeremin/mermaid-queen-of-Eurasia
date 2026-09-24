import type {
  Choice,
  Condition,
  DialogueNode,
  DialogueTree,
  Effect,
  Method,
} from '@/data/dialogue-types';

export type DialogueContext = {
  relationship: (npc: string) => number;
  methodUsed: (npc: string, method: Method) => boolean;
  joined: (npc: string) => boolean;
  following: (npc: string) => boolean;
};

const MAX_ROUTER_HOPS = 12;

export function isMet(condition: Condition, ctx: DialogueContext): boolean {
  switch (condition.kind) {
    case 'relationshipAtLeast':
      return ctx.relationship(condition.npc) >= condition.value;
    case 'relationshipBelow':
      return ctx.relationship(condition.npc) < condition.value;
    case 'methodUnused':
      return !ctx.methodUsed(condition.npc, condition.method);
    case 'joined':
      return ctx.joined(condition.npc) === condition.value;
    case 'following':
      return ctx.following(condition.npc) === condition.value;
  }
}

export const allMet = (
  conditions: readonly Condition[] | undefined,
  ctx: DialogueContext,
): boolean => (conditions ?? []).every((c) => isMet(c, ctx));

export type ResolvedNode = { id: string; node: DialogueNode };

/** Follows routers until a node with text is reached. Returns null for 'end' or a dead end. */
export function resolveNode(
  tree: DialogueTree,
  nodeId: string,
  ctx: DialogueContext,
): ResolvedNode | null {
  let id = nodeId;
  for (let hop = 0; hop < MAX_ROUTER_HOPS; hop++) {
    if (id === 'end') return null;
    const node = tree.nodes[id];
    if (!node) return null;
    if (!node.branches) return { id, node };
    const branch = node.branches.find((b) => allMet(b.when, ctx));
    if (!branch) return null;
    id = branch.next;
  }
  return null;
}

export type VisibleChoice = { choice: Choice; index: number };

export function visibleChoices(node: DialogueNode, ctx: DialogueContext): VisibleChoice[] {
  return (node.choices ?? [])
    .map((choice, index) => ({ choice, index }))
    .filter(({ choice }) => allMet(choice.requires, ctx));
}

export type Advance = { effects: readonly Effect[]; next: string };

/** What happens when the player picks a choice (menu) or continues (line). */
export function advance(node: DialogueNode, choiceIndex: number | null): Advance {
  if (choiceIndex !== null && node.choices) {
    const choice = node.choices[choiceIndex];
    if (choice) return { effects: choice.effects ?? [], next: choice.next };
  }
  return { effects: [], next: node.next ?? 'end' };
}

export const CHARM_PERSUASION_BONUS = 1.5;

/** While an NPC is charmed by the Aura, positive relationship gains are multiplied. */
export function charmBonus(effect: Effect): Effect {
  if (effect.type !== 'relationship' || effect.delta <= 0) return effect;
  return { ...effect, delta: Math.round(effect.delta * CHARM_PERSUASION_BONUS) };
}
