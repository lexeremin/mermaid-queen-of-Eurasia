import type { EnemyKind } from '@/data/enemies';
import type { ItemId } from '@/data/items';

type Roll = { id: ItemId; chance: number };
type LootTable = { rolls: readonly Roll[]; gear: { chance: number; pool: readonly ItemId[] } };

export const LOOT_TABLES: Readonly<Record<EnemyKind, LootTable>> = {
  tycoon: {
    rolls: [
      { id: 'healingTea', chance: 0.3 },
      { id: 'coldKvass', chance: 0.2 },
      { id: 'pearl', chance: 0.25 },
    ],
    gear: { chance: 0.06, pool: ['silverTrident', 'roseBrooch', 'rainCloak'] },
  },
  speaker: {
    rolls: [
      { id: 'healingTea', chance: 0.55 },
      { id: 'coldKvass', chance: 0.35 },
      { id: 'pearl', chance: 0.4 },
    ],
    gear: { chance: 0.3, pool: ['rainCloak', 'silverTrident', 'amberPendant', 'pearlTrident'] },
  },
  demagogue: {
    rolls: [
      { id: 'healingTea', chance: 0.25 },
      { id: 'coldKvass', chance: 0.45 },
      { id: 'pearl', chance: 0.25 },
    ],
    gear: { chance: 0.15, pool: ['roseBrooch', 'songbirdWhistle', 'velvetGown'] },
  },
};

/** Rolls the drops for one kill. `random` returns [0, 1). */
export function rollLoot(kind: EnemyKind, random: () => number): ItemId[] {
  const table = LOOT_TABLES[kind];
  const drops: ItemId[] = [];
  for (const roll of table.rolls) if (random() < roll.chance) drops.push(roll.id);
  if (random() < table.gear.chance) {
    const pick = table.gear.pool[Math.floor(random() * table.gear.pool.length)];
    if (pick) drops.push(pick);
  }
  return drops;
}
