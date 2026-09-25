import { describe, expect, it } from 'vitest';
import { ENEMIES, RESPAWN_SECONDS } from '@/data/enemies';
import {
  AURA,
  DASH,
  HURT_INVULN,
  MAX_HP,
  MAX_MANA,
  SPELL,
  SWING_TIME,
  TRIDENT,
} from '@/systems/abilities';
import { ABILITIES } from '@/systems/abilities';
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
    const far = createCombatState([wisp(0, 4.4)]);
    far.enemies[0]!.state = 'blinded';
    far.enemies[0]!.blindedUntil = 99;
    step(far, { actions: { attack: true } });
    expect(far.enemies[0]?.hp).toBe(ENEMIES.tycoon.maxHp);
  });

  it('reaches an enemy about three and a half metres in front, and no further', () => {
    expect(TRIDENT.range).toBeGreaterThanOrEqual(3.3);
    const inReach = createCombatState([wisp(0, -(TRIDENT.range - 0.3))]);
    inReach.enemies[0]!.state = 'blinded';
    inReach.enemies[0]!.blindedUntil = 99;
    step(inReach, { actions: { attack: true } });
    expect(inReach.enemies[0]?.hp).toBeLessThan(ENEMIES.tycoon.maxHp);
    const outOfReach = createCombatState([wisp(0, -(TRIDENT.range + 1.2))]);
    outOfReach.enemies[0]!.state = 'blinded';
    outOfReach.enemies[0]!.blindedUntil = 99;
    step(outOfReach, { actions: { attack: true } });
    expect(outOfReach.enemies[0]?.hp).toBe(ENEMIES.tycoon.maxHp);
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
    expect(s.effects.some((e) => e.type === 'wave')).toBe(true);
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

describe('spell looks', () => {
  it('starts a trident swing that runs out, even with no enemy in reach', () => {
    const s = createCombatState();
    expect(s.swing).toBe(0);
    step(s, { actions: { attack: true } });
    expect(s.swing).toBeGreaterThan(SWING_TIME - 0.05);
    run(s, SWING_TIME + 0.1);
    expect(s.swing).toBe(0);
  });

  it('turns Rosa into a mermaid for the whole Aura song and a moment after', () => {
    const s = createCombatState();
    step(s, { actions: { aura: true } });
    expect(s.mermaid).toBeGreaterThan(AURA.duration);
    run(s, AURA.duration);
    expect(s.mermaid).toBeGreaterThan(0);
    run(s, AURA.mermaidTail + 0.1);
    expect(s.mermaid).toBe(0);
    expect(s.effects.some((e) => e.type === 'bubbles')).toBe(false);
  });

  it('turns Rosa into a mermaid while casting Tide Surge and back afterwards', () => {
    const s = createCombatState();
    step(s, { actions: { spell: true } });
    expect(s.mermaid).toBeGreaterThan(SPELL.mermaid - 0.05);
    expect(s.effects.filter((e) => e.type === 'bubbles')).toHaveLength(1);
    run(s, SPELL.mermaid + 0.1);
    expect(s.mermaid).toBe(0);
  });

  it('does not change form when the spell cannot be cast', () => {
    const s = createCombatState();
    s.mana = 0;
    step(s, { actions: { spell: true, aura: true } });
    expect(s.mermaid).toBe(0);
  });

  it('bursts water bubbles where the dash starts and where it ends', () => {
    const s = createCombatState();
    step(s, { actions: { dash: true }, move: { x: 1, z: 0 } });
    expect(s.effects.filter((e) => e.type === 'bubbles')).toHaveLength(1);
    run(s, DASH.duration + 0.1, { move: { x: 1, z: 0 } });
    expect(s.effects.filter((e) => e.type === 'bubbles')).toHaveLength(2);
  });

  it('fainting and getting up clear the temporary looks', () => {
    const s = createCombatState();
    step(s, { actions: { aura: true, attack: true } });
    s.downed = true;
    revive(s);
    expect(s.mermaid).toBe(0);
    expect(s.swing).toBe(0);
  });
});

describe('cast events and companion', () => {
  it('reports each ability Rosa actually uses', () => {
    const s = createCombatState();
    const abilities = (events: { type: string; ability?: string }[]) =>
      events.filter((e) => e.type === 'cast').map((e) => e.ability);
    expect(abilities(step(s, { actions: { attack: true } }).events)).toEqual(['attack']);
    expect(abilities(step(s, { actions: { dash: true } }).events)).toEqual(['dash']);
    expect(abilities(step(s, { actions: { aura: true, spell: true } }).events).sort()).toEqual([
      'aura',
      'spell',
    ]);
    s.mana = 0;
    s.cooldowns.attack = 0;
    s.dash.active = false;
    expect(abilities(step(s, { actions: { attack: true, spell: true } }).events)).toEqual([
      'attack',
    ]);
  });

  it('a companion fights enemies near Rosa and the kill counts for her', () => {
    const s = createCombatState([{ id: 'e1', kind: 'tycoon', x: 0, z: -4 }]);
    s.enemies[0]!.state = 'blinded';
    s.enemies[0]!.blindedUntil = 999;
    s.enemies[0]!.hp = 8;
    const events = run(s, 5, { companion: { id: 'mikhalych' } });
    expect(s.companion?.id).toBe('mikhalych');
    expect(events.some((e) => e.type === 'enemyDefeated')).toBe(true);
    expect(s.kills).toBe(1);
  });

  it('removes the companion when he stops following', () => {
    const s = createCombatState();
    step(s, { companion: { id: 'mikhalych' } });
    expect(s.companion).not.toBeNull();
    step(s, { companion: null });
    expect(s.companion).toBeNull();
  });

  it('keeps a companion out of fights while Rosa is down', () => {
    const s = createCombatState([{ id: 'e1', kind: 'tycoon', x: 0, z: -3 }]);
    s.enemies[0]!.state = 'blinded';
    s.enemies[0]!.blindedUntil = 999;
    s.downed = true;
    run(s, 3, { companion: { id: 'mikhalych' } });
    expect(s.enemies[0]?.hp).toBe(ENEMIES.tycoon.maxHp);
  });
});

describe('hit events', () => {
  it('reports each hit that lands, and none when the swing misses', () => {
    const s = createCombatState([{ id: 'e', kind: 'tycoon', x: 0, z: -1.6 }]);
    s.enemies[0]!.state = 'blinded';
    s.enemies[0]!.blindedUntil = 99;
    const hits = (events: { type: string }[]) => events.filter((e) => e.type === 'enemyHit').length;
    expect(hits(step(s, { actions: { attack: true } }).events)).toBe(1);
    const empty = createCombatState();
    expect(hits(step(empty, { actions: { attack: true } }).events)).toBe(0);
  });
});

describe('the boss fight', () => {
  const arena = { cx: 0, cz: -10, hx: 12, hz: 12 };
  const fight = () =>
    createCombatState([
      { id: 'boss', kind: 'boss', x: 0, z: -12 },
      { id: 'h1', kind: 'tycoon', x: 6, z: -12, dormant: true },
      { id: 'h2', kind: 'demagogue', x: -6, z: -12, dormant: true },
      { id: 'h3', kind: 'tycoon', x: 6, z: -6, dormant: true },
    ]);
  const boss = (s: CombatState) => s.enemies.find((e) => e.kind === 'boss')!;

  it('keeps dormant helpers out of every hit and ignores them for aim', () => {
    const s = fight();
    const helper = s.enemies[1]!;
    helper.pos = { x: 0, z: -1.6 };
    step(s, { actions: { attack: true } });
    expect(helper.hp).toBe(ENEMIES.tycoon.maxHp);
    expect(helper.dormant).toBe(true);
  });

  it('marks a telegraphed circle and hurts Rosa only if she stays in it', () => {
    const s = fight();
    let hazard = s.hazards[0];
    for (let t = 0; t < 3 && !hazard; t += DT) {
      step(s, { arena, playerPos: { x: 0, z: -4 } });
      hazard = s.hazards[0];
    }
    expect(hazard).toBeDefined();
    expect(hazard!.hit).toBe(false);
    expect(s.hp).toBe(MAX_HP);

    const mark = (x: number) => ({
      id: 999,
      shape: { kind: 'circle', x, z: 0, r: 3 } as const,
      delay: 0.5,
      age: 0,
      damage: 25,
      hit: false,
    });
    const standing = createCombatState();
    standing.hazards.push(mark(0));
    const events = run(standing, 1);
    expect(events.filter((e) => e.type === 'playerHurt')).toHaveLength(1);
    expect(standing.hp).toBe(MAX_HP - 25);
    expect(standing.hazards).toHaveLength(0);

    const away = createCombatState();
    away.hazards.push(mark(10));
    expect(run(away, 1).some((e) => e.type === 'playerHurt')).toBe(false);
    expect(away.hp).toBe(MAX_HP);
  });

  it('wakes helpers in phase two and takes them down with him', () => {
    const s = fight();
    s.hp = 9999;
    const b = boss(s);
    run(s, 1, { arena, playerPos: { x: 0, z: -6 }, stats: { ...BASE_STATS, maxHp: 9999 } });
    b.hp = ENEMIES.boss.maxHp * 0.5;
    const events = run(s, 20, {
      arena,
      playerPos: { x: 0, z: -6 },
      stats: { ...BASE_STATS, maxHp: 9999 },
    });
    expect(events.some((e) => e.type === 'bossPhase')).toBe(true);
    expect(events.some((e) => e.type === 'bossSummon')).toBe(true);
    expect(s.enemies.filter((e) => e.helper && !e.dormant).length).toBeGreaterThan(0);
    b.state = 'chase';
    b.pos = { x: 0, z: -7 };
    b.hp = 1;
    const kill = run(s, 0.1, {
      arena,
      playerPos: { x: 0, z: -6 },
      actions: { attack: true },
      stats: { ...BASE_STATS, maxHp: 9999 },
    });
    expect(kill.some((e) => e.type === 'enemyDefeated' && e.kind === 'boss')).toBe(true);
    expect(s.enemies.filter((e) => e.helper).every((e) => e.state === 'dead')).toBe(true);
    expect(s.hazards).toHaveLength(0);
  });

  it('never respawns once beaten', () => {
    const s = fight();
    const b = boss(s);
    b.hp = 0;
    b.state = 'dead';
    run(s, 60, { arena });
    expect(b.state).toBe('dead');
  });

  it('Aura blinds him for only a quarter of the usual time', () => {
    const s = fight();
    const b = boss(s);
    s.hp = 9999;
    step(s, { arena, playerPos: { x: 0, z: -8 }, actions: { aura: true } });
    run(s, AURA.duration + 0.2, {
      arena,
      playerPos: { x: 0, z: -8 },
      stats: { ...BASE_STATS, maxHp: 9999 },
    });
    expect(b.blindedUntil - s.time).toBeLessThanOrEqual(AURA.enemyBlind * 0.25 + 0.01);
    expect(b.blindedUntil).toBeGreaterThan(0);
  });
});

describe('teleport', () => {
  const dest = { x: 8, z: 0 };
  const blink = (s: CombatState, resolveTeleport: CombatParams['resolveTeleport'] = () => dest) =>
    step(s, { actions: { teleport: true }, resolveTeleport });

  it('blinks to the destination, costs mana, starts the cooldown and grants a moment of safety', () => {
    const s = createCombatState();
    const frame = blink(s);
    expect(frame.teleportTo).toEqual(dest);
    expect(frame.events).toContainEqual({ type: 'cast', ability: 'teleport' });
    expect(s.mana).toBe(MAX_MANA - ABILITIES.teleport.mana);
    expect(s.cooldowns.teleport).toBeGreaterThan(0);
    expect(s.invuln).toBeGreaterThan(0);
    expect(s.blink).toBeGreaterThan(0);
    expect(s.effects.filter((e) => e.type === 'bubbles')).toHaveLength(2);
  });

  it('is on cooldown afterwards, and needs the mana', () => {
    const s = createCombatState();
    blink(s);
    expect(blink(s).teleportTo).toBeNull();
    const poor = createCombatState();
    poor.mana = 5;
    expect(blink(poor).teleportTo).toBeNull();
  });

  it('is not cast (and costs nothing) when there is nowhere to land', () => {
    const s = createCombatState();
    const frame = blink(s, () => null);
    expect(frame.teleportTo).toBeNull();
    expect(s.mana).toBe(MAX_MANA);
    expect(s.cooldowns.teleport).toBe(0);
  });

  it('cannot be cast while downed', () => {
    const s = createCombatState();
    s.downed = true;
    expect(blink(s).teleportTo).toBeNull();
  });

  it('dodges a boss hazard that lands while the invulnerability lasts', () => {
    const s = createCombatState();
    s.hazards.push({
      id: 1,
      shape: { kind: 'circle', x: 0, z: 0, r: 3 },
      delay: 0.2,
      age: 0,
      damage: 40,
      hit: false,
    });
    blink(s);
    // She has moved away in the game loop, but even standing still the blink's safety window covers the hit.
    const events = run(s, 0.3);
    expect(events.some((e) => e.type === 'playerHurt')).toBe(false);
  });
});

describe('respawning', () => {
  it('surface monsters come back after a while; instanced ones never on their own', () => {
    const s = createCombatState([
      { id: 'a', kind: 'tycoon', x: 20, z: 20 },
      { id: 'b', kind: 'tycoon', x: -20, z: 20, instanced: true },
    ]);
    for (const e of s.enemies) {
      e.hp = 0;
      e.state = 'dead';
    }
    run(s, RESPAWN_SECONDS + 5);
    expect(s.enemies[0]!.state).not.toBe('dead');
    expect(s.enemies[1]!.state).toBe('dead');
  });
});
