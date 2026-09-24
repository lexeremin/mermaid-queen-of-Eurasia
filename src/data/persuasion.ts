import type { Choice, DialogueNode, DialogueTree, Method } from '@/data/dialogue-types';
import { METHODS } from '@/data/dialogue-types';
import type { NpcDef } from '@/data/npcs';
import { MESMERIZED_AT, WARMING_AT } from '@/systems/relationship';

const METHOD_LABEL: Record<Method, string> = {
  kindness: 'Kindness',
  humor: 'Humor',
  song: 'Sing',
  silence: 'Silence',
};

export const methodLabel = (method: Method): string => METHOD_LABEL[method];

/** Builds the persuasion dialogue for one NPC from his lines (see docs/phases/phase-10.md). */
export function buildPersuasionTree(npc: NpcDef): DialogueTree {
  const id = npc.id;
  const nodes: Record<string, DialogueNode> = {};

  const lines = npc.companion;
  nodes.start = {
    speaker: 'npc',
    branches: [
      ...(lines
        ? [{ when: [{ kind: 'following' as const, npc: id, value: true }], next: 'following' }]
        : []),
      { when: [{ kind: 'joined', npc: id, value: true }], next: 'joined' },
      { when: [{ kind: 'relationshipAtLeast', npc: id, value: npc.joinAt }], next: 'invite' },
      { when: [{ kind: 'relationshipAtLeast', npc: id, value: MESMERIZED_AT }], next: 'hub_high' },
      { when: [{ kind: 'relationshipAtLeast', npc: id, value: WARMING_AT }], next: 'hub_mid' },
      { when: [], next: 'hub_low' },
    ],
  };

  const methodChoices: Choice[] = METHODS.map((method) => ({
    text: npc.methods[method].option,
    next: `r_${method}`,
    method,
    requires: [{ kind: 'methodUnused', npc: id, method }],
    effects: [
      { type: 'use', npc: id, method },
      { type: 'relationship', npc: id, delta: npc.methods[method].delta },
    ],
  }));
  const leave: Choice = { text: 'Goodbye for now.', next: 'end' };
  const notFollowing = [{ kind: 'following' as const, npc: id, value: false }];
  const followChoice: Choice[] = lines
    ? [
        {
          text: lines.offer,
          next: 'follow_yes',
          requires: notFollowing,
          effects: [{ type: 'follow', npc: id, value: true }],
        },
      ]
    : [];

  for (const [hub, text] of [
    ['hub_low', npc.greet.low],
    ['hub_mid', npc.greet.mid],
    ['hub_high', npc.greet.high],
  ] as const) {
    const canAsk = hub === 'hub_high' ? followChoice : [];
    nodes[hub] = { speaker: 'npc', text, choices: [...canAsk, ...methodChoices, leave] };
  }

  for (const method of METHODS) {
    nodes[`r_${method}`] = { speaker: 'npc', text: npc.methods[method].reaction, next: 'start' };
  }

  nodes.invite = {
    speaker: 'npc',
    text: npc.greet.high,
    choices: [
      { text: 'Join my kingdom, please.', next: 'accepted', effects: [{ type: 'join', npc: id }] },
      ...followChoice,
      { text: 'Not yet. Stay a while.', next: 'end' },
    ],
  };
  nodes.accepted = { speaker: 'npc', text: npc.invite, next: 'end' };
  nodes.joined = {
    speaker: 'npc',
    text: npc.joined,
    choices: [...followChoice, { text: 'Take care of yourself.', next: 'end' }],
  };
  if (lines) {
    nodes.follow_yes = { speaker: 'npc', text: lines.accept, next: 'end' };
    nodes.following = {
      speaker: 'npc',
      text: lines.following,
      choices: [
        {
          text: lines.dismiss,
          next: 'dismissed',
          effects: [{ type: 'follow', npc: id, value: false }],
        },
        { text: 'Onward!', next: 'end' },
      ],
    };
    nodes.dismissed = { speaker: 'npc', text: lines.dismissed, next: 'end' };
  }

  return { id: `persuade-${id}`, start: 'start', nodes };
}
