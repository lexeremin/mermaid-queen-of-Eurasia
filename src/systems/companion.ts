import { directionTo } from '@/systems/combat-math';
import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import { PLAYER_SPEED } from '@/systems/movement';
import type { Vec2 } from '@/utils/vec2';

export const COMPANION = {
  speed: PLAYER_SPEED * 1.05,
  radius: 0.4,
  /** Where he stands next to Rosa: behind and to the side. */
  followBack: 1.5,
  followSide: 1.1,
  /** Enemies this close to Rosa are his targets. */
  engageRange: 7.5,
  /** He is within sword reach of an enemy at this distance (from the enemy's edge). */
  reach: 1.5,
  windup: 0.16,
  strike: 0.14,
  recover: 0.45,
  damage: 11,
  knockback: 2.4,
  lungeSpeed: 9,
  /** Farther than this from Rosa and he simply appears beside her. */
  teleportDistance: 22,
  /** Start walking to his spot when farther than this, stop when closer than `settleDistance`. */
  startDistance: 0.6,
  settleDistance: 0.15,
  swingTime: 0.3,
} as const;

export type CompanionState = 'follow' | 'chase' | 'windup' | 'strike' | 'recover';

export type Companion = {
  id: string;
  pos: Vec2;
  /** Position at the start of the last step, for smooth rendering between steps. */
  prev: Vec2;
  facing: Vec2;
  state: CompanionState;
  timer: number;
  target: string | null;
  /** Seconds left of the sword swing animation. */
  swing: number;
  /** Set on the step where the sword lands, so the hit is applied exactly once. */
  hitPending: boolean;
  /** Walking to his spot beside Rosa; starts and stops at different distances so he does not stutter. */
  repositioning: boolean;
  /** Rosa's position on the previous step, to know how fast she is moving. */
  lastPlayer: Vec2;
};

export type CompanionTarget = { id: string; pos: Vec2; radius: number };

export type CompanionHit = { enemyId: string; damage: number; dir: Vec2 };

const dist = (a: Vec2, b: Vec2): number => Math.hypot(b.x - a.x, b.z - a.z);

/** The spot beside Rosa where a following companion likes to stand. */
export function followSpot(player: Vec2, playerFacing: Vec2): Vec2 {
  const len = Math.hypot(playerFacing.x, playerFacing.z) || 1;
  const fx = playerFacing.x / len;
  const fz = playerFacing.z / len;
  return {
    x: player.x - fx * COMPANION.followBack + fz * COMPANION.followSide,
    z: player.z - fz * COMPANION.followBack - fx * COMPANION.followSide,
  };
}

export function createCompanion(id: string, player: Vec2, playerFacing: Vec2): Companion {
  const spot = followSpot(player, playerFacing);
  return {
    id,
    pos: spot,
    prev: { x: spot.x, z: spot.z },
    facing: { x: playerFacing.x, z: playerFacing.z },
    state: 'follow',
    timer: 0,
    target: null,
    swing: 0,
    hitPending: false,
    repositioning: false,
    lastPlayer: { x: player.x, z: player.z },
  };
}

export type CompanionContext = {
  dt: number;
  player: Vec2;
  playerFacing: Vec2;
  targets: readonly CompanionTarget[];
  world: CollisionWorld;
};

function walk(c: Companion, dir: Vec2, speed: number, dt: number, world: CollisionWorld): void {
  c.pos = resolveCircle(
    { x: c.pos.x + dir.x * speed * dt, z: c.pos.z + dir.z * speed * dt },
    COMPANION.radius,
    world,
  );
}

function pickTarget(c: Companion, ctx: CompanionContext): CompanionTarget | null {
  let best: CompanionTarget | null = null;
  let bestDistance = Infinity;
  for (const t of ctx.targets) {
    if (dist(ctx.player, t.pos) > COMPANION.engageRange) continue;
    const d = dist(c.pos, t.pos);
    if (d < bestDistance) {
      best = t;
      bestDistance = d;
    }
  }
  return best;
}

/**
 * Advances a companion by one fixed step: he keeps beside Rosa, charges the nearest enemy near her,
 * lunges with his sword and returns the hit to apply. Pure apart from mutating `c`.
 */
export function stepCompanion(c: Companion, ctx: CompanionContext): CompanionHit | null {
  const { dt, player, world } = ctx;
  c.swing = Math.max(0, c.swing - dt);
  c.hitPending = false;
  c.prev = { x: c.pos.x, z: c.pos.z };
  const wasPlayer = c.lastPlayer;
  c.lastPlayer = { x: player.x, z: player.z };

  if (dist(c.pos, player) > COMPANION.teleportDistance) {
    c.pos = resolveCircle(followSpot(player, ctx.playerFacing), COMPANION.radius, world);
    c.prev = { x: c.pos.x, z: c.pos.z };
    c.state = 'follow';
    c.target = null;
  }

  const target = c.target ? (ctx.targets.find((t) => t.id === c.target) ?? null) : null;

  switch (c.state) {
    case 'follow':
    case 'chase': {
      const next = pickTarget(c, ctx);
      if (!next) {
        c.state = 'follow';
        c.target = null;
        const spot = followSpot(player, ctx.playerFacing);
        const d = dist(c.pos, spot);
        const playerSpeed = dist(wasPlayer, player) / dt;
        c.repositioning = c.repositioning
          ? d >= COMPANION.settleDistance || playerSpeed > 0.5
          : d > COMPANION.startDistance;
        if (c.repositioning) {
          const dir = d > 0.05 ? directionTo(c.pos, spot) : ctx.playerFacing;
          walk(c, dir, Math.min(COMPANION.speed * 1.8, playerSpeed + d * 5), dt, world);
          c.facing = dir;
        } else {
          c.facing = { x: ctx.playerFacing.x, z: ctx.playerFacing.z };
        }
        return null;
      }
      c.state = 'chase';
      c.target = next.id;
      const dir = directionTo(c.pos, next.pos);
      c.facing = dir;
      if (dist(c.pos, next.pos) <= next.radius + COMPANION.reach) {
        c.state = 'windup';
        c.timer = COMPANION.windup;
      } else {
        walk(c, dir, COMPANION.speed * 1.15, dt, world);
      }
      return null;
    }
    case 'windup': {
      if (!target) {
        c.state = 'follow';
        return null;
      }
      c.facing = directionTo(c.pos, target.pos);
      c.timer -= dt;
      if (c.timer > 0) return null;
      c.state = 'strike';
      c.timer = COMPANION.strike;
      c.swing = COMPANION.swingTime;
      c.hitPending = true;
      const inReach = dist(c.pos, target.pos) <= target.radius + COMPANION.reach * 1.3;
      return inReach
        ? { enemyId: target.id, damage: COMPANION.damage, dir: directionTo(c.pos, target.pos) }
        : null;
    }
    case 'strike': {
      c.timer -= dt;
      if (target && dist(c.pos, target.pos) > target.radius + COMPANION.radius + 0.25) {
        walk(c, c.facing, COMPANION.lungeSpeed, dt, world);
      }
      if (c.timer <= 0) {
        c.state = 'recover';
        c.timer = COMPANION.recover;
      }
      return null;
    }
    case 'recover': {
      c.timer -= dt;
      if (c.timer <= 0) c.state = 'chase';
      return null;
    }
  }
}
