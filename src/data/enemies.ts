import type { AssetId } from '@/data/assets';

/**
 * Original satirical politician caricatures, defined by costume and weapon.
 * None is meant to resemble, or resembles, any real person.
 */
export type EnemyKind =
  | 'tycoon'
  | 'speaker'
  | 'demagogue'
  | 'registrar'
  | 'boss'
  | 'lobbyist'
  | 'senator'
  | 'baron'
  | 'spin';

/** The underground's bosses, in the order they guard the tenth layers (then it starts again, tougher). */
export const BOSS_KINDS: readonly EnemyKind[] = ['boss', 'lobbyist', 'senator', 'baron', 'spin'];
/** What each boss shouts when he calls for backup (phase 2) and when he loses his temper (phase 3). */
export const BOSS_LINES: Readonly<Record<string, { angry: string; furious: string }>> = {
  boss: {
    angry: 'The Father of Corruption calls for backup!',
    furious: 'Form 27-B: he is furious!',
  },
  lobbyist: {
    angry: 'The Lobbyist makes a few phone calls: backup arrives!',
    furious: 'The Lobbyist stops smiling and raises his voice!',
  },
  senator: {
    angry: 'Senator Endless calls a recess... for his guards!',
    furious: 'The Senator is out of patience and out of order!',
  },
  baron: {
    angry: 'The Yacht Baron calls up his deckhands!',
    furious: 'The Baron is seasick with fury!',
  },
  spin: {
    angry: 'The Spin Doctor spins it: reinforcements!',
    furious: 'The Spin Doctor has lost control of the narrative!',
  },
};

export const isBossKind = (kind: EnemyKind): boolean => BOSS_KINDS.includes(kind);

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
  // The other underground bosses: original satirical archetypes. Their moves live in systems/boss.ts.
  lobbyist: {
    kind: 'lobbyist',
    name: 'The Lobbyist',
    weapon: 'briefcase of donations',
    asset: 'bossLobbyist',
    maxHp: 1100,
    speed: 2.4,
    radius: 1.1,
    aggroRange: 16,
    attackRange: 3.4,
    damage: 20,
    windup: 1.0,
    recover: 1.4,
    knockbackResist: 0.97,
    ranged: false,
    lunge: false,
    preferMin: 0,
    preferMax: 0,
    projectileSpeed: 11,
    scale: 1,
    headHeight: 6.0,
    markHeight: 9.0,
    headRadius: 0.8,
  },
  senator: {
    kind: 'senator',
    name: 'Senator Endless',
    weapon: 'megaphone and an endless scroll',
    asset: 'bossSenator',
    maxHp: 1300,
    speed: 1.2,
    radius: 1.8,
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
    projectileSpeed: 7,
    scale: 1,
    headHeight: 6.1,
    markHeight: 8.6,
    headRadius: 1.0,
  },
  baron: {
    kind: 'baron',
    name: 'The Yacht Baron',
    weapon: 'golden anchor',
    asset: 'bossBaron',
    maxHp: 1300,
    speed: 1.8,
    radius: 1.6,
    aggroRange: 16,
    attackRange: 3.4,
    damage: 24,
    windup: 1.0,
    recover: 1.4,
    knockbackResist: 0.97,
    ranged: false,
    lunge: false,
    preferMin: 0,
    preferMax: 0,
    projectileSpeed: 9,
    scale: 1,
    headHeight: 6.1,
    markHeight: 8.8,
    headRadius: 0.9,
  },
  spin: {
    kind: 'spin',
    name: 'The Spin Doctor',
    weapon: 'giant microphone',
    asset: 'bossSpin',
    maxHp: 1000,
    speed: 3.0,
    radius: 1.0,
    aggroRange: 16,
    attackRange: 3.4,
    damage: 18,
    windup: 1.0,
    recover: 1.4,
    knockbackResist: 0.97,
    ranged: false,
    lunge: false,
    preferMin: 0,
    preferMax: 0,
    projectileSpeed: 12,
    scale: 1,
    headHeight: 6.0,
    markHeight: 9.2,
    headRadius: 0.8,
  },
};

/** Surface monsters return after three minutes (the underground refills only when Rosa re-enters it). */
export const RESPAWN_SECONDS = 180;
export const LEASH_DISTANCE = 20;
