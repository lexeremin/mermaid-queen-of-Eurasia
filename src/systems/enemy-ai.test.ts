import { describe, expect, it } from 'vitest';
import { ENEMIES, LEASH_DISTANCE } from '@/data/enemies';
import type { CollisionWorld } from '@/systems/collision';
import {
  charmEnemy,
  createEnemy,
  damageEnemy,
  respawnEnemy,
  standDown,
  stepEnemy,
  type EnemyAction,
  type EnemyContext,
} from '@/systems/enemy-ai';

const world: CollisionWorld = {
  bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
  colliders: [],
};
const ctx = (player: { x: number; z: number }, time = 0, alive = true): EnemyContext => ({
  player,
  playerAlive: alive,
  time,
  world,
});
const DT = 1 / 60;

function run(
  enemy: ReturnType<typeof createEnemy>,
  c: EnemyContext,
  seconds: number,
): EnemyAction[] {
  const actions: EnemyAction[] = [];
  for (let t = 0; t < seconds; t += DT) {
    const a = stepEnemy(enemy, c, DT);
    if (a) actions.push(a);
  }
  return actions;
}

describe('enemy AI', () => {
  it('stays idle until the player is inside the aggro range', () => {
    const e = createEnemy('e', 'paperWisp', { x: 0, z: 0 });
    run(e, ctx({ x: 20, z: 0 }), 1);
    expect(e.state).toBe('idle');
    run(e, ctx({ x: 6, z: 0 }), 0.1);
    expect(e.state).toBe('chase');
  });

  it('chases at its own speed and faces the player', () => {
    const e = createEnemy('e', 'paperWisp', { x: 0, z: 0 });
    run(e, ctx({ x: 8, z: 0 }), 0.5);
    expect(e.pos.x).toBeGreaterThan(1.5);
    expect(e.pos.x).toBeLessThan(0.5 * ENEMIES.paperWisp.speed + 0.5);
    expect(e.facing.x).toBeCloseTo(1);
  });

  it('winds up, then strikes once with the melee damage, then recovers', () => {
    const e = createEnemy('e', 'stampGolem', { x: 0, z: 0 });
    const c = ctx({ x: 2, z: 0 });
    e.state = 'chase';
    const actions = run(e, c, 0.9);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ kind: 'melee', damage: ENEMIES.stampGolem.damage });
    run(e, c, 0.3);
    expect(e.state).toBe('recover');
  });

  it('a stamp golem telegraphs for its whole windup before striking', () => {
    const e = createEnemy('e', 'stampGolem', { x: 0, z: 0 });
    e.state = 'chase';
    const c = ctx({ x: 1.8, z: 0 });
    stepEnemy(e, c, DT);
    expect(e.state).toBe('windup');
    const early = run(e, c, ENEMIES.stampGolem.windup - 0.1);
    expect(early).toHaveLength(0);
    expect(e.state).toBe('windup');
  });

  it('a ranged enemy keeps its distance and fires a projectile toward the player', () => {
    const e = createEnemy('e', 'memoThrower', { x: 0, z: 0 });
    e.state = 'chase';
    const c = ctx({ x: 2, z: 0 });
    run(e, c, 1);
    expect(e.pos.x).toBeLessThan(0);
    const e2 = createEnemy('e2', 'memoThrower', { x: 0, z: 0 });
    e2.state = 'chase';
    const shots = run(e2, ctx({ x: 6.5, z: 0 }), 1.2);
    expect(shots.length).toBeGreaterThanOrEqual(1);
    expect(shots[0]).toMatchObject({ kind: 'projectile', damage: ENEMIES.memoThrower.damage });
    if (shots[0]?.kind === 'projectile') expect(shots[0].dir.x).toBeGreaterThan(0.9);
  });

  it('damage interrupts light enemies but a windup golem has armor', () => {
    const wisp = createEnemy('w', 'paperWisp', { x: 0, z: 0 });
    wisp.state = 'windup';
    wisp.timer = 0.2;
    damageEnemy(wisp, 5, { x: 1, z: 0 }, 2, 0);
    expect(wisp.state).toBe('stunned');
    const golem = createEnemy('g', 'stampGolem', { x: 0, z: 0 });
    golem.state = 'windup';
    golem.timer = 0.5;
    damageEnemy(golem, 5, { x: 1, z: 0 }, 2, 0);
    expect(golem.state).toBe('windup');
    expect(golem.hp).toBe(ENEMIES.stampGolem.maxHp - 5);
  });

  it('knockback moves the enemy and heavy enemies resist it', () => {
    const wisp = createEnemy('w', 'paperWisp', { x: 0, z: 0 });
    const golem = createEnemy('g', 'stampGolem', { x: 0, z: 0 });
    damageEnemy(wisp, 1, { x: 1, z: 0 }, 5, 0);
    damageEnemy(golem, 1, { x: 1, z: 0 }, 5, 0);
    run(wisp, ctx({ x: -50, z: 0 }), 0.4);
    run(golem, ctx({ x: -50, z: 0 }), 0.4);
    expect(wisp.pos.x).toBeGreaterThan(golem.pos.x);
    expect(golem.pos.x).toBeGreaterThan(0);
  });

  it('dies at zero health, reports the kill once, and respawns full', () => {
    const e = createEnemy('e', 'paperWisp', { x: 3, z: 3 });
    expect(damageEnemy(e, 10, { x: 1, z: 0 }, 1, 0)).toBe(false);
    expect(damageEnemy(e, 100, { x: 1, z: 0 }, 1, 0)).toBe(true);
    expect(e.state).toBe('dead');
    expect(damageEnemy(e, 100, { x: 1, z: 0 }, 1, 0)).toBe(false);
    run(e, ctx({ x: 3, z: 3 }), 2);
    expect(e.deadFor).toBeGreaterThan(1.9);
    respawnEnemy(e);
    expect(e.hp).toBe(ENEMIES.paperWisp.maxHp);
    expect(e.state).toBe('idle');
    expect(e.pos).toEqual({ x: 3, z: 3 });
  });

  it('a lovestruck enemy does nothing until the charm ends', () => {
    const e = createEnemy('e', 'stampGolem', { x: 0, z: 0 });
    charmEnemy(e, 5);
    const actions = run(e, ctx({ x: 1.5, z: 0 }, 1), 2);
    expect(actions).toHaveLength(0);
    expect(e.state).toBe('lovestruck');
    expect(e.pos).toEqual({ x: 0, z: 0 });
    stepEnemy(e, ctx({ x: 1.5, z: 0 }, 5.1), DT);
    expect(e.state).toBe('idle');
  });

  it('gives up when the player runs away and heals at home', () => {
    const e = createEnemy('e', 'paperWisp', { x: 0, z: 0 });
    e.state = 'chase';
    e.pos = { x: 6, z: 0 };
    e.hp = 5;
    run(e, ctx({ x: 200, z: 0 }), 0.1);
    expect(e.state).toBe('returning');
    run(e, ctx({ x: 200, z: 0 }), 4);
    expect(e.state).toBe('idle');
    expect(Math.hypot(e.pos.x, e.pos.z)).toBeLessThan(0.5);
    expect(e.hp).toBeGreaterThan(5);
  });

  it('is leashed to its spawn', () => {
    const e = createEnemy('e', 'paperWisp', { x: 0, z: 0 });
    e.state = 'chase';
    e.pos = { x: LEASH_DISTANCE + 1, z: 0 };
    stepEnemy(e, ctx({ x: LEASH_DISTANCE + 5, z: 0 }), DT);
    expect(e.state).toBe('returning');
  });

  it('stands down when told to and ignores a fainted player', () => {
    const e = createEnemy('e', 'paperWisp', { x: 0, z: 0 });
    e.state = 'chase';
    standDown(e);
    expect(e.state).toBe('returning');
    const f = createEnemy('f', 'paperWisp', { x: 0, z: 0 });
    run(f, ctx({ x: 1, z: 0 }, 0, false), 1);
    expect(f.state).toBe('idle');
  });
});
