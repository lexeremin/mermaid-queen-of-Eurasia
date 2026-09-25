import type { EnemyKind } from '@/data/enemies';
import type { ItemId } from '@/data/items';

type Roll = { id: ItemId; chance: number };
type LootTable = { rolls: readonly Roll[]; gear: { chance: number; pool: readonly ItemId[] } };

/** Drops are rare on purpose: most kills give nothing, and gear is a real event. */
export const LOOT_TABLES: Readonly<Record<EnemyKind, LootTable>> = {
  tycoon: {
    rolls: [
      { id: 'healingTea', chance: 0.1 },
      { id: 'coldKvass', chance: 0.07 },
      { id: 'pearl', chance: 0.08 },
    ],
    gear: { chance: 0.015, pool: ['silverTrident', 'roseBrooch', 'rainCloak'] },
  },
  speaker: {
    rolls: [
      { id: 'healingTea', chance: 0.2 },
      { id: 'coldKvass', chance: 0.12 },
      { id: 'pearl', chance: 0.15 },
    ],
    gear: { chance: 0.08, pool: ['rainCloak', 'silverTrident', 'amberPendant', 'pearlTrident'] },
  },
  demagogue: {
    rolls: [
      { id: 'healingTea', chance: 0.08 },
      { id: 'coldKvass', chance: 0.14 },
      { id: 'pearl', chance: 0.08 },
    ],
    gear: { chance: 0.04, pool: ['roseBrooch', 'songbirdWhistle', 'velvetGown'] },
  },
  registrar: {
    rolls: [
      { id: 'healingTea', chance: 0.5 },
      { id: 'coldKvass', chance: 0.3 },
      { id: 'pearl', chance: 0.4 },
    ],
    gear: { chance: 0.3, pool: ['pearlTrident', 'velvetGown', 'songbirdWhistle'] },
  },
  // The boss's rewards are handed out by the boss fight itself (see dungeon-actions).
  boss: { rolls: [], gear: { chance: 0, pool: [] } },
  lobbyist: { rolls: [], gear: { chance: 0, pool: [] } },
  senator: { rolls: [], gear: { chance: 0, pool: [] } },
  baron: { rolls: [], gear: { chance: 0, pool: [] } },
  spin: { rolls: [], gear: { chance: 0, pool: [] } },
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
