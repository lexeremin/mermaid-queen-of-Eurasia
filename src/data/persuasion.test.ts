import { describe, expect, it } from 'vitest';
import { METHODS } from '@/data/dialogue-types';
import { NPCS } from '@/data/npcs';
import { buildPersuasionTree } from '@/data/persuasion';
import { advance, resolveNode, visibleChoices, type DialogueContext } from '@/systems/dialogue';
import { MESMERIZED_AT } from '@/systems/relationship';

function makeContext(state: { rel: number; used: Set<string>; joined: boolean }): DialogueContext {
  return {
    relationship: () => state.rel,
    methodUsed: (_npc, method) => state.used.has(method),
    joined: () => state.joined,
  };
}

describe('NPC data', () => {
  it('has eight unique NPCs', () => {
    expect(NPCS).toHaveLength(8);
    expect(new Set(NPCS.map((n) => n.id)).size).toBe(8);
  });

  it('lets every NPC be won over even if the player only picks good options', () => {
    for (const npc of NPCS) {
      const positives = METHODS.map((m) => npc.methods[m].delta).filter((d) => d > 0);
      const total = npc.initial + positives.reduce((a, b) => a + b, 0);
      expect(total, npc.id).toBeGreaterThanOrEqual(npc.joinAt);
      expect(npc.joinAt).toBeGreaterThanOrEqual(MESMERIZED_AT);
    }
  });

  it('gives every method a line, an option and a reaction', () => {
    for (const npc of NPCS) {
      for (const method of METHODS) {
        expect(npc.methods[method].option.length).toBeGreaterThan(5);
        expect(npc.methods[method].reaction.length).toBeGreaterThan(5);
      }
    }
  });
});

describe('persuasion tree', () => {
  const npc = NPCS[0]!;
  const tree = buildPersuasionTree(npc);

  it('routes by relationship tier and joined state', () => {
    const at = (rel: number, joined = false) =>
      resolveNode(tree, 'start', makeContext({ rel, used: new Set(), joined }))?.id;
    expect(at(0)).toBe('hub_low');
    expect(at(30)).toBe('hub_mid');
    expect(at(60)).toBe('hub_high');
    expect(at(npc.joinAt)).toBe('invite');
    expect(at(10, true)).toBe('joined');
  });

  it('offers only unused methods plus goodbye', () => {
    const ctx = makeContext({ rel: 0, used: new Set(['kindness']), joined: false });
    const hub = resolveNode(tree, 'start', ctx)!;
    const texts = visibleChoices(hub.node, ctx).map((c) => c.choice.text);
    expect(texts).toHaveLength(METHODS.length - 1 + 1);
    expect(texts).toContain('Goodbye for now.');
    expect(texts).not.toContain(npc.methods.kindness.option);
  });

  it('applies relationship and use effects, then loops back to the router', () => {
    const ctx = makeContext({ rel: 0, used: new Set(), joined: false });
    const hub = resolveNode(tree, 'start', ctx)!;
    const song = visibleChoices(hub.node, ctx).find((c) => c.choice.method === 'song')!;
    const result = advance(hub.node, song.index);
    expect(result.effects).toContainEqual({
      type: 'relationship',
      npc: npc.id,
      delta: npc.methods.song.delta,
    });
    expect(result.effects).toContainEqual({ type: 'use', npc: npc.id, method: 'song' });
    expect(result.next).toBe('r_song');
    const reaction = resolveNode(tree, result.next, ctx)!;
    expect(reaction.node.text).toBe(npc.methods.song.reaction);
    expect(advance(reaction.node, null).next).toBe('start');
  });

  it('joins through the invitation and ends the conversation', () => {
    const ctx = makeContext({ rel: npc.joinAt, used: new Set(), joined: false });
    const invite = resolveNode(tree, 'start', ctx)!;
    const join = advance(invite.node, 0);
    expect(join.effects).toContainEqual({ type: 'join', npc: npc.id });
    expect(resolveNode(tree, join.next, ctx)!.node.text).toBe(npc.invite);
    expect(advance(resolveNode(tree, 'accepted', ctx)!.node, null).next).toBe('end');
    expect(resolveNode(tree, 'end', ctx)).toBeNull();
  });

  it('every node targets an existing node, router branch or end', () => {
    for (const def of NPCS) {
      const t = buildPersuasionTree(def);
      for (const node of Object.values(t.nodes)) {
        const targets = [
          ...(node.next ? [node.next] : []),
          ...(node.choices ?? []).map((c) => c.next),
          ...(node.branches ?? []).map((b) => b.next),
        ];
        for (const target of targets)
          expect(target === 'end' || t.nodes[target], `${def.id}:${target}`).toBeTruthy();
      }
    }
  });
});
