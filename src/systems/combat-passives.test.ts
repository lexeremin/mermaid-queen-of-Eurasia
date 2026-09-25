import { describe, expect, it } from 'vitest';
import { ENEMIES } from '@/data/enemies';
import { ARCANE_BLAST, LIGHT_BEAMS, SEA_WAVE, SHARKS, TRIDENT_COMBO } from '@/systems/abilities';
import type { CollisionWorld } from '@/systems/collision';
import {
  createCombatState,
  stepCombat,
  type CombatActions,
  type CombatParams,
  type CombatState,
} from '@/systems/combat';
import { computeStats } from '@/systems/progression';

const DT = 1 / 60;
const world: CollisionWorld = {
  bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
  colliders: [],
};
const NONE: CombatActions = { attack: false, blink: false, aura: false, spell: false };
const east = { x: 1, z: 0 };
const stats = (level: number) => computeStats(level, { weapon: null, outfit: null, charm: null });

function step(
  s: CombatState,
  level: number,
  actions: Partial<CombatActions> = {},
  over: Partial<CombatParams> = {},
) {
  return stepCombat(s, {
    dt: DT,
    playerPos: { x: 0, z: 0 },
    playerFacing: east,
    move: { x: 0, z: 0 },
    npcs: [],
    world,
    level,
    stats: stats(level),
    ...over,
    actions: { ...NONE, ...actions },
  });
}

function run(s: CombatState, level: number, seconds: number, actions: Partial<CombatActions> = {}) {
  const events = [] as ReturnType<typeof step>['events'];
  for (let t = 0; t < seconds; t += DT)
    events.push(...step(s, level, t === 0 ? actions : {}).events);
  return events;
}

const still = (s: CombatState) => {
  for (const e of s.enemies) {
    e.state = 'blinded';
    e.blindedUntil = 999;
  }
};
const dummy = (id: string, x: number, z: number) => ({ id, kind: 'tycoon' as const, x, z });

describe('abilities that are not unlocked yet', () => {
  it('do nothing and cost nothing', () => {
    const s = createCombatState();
    const dest = { x: 8, z: 0 };
    const frame = step(
      s,
      1,
      { aura: true, spell: true, blink: true },
      { resolveBlink: () => dest },
    );
    expect(frame.blinkTo).toBeNull();
    expect(frame.events).toEqual([]);
    expect(s.aura.active).toBe(false);
    expect(s.mana).toBeGreaterThanOrEqual(stats(1).maxMana - 1);
    expect(s.cooldowns.spell).toBe(0);
  });

  it('start working on the level that opens them', () => {
    for (const [level, action, ability] of [
      [3, 'aura', 'aura'],
      [6, 'blink', 'blink'],
      [10, 'spell', 'spell'],
    ] as const) {
      const before = createCombatState();
      const early = step(
        before,
        level - 1,
        { [action]: true },
        { resolveBlink: () => ({ x: 5, z: 0 }) },
      );
      expect(
        early.events.some((e) => e.type === 'cast'),
        `${ability} at ${level - 1}`,
      ).toBe(false);
      const now = createCombatState();
      const frame = step(now, level, { [action]: true }, { resolveBlink: () => ({ x: 5, z: 0 }) });
      expect(frame.events).toContainEqual({ type: 'cast', ability });
    }
  });

  it('the trident is always there', () => {
    const frame = step(createCombatState(), 1, { attack: true });
    expect(frame.events).toContainEqual({ type: 'cast', ability: 'attack' });
  });
});

describe('level 20: the sea wave', () => {
  it('rolls out along the swing, hits what it passes once and goes on beyond the trident', () => {
    const s = createCombatState([dummy('near', 5, 0), dummy('far', 7.5, 0), dummy('side', 5, 9)]);
    still(s);
    const events = run(s, 20, 1, { attack: true });
    expect(events).toContainEqual({ type: 'passive', ability: 'attack' });
    const hits = events.filter((e) => e.type === 'enemyHit');
    expect(hits.length).toBe(2);
    expect(s.enemies[0]!.hp).toBeLessThan(ENEMIES.tycoon.maxHp);
    expect(s.enemies[1]!.hp).toBeLessThan(ENEMIES.tycoon.maxHp);
    expect(s.enemies[2]!.hp).toBe(ENEMIES.tycoon.maxHp);
    expect(s.seaWaves).toHaveLength(0);
  });

  it('is not there before level 20', () => {
    const s = createCombatState([dummy('near', 6, 0)]);
    still(s);
    run(s, 19, 1, { attack: true });
    expect(s.enemies[0]!.hp).toBe(ENEMIES.tycoon.maxHp);
  });

  it('stops at a wall', () => {
    const wall: CollisionWorld = {
      ...world,
      colliders: [{ kind: 'box', x: 5, z: 0, hx: 0.5, hz: 3, rot: 0 }] as never,
    };
    const s = createCombatState([dummy('behind', 9, 0)]);
    still(s);
    for (let t = 0; t < 1; t += DT) step(s, 20, t === 0 ? { attack: true } : {}, { world: wall });
    expect(s.enemies[0]!.hp).toBe(ENEMIES.tycoon.maxHp);
    expect(SEA_WAVE.speed * SEA_WAVE.life).toBeGreaterThan(5);
  });
});

describe('level 30: light beams from the Aura', () => {
  it('sweep around Rosa and hurt what they touch, not too often', () => {
    const s = createCombatState([dummy('a', 4, 0), dummy('b', 0, 4), dummy('c', -4, 0)]);
    still(s);
    run(s, 30, 2.6, { aura: true });
    for (const e of s.enemies) expect(e.hp, e.id).toBeLessThan(ENEMIES.tycoon.maxHp);
    const maxTicks = Math.ceil(2.4 / LIGHT_BEAMS.tick) + 1;
    expect(ENEMIES.tycoon.maxHp - s.enemies[0]!.hp).toBeLessThanOrEqual(
      maxTicks * Math.round(LIGHT_BEAMS.damage * stats(30).damageMult),
    );
  });

  it('are not there at level 29', () => {
    const s = createCombatState([dummy('a', 4, 0)]);
    still(s);
    run(s, 29, 2.6, { aura: true });
    expect(s.enemies[0]!.hp).toBe(ENEMIES.tycoon.maxHp);
  });
});

describe('level 40: sharks from the Surge wave', () => {
  it('leap out of the wave and land outside it, hurting what is there', () => {
    const outside = SHARKS.landFrom * 4.8;
    const s = createCombatState([dummy('out', outside + 1, 0), dummy('far', 30, 0)]);
    still(s);
    // Put the target where a shark will land, whichever way they fan out.
    step(s, 40, { spell: true });
    expect(s.sharks).toHaveLength(SHARKS.count);
    const landing = s.sharks[0]!.to;
    s.enemies[0]!.pos = { x: landing.x, z: landing.z };
    const hpBefore = s.enemies[0]!.hp;
    run(s, 40, 1.5);
    expect(s.sharks).toHaveLength(0);
    expect(s.enemies[0]!.hp).toBeLessThan(hpBefore);
    expect(s.enemies[1]!.hp).toBe(ENEMIES.tycoon.maxHp);
    expect(s.effects.some((e) => e.type === 'splash')).toBe(true);
  });

  it('land further out than the wave reaches', () => {
    const s = createCombatState();
    step(s, 40, { spell: true });
    for (const shark of s.sharks) {
      expect(Math.hypot(shark.to.x, shark.to.z)).toBeGreaterThan(4.8);
    }
  });

  it('are not released before level 40', () => {
    const s = createCombatState();
    step(s, 39, { spell: true });
    expect(s.sharks).toHaveLength(0);
  });
});

describe('level 50: the arcane blast of the Blink', () => {
  it('goes off where Rosa arrives and hurts what is close', () => {
    const dest = { x: 10, z: 0 };
    const s = createCombatState([dummy('close', 12, 0), dummy('far', 20, 0)]);
    still(s);
    const frame = step(s, 50, { blink: true }, { resolveBlink: () => dest });
    expect(frame.events).toContainEqual({ type: 'passive', ability: 'blink' });
    expect(s.effects.some((e) => e.type === 'arcane')).toBe(true);
    expect(s.enemies[0]!.hp).toBeLessThan(ENEMIES.tycoon.maxHp);
    expect(s.enemies[1]!.hp).toBe(ENEMIES.tycoon.maxHp);
    expect(ARCANE_BLAST.radius).toBeGreaterThan(3);
  });

  it('does not happen at level 49', () => {
    const s = createCombatState([dummy('close', 12, 0)]);
    still(s);
    step(s, 49, { blink: true }, { resolveBlink: () => ({ x: 10, z: 0 }) });
    expect(s.enemies[0]!.hp).toBe(ENEMIES.tycoon.maxHp);
  });
});

describe('fainting', () => {
  it('drops the waves and sharks in the air', () => {
    const s = createCombatState();
    step(s, 40, { spell: true });
    step(s, 40, { attack: true });
    expect(s.sharks.length).toBeGreaterThan(0);
    expect(s.seaWaves.length).toBeGreaterThan(0);
    s.hp = 1;
    s.invuln = 0;
    s.projectiles.push({ id: 100, pos: { x: 0, z: 0 }, vel: { x: 0, z: 0 }, damage: 999, age: 0 });
    step(s, 40);
    expect(s.downed).toBe(true);
    expect(s.sharks).toHaveLength(0);
    expect(s.seaWaves).toHaveLength(0);
  });
});

describe('the three-swing auto-attack', () => {
  const swingKinds = (s: CombatState, seconds: number) => {
    const kinds: number[] = [];
    let last = 0;
    for (let t = 0; t < seconds; t += DT) {
      step(s, 1, { attack: true });
      if (s.swing > last) kinds.push(s.swingKind);
      last = s.swing;
    }
    return kinds;
  };
  const wait = (s: CombatState) => {
    let waited = 0;
    while (s.cooldowns.attack > 0) {
      step(s, 1);
      waited += DT;
    }
    return waited;
  };

  it('goes forehand, backhand, finisher and round again while the button is held', () => {
    expect(swingKinds(createCombatState(), 3.2)).toEqual([0, 1, 2, 0, 1, 2]);
  });

  it('starts over after a pause, and the finisher takes longer to follow than the slashes', () => {
    const s = createCombatState();
    step(s, 1, { attack: true });
    expect(s.combo).toBe(1);
    for (let t = 0; t < 1.5; t += DT) step(s, 1);
    step(s, 1, { attack: true });
    expect(s.swingKind).toBe(0);
    const slashGap = wait(s);
    step(s, 1, { attack: true });
    expect(s.swingKind).toBe(1);
    wait(s);
    step(s, 1, { attack: true });
    expect(s.swingKind).toBe(2);
    expect(wait(s)).toBeGreaterThan(slashGap + 0.2);
  });

  it('the finisher hits harder and reaches further, and its cone is narrower', () => {
    const hurt = (kind: number, x: number, z: number) => {
      const s = createCombatState([dummy('d', x, z)]);
      s.enemies[0]!.hp = 1000;
      s.enemies[0]!.state = 'blinded';
      s.enemies[0]!.blindedUntil = 999;
      s.combo = kind;
      s.comboIdle = 0;
      step(s, 1, { attack: true }, { playerFacing: east });
      return 1000 - s.enemies[0]!.hp;
    };
    expect(hurt(2, 4.4, 0)).toBeGreaterThan(hurt(0, 3.0, 0) * 1.5);
    expect(hurt(0, 4.4, 0)).toBe(0);
    expect(TRIDENT_COMBO[2].halfAngle).toBeLessThan(TRIDENT_COMBO[0].halfAngle);
    expect(TRIDENT_COMBO[1].halfAngle).toBeGreaterThan(TRIDENT_COMBO[0].halfAngle);
    expect(TRIDENT_COMBO[2].knockback).toBeGreaterThan(TRIDENT_COMBO[0].knockback);
  });

  it('marks each swing on its slash effect', () => {
    const s = createCombatState();
    const styles = new Set<number>();
    for (let t = 0; t < 3.2; t += DT) {
      step(s, 1, { attack: true });
      for (const e of s.effects) if (e.type === 'arc') styles.add(e.style);
    }
    expect([...styles].sort()).toEqual([0, 1, 2]);
  });
});
