import { NPC_BY_ID } from '@/data/npcs';
import { ITEMS, type ItemDef, type ItemId } from '@/data/items';
import { combat } from '@/game/combat-sim';
import { dropOnGround } from '@/game/loot-sim';
import { sim } from '@/game/sim';
import { track } from '@/net/stats';
import { useGameStore } from '@/store/game-store';
import { useNpcStore } from '@/store/npc-store';
import { currentStats, useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { firstIndexOf } from '@/systems/inventory';
import { XP_REWARDS } from '@/systems/progression';
import { MESMERIZED_AT } from '@/systems/relationship';

const toast = (text: string, kind: 'xp' | 'item' | 'warn' | 'info' = 'info') =>
  useToastStore.getState().push(text, kind);

/** Level-up: full heal, banner, stat event. */
function onLevelUp(levelsGained: number): void {
  if (levelsGained <= 0) return;
  const stats = currentStats();
  combat.hp = stats.maxHp;
  combat.mana = stats.maxMana;
  const level = useProgressStore.getState().level;
  useToastStore.getState().announceLevelUp(level);
  track('level_up', { level });
}

export function grantXp(amount: number, label?: string): void {
  const gained = useProgressStore.getState().gainXp(amount);
  toast(label ? `+${amount} XP  ${label}` : `+${amount} XP`, 'xp');
  onLevelUp(gained);
}

/** One-time XP for a milestone, keyed so reloads and cloud pulls cannot award it twice. */
function awardOnce(key: string, amount: number, label: string): void {
  const result = useProgressStore.getState().award(key, amount);
  if (!result.awarded) return;
  toast(`+${amount} XP  ${label}`, 'xp');
  onLevelUp(result.levelsGained);
}

/** XP for NPC milestones (first mesmerized, joined the kingdom). Also catches up on saves that predate XP. */
export function startProgressHooks(): void {
  const check = () => {
    for (const [id, n] of Object.entries(useNpcStore.getState().npcs)) {
      const name = NPC_BY_ID.get(id)?.name ?? id;
      if (n.relationship >= MESMERIZED_AT)
        awardOnce(`mes:${id}`, XP_REWARDS.npcMesmerized, `${name} is mesmerized`);
      if (n.joined) awardOnce(`join:${id}`, XP_REWARDS.npcJoined, `${name} joined the kingdom`);
    }
  };
  useNpcStore.subscribe(check);
  useProgressStore.subscribe((s, prev) => {
    if (s.awarded.length < prev.awarded.length) check();
  });
  check();
}

export type UseResult = 'used' | 'full' | 'blocked' | 'empty';

/** Uses a consumable from the bag. Refuses (and keeps the item) when it would do nothing. */
export function consumeAt(index: number): UseResult {
  const slot = useProgressStore.getState().bag[index];
  if (!slot) return 'empty';
  const def: ItemDef = ITEMS[slot.id];
  if (def.kind !== 'consumable') return 'blocked';
  if (combat.downed) return 'blocked';
  const stats = currentStats();
  const needsHp = def.heal !== undefined && combat.hp < stats.maxHp - 0.5;
  const needsMana = def.mana !== undefined && combat.mana < stats.maxMana - 0.5;
  if (!needsHp && !needsMana) {
    toast(def.heal !== undefined ? 'Health is already full' : 'Mana is already full', 'warn');
    return 'full';
  }
  if (def.heal !== undefined) combat.hp = Math.min(stats.maxHp, combat.hp + def.heal);
  if (def.mana !== undefined) combat.mana = Math.min(stats.maxMana, combat.mana + def.mana);
  useProgressStore.getState().removeAt(index);
  toast(`Used ${def.name}`, 'item');
  return 'used';
}

export function quickUse(id: ItemId): UseResult {
  const index = firstIndexOf(useProgressStore.getState().bag, id);
  if (index < 0) {
    toast(`No ${ITEMS[id].name} left`, 'warn');
    return 'empty';
  }
  return consumeAt(index);
}

export function dropAt(index: number): void {
  const slot = useProgressStore.getState().bag[index];
  if (!slot) return;
  useProgressStore.getState().removeAt(index);
  dropOnGround(slot.id, sim.curr.pos);
  toast(`Dropped ${ITEMS[slot.id].name}`, 'info');
}

/** Ignore quick-use while the world is paused or a panel is open. */
export const canQuickUse = (): boolean => {
  const s = useGameStore.getState();
  return !s.paused && !s.inventoryOpen && !s.questPanel && !s.dialogueOpen && !s.downed;
};
