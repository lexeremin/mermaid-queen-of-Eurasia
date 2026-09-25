import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ASSETS } from '@/data/assets';
import { LOCALS, LOCAL_BY_ID, LOCAL_MEET_XP, buildLocalTree } from '@/data/locals';
import { RED_SQUARE } from '@/data/maps/red-square';
import { NPCS } from '@/data/npcs';
import { meetLocal, receiveGift } from '@/game/local-actions';
import { useDialogueStore } from '@/store/dialogue-store';
import { useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { speakerOf } from '@/data/speakers';
import { resolveCircle } from '@/systems/collision';
import { advance, resolveNode, visibleChoices, type DialogueContext } from '@/systems/dialogue';
import { addToBag } from '@/systems/inventory';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid, findPath } from '@/systems/pathfinding';

vi.mock('@/audio/sfx', () => ({ playSfx: vi.fn() }));

const ctx: DialogueContext = {
  relationship: () => 0,
  methodUsed: () => false,
  joined: () => false,
  following: () => false,
  saved: () => false,
};

describe('the locals', () => {
  it('are seven, with their own names, models and words', () => {
    expect(LOCALS).toHaveLength(7);
    expect(new Set(LOCALS.map((l) => l.id)).size).toBe(7);
    expect(new Set(LOCALS.map((l) => l.name)).size).toBe(7);
    expect(new Set(LOCALS.map((l) => l.asset)).size).toBe(7);
    for (const l of LOCALS) {
      expect(ASSETS[l.asset], l.id).toBeDefined();
      const lines = [l.hello, l.goodbye, ...l.topics.flatMap((t) => [t.ask, t.reply])];
      for (const line of lines) expect(line.length, l.id).toBeGreaterThan(8);
    }
    const all = LOCALS.flatMap((l) => [l.hello, ...l.topics.map((t) => t.reply)]);
    expect(new Set(all).size).toBe(all.length);
  });

  it('are found by the speaker lookup, and none is a person of the court', () => {
    for (const l of LOCALS) {
      expect(speakerOf(l.id)?.name).toBe(l.name);
      expect(NPCS.some((n) => n.id === l.id)).toBe(false);
    }
  });

  it('hint at the hidden things: the three archangels, the pearls and the lanterns', () => {
    const text = LOCALS.flatMap((l) => l.topics.map((t) => t.reply))
      .join(' ')
      .toLowerCase();
    for (const word of ['wings', 'trumpet', 'six wings', 'pearl', 'lantern'])
      expect(text).toContain(word);
  });
});

describe('a conversation with a local', () => {
  for (const def of LOCALS) {
    it(`${def.name}: greets, offers three topics and goodbye, and each topic returns to the menu`, () => {
      const tree = buildLocalTree(def);
      const first = resolveNode(tree, tree.start, ctx)!;
      expect(first.node.text).toBe(def.hello);
      const menu = resolveNode(tree, advance(first.node, null).next, ctx)!;
      const choices = visibleChoices(menu.node, ctx);
      expect(choices).toHaveLength(4);
      expect(choices.slice(0, 3).map((c) => c.choice.text)).toEqual(def.topics.map((t) => t.ask));
      choices.slice(0, 3).forEach((c, i) => {
        const step = advance(menu.node, c.index);
        expect(step.effects.some((e) => e.type === 'meet')).toBe(true);
        expect(step.effects.some((e) => e.type === 'gift')).toBe(Boolean(def.gift));
        const reply = resolveNode(tree, step.next, ctx)!;
        expect(reply.node.text).toBe(def.topics[i]!.reply);
        expect(advance(reply.node, null).next).toBe('menu');
      });
      const bye = advance(menu.node, choices[3]!.index);
      expect(bye.effects).toEqual([]);
      const last = resolveNode(tree, bye.next, ctx)!;
      expect(last.node.text).toBe(def.goodbye);
      expect(advance(last.node, null).next).toBe('end');
    });
  }

  it('opens through the normal dialogue box logic', () => {
    useDialogueStore.getState().open('vanya');
    expect(useDialogueStore.getState().active?.npcId).toBe('vanya');
    useDialogueStore.getState().close();
  });
});

describe('meeting and gifts', () => {
  beforeEach(() => {
    useProgressStore.getState().reset();
    useToastStore.setState({ toasts: [] });
  });

  it('give a little XP the first time, and never again', () => {
    meetLocal('vanya');
    const xp = useProgressStore.getState().xp;
    expect(xp).toBe(LOCAL_MEET_XP);
    meetLocal('vanya');
    expect(useProgressStore.getState().xp).toBe(xp);
    meetLocal('tim');
    expect(useProgressStore.getState().xp).toBe(xp + LOCAL_MEET_XP);
    meetLocal('nobody');
    expect(useProgressStore.getState().xp).toBe(xp + LOCAL_MEET_XP);
  });

  it('hand over the gift once, if the bag has room', () => {
    const bag = () => useProgressStore.getState().bag.filter(Boolean).length;
    expect(receiveGift('zoya')).toBe(true);
    expect(LOCAL_BY_ID.get('zoya')!.gift!.item).toBe('healingTea');
    expect(bag()).toBe(1);
    expect(receiveGift('zoya')).toBe(false);
    expect(bag()).toBe(1);
    expect(receiveGift('vanya')).toBe(false); // he has none
  });

  it('keep the gift for later when the bag is full', () => {
    let bag = useProgressStore.getState().bag;
    for (let i = 0; i < 40; i++) bag = addToBag(bag, 'silverTrident', 1).bag;
    useProgressStore.getState().setBag(bag);
    expect(receiveGift('tamara')).toBe(false);
    expect(useToastStore.getState().toasts.some((t) => t.text.includes('room'))).toBe(true);
    useProgressStore.getState().setBag(Array.from({ length: bag.length }, () => null));
    expect(receiveGift('tamara')).toBe(true);
  });
});

describe('where they stand', () => {
  const world = buildCollisionWorld(RED_SQUARE);
  const bare = buildCollisionWorld({ ...RED_SQUARE, locals: [] });
  const grid = createNavGrid(bare, PLAYER_RADIUS, 0.5);
  const spots = RED_SQUARE.locals ?? [];

  it('are on the map, one spot each', () => {
    expect(spots.map((s) => s.id)).toEqual(LOCALS.map((l) => l.id));
  });

  it('stand on free ground that Rosa can walk to, and stop her like people do', () => {
    for (const s of spots) {
      const p = resolveCircle({ x: s.x, z: s.z }, PLAYER_RADIUS, bare);
      expect(Math.hypot(p.x - s.x, p.z - s.z), s.id).toBeLessThan(1e-6);
      expect(findPath(grid, RED_SQUARE.spawn, { x: s.x, z: s.z }), s.id).not.toBeNull();
    }
    expect(world.colliders.length - bare.colliders.length).toBe(spots.length);
  });

  it('keep their distance from everybody else, so a click picks the right one', () => {
    const others = [...RED_SQUARE.npcs, ...(RED_SQUARE.archangels ?? [])];
    for (const a of spots) {
      for (const b of spots)
        if (a.id < b.id)
          expect(Math.hypot(a.x - b.x, a.z - b.z), `${a.id}/${b.id}`).toBeGreaterThan(4);
      for (const o of others)
        expect(Math.hypot(a.x - o.x, a.z - o.z), `${a.id}/${o.id}`).toBeGreaterThan(3.5);
    }
  });
});
