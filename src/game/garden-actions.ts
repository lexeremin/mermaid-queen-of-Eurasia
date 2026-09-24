import { ITEMS, type ItemId } from '@/data/items';
import { playSfx } from '@/audio/sfx';
import { combat } from '@/game/combat-sim';
import { gather } from '@/game/gather-sim';
import { awardOnce } from '@/game/progress-actions';
import { track } from '@/net/stats';
import { useGameStore } from '@/store/game-store';
import { useGardenStore } from '@/store/garden-store';
import { currentStats, useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { stepGathering, type GatherNode } from '@/systems/gathering';
import { addToBag } from '@/systems/inventory';

const toast = (text: string, kind: 'xp' | 'item' | 'warn' | 'info' = 'info') =>
  useToastStore.getState().push(text, kind);

export const ITEM_OF_NODE: Record<GatherNode['kind'], ItemId> = {
  roseHip: 'roseHip',
  moonMint: 'moonMint',
  pearl: 'pearl',
};

export const SHRINE_XP = 60;
export const SHRINE_GIFT: readonly { id: ItemId; qty: number }[] = [
  { id: 'pearlTrident', qty: 1 },
  { id: 'pearl', qty: 2 },
];

function take(node: GatherNode): boolean {
  const item = ITEM_OF_NODE[node.kind];
  if (useProgressStore.getState().addItem(item).added === 0) return false;
  if (node.kind === 'pearl') {
    useGardenStore.getState().takePearl(node.id);
    toast('Found a hidden pearl', 'item');
  } else {
    toast(`Gathered ${ITEMS[item].name}`, 'item');
  }
  playSfx('gather');
  return true;
}

let lastFull = -Infinity;

/** One fixed step of herb and pearl picking around Rosa. */
export function stepGather(dt: number, playerPos: { x: number; z: number }): void {
  gather.time += dt;
  if (gather.nodes.length === 0) return;
  const step = stepGathering(gather.nodes, playerPos, gather.time, take);
  if (step.blocked.length > 0 && gather.time - lastFull > 3) {
    lastFull = gather.time;
    toast('Bag full', 'warn');
  }
}

/** Kneeling at the shrine: the first visit gives a gift once ever; every later visit restores health and mana. */
export function prayAtShrine(): void {
  const garden = useGardenStore.getState();
  if (!garden.shrineGift) {
    let bag = useProgressStore.getState().bag;
    for (const gift of SHRINE_GIFT) {
      const added = addToBag(bag, gift.id, gift.qty);
      if (added.leftover > 0) {
        toast('Make room in your bag for the shrine’s gift', 'warn');
        return;
      }
      bag = added.bag;
    }
    useProgressStore.getState().setBag(bag);
    garden.giveShrineGift();
    toast('The shrine gives you the Pearl Trident', 'item');
    playSfx('wave');
    track('shrine_gift');
    return;
  }
  const stats = currentStats();
  if (combat.hp >= stats.maxHp - 0.5 && combat.mana >= stats.maxMana - 0.5) {
    toast('You are already rested', 'info');
    return;
  }
  combat.hp = stats.maxHp;
  combat.mana = stats.maxMana;
  toast('The shrine restores you', 'info');
  playSfx('wave');
}

/** Announces the shrine the first time Rosa steps into its nook (XP once ever). Call once at startup. */
export function startGardenHooks(): void {
  useGameStore.subscribe((state, prev) => {
    if (state.zone?.id === 'pearl-shrine' && prev.zone?.id !== 'pearl-shrine') {
      awardOnce('shrine-found', SHRINE_XP, 'Found the Pearl Shrine');
    }
  });
}
