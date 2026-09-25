import { defOf, slide, type BossAction, type BossActionKind, type Enemy } from '@/systems/enemy-ai';
import { directionTo } from '@/systems/combat-math';
import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import type { HazardSpec } from '@/systems/hazards';
import type { Vec2 } from '@/utils/vec2';

/** Father of Corruption's moves (numbers from docs/phases/phase-16.md). */
export const BOSS = {
  phase2At: 0.6,
  phase3At: 0.3,
  /** Speed multiplier in the last phase. */
  frenzySpeed: 1.3,
  stomp: { windup: 1.0, radius: 5.5, damage: 32, recover: 0.6 },
  stamp: { windup: 1.1, radius: 3.2, damage: 38, recover: 0.6 },
  darts: { windup: 0.6, count: 5, step: 0.2, damage: 12, speed: 10, recover: 0.5 },
  summon: { duration: 1.4, count: 2 },
  storm: { duration: 1.3, ring: 12, damage: 10, speed: 7, ringAt: [0.5, 1.0] as readonly number[] },
  form: {
    windup: 1.4,
    damage: 30,
    hx: 9,
    hz: 1.3,
    offsets: [-4.4, 0, 4.4] as readonly number[],
    recover: 1.0,
  },
  cooldown: { 1: 0.9, 2: 0.7, 3: 0.5 } as const,
  /** Keeps a little distance so the boss is not standing on Rosa. */
  closeEnough: 3.4,
  returnHealPerSecond: 0.2,
  /** Rosa's Aura blinds him for this fraction of the usual time. */
  blindFactor: 0.25,
} as const;

/** What each phase does, in order. `summon` falls back to darts when no helper is left to wake. */
const MOVES: Readonly<Record<1 | 2 | 3, readonly BossActionKind[]>> = {
  1: ['stamp', 'stomp', 'darts', 'stomp', 'stamp', 'darts'],
  2: ['stomp', 'summon', 'stamp', 'storm', 'darts', 'stamp', 'storm'],
  3: ['form', 'stamp', 'storm', 'stomp', 'form', 'darts', 'stamp'],
};

export type Box = { cx: number; cz: number; hx: number; hz: number };

export type BossContext = {
  player: Vec2;
  playerAlive: boolean;
  time: number;
  world: CollisionWorld;
  /** The arena; he only fights while Rosa is inside it. */
  arena: Box | null;
  /** How many helpers are still asleep. */
  dormantLeft: number;
};

export type BossOutput = {
  hazards: HazardSpec[];
  darts: { from: Vec2; dir: Vec2; damage: number; speed: number }[];
  /** Number of helpers to wake now. */
  summon: number;
  /** The phase just entered, if it changed. */
  phaseChanged: 2 | 3 | null;
};

export const phaseFor = (hpFraction: number): 1 | 2 | 3 =>
  hpFraction < BOSS.phase3At ? 3 : hpFraction < BOSS.phase2At ? 2 : 1;

const inside = (box: Box, p: Vec2): boolean =>
  Math.abs(p.x - box.cx) <= box.hx && Math.abs(p.z - box.cz) <= box.hz;

const rotate = (v: Vec2, a: number): Vec2 => ({
  x: v.x * Math.cos(a) - v.z * Math.sin(a),
  z: v.x * Math.sin(a) + v.z * Math.cos(a),
});

function walk(enemy: Enemy, dir: Vec2, speed: number, dt: number, world: CollisionWorld): void {
  enemy.pos = resolveCircle(
    { x: enemy.pos.x + dir.x * speed * dt, z: enemy.pos.z + dir.z * speed * dt },
    defOf(enemy).radius,
    world,
  );
}

function begin(kind: BossActionKind, enemy: Enemy, player: Vec2): BossAction {
  const duration = {
    stomp: BOSS.stomp.windup + BOSS.stomp.recover,
    stamp: BOSS.stamp.windup + BOSS.stamp.recover,
    darts: BOSS.darts.windup + BOSS.darts.recover,
    summon: BOSS.summon.duration,
    storm: BOSS.storm.duration + 0.6,
    form: BOSS.form.windup + BOSS.form.recover,
  }[kind];
  return {
    kind,
    t: 0,
    duration,
    target: { x: player.x, z: player.z },
    dir: directionTo(enemy.pos, player),
    fired: 0,
  };
}

const empty = (): BossOutput => ({ hazards: [], darts: [], summon: 0, phaseChanged: null });

/** Moves that fire something at the moment the windup ends. Returns what to spawn. */
function emit(enemy: Enemy, action: BossAction, out: BossOutput): void {
  switch (action.kind) {
    case 'stomp':
      if (action.fired === 0) {
        action.fired = 1;
        out.hazards.push({
          shape: { kind: 'circle', x: enemy.pos.x, z: enemy.pos.z, r: BOSS.stomp.radius },
          delay: BOSS.stomp.windup,
          damage: BOSS.stomp.damage,
        });
      }
      break;
    case 'stamp':
      if (action.fired === 0) {
        action.fired = 1;
        out.hazards.push({
          shape: { kind: 'circle', x: action.target.x, z: action.target.z, r: BOSS.stamp.radius },
          delay: BOSS.stamp.windup,
          damage: BOSS.stamp.damage,
        });
      }
      break;
    case 'form':
      if (action.fired === 0) {
        action.fired = 1;
        const rot = Math.atan2(action.dir.z, action.dir.x);
        for (const offset of BOSS.form.offsets) {
          out.hazards.push({
            shape: {
              kind: 'rect',
              x: action.target.x - Math.sin(rot) * offset,
              z: action.target.z + Math.cos(rot) * offset,
              hx: BOSS.form.hx,
              hz: BOSS.form.hz,
              rot,
            },
            delay: BOSS.form.windup,
            damage: BOSS.form.damage,
          });
        }
      }
      break;
    case 'darts':
      if (action.fired === 0 && action.t >= BOSS.darts.windup) {
        action.fired = 1;
        const dir = directionTo(enemy.pos, action.target);
        for (let i = 0; i < BOSS.darts.count; i++) {
          const angle = (i - (BOSS.darts.count - 1) / 2) * BOSS.darts.step;
          out.darts.push({
            from: { ...enemy.pos },
            dir: rotate(dir, angle),
            damage: BOSS.darts.damage,
            speed: BOSS.darts.speed,
          });
        }
      }
      break;
    case 'summon':
      if (action.fired === 0 && action.t >= 0.6) {
        action.fired = 1;
        out.summon = BOSS.summon.count;
      }
      break;
    case 'storm': {
      const due = BOSS.storm.ringAt.filter((at) => action.t >= at).length;
      while (action.fired < due) {
        const ring = action.fired;
        action.fired += 1;
        const offset = ring % 2 === 0 ? 0 : Math.PI / BOSS.storm.ring;
        for (let i = 0; i < BOSS.storm.ring; i++) {
          const a = offset + (i / BOSS.storm.ring) * Math.PI * 2;
          out.darts.push({
            from: { ...enemy.pos },
            dir: { x: Math.cos(a), z: Math.sin(a) },
            damage: BOSS.storm.damage,
            speed: BOSS.storm.speed,
          });
        }
      }
      break;
    }
  }
}

/**
 * One fixed step of the boss. Handles his knockback, waking when Rosa enters the arena, the walking, the phases
 * and every move. Emits hazards, darts and helper wake-ups for the combat step to apply.
 */
export function stepBoss(enemy: Enemy, ctx: BossContext, dt: number): BossOutput {
  const out = empty();
  const brain = enemy.brain;
  if (!brain) return out;
  const def = defOf(enemy);
  enemy.flash = Math.max(0, enemy.flash - dt);
  slide(enemy, ctx.world, dt);

  if (enemy.state === 'dead') {
    enemy.deadFor += dt;
    brain.action = null;
    return out;
  }

  const fraction = enemy.hp / def.maxHp;
  const engaged = ctx.playerAlive && ctx.arena !== null && inside(ctx.arena, ctx.player);

  if (!engaged) {
    // Rosa fainted or left: back to the throne room, healing, and forgetting the fight.
    brain.awake = false;
    brain.action = null;
    brain.cooldown = 1.2;
    brain.sequence = 0;
    brain.phase = 1;
    if (enemy.state === 'blinded') enemy.state = 'returning';
    const home = directionTo(enemy.pos, enemy.spawn);
    const away = Math.hypot(enemy.spawn.x - enemy.pos.x, enemy.spawn.z - enemy.pos.z);
    enemy.hp = Math.min(def.maxHp, enemy.hp + def.maxHp * BOSS.returnHealPerSecond * dt);
    if (away > 0.4) {
      enemy.state = 'returning';
      enemy.facing = home;
      walk(enemy, home, def.speed, dt, ctx.world);
    } else {
      enemy.state = 'idle';
    }
    return out;
  }

  if (!brain.awake) {
    brain.awake = true;
    brain.phase = phaseFor(fraction);
    brain.cooldown = 1.0;
  }

  const phase = phaseFor(fraction);
  if (phase > brain.phase) {
    brain.phase = phase;
    brain.action = null;
    brain.cooldown = 1.0;
    out.phaseChanged = phase as 2 | 3;
  }

  const speed = def.speed * (brain.phase === 3 ? BOSS.frenzySpeed : 1);
  const toPlayer = directionTo(enemy.pos, ctx.player);
  const dPlayer = Math.hypot(ctx.player.x - enemy.pos.x, ctx.player.z - enemy.pos.z);

  if (enemy.state === 'blinded') {
    if (ctx.time >= enemy.blindedUntil) {
      enemy.state = 'chase';
    } else {
      // Blinded: stumbles about and does nothing dangerous.
      brain.action = null;
      brain.cooldown = Math.max(brain.cooldown, 0.6);
      return out;
    }
  }

  if (brain.action) {
    const action = brain.action;
    action.t += dt;
    enemy.state = action.t < action.duration ? 'windup' : 'chase';
    enemy.facing = action.kind === 'stamp' ? directionTo(enemy.pos, action.target) : action.dir;
    emit(enemy, action, out);
    if (action.t >= action.duration) {
      brain.action = null;
      brain.cooldown = BOSS.cooldown[brain.phase];
    }
    return out;
  }

  enemy.state = 'chase';
  enemy.facing = toPlayer;
  if (dPlayer > BOSS.closeEnough) walk(enemy, toPlayer, speed, dt, ctx.world);
  brain.cooldown -= dt;
  if (brain.cooldown <= 0) {
    const list = MOVES[brain.phase];
    let kind = list[brain.sequence % list.length]!;
    brain.sequence += 1;
    if (kind === 'summon' && ctx.dormantLeft <= 0) kind = 'darts';
    if (kind === 'stomp' && dPlayer > BOSS.stomp.radius + 3) kind = 'darts';
    brain.action = begin(kind, enemy, ctx.player);
    emit(enemy, brain.action, out);
  }
  return out;
}
