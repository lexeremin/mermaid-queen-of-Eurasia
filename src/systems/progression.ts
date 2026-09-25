import { MERMAID, type Form } from '@/systems/abilities';
import { ITEMS, isItemId, type Bonuses, type EquipSlot, type ItemId } from '@/data/items';

/** The level cap: skills come one by one up to level 10, passives every tenth level after (see `skills.ts`). */
export const MAX_LEVEL = 60;

/** The level after which each level adds more (see `computeStats`). */
const VETERAN_FROM = 10;

/** Levels 1 to 9 cost 40, 70, 100... XP; from the tenth the steps are bigger, because the cap is sixty. */
export const xpToNext = (level: number): number =>
  level < 10 ? 40 + 30 * (level - 1) : 280 + 70 * (level - 9);

export type Progress = { level: number; xp: number };

export type LevelUpResult = { progress: Progress; levelsGained: number };

/** Adds XP, rolling over into as many levels as it pays for. At the cap XP stops accumulating. */
export function addXp(progress: Progress, amount: number): LevelUpResult {
  if (amount <= 0 || progress.level >= MAX_LEVEL) return { progress, levelsGained: 0 };
  let { level, xp } = progress;
  xp += amount;
  let levelsGained = 0;
  while (level < MAX_LEVEL && xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    levelsGained += 1;
  }
  if (level >= MAX_LEVEL) xp = 0;
  return { progress: { level, xp }, levelsGained };
}

export type Equipment = Record<EquipSlot, ItemId | null>;

export type PlayerStats = {
  maxHp: number;
  maxMana: number;
  damageMult: number;
  /** Fraction of damage taken that is ignored, 0..MAX_REDUCTION. */
  reduction: number;
  manaRegen: number;
};

export const BASE_HP = 100;
export const BASE_MANA = 100;
export const BASE_MANA_REGEN = 5;
export const MAX_REDUCTION = 0.6;

export const BASE_STATS: PlayerStats = {
  maxHp: BASE_HP,
  maxMana: BASE_MANA,
  damageMult: 1,
  reduction: 0,
  manaRegen: BASE_MANA_REGEN,
};

const ZERO: Bonuses = { maxHp: 0, maxMana: 0, damagePct: 0, reductionPct: 0, manaRegen: 0 };

export function equipmentBonuses(equipment: Equipment): Bonuses {
  const total = { ...ZERO };
  for (const id of Object.values(equipment)) {
    if (!id || !isItemId(id)) continue;
    const def = ITEMS[id];
    if (def.kind !== 'equipment') continue;
    const bonuses: Partial<Bonuses> = def.bonuses;
    for (const key of Object.keys(bonuses) as (keyof Bonuses)[]) total[key] += bonuses[key] ?? 0;
  }
  return total;
}

/** Derived stats from level and equipment. */
export function computeStats(
  level: number,
  equipment: Equipment,
  form: Form = 'human',
): PlayerStats {
  const l = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
  const b = equipmentBonuses(equipment);
  /** Levels past the tenth grow a little faster: the dungeon below gets a lot harder. */
  const veteran = Math.max(0, l - VETERAN_FROM);
  return {
    maxHp: BASE_HP + 10 * (l - 1) + 4 * veteran + b.maxHp,
    maxMana: BASE_MANA + 8 * (l - 1) + 4 * veteran + b.maxMana,
    damageMult: 1 + 0.06 * (l - 1) + 0.03 * veteran + b.damagePct / 100,
    reduction: Math.min(MAX_REDUCTION, b.reductionPct / 100),
    manaRegen: BASE_MANA_REGEN + b.manaRegen + (form === 'mermaid' ? MERMAID.manaRegen : 0),
  };
}

export const XP_REWARDS = {
  enemy: {
    tycoon: 15,
    speaker: 40,
    demagogue: 22,
    registrar: 120,
    boss: 400,
    lobbyist: 450,
    senator: 550,
    baron: 500,
    spin: 450,
  },
  npcMesmerized: 25,
  npcJoined: 50,
} as const;
