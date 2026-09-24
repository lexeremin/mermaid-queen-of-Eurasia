import type { AssetId } from '@/data/assets';

export type EnemyKind = 'paperWisp' | 'stampGolem' | 'memoThrower';

export type EnemyDef = {
  kind: EnemyKind;
  name: string;
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
  /** Ranged enemies back off inside this distance and close in beyond `preferMax`. */
  preferMin: number;
  preferMax: number;
  projectileSpeed: number;
  scale: number;
};

export const ENEMIES: Readonly<Record<EnemyKind, EnemyDef>> = {
  paperWisp: {
    kind: 'paperWisp',
    name: 'Paper Wisp',
    asset: 'enemyWisp',
    maxHp: 18,
    speed: 4.6,
    radius: 0.4,
    aggroRange: 9,
    attackRange: 1.1,
    damage: 6,
    windup: 0.25,
    recover: 0.55,
    knockbackResist: 0,
    ranged: false,
    preferMin: 0,
    preferMax: 0,
    projectileSpeed: 0,
    scale: 1,
  },
  stampGolem: {
    kind: 'stampGolem',
    name: 'Stamp Golem',
    asset: 'enemyStamper',
    maxHp: 60,
    speed: 2.4,
    radius: 0.8,
    aggroRange: 8,
    attackRange: 2.0,
    damage: 16,
    windup: 0.7,
    recover: 1.0,
    knockbackResist: 0.6,
    ranged: false,
    preferMin: 0,
    preferMax: 0,
    projectileSpeed: 0,
    scale: 1,
  },
  memoThrower: {
    kind: 'memoThrower',
    name: 'Memo Thrower',
    asset: 'enemyMemo',
    maxHp: 28,
    speed: 3.0,
    radius: 0.5,
    aggroRange: 10,
    attackRange: 9,
    damage: 8,
    windup: 0.45,
    recover: 1.3,
    knockbackResist: 0.2,
    ranged: true,
    preferMin: 5,
    preferMax: 8,
    projectileSpeed: 9,
    scale: 1,
  },
};

export const RESPAWN_SECONDS = 40;
export const LEASH_DISTANCE = 20;
