import type { EnemyKind } from '@/data/enemies';
import { ITEMS } from '@/data/items';
import { QUEST_BY_ID } from '@/data/quests';
import { grantXp } from '@/game/progress-actions';
import { track } from '@/net/stats';
import { useGameStore } from '@/store/game-store';
import { useNpcStore } from '@/store/npc-store';
import { useProgressStore } from '@/store/progress-store';
import { useQuestStore } from '@/store/quest-store';
import { useToastStore } from '@/store/toast-store';
import {
  acceptQuest,
  claimQuest,
  isReady,
  rankIndex,
  rankName,
  recordKill,
  recordVisit,
  reputation,
  type WorldView,
} from '@/systems/quests';

const toast = (text: string, kind: 'xp' | 'item' | 'warn' | 'info' = 'info') =>
  useToastStore.getState().push(text, kind);

export function worldView(): WorldView {
  const { level, bag } = useProgressStore.getState();
  const npcs = useNpcStore.getState().npcs;
  return {
    level,
    bag,
    joinedCount: Object.values(npcs).filter((n) => n.joined).length,
    relationship: (id) => npcs[id]?.relationship ?? 0,
  };
}

export const currentReputation = (): number =>
  reputation(useQuestStore.getState().log, worldView().joinedCount);

export const currentRank = (): number => rankIndex(currentReputation());

export function acceptQuestAction(id: string): boolean {
  const { log, setLog } = useQuestStore.getState();
  const next = acceptQuest(log, id, currentRank());
  if (!next) return false;
  setLog(next);
  toast(`Quest accepted: ${QUEST_BY_ID.get(id)?.title ?? id}`, 'info');
  track('quest_accepted', { id });
  return true;
}

export function claimQuestAction(id: string): boolean {
  const def = QUEST_BY_ID.get(id);
  const { log, setLog } = useQuestStore.getState();
  const result = claimQuest(log, id, worldView());
  if (!def || !result.ok) {
    if (result.ok === false && result.reason === 'bag-full')
      toast('Bag too full for the reward', 'warn');
    return false;
  }
  useProgressStore.getState().setBag(result.bag);
  setLog(result.log);
  toast(`Quest complete: ${def.title}`, 'info');
  for (const item of def.reward.items ?? []) toast(`Received ${ITEMS[item.id].name}`, 'item');
  grantXp(def.reward.xp);
  track('quest_completed', { id });
  return true;
}

export function onEnemyDefeatedForQuests(kind: EnemyKind): void {
  const { log, setLog } = useQuestStore.getState();
  const next = recordKill(log, kind);
  if (next !== log) setLog(next);
}

/** Watches zones and announces readiness and rank-ups. Call once at startup, after the save is applied. */
export function startQuestHooks(): void {
  useGameStore.subscribe((state, prev) => {
    if (state.zone && state.zone.id !== prev.zone?.id) {
      const { log, setLog } = useQuestStore.getState();
      const next = recordVisit(log, state.zone.id);
      if (next !== log) setLog(next);
    }
  });

  const readyIds = () => {
    const { log } = useQuestStore.getState();
    const view = worldView();
    return Object.entries(log.active)
      .filter(([id, progress]) => {
        const def = QUEST_BY_ID.get(id);
        return def ? isReady(def, progress, view) : false;
      })
      .map(([id]) => id);
  };

  let ready = new Set(readyIds());
  let rank = currentRank();
  const refresh = () => {
    const now = readyIds();
    for (const id of now) {
      if (!ready.has(id))
        toast(`Quest ready: ${QUEST_BY_ID.get(id)?.title}. Claim it at the board.`, 'xp');
    }
    ready = new Set(now);
    const nextRank = currentRank();
    if (nextRank > rank) toast(`Kingdom rank: ${rankName(nextRank)}`, 'xp');
    rank = nextRank;
  };
  useQuestStore.subscribe(refresh);
  useProgressStore.subscribe(refresh);
  useNpcStore.subscribe(refresh);
}
