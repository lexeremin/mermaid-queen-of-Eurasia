import { beforeEach, describe, expect, it } from 'vitest';
import { combat, resetCombat } from '@/game/combat-sim';
import { gather, rebuildGather } from '@/game/gather-sim';
import { SHRINE_GIFT, prayAtShrine, stepGather } from '@/game/garden-actions';
import { useGardenStore } from '@/store/garden-store';
import { useProgressStore } from '@/store/progress-store';
import { countOf, emptyBag, addToBag } from '@/systems/inventory';

const bag = () => useProgressStore.getState().bag;
const node = (id: string) => gather.nodes.find((n) => n.id === id)!;

beforeEach(() => {
  useProgressStore.getState().reset();
  useGardenStore.getState().reset();
  resetCombat();
  rebuildGather();
});

describe('gathering in the game', () => {
  it('picks a herb into the bag, then regrows it', () => {
    const rose = node('rose-1');
    stepGather(0.02, rose.pos);
    expect(countOf(bag(), 'roseHip')).toBe(1);
    stepGather(0.02, rose.pos);
    expect(countOf(bag(), 'roseHip')).toBe(1);
    stepGather(95, { x: 0, z: 0 });
    stepGather(0.02, rose.pos);
    expect(countOf(bag(), 'roseHip')).toBe(2);
  });

  it('records a hidden pearl as taken, once ever', () => {
    const pearl = node('pearl-1');
    stepGather(0.02, pearl.pos);
    expect(countOf(bag(), 'pearl')).toBe(1);
    expect(useGardenStore.getState().pearlsTaken).toEqual(['pearl-1']);
    stepGather(500, { x: 0, z: 0 });
    stepGather(0.02, pearl.pos);
    expect(countOf(bag(), 'pearl')).toBe(1);
  });

  it('does not lose a plant when the bag is full', () => {
    let full = emptyBag();
    for (let i = 0; i < 20; i++)
      full = addToBag(full, i % 2 ? 'silverTrident' : 'pearlTrident', 1).bag;
    useProgressStore.getState().setBag(full);
    const rose = node('rose-2');
    stepGather(0.02, rose.pos);
    expect(countOf(bag(), 'roseHip')).toBe(0);
    expect(rose.readyAt).toBe(0);
  });

  it('rebuilding after a load keeps taken pearls gone', () => {
    useGardenStore.getState().takePearl('pearl-2');
    rebuildGather();
    expect(node('pearl-2').readyAt).toBe(Infinity);
    expect(node('pearl-3').readyAt).toBe(0);
  });
});

describe('the shrine', () => {
  it('gives its gift the first time only, and never with a full bag', () => {
    let full = emptyBag();
    for (let i = 0; i < 20; i++)
      full = addToBag(full, i % 2 ? 'silverTrident' : 'pearlTrident', 1).bag;
    useProgressStore.getState().setBag(full);
    prayAtShrine();
    expect(useGardenStore.getState().shrineGift).toBe(false);

    useProgressStore.getState().setBag(emptyBag());
    prayAtShrine();
    expect(useGardenStore.getState().shrineGift).toBe(true);
    for (const gift of SHRINE_GIFT) expect(countOf(bag(), gift.id)).toBe(gift.qty);

    prayAtShrine();
    expect(countOf(bag(), 'pearlTrident')).toBe(1);
    expect(countOf(bag(), 'pearl')).toBe(2);
  });

  it('restores health and mana after the gift, and refuses when already rested', () => {
    useGardenStore.getState().giveShrineGift();
    combat.hp = 20;
    combat.mana = 10;
    prayAtShrine();
    expect(combat.hp).toBe(100);
    expect(combat.mana).toBe(100);
    const before = countOf(bag(), 'pearl');
    prayAtShrine();
    expect(countOf(bag(), 'pearl')).toBe(before);
  });
});
