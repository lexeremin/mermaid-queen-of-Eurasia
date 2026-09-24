import { RESPAWN_SECONDS, type EnemyKind } from '@/data/enemies';
import {
  AIM_ASSIST,
  AURA,
  DASH,
  HP_REGEN,
  HP_REGEN_DELAY,
  HURT_INVULN,
  MANA_REGEN,
  MAX_HP,
  MAX_MANA,
  SPELL,
  TRIDENT,
  canUse,
  createCooldowns,
  tickCooldowns,
  spendAbility,
  type Cooldowns,
} from '@/systems/abilities';
import { aimAssist, directionTo, inCircle, inCone } from '@/systems/combat-math';
import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import {
  charmEnemy,
  createEnemy,
  damageEnemy,
  defOf,
  respawnEnemy,
  standDown,
  stepEnemy,
  type Enemy,
} from '@/systems/enemy-ai';
import { PLAYER_RADIUS, PLAYER_SPEED } from '@/systems/movement';
import { isZero, normalize, type Vec2 } from '@/utils/vec2';

export type Projectile = { id: number; pos: Vec2; vel: Vec2; damage: number; age: number };

export type EffectType = 'arc' | 'ring' | 'streak' | 'puff';
export type Effect = {
  id: number;
  type: EffectType;
  x: number;
  z: number;
  dir: Vec2;
  age: number;
  life: number;
  size: number;
};

export type CombatEvent =
  | { type: 'enemyDefeated'; kind: EnemyKind }
  | { type: 'playerHurt'; damage: number }
  | { type: 'playerDowned' }
  | { type: 'npcCharmed'; id: string };

export type CombatState = {
  time: number;
  hp: number;
  mana: number;
  cooldowns: Cooldowns;
  invuln: number;
  sinceHurt: number;
  hurtFlash: number;
  downed: boolean;
  attackLock: number;
  dash: { active: boolean; t: number; dir: Vec2 };
  aura: { active: boolean; t: number; hit: Set<string> };
  enemies: Enemy[];
  projectiles: Projectile[];
  effects: Effect[];
  /** NPC id -> time (sim seconds) until which the NPC is charmed by the Aura. */
  charmed: Record<string, number>;
  kills: number;
  nextId: number;
};

export type SpawnPoint = { id: string; kind: EnemyKind; x: number; z: number };

export function createCombatState(spawns: readonly SpawnPoint[] = []): CombatState {
  return {
    time: 0,
    hp: MAX_HP,
    mana: MAX_MANA,
    cooldowns: createCooldowns(),
    invuln: 0,
    sinceHurt: HP_REGEN_DELAY,
    hurtFlash: 0,
    downed: false,
    attackLock: 0,
    dash: { active: false, t: 0, dir: { x: 0, z: 1 } },
    aura: { active: false, t: 0, hit: new Set() },
    enemies: spawns.map((s) => createEnemy(s.id, s.kind, { x: s.x, z: s.z })),
    projectiles: [],
    effects: [],
    charmed: {},
    kills: 0,
    nextId: 1,
  };
}

export type CombatActions = { attack: boolean; dash: boolean; aura: boolean; spell: boolean };

export type CombatParams = {
  dt: number;
  playerPos: Vec2;
  playerFacing: Vec2;
  move: Vec2;
  actions: CombatActions;
  npcs: readonly { id: string; pos: Vec2 }[];
  world: CollisionWorld;
};

export type CombatFrame = {
  /** Replaces the movement vector (dash), or null. */
  moveOverride: Vec2 | null;
  moveScale: number;
  faceOverride: Vec2 | null;
  cancelWalk: boolean;
  events: CombatEvent[];
};

const ATTACK_LOCK = 0.18;
const ATTACK_LOCK_SCALE = 0.4;
const PROJECTILE_RADIUS = 0.25;
const PROJECTILE_LIFE = 2.2;

const pushEffect = (
  s: CombatState,
  type: EffectType,
  x: number,
  z: number,
  dir: Vec2,
  life: number,
  size: number,
) => s.effects.push({ id: s.nextId++, type, x, z, dir, age: 0, life, size });

function hurtPlayer(s: CombatState, damage: number, events: CombatEvent[]): void {
  if (s.downed || s.invuln > 0) return;
  s.hp = Math.max(0, s.hp - damage);
  s.invuln = HURT_INVULN;
  s.sinceHurt = 0;
  s.hurtFlash = 1;
  events.push({ type: 'playerHurt', damage });
  if (s.hp <= 0) {
    s.downed = true;
    s.aura.active = false;
    s.dash.active = false;
    events.push({ type: 'playerDowned' });
    for (const e of s.enemies) standDown(e);
  }
}

function hitEnemy(
  s: CombatState,
  e: Enemy,
  damage: number,
  from: Vec2,
  knockback: number,
  events: CombatEvent[],
): void {
  const dir = directionTo(from, e.pos);
  if (damageEnemy(e, damage, dir, knockback, s.time)) {
    s.kills += 1;
    events.push({ type: 'enemyDefeated', kind: e.kind });
    pushEffect(s, 'puff', e.pos.x, e.pos.z, dir, 0.5, defOf(e).radius * 2.2);
  }
}

/** Advances combat by one fixed step. Mutates `s`. */
export function stepCombat(s: CombatState, p: CombatParams): CombatFrame {
  const { dt, playerPos, world } = p;
  const events: CombatEvent[] = [];
  const frame: CombatFrame = {
    moveOverride: null,
    moveScale: 1,
    faceOverride: null,
    cancelWalk: false,
    events,
  };

  s.time += dt;
  s.invuln = Math.max(0, s.invuln - dt);
  s.hurtFlash = Math.max(0, s.hurtFlash - dt * 2.5);
  s.attackLock = Math.max(0, s.attackLock - dt);
  s.sinceHurt += dt;
  tickCooldowns(s.cooldowns, dt);

  for (const [id, until] of Object.entries(s.charmed)) if (s.time >= until) delete s.charmed[id];

  if (!s.downed) {
    s.mana = Math.min(MAX_MANA, s.mana + MANA_REGEN * dt);
    if (s.sinceHurt >= HP_REGEN_DELAY) s.hp = Math.min(MAX_HP, s.hp + HP_REGEN * dt);
  }

  const alive = !s.downed;
  let facing = p.playerFacing;

  if (alive) {
    if (p.actions.dash && !s.dash.active && canUse(s.cooldowns, s.mana, 'dash')) {
      spendAbility(s.cooldowns, s.mana, 'dash');
      const dir = isZero(p.move) ? facing : normalize(p.move);
      s.dash = { active: true, t: 0, dir };
      s.invuln = Math.max(s.invuln, DASH.invuln);
      pushEffect(s, 'streak', playerPos.x, playerPos.z, dir, 0.3, DASH.distance);
      frame.cancelWalk = true;
    }

    if (p.actions.attack && !s.dash.active && canUse(s.cooldowns, s.mana, 'attack')) {
      const targets = s.enemies
        .filter((e) => e.state !== 'dead')
        .map((e) => ({ id: e.id, pos: e.pos, radius: defOf(e).radius }));
      const assisted = aimAssist(playerPos, facing, targets, AIM_ASSIST.range, AIM_ASSIST.maxAngle);
      facing =
        assisted !== facing
          ? assisted
          : aimAssist(playerPos, facing, targets, AIM_ASSIST.closeRange, Math.PI);
      spendAbility(s.cooldowns, s.mana, 'attack');
      s.attackLock = ATTACK_LOCK;
      frame.faceOverride = facing;
      frame.cancelWalk = true;
      pushEffect(s, 'arc', playerPos.x, playerPos.z, facing, 0.16, TRIDENT.range);
      for (const e of s.enemies) {
        if (e.state === 'dead') continue;
        if (inCone(playerPos, facing, e.pos, defOf(e).radius, TRIDENT.range, TRIDENT.halfAngle)) {
          hitEnemy(s, e, TRIDENT.damage, playerPos, TRIDENT.knockback, events);
        }
      }
    }

    if (p.actions.spell && canUse(s.cooldowns, s.mana, 'spell')) {
      s.mana = spendAbility(s.cooldowns, s.mana, 'spell') ?? s.mana;
      frame.cancelWalk = true;
      pushEffect(s, 'ring', playerPos.x, playerPos.z, facing, SPELL.burst + 0.15, SPELL.radius);
      for (const e of s.enemies) {
        if (e.state === 'dead') continue;
        if (inCircle(playerPos, e.pos, defOf(e).radius, SPELL.radius)) {
          hitEnemy(s, e, SPELL.damage, playerPos, SPELL.knockback, events);
        }
      }
    }

    if (p.actions.aura && !s.aura.active && canUse(s.cooldowns, s.mana, 'aura')) {
      s.mana = spendAbility(s.cooldowns, s.mana, 'aura') ?? s.mana;
      s.aura = { active: true, t: 0, hit: new Set() };
      frame.cancelWalk = true;
    }
  }

  if (s.dash.active) {
    s.dash.t += dt;
    const speedFactor = DASH.distance / DASH.duration / PLAYER_SPEED;
    frame.moveOverride = { x: s.dash.dir.x * speedFactor, z: s.dash.dir.z * speedFactor };
    if (s.dash.t >= DASH.duration) s.dash.active = false;
  } else if (s.attackLock > 0) {
    frame.moveScale = ATTACK_LOCK_SCALE;
  }

  if (s.aura.active) {
    s.aura.t += dt;
    const radius = AURA.maxRadius * Math.min(1, s.aura.t / AURA.duration);
    for (const npc of p.npcs) {
      if (s.aura.hit.has(npc.id)) continue;
      if (inCircle(playerPos, npc.pos, 0.5, radius)) {
        s.aura.hit.add(npc.id);
        s.charmed[npc.id] = s.time + AURA.npcCharm;
        events.push({ type: 'npcCharmed', id: npc.id });
      }
    }
    for (const e of s.enemies) {
      if (e.state === 'dead' || s.aura.hit.has(e.id)) continue;
      if (inCircle(playerPos, e.pos, defOf(e).radius, radius)) {
        s.aura.hit.add(e.id);
        charmEnemy(e, s.time + AURA.enemyCharm);
      }
    }
    if (s.aura.t >= AURA.duration) s.aura.active = false;
  }

  for (const e of s.enemies) {
    const action = stepEnemy(e, { player: playerPos, playerAlive: alive, time: s.time, world }, dt);
    if (e.state === 'dead' && e.deadFor >= RESPAWN_SECONDS) respawnEnemy(e);
    if (!action) continue;
    if (action.kind === 'melee') {
      const reach = action.range + PLAYER_RADIUS;
      if (Math.hypot(playerPos.x - action.origin.x, playerPos.z - action.origin.z) <= reach) {
        hurtPlayer(s, action.damage, events);
      }
    } else {
      s.projectiles.push({
        id: s.nextId++,
        pos: { ...action.from },
        vel: { x: action.dir.x * action.speed, z: action.dir.z * action.speed },
        damage: action.damage,
        age: 0,
      });
    }
  }

  s.projectiles = s.projectiles.filter((proj) => {
    proj.age += dt;
    const next = { x: proj.pos.x + proj.vel.x * dt, z: proj.pos.z + proj.vel.z * dt };
    const blocked = resolveCircle(next, 0.1, world);
    if (proj.age > PROJECTILE_LIFE || Math.hypot(blocked.x - next.x, blocked.z - next.z) > 0.05)
      return false;
    proj.pos = next;
    if (
      Math.hypot(playerPos.x - next.x, playerPos.z - next.z) <=
      PLAYER_RADIUS + PROJECTILE_RADIUS
    ) {
      hurtPlayer(s, proj.damage, events);
      return false;
    }
    return true;
  });

  for (const fx of s.effects) fx.age += dt;
  s.effects = s.effects.filter((fx) => fx.age < fx.life);

  return frame;
}

export const REVIVE_HP_FRACTION = 0.6;

/** Get up after fainting: partial health, full mana, everything calm. */
export function revive(s: CombatState): void {
  s.downed = false;
  s.hp = MAX_HP * REVIVE_HP_FRACTION;
  s.mana = MAX_MANA;
  s.invuln = 2;
  s.sinceHurt = 0;
  s.projectiles = [];
  s.aura.active = false;
  s.dash.active = false;
  for (const e of s.enemies) standDown(e);
}
