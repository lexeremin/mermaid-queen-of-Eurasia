import { RESPAWN_SECONDS, isBossKind, type EnemyKind } from '@/data/enemies';
import {
  AIM_ASSIST,
  ARCANE_BLAST,
  AURA,
  LIGHT_BEAMS,
  SEA_WAVE,
  SHARKS,
  songFor,
  type Form,
  type SongSpec,
  HP_REGEN,
  HP_REGEN_DELAY,
  HURT_INVULN,
  MAX_HP,
  MAX_MANA,
  SPELL,
  BLINK,
  COMBO_RESET,
  TRIDENT,
  TRIDENT_COMBO,
  canUse,
  createCooldowns,
  tickCooldowns,
  spendAbility,
  type AbilityId,
  type Cooldowns,
} from '@/systems/abilities';
import { createCompanion, stepCompanion, type Companion } from '@/systems/companion';
import { aimAssist, directionTo, inCircle, inCone } from '@/systems/combat-math';
import { resolveCircle, type CollisionWorld } from '@/systems/collision';
import {
  blindEnemy,
  createEnemy,
  damageEnemy,
  defOf,
  respawnEnemy,
  standDown,
  stepEnemy,
  wakeEnemy,
  type Enemy,
} from '@/systems/enemy-ai';
import { bossTuning, stepBoss, type Box } from '@/systems/boss';
import { overlapsHazard, stepHazards, type Hazard } from '@/systems/hazards';
import { PLAYER_RADIUS } from '@/systems/movement';
import { BASE_STATS, type PlayerStats } from '@/systems/progression';
import { ALL_UNLOCKED_LEVEL, hasPassive, isUnlocked } from '@/systems/skills';
import type { Vec2 } from '@/utils/vec2';

export type Projectile = { id: number; pos: Vec2; vel: Vec2; damage: number; age: number };

/** The level-20 passive of the trident: a sea wave rolling out along the swing. */
export type SeaWave = { id: number; pos: Vec2; dir: Vec2; age: number; hit: Set<string> };
/** A level-40 shark leaping from the Surge wave; `age` starts below zero while it waits its turn. */
export type Shark = { id: number; from: Vec2; to: Vec2; age: number };

export type EffectType = 'arc' | 'wave' | 'bubbles' | 'puff' | 'arcane' | 'splash';
export type Effect = {
  id: number;
  type: EffectType;
  x: number;
  z: number;
  dir: Vec2;
  age: number;
  life: number;
  size: number;
  /** Which of the three trident swings an `arc` belongs to (0 forehand, 1 backhand, 2 finisher). */
  style: number;
};

export type CombatEvent =
  | { type: 'enemyDefeated'; kind: EnemyKind; power: number; x: number; z: number }
  | { type: 'playerHurt'; damage: number }
  | { type: 'playerDowned' }
  | { type: 'npcCharmed'; id: string }
  /** A hit landed on an enemy (from Rosa or a companion). */
  | { type: 'enemyHit'; x: number; z: number; amount: number }
  /** Rosa used an ability (drives voice and sound). */
  | { type: 'cast'; ability: AbilityId }
  /** A passive effect fired (sea wave, sharks, arcane blast). */
  | { type: 'passive'; ability: AbilityId }
  /** The boss entered his second or third phase. */
  | { type: 'bossPhase'; phase: 2 | 3; kind: EnemyKind }
  /** The boss woke helpers. */
  | { type: 'bossSummon'; count: number };

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
  /** The song being sung (the human Aura or the mermaid's Tidal Song), kept from the moment it was cast. */
  aura: {
    active: boolean;
    t: number;
    hit: Set<string>;
    song: SongSpec;
    /** The level-30 passive was on when the song began. */
    beams: boolean;
    /** Enemy id -> time (sim seconds) until which the beams will not hurt it again. */
    beamAt: Record<string, number>;
  };
  enemies: Enemy[];
  projectiles: Projectile[];
  /** Rosa's sea waves (level 20 trident) and leaping sharks (level 40 Surge). */
  seaWaves: SeaWave[];
  sharks: Shark[];
  /** Telegraphed danger zones (boss moves) waiting to land. */
  hazards: Hazard[];
  effects: Effect[];
  /** A companion fighting beside Rosa, or null. */
  companion: Companion | null;
  /** Seconds left of the trident swing animation, and which of the three swings it is. */
  swing: number;
  swingKind: number;
  /** The swing the next attack will be, and the seconds since the last one (the chain restarts when it is long). */
  combo: number;
  comboIdle: number;
  /** Seconds left of the pop-in after a blink (0 when not blinking). */
  blink: number;
  /** Seconds left of the temporary mermaid look (Aura song, Tide Surge). */
  mermaid: number;
  /** NPC id -> time (sim seconds) until which the NPC is charmed by the Aura. */
  charmed: Record<string, number>;
  kills: number;
  nextId: number;
};

export type SpawnPoint = {
  id: string;
  kind: EnemyKind;
  x: number;
  z: number;
  dormant?: boolean;
  instanced?: boolean;
  power?: number;
};

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
    aura: { active: false, t: 0, hit: new Set(), song: AURA, beams: false, beamAt: {} },
    enemies: spawns.map((s) =>
      createEnemy(
        s.id,
        s.kind,
        { x: s.x, z: s.z },
        { dormant: s.dormant, instanced: s.instanced, power: s.power },
      ),
    ),
    projectiles: [],
    seaWaves: [],
    sharks: [],
    hazards: [],
    effects: [],
    companion: null,
    swing: 0,
    swingKind: 0,
    combo: 0,
    comboIdle: COMBO_RESET,
    blink: 0,
    mermaid: 0,
    charmed: {},
    kills: 0,
    nextId: 1,
  };
}

export type CombatActions = {
  attack: boolean;
  aura: boolean;
  spell: boolean;
  blink: boolean;
};

export type CombatParams = {
  dt: number;
  playerPos: Vec2;
  playerFacing: Vec2;
  move: Vec2;
  actions: CombatActions;
  npcs: readonly { id: string; pos: Vec2 }[];
  world: CollisionWorld;
  /** Rosa's level: it decides which abilities she has and which passives (default: all abilities, no passives). */
  level?: number;
  /** Derived player stats (level and equipment); defaults to the base stats. */
  stats?: PlayerStats;
  /** Rosa's form: the mermaid sings Tidal Song instead of the Aura. */
  form?: Form;
  /** The NPC currently following Rosa as a companion, if any. */
  companion?: { id: string } | null;
  /** The boss arena; the boss only fights while Rosa is inside. */
  arena?: Box | null;
  /** Where a blink from here would land (null: nowhere, so it is not cast). Supplied by the game loop. */
  resolveBlink?: (from: Vec2) => Vec2 | null;
};

export type CombatFrame = {
  moveScale: number;
  faceOverride: Vec2 | null;
  cancelWalk: boolean;
  /** Rosa blinks here this step. */
  blinkTo: Vec2 | null;
  events: CombatEvent[];
};

const ATTACK_LOCK = 0.18;
const ATTACK_LOCK_SCALE = 0.4;
const PROJECTILE_RADIUS = 0.25;
/** A blinded enemy only connects when Rosa is practically touching it. */
const BLIND_MELEE_REACH = 0.9;
const PROJECTILE_LIFE = 2.2;

/** Turns Rosa into a mermaid for `seconds`, with a burst of bubbles when the change starts. */
function startMermaid(s: CombatState, seconds: number, at: Vec2): void {
  if (s.mermaid <= 0) pushEffect(s, 'bubbles', at.x, at.z, { x: 0, z: 1 }, 0.9, 1.2);
  s.mermaid = Math.max(s.mermaid, seconds);
}

export const pushEffect = (
  s: CombatState,
  type: EffectType,
  x: number,
  z: number,
  dir: Vec2,
  life: number,
  size: number,
  style = 0,
) => s.effects.push({ id: s.nextId++, type, x, z, dir, age: 0, life, size, style });

function hurtPlayer(
  s: CombatState,
  rawDamage: number,
  events: CombatEvent[],
  reduction: number,
): void {
  if (s.downed || s.invuln > 0) return;
  const damage = Math.max(1, Math.round(rawDamage * (1 - reduction)));
  s.hp = Math.max(0, s.hp - damage);
  s.invuln = HURT_INVULN;
  s.sinceHurt = 0;
  s.hurtFlash = 1;
  events.push({ type: 'playerHurt', damage });
  if (s.hp <= 0) {
    s.downed = true;
    s.aura.active = false;
    s.swing = 0;
    s.combo = 0;
    s.mermaid = 0;
    s.hazards = [];
    s.seaWaves = [];
    s.sharks = [];
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
  events.push({ type: 'enemyHit', x: e.pos.x, z: e.pos.z, amount: damage });
  if (damageEnemy(e, damage, dir, knockback, s.time)) {
    s.kills += 1;
    events.push({
      type: 'enemyDefeated',
      kind: e.kind,
      power: e.power,
      x: e.pos.x,
      z: e.pos.z,
    });
    pushEffect(s, 'puff', e.pos.x, e.pos.z, dir, 0.5, defOf(e).radius * 2.2);
    if (isBossKind(e.kind)) collapseHelpers(s);
  }
}

/** The boss's paperwork falls apart with him: every helper is gone, with no reward. */
function collapseHelpers(s: CombatState): void {
  s.hazards = [];
  s.projectiles = [];
  for (const h of s.enemies) {
    if (!h.helper || h.state === 'dead') continue;
    if (h.dormant) {
      h.dormant = false;
      h.deadFor = 1;
    } else {
      pushEffect(s, 'puff', h.pos.x, h.pos.z, { x: 0, z: 1 }, 0.5, defOf(h).radius * 2.2);
    }
    h.hp = 0;
    h.state = 'dead';
  }
}

const TAU = Math.PI * 2;

/** The angle of ray `k` of the Aura's light beams `t` seconds into the song. */
export const beamAngle = (t: number, k: number): number =>
  t * LIGHT_BEAMS.spin + (k / LIGHT_BEAMS.count) * TAU;

/** Sends a sea wave out along `dir`, starting just past the trident's reach. */
function castSeaWave(s: CombatState, from: Vec2, dir: Vec2): void {
  s.seaWaves.push({
    id: s.nextId++,
    pos: { x: from.x + dir.x * 1.4, z: from.z + dir.z * 1.4 },
    dir,
    age: 0,
    hit: new Set(),
  });
}

/** Sends the sharks off: they leave the Surge wave and land at fixed spots outside it. */
function releaseSharks(s: CombatState, from: Vec2, facing: Vec2, world: CollisionWorld): void {
  const base = Math.atan2(facing.z, facing.x) + (s.nextId % 7) * 0.09;
  for (let k = 0; k < SHARKS.count; k++) {
    const a = base + (k / SHARKS.count) * TAU;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    const reach = SHARKS.landFrom + ((k % 3) / 2) * (SHARKS.landTo - SHARKS.landFrom);
    const land = resolveCircle(
      { x: from.x + dx * SPELL.radius * reach, z: from.z + dz * SPELL.radius * reach },
      0.4,
      world,
    );
    s.sharks.push({
      id: s.nextId++,
      from: {
        x: from.x + dx * SPELL.radius * SHARKS.startAt,
        z: from.z + dz * SPELL.radius * SHARKS.startAt,
      },
      to: land,
      age: -k * SHARKS.stagger,
    });
  }
}

/** Rosa's own passive effects for one step: sea waves in flight, sharks in the air, the Aura's light beams. */
function stepPassives(
  s: CombatState,
  p: { dt: number; playerPos: Vec2; world: CollisionWorld; mult: number },
  events: CombatEvent[],
): void {
  const { dt, playerPos, world, mult } = p;

  s.seaWaves = s.seaWaves.filter((w) => {
    w.age += dt;
    const next = {
      x: w.pos.x + w.dir.x * SEA_WAVE.speed * dt,
      z: w.pos.z + w.dir.z * SEA_WAVE.speed * dt,
    };
    const blocked = resolveCircle(next, 0.15, world);
    if (w.age > SEA_WAVE.life || Math.hypot(blocked.x - next.x, blocked.z - next.z) > 0.05) {
      return false;
    }
    w.pos = next;
    for (const e of s.enemies) {
      if (e.state === 'dead' || e.dormant || w.hit.has(e.id)) continue;
      if (!inCircle(w.pos, e.pos, defOf(e).radius, SEA_WAVE.radius)) continue;
      w.hit.add(e.id);
      hitEnemy(
        s,
        e,
        Math.round(TRIDENT.damage * SEA_WAVE.damageFactor * mult),
        w.pos,
        SEA_WAVE.knockback,
        events,
      );
    }
    return true;
  });

  s.sharks = s.sharks.filter((shark) => {
    shark.age += dt;
    if (shark.age < SHARKS.flight) return true;
    pushEffect(s, 'splash', shark.to.x, shark.to.z, { x: 0, z: 1 }, 0.55, SHARKS.blastRadius);
    for (const e of s.enemies) {
      if (e.state === 'dead' || e.dormant) continue;
      if (inCircle(shark.to, e.pos, defOf(e).radius, SHARKS.blastRadius)) {
        hitEnemy(
          s,
          e,
          Math.round(SPELL.damage * SHARKS.damageFactor * mult),
          shark.to,
          SHARKS.knockback,
          events,
        );
      }
    }
    return false;
  });

  if (s.aura.active && s.aura.beams) {
    const song = s.aura.song;
    const reach = song.maxRadius * Math.min(1, s.aura.t / song.duration);
    for (const e of s.enemies) {
      if (e.state === 'dead' || e.dormant) continue;
      if ((s.aura.beamAt[e.id] ?? 0) > s.time) continue;
      const dx = e.pos.x - playerPos.x;
      const dz = e.pos.z - playerPos.z;
      const r = Math.hypot(dx, dz);
      const er = defOf(e).radius;
      if (r > reach + er) continue;
      for (let k = 0; k < LIGHT_BEAMS.count; k++) {
        const a = beamAngle(s.aura.t, k);
        const along = dx * Math.cos(a) + dz * Math.sin(a);
        const across = Math.abs(-dx * Math.sin(a) + dz * Math.cos(a));
        if (along < -er || across > LIGHT_BEAMS.halfWidth + er) continue;
        s.aura.beamAt[e.id] = s.time + LIGHT_BEAMS.tick;
        hitEnemy(s, e, Math.round(LIGHT_BEAMS.damage * mult), playerPos, 0.5, events);
        break;
      }
    }
  }
}

/** The arcane blast of the level-50 Blink, where Rosa lands. */
function arcaneBlast(s: CombatState, at: Vec2, mult: number, events: CombatEvent[]): void {
  events.push({ type: 'passive', ability: 'blink' });
  pushEffect(s, 'arcane', at.x, at.z, { x: 0, z: 1 }, ARCANE_BLAST.life, ARCANE_BLAST.radius);
  for (const e of s.enemies) {
    if (e.state === 'dead' || e.dormant) continue;
    if (inCircle(at, e.pos, defOf(e).radius, ARCANE_BLAST.radius)) {
      hitEnemy(s, e, Math.round(ARCANE_BLAST.damage * mult), at, ARCANE_BLAST.knockback, events);
    }
  }
}

/** Advances combat by one fixed step. Mutates `s`. */
export function stepCombat(s: CombatState, p: CombatParams): CombatFrame {
  const { dt, playerPos, world } = p;
  const stats = p.stats ?? BASE_STATS;
  const events: CombatEvent[] = [];
  const frame: CombatFrame = {
    moveScale: 1,
    faceOverride: null,
    cancelWalk: false,
    blinkTo: null,
    events,
  };

  s.time += dt;
  s.invuln = Math.max(0, s.invuln - dt);
  s.hurtFlash = Math.max(0, s.hurtFlash - dt * 2.5);
  s.attackLock = Math.max(0, s.attackLock - dt);
  s.swing = Math.max(0, s.swing - dt);
  s.comboIdle += dt;
  s.blink = Math.max(0, s.blink - dt);
  s.mermaid = Math.max(0, s.mermaid - dt);
  s.sinceHurt += dt;
  tickCooldowns(s.cooldowns, dt);

  for (const [id, until] of Object.entries(s.charmed)) if (s.time >= until) delete s.charmed[id];

  s.hp = Math.min(s.hp, stats.maxHp);
  s.mana = Math.min(s.mana, stats.maxMana);
  if (!s.downed) {
    s.mana = Math.min(stats.maxMana, s.mana + stats.manaRegen * dt);
    if (s.sinceHurt >= HP_REGEN_DELAY) s.hp = Math.min(stats.maxHp, s.hp + HP_REGEN * dt);
  }

  const alive = !s.downed;
  let facing = p.playerFacing;
  const level = p.level ?? ALL_UNLOCKED_LEVEL;

  if (alive) {
    if (p.actions.blink && isUnlocked('blink', level) && canUse(s.cooldowns, s.mana, 'blink')) {
      const dest = p.resolveBlink?.(playerPos) ?? null;
      if (dest) {
        s.mana = spendAbility(s.cooldowns, s.mana, 'blink') ?? s.mana;
        events.push({ type: 'cast', ability: 'blink' });
        const dir = directionTo(playerPos, dest);
        pushEffect(s, 'bubbles', playerPos.x, playerPos.z, dir, 0.8, 1);
        pushEffect(s, 'bubbles', dest.x, dest.z, dir, 0.8, 1);
        s.invuln = Math.max(s.invuln, BLINK.invuln);
        s.blink = BLINK.pop;
        frame.blinkTo = dest;
        frame.cancelWalk = true;
        frame.faceOverride = dir;
        facing = dir;
        if (hasPassive('blink', level)) arcaneBlast(s, dest, stats.damageMult, events);
      }
    }

    if (p.actions.attack && isUnlocked('attack', level) && canUse(s.cooldowns, s.mana, 'attack')) {
      const targets = s.enemies
        .filter((e) => e.state !== 'dead' && !e.dormant)
        .map((e) => ({ id: e.id, pos: e.pos, radius: defOf(e).radius }));
      const assisted = aimAssist(playerPos, facing, targets, AIM_ASSIST.range, AIM_ASSIST.maxAngle);
      facing =
        assisted !== facing
          ? assisted
          : aimAssist(playerPos, facing, targets, AIM_ASSIST.closeRange, Math.PI);
      spendAbility(s.cooldowns, s.mana, 'attack');
      if (s.comboIdle > COMBO_RESET) s.combo = 0;
      const kind = s.combo;
      const step = TRIDENT_COMBO[kind] ?? TRIDENT_COMBO[0];
      s.cooldowns.attack = step.cooldown;
      s.combo = (kind + 1) % TRIDENT_COMBO.length;
      s.comboIdle = 0;
      events.push({ type: 'cast', ability: 'attack' });
      s.attackLock = ATTACK_LOCK;
      s.swing = step.swing;
      s.swingKind = kind;
      frame.faceOverride = facing;
      frame.cancelWalk = true;
      pushEffect(s, 'arc', playerPos.x, playerPos.z, facing, 0.16 + kind * 0.04, step.range, kind);
      if (hasPassive('attack', level)) {
        castSeaWave(s, playerPos, facing);
        events.push({ type: 'passive', ability: 'attack' });
      }
      for (const e of s.enemies) {
        if (e.state === 'dead' || e.dormant) continue;
        if (inCone(playerPos, facing, e.pos, defOf(e).radius, step.range, step.halfAngle)) {
          hitEnemy(
            s,
            e,
            Math.round(TRIDENT.damage * step.damage * stats.damageMult),
            playerPos,
            step.knockback,
            events,
          );
        }
      }
    }

    if (p.actions.spell && isUnlocked('spell', level) && canUse(s.cooldowns, s.mana, 'spell')) {
      s.mana = spendAbility(s.cooldowns, s.mana, 'spell') ?? s.mana;
      events.push({ type: 'cast', ability: 'spell' });
      frame.cancelWalk = true;
      startMermaid(s, SPELL.mermaid, playerPos);
      pushEffect(s, 'wave', playerPos.x, playerPos.z, facing, 0.95, SPELL.radius);
      if (hasPassive('spell', level)) {
        releaseSharks(s, playerPos, facing, world);
        events.push({ type: 'passive', ability: 'spell' });
      }
      for (const e of s.enemies) {
        if (e.state === 'dead' || e.dormant) continue;
        if (inCircle(playerPos, e.pos, defOf(e).radius, SPELL.radius)) {
          hitEnemy(
            s,
            e,
            Math.round(SPELL.damage * stats.damageMult),
            playerPos,
            SPELL.knockback,
            events,
          );
        }
      }
    }

    if (
      p.actions.aura &&
      isUnlocked('aura', level) &&
      !s.aura.active &&
      canUse(s.cooldowns, s.mana, 'aura')
    ) {
      s.mana = spendAbility(s.cooldowns, s.mana, 'aura') ?? s.mana;
      events.push({ type: 'cast', ability: 'aura' });
      const song = songFor(p.form);
      s.aura = {
        active: true,
        t: 0,
        hit: new Set(),
        song,
        beams: hasPassive('aura', level),
        beamAt: {},
      };
      startMermaid(s, song.duration + song.mermaidTail, playerPos);
      frame.cancelWalk = true;
    }
  }

  if (s.attackLock > 0) {
    frame.moveScale = ATTACK_LOCK_SCALE;
  }

  if (s.aura.active) {
    s.aura.t += dt;
    const song = s.aura.song;
    const radius = song.maxRadius * Math.min(1, s.aura.t / song.duration);
    for (const npc of p.npcs) {
      if (s.aura.hit.has(npc.id)) continue;
      if (inCircle(playerPos, npc.pos, 0.5, radius)) {
        s.aura.hit.add(npc.id);
        s.charmed[npc.id] = s.time + song.npcCharm;
        events.push({ type: 'npcCharmed', id: npc.id });
      }
    }
    for (const e of s.enemies) {
      if (e.state === 'dead' || e.dormant || s.aura.hit.has(e.id)) continue;
      if (inCircle(playerPos, e.pos, defOf(e).radius, radius)) {
        s.aura.hit.add(e.id);
        blindEnemy(
          e,
          s.time + song.enemyBlind * (isBossKind(e.kind) ? bossTuning(e.kind).blindFactor : 1),
        );
      }
    }
    if (s.aura.t >= song.duration) s.aura.active = false;
  }

  stepPassives(s, { dt, playerPos, world, mult: stats.damageMult }, events);

  if (p.companion) {
    if (s.companion?.id !== p.companion.id) {
      s.companion = createCompanion(p.companion.id, playerPos, facing);
    }
    const targets = s.downed
      ? []
      : s.enemies
          .filter((e) => e.state !== 'dead' && !e.dormant)
          .map((e) => ({ id: e.id, pos: e.pos, radius: defOf(e).radius }));
    const hit = stepCompanion(s.companion, {
      dt,
      player: playerPos,
      playerFacing: facing,
      targets,
      world,
    });
    const struck = hit ? s.enemies.find((e) => e.id === hit.enemyId) : undefined;
    if (hit && struck) {
      const from = s.companion.pos;
      hitEnemy(s, struck, Math.round(hit.damage * stats.damageMult), from, hit.knockback, events);
      pushEffect(
        s,
        'arc',
        from.x,
        from.z,
        hit.dir,
        0.16 + s.companion.swingKind * 0.04,
        1.9,
        s.companion.swingKind,
      );
    }
  } else {
    s.companion = null;
  }

  const dormantLeft = s.enemies.filter((e) => e.dormant).length;
  for (const e of s.enemies) {
    if (e.dormant) continue;
    if (isBossKind(e.kind)) {
      const out = stepBoss(
        e,
        {
          player: playerPos,
          playerAlive: alive,
          time: s.time,
          world,
          arena: p.arena ?? null,
          dormantLeft,
        },
        dt,
      );
      for (const spec of out.hazards)
        s.hazards.push({ ...spec, id: s.nextId++, age: 0, hit: false });
      for (const dart of out.darts) {
        s.projectiles.push({
          id: s.nextId++,
          pos: { ...dart.from },
          vel: { x: dart.dir.x * dart.speed, z: dart.dir.z * dart.speed },
          damage: dart.damage,
          age: 0,
        });
      }
      if (out.phaseChanged)
        events.push({ type: 'bossPhase', phase: out.phaseChanged, kind: e.kind });
      if (out.summon > 0) {
        const woken = s.enemies.filter((h) => h.dormant).slice(0, out.summon);
        for (const h of woken) {
          wakeEnemy(h);
          pushEffect(s, 'puff', h.pos.x, h.pos.z, { x: 0, z: 1 }, 0.6, defOf(h).radius * 3);
        }
        if (woken.length > 0) events.push({ type: 'bossSummon', count: woken.length });
      }
      continue;
    }
    const action = stepEnemy(e, { player: playerPos, playerAlive: alive, time: s.time, world }, dt);
    // Instanced monsters (the underground) stay down until Rosa leaves and re-enters.
    if (e.state === 'dead' && e.deadFor >= RESPAWN_SECONDS && !e.helper && !e.instanced)
      respawnEnemy(e);
    if (!action) continue;
    if (action.kind === 'melee') {
      const reach = action.blind ? BLIND_MELEE_REACH : action.range + PLAYER_RADIUS;
      if (Math.hypot(playerPos.x - action.origin.x, playerPos.z - action.origin.z) <= reach) {
        hurtPlayer(s, action.damage, events, stats.reduction);
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

  const stepped = stepHazards(s.hazards, dt);
  s.hazards = stepped.remaining;
  for (const h of stepped.landed) {
    if (alive && overlapsHazard(h.shape, playerPos, PLAYER_RADIUS)) {
      hurtPlayer(s, h.damage, events, stats.reduction);
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
      hurtPlayer(s, proj.damage, events, stats.reduction);
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
export function revive(s: CombatState, stats: PlayerStats = BASE_STATS): void {
  s.downed = false;
  s.hp = Math.round(stats.maxHp * REVIVE_HP_FRACTION);
  s.mana = stats.maxMana;
  s.invuln = 2;
  s.sinceHurt = 0;
  s.projectiles = [];
  s.seaWaves = [];
  s.sharks = [];
  s.hazards = [];
  s.aura.active = false;
  s.swing = 0;
  s.combo = 0;
  s.mermaid = 0;
  for (const e of s.enemies) standDown(e);
}
