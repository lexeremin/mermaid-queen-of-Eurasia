import { ENEMIES, LEASH_DISTANCE, type EnemyDef, type EnemyKind } from '@/data/enemies';
import { directionTo } from '@/systems/combat-math';
import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';
import type { Vec2 } from '@/utils/vec2';

export type EnemyState =
  'idle' | 'chase' | 'windup' | 'attack' | 'recover' | 'stunned' | 'blinded' | 'returning' | 'dead';

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
  blindedUntil: number;
  /** Direction a blinded enemy stumbles in, re-rolled every WANDER_INTERVAL. */
  wander: Vec2;
  wanderTimer: number;
  swingTimer: number;
  seed: number;
  flash: number;
  deadFor: number;
  strafe: 1 | -1;
  /** Time until which the health bar is shown after taking damage. */
  barUntil: number;
  /** Waits out of the fight (invisible, untargetable) until the boss wakes it. */
  dormant: boolean;
  /** Belongs to an instance: does not respawn by timer (see `resetInstance`). */
  instanced: boolean;
  /** One of the boss's four helpers (they collapse when the boss falls). */
  helper: boolean;
  /** How much tougher than the base kind (the underground gets stronger with depth): health and damage scale with it. */
  power: number;
  /** The boss's state machine; null for everyone else. */
  brain: BossBrain | null;
};

export type BossActionKind = 'stomp' | 'stamp' | 'darts' | 'summon' | 'storm' | 'form';
export type BossAction = {
  kind: BossActionKind;
  /** Seconds into the action. */
  t: number;
  duration: number;
  /** Where the action is aimed (locked when it starts). */
  target: Vec2;
  /** Direction the boss faced when it started. */
  dir: Vec2;
  /** How many timed emissions have gone out already (storm rings). */
  fired: number;
};
export type BossBrain = {
  phase: 1 | 2 | 3;
  action: BossAction | null;
  /** Seconds until the next action may start. */
  cooldown: number;
  /** Position in the phase's move list. */
  sequence: number;
  awake: boolean;
};

export const createBrain = (): BossBrain => ({
  phase: 1,
  action: null,
  cooldown: 1.2,
  sequence: 0,
  awake: false,
});

export type EnemyContext = {
  player: Vec2;
  playerAlive: boolean;
  time: number;
  world: CollisionWorld;
};

export type EnemyAction =
  | { kind: 'melee'; damage: number; origin: Vec2; range: number; blind: boolean }
  | { kind: 'projectile'; from: Vec2; dir: Vec2; damage: number; speed: number; blind: boolean };

const ATTACK_TIME = 0.12;
const LUNGE_SPEED_FACTOR = 2.6;
const KNOCK_DECAY = 9;
const RETURN_HEAL_PER_SECOND = 0.25;
const LOSE_INTEREST_FACTOR = 1.8;
const WANDER_INTERVAL = 0.7;
const BLIND_SPEED_FACTOR = 0.45;
const BLIND_SWING_INTERVAL = 1.4;
const BLIND_SWING_ANIMATION = 0.18;

const hashId = (id: string): number => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0 || 1;
};

/** Deterministic xorshift in [0, 1), advancing the enemy's own seed. */
function random(enemy: Enemy): number {
  let x = enemy.seed;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;
  x >>>= 0;
  enemy.seed = x || 1;
  return enemy.seed / 4294967296;
}

function randomDirection(enemy: Enemy): Vec2 {
  const a = random(enemy) * Math.PI * 2;
  return { x: Math.sin(a), z: Math.cos(a) };
}

export const defOf = (enemy: Pick<Enemy, 'kind'>): EnemyDef => ENEMIES[enemy.kind];

/** Full health of this enemy (the base health times its power). */
export const maxHpOf = (enemy: Pick<Enemy, 'kind' | 'power'>): number =>
  ENEMIES[enemy.kind].maxHp * enemy.power;

/** Damage grows more slowly than health: 42% of the extra power. */
export const damageMult = (power: number): number => 1 + (power - 1) * 0.42;

/** XP grows by a third of the extra power. */
export const xpMult = (power: number): number => 1 + (power - 1) / 3;

/** What one of this enemy's hits does. */
export const damageOf = (enemy: Pick<Enemy, 'kind' | 'power'>): number =>
  Math.round(ENEMIES[enemy.kind].damage * damageMult(enemy.power));

export function createEnemy(
  id: string,
  kind: EnemyKind,
  spawn: Vec2,
  options: { dormant?: boolean; instanced?: boolean; power?: number } = {},
): Enemy {
  const power = options.power ?? 1;
  return {
    id,
    kind,
    pos: { x: spawn.x, z: spawn.z },
    facing: { x: 0, z: 1 },
    spawn: { x: spawn.x, z: spawn.z },
    hp: ENEMIES[kind].maxHp * power,
    state: 'idle',
    timer: 0,
    attackDir: { x: 0, z: 1 },
    knock: { x: 0, z: 0 },
    blindedUntil: 0,
    wander: { x: 0, z: 1 },
    wanderTimer: 0,
    swingTimer: 0.6,
    seed: hashId(id),
    flash: 0,
    deadFor: 0,
    strafe: 1,
    barUntil: 0,
    dormant: options.dormant ?? false,
    instanced: options.instanced ?? false,
    helper: options.dormant ?? false,
    power,
    brain: kind === 'boss' ? createBrain() : null,
  };
}

/** Back to full health at the spawn point (respawn). */
export function respawnEnemy(enemy: Enemy): void {
  Object.assign(enemy, createEnemy(enemy.id, enemy.kind, enemy.spawn, { power: enemy.power }), {
    helper: enemy.helper,
    instanced: enemy.instanced,
  });
}

/** Wakes a dormant helper where it stands, ready to fight. */
export function wakeEnemy(enemy: Enemy): void {
  enemy.dormant = false;
  enemy.state = 'chase';
  enemy.timer = 0;
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
  const armored = (def.knockbackResist >= 0.5 && enemy.state === 'windup') || enemy.kind === 'boss';
  if (!armored && enemy.state !== 'blinded') {
    enemy.state = 'stunned';
    enemy.timer = 0.3 * (1 - def.knockbackResist);
  }
  return false;
}

export function blindEnemy(enemy: Enemy, until: number): void {
  if (enemy.state === 'dead') return;
  enemy.blindedUntil = until;
  enemy.state = 'blinded';
}

/** Carries the enemy along its knockback, which fades quickly. */
export function slide(enemy: Enemy, world: CollisionWorld, dt: number): void {
  if (Math.hypot(enemy.knock.x, enemy.knock.z) <= 0.05) return;
  enemy.pos = resolveCircle(
    { x: enemy.pos.x + enemy.knock.x * dt, z: enemy.pos.z + enemy.knock.z * dt },
    defOf(enemy).radius,
    world,
  );
  const k = Math.exp(-KNOCK_DECAY * dt);
  enemy.knock = { x: enemy.knock.x * k, z: enemy.knock.z * k };
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
    slide(enemy, ctx.world, dt);
    return null;
  }

  slide(enemy, ctx.world, dt);

  if (enemy.state === 'blinded') {
    if (ctx.time >= enemy.blindedUntil) {
      enemy.state = 'idle';
      return null;
    }
    enemy.wanderTimer -= dt;
    enemy.swingTimer -= dt;
    enemy.timer = Math.max(0, enemy.timer - dt);
    if (enemy.wanderTimer <= 0) {
      enemy.wanderTimer = WANDER_INTERVAL;
      enemy.wander = randomDirection(enemy);
    }
    enemy.facing = enemy.wander;
    move(enemy, enemy.wander, def.speed * BLIND_SPEED_FACTOR, dt, ctx.world);
    if (enemy.swingTimer > 0) return null;
    enemy.swingTimer = BLIND_SWING_INTERVAL;
    enemy.timer = BLIND_SWING_ANIMATION;
    const dir = randomDirection(enemy);
    enemy.facing = dir;
    if (def.ranged) {
      return {
        kind: 'projectile',
        from: { ...enemy.pos },
        dir,
        damage: damageOf(enemy),
        speed: def.projectileSpeed,
        blind: true,
      };
    }
    return {
      kind: 'melee',
      damage: damageOf(enemy),
      origin: { ...enemy.pos },
      range: def.attackRange,
      blind: true,
    };
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
      enemy.hp = Math.min(maxHpOf(enemy), enemy.hp + maxHpOf(enemy) * RETURN_HEAL_PER_SECOND * dt);
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
          damage: damageOf(enemy),
          speed: def.projectileSpeed,
          blind: false,
        };
      }
      return {
        kind: 'melee',
        damage: damageOf(enemy),
        origin: { ...enemy.pos },
        range: def.attackRange,
        blind: false,
      };
    }
    case 'attack': {
      enemy.timer -= dt;
      if (def.lunge) {
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
