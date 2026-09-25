import {
  damageMult,
  defOf,
  maxHpOf,
  random,
  slide,
  type BossAction,
  type BossActionKind,
  type Enemy,
} from '@/systems/enemy-ai';
import { directionTo } from '@/systems/combat-math';
import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import type { HazardSpec } from '@/systems/hazards';
import type { Vec2 } from '@/utils/vec2';

/** Father of Corruption's moves (numbers from docs/phases/phase-16.md). The other bosses reshape these numbers. */
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
  /** Coins and papers fall on and around Rosa, one marked circle after another. */
  rain: {
    windup: 0.9,
    count: 6,
    radius: 1.9,
    spread: 6.5,
    stagger: 0.16,
    damage: 22,
    recover: 0.7,
  },
  /** He runs at where Rosa stood: a marked lane first, then the dash. */
  charge: { windup: 0.9, length: 13, halfWidth: 1.5, speed: 20, damage: 34, recover: 0.9 },
  cooldown: { 1: 0.9, 2: 0.7, 3: 0.5 } as const,
  /** Keeps a little distance so the boss is not standing on Rosa. */
  closeEnough: 3.4,
  returnHealPerSecond: 0.2,
  /** Rosa's Aura blinds him for this fraction of the usual time. */
  blindFactor: 0.25,
};

export type BossTuning = typeof BOSS;
type Phase = 1 | 2 | 3;
type Sections = Pick<
  BossTuning,
  'stomp' | 'stamp' | 'darts' | 'summon' | 'storm' | 'form' | 'rain' | 'charge'
>;
type Overrides = Partial<{ [K in keyof Sections]: Partial<Sections[K]> }> & {
  frenzySpeed?: number;
  closeEnough?: number;
};

const tune = (over: Overrides): BossTuning => ({
  ...BOSS,
  frenzySpeed: over.frenzySpeed ?? BOSS.frenzySpeed,
  closeEnough: over.closeEnough ?? BOSS.closeEnough,
  stomp: { ...BOSS.stomp, ...over.stomp },
  stamp: { ...BOSS.stamp, ...over.stamp },
  darts: { ...BOSS.darts, ...over.darts },
  summon: { ...BOSS.summon, ...over.summon },
  storm: { ...BOSS.storm, ...over.storm },
  form: { ...BOSS.form, ...over.form },
  rain: { ...BOSS.rain, ...over.rain },
  charge: { ...BOSS.charge, ...over.charge },
});

type Spec = { tuning: BossTuning; moves: Readonly<Record<Phase, readonly BossActionKind[]>> };

/**
 * What each boss does, in order, per phase. `summon` falls back to darts when no helper is left to wake, and a
 * `stomp` to darts when Rosa is far away.
 */
const SPECS: Readonly<Record<string, Spec>> = {
  // Father of Corruption: stamps, stomps and forms.
  boss: {
    tuning: BOSS,
    moves: {
      1: ['stamp', 'stomp', 'darts', 'stomp', 'stamp', 'darts'],
      2: ['stomp', 'summon', 'stamp', 'storm', 'darts', 'stamp', 'storm'],
      3: ['form', 'stamp', 'storm', 'stomp', 'form', 'darts', 'stamp'],
    },
  },
  // The Lobbyist: fans of banknotes, a rain of coins, and a rush across the room.
  lobbyist: {
    tuning: tune({
      darts: { count: 7, step: 0.15, damage: 12, speed: 11, windup: 0.5 },
      rain: { count: 6, damage: 24 },
      charge: { damage: 30 },
      stamp: { radius: 2.8 },
    }),
    moves: {
      1: ['darts', 'rain', 'darts', 'stamp'],
      2: ['rain', 'summon', 'darts', 'storm', 'rain'],
      3: ['charge', 'rain', 'storm', 'darts', 'charge'],
    },
  },
  // Senator Endless: slow, and never stops talking: rings of words and long lecterns sweeping the floor.
  senator: {
    tuning: tune({
      frenzySpeed: 1.5,
      storm: { duration: 1.9, ring: 16, damage: 9, speed: 6, ringAt: [0.4, 0.9, 1.4] },
      form: { windup: 1.5, offsets: [-6.6, -2.2, 2.2, 6.6], hz: 1.2, damage: 28 },
      stomp: { radius: 6.2, damage: 30 },
      rain: { count: 5, damage: 20 },
    }),
    moves: {
      1: ['storm', 'form', 'stomp', 'storm'],
      2: ['storm', 'summon', 'form', 'rain', 'storm'],
      3: ['form', 'storm', 'rain', 'form', 'storm', 'stomp'],
    },
  },
  // The Yacht Baron: rams across the room with his anchor and slams the floor.
  baron: {
    tuning: tune({
      charge: { damage: 38, speed: 22, windup: 0.85, length: 15, halfWidth: 1.7 },
      stomp: { radius: 5.8, damage: 34 },
      stamp: { radius: 3.6, damage: 40 },
    }),
    moves: {
      1: ['charge', 'stomp', 'charge', 'stamp'],
      2: ['stomp', 'summon', 'charge', 'stamp', 'charge'],
      3: ['charge', 'stomp', 'charge', 'storm', 'stamp', 'charge'],
    },
  },
  // The Spin Doctor: quick, with wide fans of darts and rings of spin.
  spin: {
    tuning: tune({
      frenzySpeed: 1.4,
      darts: { count: 9, step: 0.13, damage: 10, speed: 12, windup: 0.4, recover: 0.4 },
      storm: { ring: 14, damage: 9, speed: 9 },
      rain: { count: 7, spread: 7.5, damage: 20, stagger: 0.12 },
      charge: { length: 11, damage: 28 },
    }),
    moves: {
      1: ['darts', 'rain', 'darts', 'stamp'],
      2: ['darts', 'storm', 'rain', 'summon', 'darts'],
      3: ['storm', 'darts', 'rain', 'storm', 'charge', 'darts'],
    },
  },
};

/** The numbers of a boss kind (Father of Corruption for anything unknown). */
export const bossTuning = (kind: string): BossTuning => (SPECS[kind] ?? SPECS.boss!).tuning;

/** The moves of a boss kind in a phase. */
export const bossMoves = (kind: string, phase: Phase): readonly BossActionKind[] =>
  (SPECS[kind] ?? SPECS.boss!).moves[phase];

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

export const phaseFor = (hpFraction: number, cfg: BossTuning = BOSS): Phase =>
  hpFraction < cfg.phase3At ? 3 : hpFraction < cfg.phase2At ? 2 : 1;

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

function begin(kind: BossActionKind, enemy: Enemy, player: Vec2, cfg: BossTuning): BossAction {
  const duration = {
    stomp: cfg.stomp.windup + cfg.stomp.recover,
    stamp: cfg.stamp.windup + cfg.stamp.recover,
    darts: cfg.darts.windup + cfg.darts.recover,
    summon: cfg.summon.duration,
    storm: cfg.storm.duration + 0.6,
    form: cfg.form.windup + cfg.form.recover,
    rain: cfg.rain.windup + cfg.rain.count * cfg.rain.stagger + cfg.rain.recover,
    charge: cfg.charge.windup + cfg.charge.length / cfg.charge.speed + cfg.charge.recover,
  }[kind];
  const dir = directionTo(enemy.pos, player);
  const toPlayer = Math.hypot(player.x - enemy.pos.x, player.z - enemy.pos.z);
  return {
    kind,
    t: 0,
    duration,
    target: { x: player.x, z: player.z },
    dir,
    fired: 0,
    // A charge runs a little past where Rosa stood, never farther than its length.
    len: Math.min(cfg.charge.length, toPlayer + 3),
    travelled: 0,
  };
}

const empty = (): BossOutput => ({ hazards: [], darts: [], summon: 0, phaseChanged: null });

/** Moves that fire something at the moment the windup ends. Returns what to spawn. */
function emit(enemy: Enemy, action: BossAction, out: BossOutput, cfg: BossTuning): void {
  const scale = damageMult(enemy.power);
  switch (action.kind) {
    case 'stomp':
      if (action.fired === 0) {
        action.fired = 1;
        out.hazards.push({
          shape: { kind: 'circle', x: enemy.pos.x, z: enemy.pos.z, r: cfg.stomp.radius },
          delay: cfg.stomp.windup,
          damage: Math.round(cfg.stomp.damage * scale),
        });
      }
      break;
    case 'stamp':
      if (action.fired === 0) {
        action.fired = 1;
        out.hazards.push({
          shape: { kind: 'circle', x: action.target.x, z: action.target.z, r: cfg.stamp.radius },
          delay: cfg.stamp.windup,
          damage: Math.round(cfg.stamp.damage * scale),
        });
      }
      break;
    case 'form':
      if (action.fired === 0) {
        action.fired = 1;
        const rot = Math.atan2(action.dir.z, action.dir.x);
        for (const offset of cfg.form.offsets) {
          out.hazards.push({
            shape: {
              kind: 'rect',
              x: action.target.x - Math.sin(rot) * offset,
              z: action.target.z + Math.cos(rot) * offset,
              hx: cfg.form.hx,
              hz: cfg.form.hz,
              rot,
            },
            delay: cfg.form.windup,
            damage: Math.round(cfg.form.damage * scale),
          });
        }
      }
      break;
    case 'darts':
      if (action.fired === 0 && action.t >= cfg.darts.windup) {
        action.fired = 1;
        const dir = directionTo(enemy.pos, action.target);
        for (let i = 0; i < cfg.darts.count; i++) {
          const angle = (i - (cfg.darts.count - 1) / 2) * cfg.darts.step;
          out.darts.push({
            from: { ...enemy.pos },
            dir: rotate(dir, angle),
            damage: Math.round(cfg.darts.damage * scale),
            speed: cfg.darts.speed,
          });
        }
      }
      break;
    case 'summon':
      if (action.fired === 0 && action.t >= 0.6) {
        action.fired = 1;
        out.summon = cfg.summon.count;
      }
      break;
    case 'storm': {
      const due = cfg.storm.ringAt.filter((at) => action.t >= at).length;
      while (action.fired < due) {
        const ring = action.fired;
        action.fired += 1;
        const offset = ring % 2 === 0 ? 0 : Math.PI / cfg.storm.ring;
        for (let i = 0; i < cfg.storm.ring; i++) {
          const a = offset + (i / cfg.storm.ring) * Math.PI * 2;
          out.darts.push({
            from: { ...enemy.pos },
            dir: { x: Math.cos(a), z: Math.sin(a) },
            damage: Math.round(cfg.storm.damage * scale),
            speed: cfg.storm.speed,
          });
        }
      }
      break;
    }
    case 'rain':
      if (action.fired === 0) {
        action.fired = 1;
        // The first drop lands right where Rosa stood; the rest scatter around her, one after another.
        for (let i = 0; i < cfg.rain.count; i++) {
          const angle = random(enemy) * Math.PI * 2;
          const reach = i === 0 ? 0 : (0.3 + 0.7 * random(enemy)) * cfg.rain.spread;
          out.hazards.push({
            shape: {
              kind: 'circle',
              x: action.target.x + Math.cos(angle) * reach,
              z: action.target.z + Math.sin(angle) * reach,
              r: cfg.rain.radius,
            },
            delay: cfg.rain.windup + i * cfg.rain.stagger,
            damage: Math.round(cfg.rain.damage * scale),
          });
        }
      }
      break;
    case 'charge':
      if (action.fired === 0) {
        action.fired = 1;
        // The lane is marked from where he stands to where he will stop.
        const rot = Math.atan2(action.dir.z, action.dir.x);
        out.hazards.push({
          shape: {
            kind: 'rect',
            x: enemy.pos.x + action.dir.x * (action.len / 2),
            z: enemy.pos.z + action.dir.z * (action.len / 2),
            hx: action.len / 2,
            hz: cfg.charge.halfWidth,
            rot,
          },
          delay: cfg.charge.windup,
          damage: Math.round(cfg.charge.damage * scale),
        });
      }
      break;
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
  const cfg = bossTuning(enemy.kind);
  enemy.flash = Math.max(0, enemy.flash - dt);
  slide(enemy, ctx.world, dt);

  if (enemy.state === 'dead') {
    enemy.deadFor += dt;
    brain.action = null;
    return out;
  }

  const fraction = enemy.hp / maxHpOf(enemy);
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
    enemy.hp = Math.min(maxHpOf(enemy), enemy.hp + maxHpOf(enemy) * cfg.returnHealPerSecond * dt);
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
    brain.phase = phaseFor(fraction, cfg);
    brain.cooldown = 1.0;
  }

  const phase = phaseFor(fraction, cfg);
  if (phase > brain.phase) {
    brain.phase = phase;
    brain.action = null;
    brain.cooldown = 1.0;
    out.phaseChanged = phase as 2 | 3;
  }

  const speed = def.speed * (brain.phase === 3 ? cfg.frenzySpeed : 1);
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
    emit(enemy, action, out, cfg);
    if (
      action.kind === 'charge' &&
      action.t >= cfg.charge.windup &&
      action.travelled < action.len
    ) {
      // The rush itself: straight along the marked lane, stopped short by a wall.
      const step = Math.min(cfg.charge.speed * dt, action.len - action.travelled);
      const before = { ...enemy.pos };
      walk(enemy, action.dir, step / dt, dt, ctx.world);
      const moved = Math.hypot(enemy.pos.x - before.x, enemy.pos.z - before.z);
      action.travelled = moved < step * 0.5 ? action.len : action.travelled + moved;
    }
    if (action.t >= action.duration) {
      brain.action = null;
      brain.cooldown = cfg.cooldown[brain.phase];
    }
    return out;
  }

  enemy.state = 'chase';
  enemy.facing = toPlayer;
  if (dPlayer > cfg.closeEnough) walk(enemy, toPlayer, speed, dt, ctx.world);
  brain.cooldown -= dt;
  if (brain.cooldown <= 0) {
    const list = bossMoves(enemy.kind, brain.phase);
    let kind = list[brain.sequence % list.length]!;
    brain.sequence += 1;
    if (kind === 'summon' && ctx.dormantLeft <= 0) kind = 'darts';
    if (kind === 'stomp' && dPlayer > cfg.stomp.radius + 3) kind = 'darts';
    brain.action = begin(kind, enemy, ctx.player, cfg);
    emit(enemy, brain.action, out, cfg);
  }
  return out;
}
