import { describe, expect, it } from 'vitest';
import type { Gatherable } from '@/data/maps/types';
import {
  GATHER_RADIUS,
  HERB_REGROW_SECONDS,
  createNodes,
  isReady,
  stepGathering,
} from '@/systems/gathering';

const spots: Gatherable[] = [
  { id: 'rose', kind: 'roseHip', x: 0, z: 0 },
  { id: 'mint', kind: 'moonMint', x: 10, z: 0 },
  { id: 'pearl', kind: 'pearl', x: 0, z: 5 },
];
const take = () => true;

describe('gathering', () => {
  it('picks only what is within reach', () => {
    const nodes = createNodes(spots, []);
    const step = stepGathering(nodes, { x: GATHER_RADIUS - 0.1, z: 0 }, 1, take);
    expect(step.collected.map((n) => n.id)).toEqual(['rose']);
    expect(stepGathering(nodes, { x: GATHER_RADIUS + 0.3, z: 0 }, 1, take).collected).toHaveLength(
      0,
    );
  });

  it('regrows herbs after the regrowth time, not before', () => {
    const nodes = createNodes(spots, []);
    stepGathering(nodes, { x: 0, z: 0 }, 5, take);
    const rose = nodes[0]!;
    expect(isReady(rose, 5 + HERB_REGROW_SECONDS - 1)).toBe(false);
    expect(
      stepGathering(nodes, { x: 0, z: 0 }, 5 + HERB_REGROW_SECONDS - 1, take).collected,
    ).toHaveLength(0);
    expect(
      stepGathering(nodes, { x: 0, z: 0 }, 5 + HERB_REGROW_SECONDS, take).collected,
    ).toHaveLength(1);
  });

  it('takes a pearl only once, ever', () => {
    const nodes = createNodes(spots, []);
    expect(stepGathering(nodes, { x: 0, z: 5 }, 1, take).collected).toHaveLength(1);
    expect(stepGathering(nodes, { x: 0, z: 5 }, 100000, take).collected).toHaveLength(0);
  });

  it('keeps pearls that were already taken gone after a reload', () => {
    const nodes = createNodes(spots, ['pearl']);
    expect(stepGathering(nodes, { x: 0, z: 5 }, 1, take).collected).toHaveLength(0);
    expect(nodes.find((n) => n.id === 'rose')?.readyAt).toBe(0);
  });

  it('leaves the plant in place when the bag is full', () => {
    const nodes = createNodes(spots, []);
    const step = stepGathering(nodes, { x: 0, z: 0 }, 1, () => false);
    expect(step.collected).toHaveLength(0);
    expect(step.blocked.map((n) => n.id)).toEqual(['rose']);
    expect(stepGathering(nodes, { x: 0, z: 0 }, 2, take).collected).toHaveLength(1);
  });

  it('collects several plants in one step', () => {
    const nodes = createNodes(
      [
        { id: 'a', kind: 'roseHip', x: 0, z: 0 },
        { id: 'b', kind: 'moonMint', x: 0.5, z: 0 },
      ],
      [],
    );
    expect(stepGathering(nodes, { x: 0.2, z: 0 }, 1, take).collected).toHaveLength(2);
  });
});
