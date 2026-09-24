import { describe, expect, it } from 'vitest';
import { ENEMIES } from '@/data/enemies';
import { AURA, DASH, HURT_INVULN, MAX_HP, MAX_MANA, SPELL, TRIDENT } from '@/systems/abilities';
import { BASE_STATS } from '@/systems/progression';
import type { CollisionWorld } from '@/systems/collision';
import {
  createCombatState,
  revive,
  stepCombat,
  type CombatActions,
  type CombatParams,
  type CombatState,
} from '@/systems/combat';

const DT = 1 / 60;
const world: CollisionWorld = {
  bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
  colliders: [],
};
const NONE: CombatActions = { attack: false, dash: false, aura: false, spell: false };
const north = { x: 0, z: -1 };

function step(
  s: CombatState,
  over: Omit<Partial<CombatParams>, 'actions'> & { actions?: Partial<CombatActions> } = {},
) {
  const params: CombatParams = {
    dt: DT,
    playerPos: { x: 0, z: 0 },
    playerFacing: north,
    move: { x: 0, z: 0 },
    npcs: [],
    world,
    ...over,
    actions: { ...NONE, ...over.actions },
  };
  return stepCombat(s, params);
}

function run(s: CombatState, seconds: number, over: Parameters<typeof step>[1] = {}) {
  const events = [] as ReturnType<typeof step>['events'];
  for (let t = 0; t < seconds; t += DT) events.push(...step(s, over).events);
  return events;
}

const wisp = (x: number, z: number) => ({ id: `w${x}_${z}`, kind: 'tycoon' as const, x, z });

describe('trident attack', () => {
  it('damages enemies in front, not behind, and starts the cooldown', () => {
    const s = createCombatState([wisp(0, -1.6), wisp(0, 1.6)]);
    for (const e of s.enemies) e.state = 'blinded';
    for (const e of s.enemies) e.blindedUntil = 99;
    step(s, { actions: { attack: true } });
    expect(s.enemies[0]?.hp).toBe(ENEMIES.tycoon.maxHp - TRIDENT.damage);
    expect(s.enemies[1]?.hp).toBe(ENEMIES.tycoon.maxHp);
    expect(s.cooldowns.attack).toBeGreaterThan(0.4);
    step(s, { actions: { attack: true } });
    expect(s.enemies[0]?.hp).toBe(ENEMIES.tycoon.maxHp - TRIDENT.damage);
  });

  it('aim assist turns the strike toward a nearby enemy off to the side', () => {
    const s = createCombatState([wisp(2.0, -1.0)]);
    s.enemies[0]!.state = 'blinded';
    s.enemies[0]!.blindedUntil = 99;
    const frame = step(s, { actions: { attack: true } });
    expect(s.enemies[0]?.hp).toBeLessThan(ENEMIES.tycoon.maxHp);
    expect(frame.faceOverride?.x).toBeGreaterThan(0.5);
    expect(frame.cancelWalk).toBe(true);
  });

  it('turns to hit an enemy right behind her, but not a distant one behind her', () => {
    const near = createCombatState([wisp(0, 1.8)]);
    near.enemies[0]!.state = 'blinded';
    near.enemies[0]!.blindedUntil = 99;
    const frame = step(near, { actions: { attack: true } });
    expect(near.enemies[0]?.hp).toBeLessThan(ENEMIES.tycoon.maxHp);
    expect(frame.faceOverride?.z).toBeGreaterThan(0.9);
    const far = createCombatState([wisp(0, 3.2)]);
    far.enemies[0]!.state = 'blinded';
    far.enemies[0]!.blindedUntil = 99;
    step(far, { actions: { attack: true } });
    expect(far.enemies[0]?.hp).toBe(ENEMIES.tycoon.maxHp);
  });

  it('slows the player briefly and reports a kill once', () => {
    const s = createCombatState([wisp(0, -1.2)]);
    s.enemies[0]!.hp = 5;
    const frame = step(s, { actions: { attack: true } });
    expect(frame.events).toContainEqual(
      expect.objectContaining({ type: 'enemyDefeated', kind: 'tycoon', x: 0, z: -1.2 }),
    );
    expect(frame.moveScale).toBeLessThan(1);
    expect(s.kills).toBe(1);
    expect(run(s, 1).filter((e) => e.type === 'enemyDefeated')).toHaveLength(0);
  });
});

describe('dash', () => {
  it('moves along the input direction at dash speed for its duration and grants invulnerability', () => {
    const s = createCombatState();
    const frame = step(s, { move: { x: 1, z: 0 }, actions: { dash: true } });
    expect(frame.moveOverride?.x).toBeGreaterThan(1);
    expect(s.invuln).toBeGreaterThanOrEqual(DASH.invuln - 0.05);
    let travelled = frame.moveOverride!.x;
    for (let t = DT; t < DASH.duration + DT; t += DT) {
      const f = step(s, { move: { x: 1, z: 0 } });
      if (f.moveOverride) travelled += f.moveOverride.x;
    }
    const metres = (travelled * 5) / 60;
    expect(metres).toBeGreaterThan(DASH.distance * 0.85);
    expect(metres).toBeLessThan(DASH.distance * 1.2);
    expect(s.dash.active).toBe(false);
  });

  it('dashes along the facing when standing still and respects its cooldown', () => {
    const s = createCombatState();
    const frame = step(s, { actions: { dash: true } });
    expect(frame.moveOverride?.z).toBeLessThan(0);
    run(s, 0.3);
    step(s, { actions: { dash: true } });
    expect(s.dash.active).toBe(false);
  });

  it('a dashing player is not hurt', () => {
    const s = createCombatState([{ id: 'g', kind: 'speaker', x: 0, z: -1.5 }]);
    s.enemies[0]!.state = 'windup';
    s.enemies[0]!.timer = 0.01;
    s.enemies[0]!.attackDir = north;
    step(s, { actions: { dash: true } });
    run(s, 0.1);
    expect(s.hp).toBe(MAX_HP);
  });
});

describe('mermaid aura', () => {
  it('costs mana, expands, and charms NPCs and enemies as the rings reach them', () => {
    const s = createCombatState([wisp(6, 0)]);
    const npcs = [
      { id: 'near', pos: { x: 2, z: 0 } },
      { id: 'far', pos: { x: 7.5, z: 0 } },
    ];
    step(s, { npcs, actions: { aura: true } });
    expect(s.mana).toBeCloseTo(MAX_MANA - 30, 0);
    const events = run(s, 0.6, { npcs });
    expect(s.charmed.near).toBeGreaterThan(s.time);
    expect(s.charmed.far).toBeUndefined();
    expect(events).toContainEqual({ type: 'npcCharmed', id: 'near' });
    run(s, AURA.duration, { npcs });
    expect(s.charmed.far).toBeGreaterThan(0);
    expect(s.enemies[0]?.state).toBe('blinded');
    expect(s.aura.active).toBe(false);
  });

  it('charm wears off', () => {
    const s = createCombatState();
    const npcs = [{ id: 'a', pos: { x: 1, z: 0 } }];
    step(s, { npcs, actions: { aura: true } });
    run(s, 0.3, { npcs });
    expect(s.charmed.a).toBeDefined();
    run(s, AURA.npcCharm + 1, { npcs });
    expect(s.charmed.a).toBeUndefined();
  });

  it('needs enough mana', () => {
    const s = createCombatState();
    s.mana = 10;
    step(s, { actions: { aura: true } });
    expect(s.aura.active).toBe(false);
    expect(s.mana).toBeGreaterThanOrEqual(10);
  });

  it("blinded enemies' swings miss unless Rosa is practically touching them", () => {
    const far = createCombatState([{ id: 'g', kind: 'speaker', x: 0, z: -1.6 }]);
    step(far, { actions: { aura: true } });
    run(far, 0.3);
    expect(far.enemies[0]?.state).toBe('blinded');
    far.enemies[0]!.wander = { x: 0, z: -1 };
    far.enemies[0]!.wanderTimer = 99;
    far.enemies[0]!.swingTimer = 0.01;
    run(far, 1.0);
    expect(far.hp).toBe(MAX_HP);

    const close = createCombatState([{ id: 'g', kind: 'speaker', x: 0, z: -0.6 }]);
    close.enemies[0]!.state = 'blinded';
    close.enemies[0]!.blindedUntil = 99;
    close.enemies[0]!.wander = { x: 0, z: -1 };
    close.enemies[0]!.wanderTimer = 99;
    close.enemies[0]!.swingTimer = 0.01;
    run(close, 0.2);
    expect(close.hp).toBe(MAX_HP - ENEMIES.speaker.damage);
  });
});

describe('tide surge', () => {
  it('hits everything in the ring, knocks back, and costs mana', () => {
    const s = createCombatState([wisp(3, 0), wisp(-3, 1), wisp(9, 0)]);
    for (const e of s.enemies) {
      e.state = 'blinded';
      e.blindedUntil = 99;
    }
    step(s, { actions: { spell: true } });
    expect(s.enemies[0]?.hp).toBe(
      ENEMIES.tycoon.maxHp - SPELL.damage > 0 ? ENEMIES.tycoon.maxHp - SPELL.damage : 0,
    );
    expect(s.enemies[1]?.state).toBe('dead');
    expect(s.enemies[2]?.hp).toBe(ENEMIES.tycoon.maxHp);
    expect(s.mana).toBeCloseTo(MAX_MANA - 35, 0);
    expect(s.effects.some((e) => e.type === 'ring')).toBe(true);
  });
});

describe('taking damage', () => {
  it('a melee hit hurts once, then grants brief invulnerability', () => {
    const s = createCombatState([{ id: 'g', kind: 'speaker', x: 0, z: -1.5 }]);
    s.enemies[0]!.state = 'chase';
    const events = run(s, 1);
    expect(events.filter((e) => e.type === 'playerHurt')).toHaveLength(1);
    expect(s.hp).toBe(MAX_HP - ENEMIES.speaker.damage);
    expect(HURT_INVULN).toBeGreaterThan(0);
  });

  it('projectiles travel, hit the player, and stop at walls', () => {
    const s = createCombatState([{ id: 'm', kind: 'demagogue', x: 0, z: -6.5 }]);
    s.enemies[0]!.state = 'chase';
    run(s, 2.2);
    expect(s.hp).toBe(MAX_HP - ENEMIES.demagogue.damage);
    const walled: CollisionWorld = {
      ...world,
      colliders: [{ kind: 'box', cx: 0, cz: -3.5, hx: 3, hz: 0.3 }],
    };
    const s2 = createCombatState([{ id: 'm', kind: 'demagogue', x: 0, z: -6.5 }]);
    s2.enemies[0]!.state = 'chase';
    run(s2, 2.2, { world: walled });
    expect(s2.hp).toBe(MAX_HP);
    expect(s2.projectiles).toHaveLength(0);
  });

  it('faints at zero health, enemies stand down, and reviving restores her', () => {
    const s = createCombatState([wisp(0, -0.9)]);
    s.hp = 4;
    s.enemies[0]!.state = 'chase';
    const events = run(s, 1);
    expect(events).toContainEqual({ type: 'playerDowned' });
    expect(s.downed).toBe(true);
    expect(['returning', 'idle']).toContain(s.enemies[0]?.state);
    run(s, 2);
    expect(s.hp).toBe(0);
    step(s, { actions: { attack: true } });
    expect(s.cooldowns.attack).toBe(0);
    revive(s);
    expect(s.downed).toBe(false);
    expect(s.hp).toBe(MAX_HP * 0.6);
    expect(s.mana).toBe(MAX_MANA);
    expect(s.invuln).toBeGreaterThan(1);
  });
});

describe('regeneration and respawn', () => {
  it('regenerates mana and, after a quiet spell, health', () => {
    const s = createCombatState();
    s.mana = 0;
    s.hp = 50;
    s.sinceHurt = 0;
    run(s, 3);
    expect(s.mana).toBeGreaterThan(14);
    expect(s.hp).toBe(50);
    run(s, 12);
    expect(s.hp).toBeGreaterThan(50);
  });

  it('a dead enemy respawns after the respawn time', () => {
    const s = createCombatState([wisp(20, 0)]);
    s.enemies[0]!.hp = 1;
    step(s, { playerPos: { x: 20, z: 1.2 }, playerFacing: north, actions: { attack: true } });
    expect(s.enemies[0]?.state).toBe('dead');
    run(s, 41, { playerPos: { x: 90, z: 90 } });
    expect(s.enemies[0]?.state).not.toBe('dead');
    expect(s.enemies[0]?.hp).toBe(ENEMIES.tycoon.maxHp);
  });
});

describe('player stats', () => {
  const strong = {
    ...BASE_STATS,
    maxHp: 150,
    maxMana: 140,
    damageMult: 1.5,
    reduction: 0.25,
    manaRegen: 8,
  };

  it('scales attack and spell damage by the damage multiplier', () => {
    const a = createCombatState([wisp(0, -1.6)]);
    a.enemies[0]!.state = 'blinded';
    a.enemies[0]!.blindedUntil = 99;
    step(a, { actions: { attack: true }, stats: strong });
    expect(a.enemies[0]?.hp).toBe(ENEMIES.tycoon.maxHp - Math.round(TRIDENT.damage * 1.5));
    const b = createCombatState([wisp(2, 0)]);
    b.enemies[0]!.state = 'blinded';
    b.enemies[0]!.blindedUntil = 99;
    step(b, { actions: { spell: true }, stats: strong });
    expect(b.enemies[0]?.hp).toBe(
      Math.max(0, ENEMIES.tycoon.maxHp - Math.round(SPELL.damage * 1.5)),
    );
  });

  it('damage reduction lowers hits but never below 1', () => {
    const s = createCombatState([{ id: 'g', kind: 'speaker', x: 0, z: -1.5 }]);
    s.hp = 150;
    s.enemies[0]!.state = 'chase';
    run(s, 1, { stats: strong });
    expect(s.hp).toBeCloseTo(150 - Math.round(ENEMIES.speaker.damage * 0.75), 0);
    const tiny = createCombatState([{ id: 'g', kind: 'speaker', x: 0, z: -0.6 }]);
    tiny.enemies[0]!.state = 'blinded';
    tiny.enemies[0]!.blindedUntil = 99;
    tiny.enemies[0]!.wander = { x: 0, z: -1 };
    tiny.enemies[0]!.wanderTimer = 99;
    tiny.enemies[0]!.swingTimer = 0.01;
    run(tiny, 0.2, { stats: { ...strong, reduction: 0.6 } });
    expect(tiny.hp).toBeCloseTo(MAX_HP - Math.round(ENEMIES.speaker.damage * 0.4), 0);
  });

  it('regenerates mana faster and up to the higher maximum; clamps down when gear is removed', () => {
    const s = createCombatState();
    s.mana = 100;
    run(s, 6, { stats: strong });
    expect(s.mana).toBeCloseTo(140, 0);
    run(s, 0.1, { stats: BASE_STATS });
    expect(s.mana).toBeLessThanOrEqual(100);
  });

  it('reviving uses the current maximums', () => {
    const s = createCombatState();
    s.downed = true;
    revive(s, strong);
    expect(s.hp).toBe(90);
    expect(s.mana).toBe(140);
  });
});
