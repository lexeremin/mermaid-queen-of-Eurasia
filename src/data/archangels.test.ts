import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ARCHANGELS, ARCHANGEL_COUNT, buildArchangelTree } from '@/data/archangels';
import { RED_SQUARE } from '@/data/maps/red-square';
import { NPCS } from '@/data/npcs';
import { saveArchangel } from '@/game/archangel-actions';
import { useArchangelStore } from '@/store/archangel-store';
import { useToastStore } from '@/store/toast-store';
import { advance, resolveNode, visibleChoices, type DialogueContext } from '@/systems/dialogue';
import { resolveCircle } from '@/systems/collision';
import { buildCollisionWorld } from '@/systems/map-collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import { createNavGrid, findPath } from '@/systems/pathfinding';
import { isInWater } from '@/systems/water';

vi.mock('@/audio/sfx', () => ({ playSfx: vi.fn() }));
import { playSfx } from '@/audio/sfx';

const ctx = (saved: boolean): DialogueContext => ({
  relationship: () => 0,
  methodUsed: () => false,
  joined: () => false,
  following: () => false,
  saved: () => saved,
});

describe('the archangels', () => {
  it('are Michael, Gabriel and Serafima', () => {
    expect(ARCHANGELS.map((a) => a.id)).toEqual(['michael', 'gabriel', 'serafima']);
    expect(ARCHANGEL_COUNT).toBe(3);
    expect(new Set(ARCHANGELS.map((a) => a.name)).size).toBe(3);
  });

  it('each have their own words: no two share an intro, prompt or answer', () => {
    const lines = ARCHANGELS.flatMap((a) => [
      a.intro,
      a.prompt,
      a.right,
      a.thanks,
      a.joy,
      a.after,
      ...a.wrong.flatMap((w) => [w.text, w.reaction]),
    ]);
    expect(new Set(lines).size).toBe(lines.length);
    for (const line of lines) expect(line.length).toBeGreaterThan(10);
  });
});

describe('an archangel conversation', () => {
  for (const def of ARCHANGELS) {
    describe(def.name, () => {
      const tree = buildArchangelTree(def);

      it('only points at nodes that exist', () => {
        for (const node of Object.values(tree.nodes)) {
          const targets = [
            ...(node.next ? [node.next] : []),
            ...(node.choices ?? []).map((c) => c.next),
            ...(node.branches ?? []).map((b) => b.next),
          ];
          for (const target of targets) expect(target === 'end' || tree.nodes[target]).toBeTruthy();
        }
      });

      it('walks intro, prompt, a wrong answer that asks again, then the right answer saves', () => {
        const first = resolveNode(tree, tree.start, ctx(false))!;
        expect(first.node.text).toBe(def.intro);
        const prompt = resolveNode(tree, advance(first.node, null).next, ctx(false))!;
        expect(prompt.node.text).toBe(def.prompt);
        const choices = visibleChoices(prompt.node, ctx(false));
        expect(choices).toHaveLength(3);
        expect(choices.filter((c) => c.choice.effects?.length)).toHaveLength(1);

        const wrong = choices.find((c) => !c.choice.effects)!;
        const step = advance(prompt.node, wrong.index);
        expect(step.effects).toEqual([]);
        const reaction = resolveNode(tree, step.next, ctx(false))!;
        expect(def.wrong.map((w) => w.reaction)).toContain(reaction.node.text);
        expect(advance(reaction.node, null).next).toBe('prompt');

        const right = choices.find((c) => c.choice.effects?.length)!;
        expect(right.choice.text).toBe(def.right);
        const saved = advance(prompt.node, right.index);
        expect(saved.effects).toEqual([{ type: 'save', child: def.id }]);
        const thanks = resolveNode(tree, saved.next, ctx(false))!;
        expect(thanks.node.text).toBe(def.thanks);
        const joy = resolveNode(tree, advance(thanks.node, null).next, ctx(false))!;
        expect(joy.node.speaker).toBe('narrator');
        expect(advance(joy.node, null).next).toBe('end');
      });

      it('greets Rosa happily once saved, with a way to say goodbye', () => {
        const after = resolveNode(tree, tree.start, ctx(true))!;
        expect(after.node.text).toBe(def.after);
        const [bye] = visibleChoices(after.node, ctx(true));
        expect(bye?.choice.text).toBe(def.farewell);
        expect(advance(after.node, bye!.index).next).toBe('end');
      });
    });
  }
});

describe('where the archangels hide', () => {
  const world = buildCollisionWorld(RED_SQUARE);
  // Without the children themselves, whose own colliders would push a test point away from its spot.
  const bare = buildCollisionWorld({ ...RED_SQUARE, archangels: [] });
  const grid = createNavGrid(bare, PLAYER_RADIUS, 0.5);
  const spots = RED_SQUARE.archangels ?? [];

  it('are on the map, one spot each', () => {
    expect(spots.map((s) => s.id)).toEqual(ARCHANGELS.map((a) => a.id));
  });

  it('stand on free, dry ground inside the map that Rosa can get to', () => {
    for (const s of spots) {
      const p = resolveCircle({ x: s.x, z: s.z }, PLAYER_RADIUS, bare);
      expect(Math.hypot(p.x - s.x, p.z - s.z), s.id).toBeLessThan(1e-6);
      expect(isInWater(bare.water, { x: s.x, z: s.z }), s.id).toBe(false);
      expect(s.x).toBeGreaterThan(RED_SQUARE.bounds.minX);
      expect(s.x).toBeLessThan(RED_SQUARE.bounds.maxX);
      expect(findPath(grid, RED_SQUARE.spawn, { x: s.x, z: s.z }), s.id).not.toBeNull();
    }
  });

  it('are hidden: far from the spawn, from each other and from every person of the square', () => {
    for (const a of spots) {
      expect(Math.hypot(a.x - RED_SQUARE.spawn.x, a.z - RED_SQUARE.spawn.z), a.id).toBeGreaterThan(
        20,
      );
      for (const b of spots) {
        if (a.id < b.id)
          expect(Math.hypot(a.x - b.x, a.z - b.z), `${a.id}/${b.id}`).toBeGreaterThan(20);
      }
      for (const n of RED_SQUARE.npcs)
        expect(Math.hypot(a.x - n.x, a.z - n.z), `${a.id}/${n.id}`).toBeGreaterThan(8);
    }
    expect(NPCS.some((n) => spots.some((s) => s.id === n.id))).toBe(false);
  });

  it('block movement like people do', () => {
    expect(world.colliders.length - bare.colliders.length).toBe(spots.length);
  });

  it('take a swim to reach Serafima: every way there crosses the river', () => {
    const serafima = spots.find((s) => s.id === 'serafima')!;
    const path = findPath(grid, RED_SQUARE.spawn, { x: serafima.x, z: serafima.z })!;
    const wet = path.some((from, i) => {
      const to = path[i + 1];
      if (!to) return false;
      for (let t = 0; t <= 1; t += 0.05) {
        const p = { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t };
        if (isInWater(bare.water, p)) return true;
      }
      return false;
    });
    expect(wet).toBe(true);
  });
});

describe('saving an archangel', () => {
  beforeEach(() => {
    useArchangelStore.getState().reset();
    useToastStore.setState({ toasts: [] });
    vi.mocked(playSfx).mockClear();
  });

  it('records the child, plays the happy sound and says so, once', () => {
    expect(saveArchangel('michael')).toBe(true);
    expect(useArchangelStore.getState().saved).toEqual(['michael']);
    expect(playSfx).toHaveBeenCalledWith('joy');
    expect(useToastStore.getState().toasts.some((t) => t.text.includes('Michael is safe'))).toBe(
      true,
    );
    expect(saveArchangel('michael')).toBe(false);
    expect(playSfx).toHaveBeenCalledTimes(1);
    expect(useArchangelStore.getState().saved).toEqual(['michael']);
  });

  it('ignores a child that does not exist and announces the last one', () => {
    expect(saveArchangel('nobody')).toBe(false);
    saveArchangel('michael');
    saveArchangel('gabriel');
    saveArchangel('serafima');
    expect(useToastStore.getState().toasts.some((t) => t.text.includes('All three'))).toBe(true);
  });
});
