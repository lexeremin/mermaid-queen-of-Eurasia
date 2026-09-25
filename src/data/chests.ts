import { ITEMS, type ItemId } from '@/data/items';
import { layerTier } from '@/data/maps/underground';
import { mulberry32 } from '@/utils/random';

export type ChestLoot = { label: string; items: readonly { id: ItemId; qty: number }[] };

const CHEST_ID = /^L(\d{1,3})-c(\d)$/;

/** Gear a chest can hold, by tier (ten layers each): the better pieces only turn up deeper. */
const GEAR: readonly (readonly ItemId[])[] = [
  ['silverTrident', 'roseBrooch', 'rainCloak', 'amberPendant'],
  ['silverTrident', 'rainCloak', 'amberPendant', 'songbirdWhistle'],
  ['songbirdWhistle', 'velvetGown', 'pearlTrident'],
  ['velvetGown', 'pearlTrident', 'songbirdWhistle', 'registrarSeal'],
];

/**
 * What a chest holds, from its id (`L12-c1`: layer 12, the first chest): potions, some pearls and, now and then,
 * a piece of gear that gets better with depth. The same id always holds the same things.
 */
export function chestLoot(id: string): ChestLoot | null {
  const match = CHEST_ID.exec(id);
  if (!match) return null;
  const layer = Number(match[1]);
  const index = Number(match[2]);
  if (layer < 1 || layer > 100) return null;
  const rng = mulberry32(layer * 977 + index * 31 + 5);
  const tier = layerTier(layer);
  const items: { id: ItemId; qty: number }[] = [
    { id: 'healingTea', qty: 2 + Math.floor(rng() * 2) + (tier >= 3 ? 1 : 0) },
    { id: 'coldKvass', qty: 2 + Math.floor(rng() * 2) + (tier >= 3 ? 1 : 0) },
  ];
  if (rng() < 0.45) items.push({ id: 'pearl', qty: 1 + Math.floor(rng() * 3) });
  if (rng() < Math.min(0.7, 0.3 + tier * 0.05)) {
    const pool = GEAR[Math.min(GEAR.length - 1, Math.floor(tier / 2))]!;
    items.push({ id: pool[Math.floor(rng() * pool.length)]!, qty: 1 });
  }
  return { label: `chest of depth ${layer}`, items: items.filter((i) => i.id in ITEMS) };
}
