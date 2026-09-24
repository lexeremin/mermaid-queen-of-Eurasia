import { ENEMIES, LEASH_DISTANCE, type EnemyDef, type EnemyKind } from '@/data/enemies';
import { directionTo } from '@/systems/combat-math';
import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import type { Vec2 } from '@/utils/vec2';

export type EnemyState =
  | 'idle'
  | 'chase'
  | 'windup'
  | 'attack'
  | 'recover'
  | 'stunned'
  | 'lovestruck'
  | 'returning'
  | 'dead';

export type Enemy = {
  id: string;
  kind: EnemyKind;
  pos: Vec2;
  facing: Vec2;
  spawn: Vec2;
  hp: number;
  state: EnemyState;
  timer: number;
  attackDir: Vec2;
  knock: Vec2;
  charmedUntil: number;
  flash: number;
  deadFor: number;
  strafe: 1 | -1;
  /** Time until which the health bar is shown after taking damage. */
  barUntil: number;
};

export type EnemyContext = {
  player: Vec2;
  playerAlive: boolean;
  time: number;
  world: CollisionWorld;
};

export type EnemyAction =
  | { kind: 'melee'; damage: number; origin: Vec2; range: number }
  | { kind: 'projectile'; from: Vec2; dir: Vec2; damage: number; speed: number };

const ATTACK_TIME = 0.12;
const LUNGE_SPEED_FACTOR = 2.6;
const KNOCK_DECAY = 9;
const RETURN_HEAL_PER_SECOND = 0.25;
const LOSE_INTEREST_FACTOR = 1.8;

export const defOf = (enemy: Pick<Enemy, 'kind'>): EnemyDef => ENEMIES[enemy.kind];

export function createEnemy(id: string, kind: EnemyKind, spawn: Vec2): Enemy {
  return {
    id,
    kind,
    pos: { x: spawn.x, z: spawn.z },
    facing: { x: 0, z: 1 },
    spawn: { x: spawn.x, z: spawn.z },
    hp: ENEMIES[kind].maxHp,
    state: 'idle',
    timer: 0,
    attackDir: { x: 0, z: 1 },
    knock: { x: 0, z: 0 },
    charmedUntil: 0,
    flash: 0,
    deadFor: 0,
    strafe: 1,
    barUntil: 0,
  };
}

/** Back to full health at the spawn point (respawn). */
export function respawnEnemy(enemy: Enemy): void {
  Object.assign(enemy, createEnemy(enemy.id, enemy.kind, enemy.spawn));
}

/** The player is gone or fainted: stand down and head home. */
export function standDown(enemy: Enemy): void {
  if (enemy.state === 'dead') return;
  enemy.state = 'returning';
  enemy.timer = 0;
}

/** Applies damage and knockback. Returns true if this hit killed the enemy. */
export function damageEnemy(
  enemy: Enemy,
  amount: number,
  knockDir: Vec2,
  knockback: number,
  time: number,
): boolean {
  if (enemy.state === 'dead') return false;
  const def = defOf(enemy);
  enemy.hp = Math.max(0, enemy.hp - amount);
  enemy.flash = 0.12;
  enemy.barUntil = time + 4;
  if (enemy.hp <= 0) {
    enemy.state = 'dead';
    enemy.deadFor = 0;
    enemy.knock = { x: knockDir.x * knockback * 0.5, z: knockDir.z * knockback * 0.5 };
    return true;
  }
  const push = knockback * (1 - def.knockbackResist);
  enemy.knock = { x: knockDir.x * push, z: knockDir.z * push };
  const armored = def.knockbackResist >= 0.5 && enemy.state === 'windup';
  if (!armored && enemy.state !== 'lovestruck') {
    enemy.state = 'stunned';
    enemy.timer = 0.3 * (1 - def.knockbackResist);
  }
  return false;
}

export function charmEnemy(enemy: Enemy, until: number): void {
  if (enemy.state === 'dead') return;
  enemy.charmedUntil = until;
  enemy.state = 'lovestruck';
}

const distance = (a: Vec2, b: Vec2): number => Math.hypot(b.x - a.x, b.z - a.z);

function move(enemy: Enemy, dir: Vec2, speed: number, dt: number, world: CollisionWorld): void {
  const def = defOf(enemy);
  enemy.pos = resolveCircle(
    { x: enemy.pos.x + dir.x * speed * dt, z: enemy.pos.z + dir.z * speed * dt },
    def.radius,
    world,
  );
}

/** Advances one enemy by `dt`. Returns an attack when its windup completes. */
export function stepEnemy(enemy: Enemy, ctx: EnemyContext, dt: number): EnemyAction | null {
  const def = defOf(enemy);
  enemy.flash = Math.max(0, enemy.flash - dt);

  if (enemy.state === 'dead') {
    enemy.deadFor += dt;
    if (Math.hypot(enemy.knock.x, enemy.knock.z) > 0.05) {
      enemy.pos = resolveCircle(
        { x: enemy.pos.x + enemy.knock.x * dt, z: enemy.pos.z + enemy.knock.z * dt },
        def.radius,
        ctx.world,
      );
      const k = Math.exp(-KNOCK_DECAY * dt);
      enemy.knock = { x: enemy.knock.x * k, z: enemy.knock.z * k };
    }
    return null;
  }

  if (Math.hypot(enemy.knock.x, enemy.knock.z) > 0.05) {
    enemy.pos = resolveCircle(
      { x: enemy.pos.x + enemy.knock.x * dt, z: enemy.pos.z + enemy.knock.z * dt },
      def.radius,
      ctx.world,
    );
    const k = Math.exp(-KNOCK_DECAY * dt);
    enemy.knock = { x: enemy.knock.x * k, z: enemy.knock.z * k };
  }

  if (enemy.state === 'lovestruck') {
    if (ctx.time >= enemy.charmedUntil) enemy.state = 'idle';
    return null;
  }

  const toPlayer = directionTo(enemy.pos, ctx.player);
  const dPlayer = distance(enemy.pos, ctx.player);

  switch (enemy.state) {
    case 'idle': {
      if (ctx.playerAlive && dPlayer < def.aggroRange) enemy.state = 'chase';
      return null;
    }
    case 'returning': {
      const home = directionTo(enemy.pos, enemy.spawn);
      const dHome = distance(enemy.pos, enemy.spawn);
      enemy.hp = Math.min(def.maxHp, enemy.hp + def.maxHp * RETURN_HEAL_PER_SECOND * dt);
      if (dHome < 0.4) {
        enemy.state = 'idle';
        return null;
      }
      enemy.facing = home;
      move(enemy, home, def.speed, dt, ctx.world);
      if (ctx.playerAlive && dPlayer < def.aggroRange * 0.7 && dHome < LEASH_DISTANCE * 0.5) {
        enemy.state = 'chase';
      }
      return null;
    }
    case 'chase': {
      if (!ctx.playerAlive || dPlayer > def.aggroRange * LOSE_INTEREST_FACTOR) {
        enemy.state = 'returning';
        return null;
      }
      if (distance(enemy.pos, enemy.spawn) > LEASH_DISTANCE) {
        enemy.state = 'returning';
        return null;
      }
      enemy.facing = toPlayer;
      const contact = def.radius + PLAYER_RADIUS;
      if (def.ranged) {
        if (dPlayer < def.preferMin)
          move(enemy, { x: -toPlayer.x, z: -toPlayer.z }, def.speed * 0.9, dt, ctx.world);
        else if (dPlayer > def.preferMax) move(enemy, toPlayer, def.speed, dt, ctx.world);
        else
          move(
            enemy,
            { x: -toPlayer.z * enemy.strafe, z: toPlayer.x * enemy.strafe },
            def.speed * 0.5,
            dt,
            ctx.world,
          );
        if (dPlayer <= def.attackRange && dPlayer >= def.preferMin * 0.7) {
          enemy.state = 'windup';
          enemy.timer = def.windup;
          enemy.attackDir = toPlayer;
        }
        return null;
      }
      if (dPlayer <= def.attackRange * 0.85 + contact * 0.3) {
        enemy.state = 'windup';
        enemy.timer = def.windup;
        enemy.attackDir = toPlayer;
      } else if (dPlayer > contact) {
        move(enemy, toPlayer, def.speed, dt, ctx.world);
      }
      return null;
    }
    case 'windup': {
      enemy.timer -= dt;
      enemy.facing = enemy.attackDir;
      if (enemy.timer > 0) return null;
      enemy.state = 'attack';
      enemy.timer = ATTACK_TIME;
      if (def.ranged) {
        const dir = directionTo(enemy.pos, ctx.player);
        enemy.attackDir = dir;
        return {
          kind: 'projectile',
          from: { ...enemy.pos },
          dir,
          damage: def.damage,
          speed: def.projectileSpeed,
        };
      }
      return {
        kind: 'melee',
        damage: def.damage,
        origin: { ...enemy.pos },
        range: def.attackRange,
      };
    }
    case 'attack': {
      enemy.timer -= dt;
      if (!def.ranged && enemy.kind === 'paperWisp') {
        move(enemy, enemy.attackDir, def.speed * LUNGE_SPEED_FACTOR, dt, ctx.world);
      }
      if (enemy.timer <= 0) {
        enemy.state = 'recover';
        enemy.timer = def.recover;
        enemy.strafe = enemy.strafe === 1 ? -1 : 1;
      }
      return null;
    }
    case 'recover':
    case 'stunned': {
      enemy.timer -= dt;
      if (enemy.timer <= 0) enemy.state = ctx.playerAlive ? 'chase' : 'returning';
      return null;
    }
    default:
      return null;
  }
}
