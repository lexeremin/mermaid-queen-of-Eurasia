export type Method = 'kindness' | 'humor' | 'song' | 'silence';
export const METHODS: readonly Method[] = ['kindness', 'humor', 'song', 'silence'];

export type Condition =
  | { kind: 'relationshipAtLeast'; npc: string; value: number }
  | { kind: 'relationshipBelow'; npc: string; value: number }
  | { kind: 'methodUnused'; npc: string; method: Method }
  | { kind: 'joined'; npc: string; value: boolean }
  | { kind: 'following'; npc: string; value: boolean }
  /** An archangel child has been saved. */
  | { kind: 'saved'; child: string; value: boolean };

export type Effect =
  | { type: 'relationship'; npc: string; delta: number }
  | { type: 'use'; npc: string; method: Method }
  | { type: 'join'; npc: string }
  | { type: 'follow'; npc: string; value: boolean }
  /** Saves an archangel child (see the archangel store). */
  | { type: 'save'; child: string };

/** The effects that change a person's relationship state. */
export type NpcEffect = Exclude<Effect, { type: 'save' }>;

export type Choice = {
  text: string;
  next: string;
  effects?: readonly Effect[];
  requires?: readonly Condition[];
  method?: Method;
};

export type Branch = { when: readonly Condition[]; next: string };

/**
 * A router has `branches` and no text. A line has `text` and `next`.
 * A menu has `text` and `choices`. `next` / choice `next` may be 'end'.
 */
export type DialogueNode = {
  speaker: 'npc' | 'rosa' | 'narrator';
  text?: string;
  choices?: readonly Choice[];
  next?: string;
  branches?: readonly Branch[];
  effects?: readonly Effect[];
};

export type DialogueTree = {
  id: string;
  start: string;
  nodes: Readonly<Record<string, DialogueNode>>;
};
