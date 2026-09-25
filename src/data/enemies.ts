import type { AssetId } from '@/data/assets';

/**
 * Original satirical politician caricatures, defined by costume and weapon.
 * None is meant to resemble, or resembles, any real person.
 */
export type EnemyKind = 'tycoon' | 'speaker' | 'demagogue' | 'registrar' | 'boss';

export type EnemyDef = {
  kind: EnemyKind;
  name: string;
  weapon: string;
  asset: AssetId;
  maxHp: number;
  speed: number;
  radius: number;
  aggroRange: number;
  /** Melee reach (or projectile range for ranged enemies). */
  attackRange: number;
  damage: number;
  windup: number;
  recover: number;
  knockbackResist: number;
  ranged: boolean;
  /** Lunges forward during the strike. */
  lunge: boolean;
  /** Ranged enemies back off inside this distance and close in beyond `preferMax`. */
  preferMin: number;
  preferMax: number;
  projectileSpeed: number;
  scale: number;
  /** Height of the head (blindfold band) and of the floating debuff icon, in metres. */
  headHeight: number;
  markHeight: number;
  headRadius: number;
};

export const ENEMIES: Readonly<Record<EnemyKind, EnemyDef>> = {
  tycoon: {
    kind: 'tycoon',
    name: 'Zelebeba',
    weapon: 'giant golden fountain pen',
    asset: 'enemyTycoon',
    maxHp: 24,
    speed: 4.2,
    radius: 0.45,
    aggroRange: 9,
    attackRange: 1.7,
    damage: 8,
    windup: 0.3,
    recover: 0.6,
    knockbackResist: 0.1,
    ranged: false,
    lunge: true,
    preferMin: 0,
    preferMax: 0,
    projectileSpeed: 0,
    scale: 1,
    headHeight: 2.08,
    markHeight: 3.15,
    headRadius: 0.3,
  },
  speaker: {
    kind: 'speaker',
    name: 'Uncle Sosunok',
    weapon: 'enormous gavel',
    asset: 'enemySpeaker',
    maxHp: 70,
    speed: 2.3,
    radius: 0.8,
    aggroRange: 8,
    attackRange: 2.2,
    damage: 18,
    windup: 0.75,
    recover: 1.1,
    knockbackResist: 0.6,
    ranged: false,
    lunge: false,
    preferMin: 0,
    preferMax: 0,
    projectileSpeed: 0,
    scale: 1,
    headHeight: 2.2,
    markHeight: 3.3,
    headRadius: 0.36,
  },
  demagogue: {
    kind: 'demagogue',
    name: 'Ugrumiy Putan',
    weapon: 'megaphone (sound blasts)',
    asset: 'enemyDemagogue',
    maxHp: 32,
    speed: 3.0,
    radius: 0.5,
    aggroRange: 10,
    attackRange: 9,
    damage: 9,
    windup: 0.5,
    recover: 1.3,
    knockbackResist: 0.2,
    ranged: true,
    lunge: false,
    preferMin: 5,
    preferMax: 8,
    projectileSpeed: 8,
    scale: 1,
    headHeight: 2.15,
    markHeight: 3.0,
    headRadius: 0.28,
  },
  // The underground's elite: a bigger, tougher gavel-bearer who carries the Registrar's Stamp.
  registrar: {
    kind: 'registrar',
    name: 'Chief Registrar',
    weapon: 'stamp of denial',
    asset: 'enemySpeaker',
    maxHp: 260,
    speed: 2.6,
    radius: 1.1,
    aggroRange: 10,
    attackRange: 3.0,
    damage: 20,
    windup: 0.7,
    recover: 1.0,
    knockbackResist: 0.75,
    ranged: false,
    lunge: false,
    preferMin: 0,
    preferMax: 0,
    projectileSpeed: 0,
    scale: 1.4,
    headHeight: 2.2,
    markHeight: 4.6,
    headRadius: 0.36,
  },
  // The Father of Corruption. His moves live in systems/boss.ts; these are the shared numbers.
  boss: {
    kind: 'boss',
    name: 'Father of Corruption',
    weapon: 'colossal rubber stamp',
    asset: 'bossRegistrar',
    maxHp: 900,
    speed: 1.6,
    radius: 1.6,
    aggroRange: 16,
    attackRange: 3.4,
    damage: 22,
    windup: 1.0,
    recover: 1.4,
    knockbackResist: 0.97,
    ranged: false,
    lunge: false,
    preferMin: 0,
    preferMax: 0,
    projectileSpeed: 9,
    scale: 1,
    headHeight: 5.7,
    markHeight: 8.4,
    headRadius: 0.85,
  },
};

/** Surface monsters return after three minutes (the underground refills only when Rosa re-enters it). */
export const RESPAWN_SECONDS = 180;
export const LEASH_DISTANCE = 20;
