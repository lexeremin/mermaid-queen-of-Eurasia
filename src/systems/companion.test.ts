import { describe, expect, it } from 'vitest';
import type { CollisionWorld } from '@/systems/collision';
import {
  COMPANION,
  createCompanion,
  followSpot,
  stepCompanion,
  type Companion,
  type CompanionContext,
  type CompanionHit,
} from '@/systems/companion';

const DT = 1 / 60;
const world: CollisionWorld = {
  bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
  colliders: [],
};
const north = { x: 0, z: -1 };

function ctx(over: Partial<CompanionContext> = {}): CompanionContext {
  return { dt: DT, player: { x: 0, z: 0 }, playerFacing: north, targets: [], world, ...over };
}

function run(c: Companion, seconds: number, over: Partial<CompanionContext> = {}) {
  const hits: CompanionHit[] = [];
  for (let t = 0; t < seconds; t += DT) {
    const hit = stepCompanion(c, ctx(over));
    if (hit) hits.push(hit);
  }
  return hits;
}

const dist = (a: { x: number; z: number }, b: { x: number; z: number }) =>
  Math.hypot(a.x - b.x, a.z - b.z);

describe('following', () => {
  it('stands behind and beside Rosa', () => {
    const spot = followSpot({ x: 0, z: 0 }, north);
    expect(spot.z).toBeGreaterThan(0);
    expect(dist(spot, { x: 0, z: 0 })).toBeCloseTo(
      Math.hypot(COMPANION.followBack, COMPANION.followSide),
    );
  });

  it('catches up with Rosa as she walks away and never falls behind', () => {
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    const player = { x: 0, z: 0 };
    for (let t = 0; t < 8; t += DT) {
      player.z -= 5 * DT;
      stepCompanion(c, ctx({ player: { ...player } }));
    }
    expect(dist(c.pos, player)).toBeLessThan(3.5);
    expect(c.state).toBe('follow');
  });

  it('appears beside Rosa when she is far away', () => {
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    c.pos = { x: 60, z: 60 };
    stepCompanion(c, ctx());
    expect(dist(c.pos, { x: 0, z: 0 })).toBeLessThan(3);
  });

  it('does not walk through walls', () => {
    const wall: CollisionWorld = {
      ...world,
      colliders: [{ kind: 'box', cx: 0, cz: 3, hx: 5, hz: 0.5 }],
    };
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    c.pos = { x: 0, z: 6 };
    run(c, 3, { world: wall, player: { x: 0, z: 0 } });
    expect(c.pos.z).toBeGreaterThanOrEqual(3.5);
  });
});

describe('fighting', () => {
  const enemy = (x: number, z: number) => ({ id: 'e1', pos: { x, z }, radius: 0.5 });

  it('charges an enemy near Rosa and hits it with his sword', () => {
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    const hits = run(c, 3, { targets: [enemy(0, -5)] });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]).toMatchObject({ enemyId: 'e1', damage: COMPANION.damage });
  });

  it('swings the sword and lunges forward as he strikes', () => {
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    c.pos = { x: 0, z: -2 };
    const target = enemy(0, -4.4);
    let struck = false;
    let before = { ...c.pos };
    for (let t = 0; t < 3 && !struck; t += DT) {
      const hit = stepCompanion(c, ctx({ targets: [target] }));
      if (hit) {
        struck = true;
        expect(c.swing).toBeGreaterThan(0);
        before = { ...c.pos };
      }
    }
    expect(struck).toBe(true);
    run(c, COMPANION.strike + 0.05, { targets: [target] });
    expect(dist(c.pos, before)).toBeGreaterThan(0.2);
  });

  it('ignores enemies far from Rosa', () => {
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    const hits = run(c, 3, { targets: [enemy(0, -30)] });
    expect(hits).toHaveLength(0);
    expect(c.state).toBe('follow');
  });

  it('hits at a limited rate and goes back to following once the enemy is gone', () => {
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    const hits = run(c, 4, { targets: [enemy(0, -3)] });
    const perSecond = hits.length / 4;
    expect(perSecond).toBeGreaterThan(0.8);
    expect(perSecond).toBeLessThan(
      1 / (COMPANION.windup + COMPANION.strike + COMPANION.recover) + 0.2,
    );
    run(c, 2, { targets: [] });
    expect(c.state).toBe('follow');
  });
});

describe('the three-swing chain', () => {
  const enemy = (x: number, z: number) => ({ id: 'e1', pos: { x, z }, radius: 0.5 });

  it('swings forehand, backhand and a heavier finisher in turn', () => {
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    const kinds: number[] = [];
    const hits = [];
    for (let t = 0; t < 8; t += DT) {
      const before = c.swing;
      const hit = stepCompanion(c, ctx({ targets: [enemy(0, -3)] }));
      if (c.swing > before) kinds.push(c.swingKind);
      if (hit) hits.push(hit);
    }
    expect(kinds.slice(0, 6)).toEqual([0, 1, 2, 0, 1, 2]);
    expect(hits[2]!.damage).toBeGreaterThan(hits[0]!.damage);
    expect(hits[2]!.knockback).toBeGreaterThan(hits[0]!.knockback);
    expect(hits[1]!.damage).toBe(hits[0]!.damage);
  });

  it('starts over after a rest', () => {
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    run(c, 1, { targets: [enemy(0, -3)] });
    expect(c.combo).toBeGreaterThan(0);
    run(c, 3, { targets: [] });
    let began = false;
    for (let t = 0; t < 3 && !began; t += DT) {
      const before = c.swing;
      stepCompanion(c, ctx({ targets: [enemy(0, -3)] }));
      began = c.swing > before;
    }
    expect(began).toBe(true);
    expect(c.swingKind).toBe(0);
  });
});

describe('stopping and starting', () => {
  it('does not stutter between walking and standing while keeping pace with a walking Rosa', () => {
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    const player = { x: 0, z: 0 };
    let switches = 0;
    let wasMoving = false;
    for (let t = 0; t < 8; t += DT) {
      player.z -= 5 * DT;
      const before = { ...c.pos };
      stepCompanion(c, ctx({ player: { ...player } }));
      const moving = dist(before, c.pos) > 0.001;
      if (t > 1 && moving !== wasMoving) switches++;
      wasMoving = moving;
    }
    expect(switches).toBeLessThanOrEqual(2);
  });

  it('settles beside Rosa and stays still once she stops', () => {
    const c = createCompanion('p', { x: 0, z: 0 }, north);
    c.pos = { x: 4, z: 4 };
    run(c, 4, { player: { x: 0, z: 0 } });
    const rest = { ...c.pos };
    run(c, 1, { player: { x: 0, z: 0 } });
    expect(dist(c.pos, rest)).toBeLessThan(0.01);
    expect(dist(c.pos, followSpot({ x: 0, z: 0 }, north))).toBeLessThan(COMPANION.startDistance);
  });
});
