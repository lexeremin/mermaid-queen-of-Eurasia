import { ENEMIES, type EnemyKind } from '@/data/enemies';
import { ITEMS } from '@/data/items';
import { NPC_BY_ID } from '@/data/npcs';
import { JOIN_REPUTATION, QUEST_BY_ID, RANKS, type Objective, type QuestDef } from '@/data/quests';
import { addToBag, removeFromBag, countOf, type Bag } from '@/systems/inventory';
import { MESMERIZED_AT } from '@/systems/relationship';

export type QuestProgress = { counts: number[]; visited: string[] };

export type QuestLog = {
  active: Readonly<Record<string, QuestProgress>>;
  completed: readonly string[];
};

/** Live game facts that some objectives read directly. */
export type WorldView = {
  level: number;
  bag: Bag;
  joinedCount: number;
  relationship: (npc: string) => number;
};

export const emptyLog = (): QuestLog => ({ active: {}, completed: [] });

export const rankIndex = (reputation: number): number => {
  let index = 0;
  RANKS.forEach((rank, i) => {
    if (reputation >= rank.min) index = i;
  });
  return index;
};

export const rankName = (index: number): string => RANKS[index]?.name ?? RANKS[0].name;

/** Reputation is derived: completed quests plus every person who joined. */
export function reputation(log: QuestLog, joinedCount: number): number {
  const fromQuests = log.completed.reduce(
    (sum, id) => sum + (QUEST_BY_ID.get(id)?.reward.rep ?? 0),
    0,
  );
  return fromQuests + joinedCount * JOIN_REPUTATION;
}

export type QuestStatus = 'ready' | 'active' | 'available' | 'locked' | 'completed';

export function statusOf(def: QuestDef, log: QuestLog, view: WorldView, rank: number): QuestStatus {
  if (log.completed.includes(def.id)) return 'completed';
  const progress = log.active[def.id];
  if (progress) return isReady(def, progress, view) ? 'ready' : 'active';
  return def.minRank <= rank ? 'available' : 'locked';
}

export type ObjectiveState = {
  text: string;
  have: number;
  need: number;
  done: boolean;
  /** False when have/need is not a meaningful count for the player (a relationship score). */
  countable: boolean;
};

export function objectiveState(
  objective: Objective,
  index: number,
  progress: QuestProgress,
  view: WorldView,
): ObjectiveState {
  let have = 0;
  let need = 1;
  let text = '';
  switch (objective.kind) {
    case 'kill': {
      need = objective.count;
      have = progress.counts[index] ?? 0;
      text = `Defeat ${objective.enemy ? ENEMIES[objective.enemy].name : 'politicians'}`;
      break;
    }
    case 'visit': {
      need = objective.zones.length;
      have = objective.zones.filter((z) => progress.visited.includes(z)).length;
      text = 'Visit GUM, Manezhnaya Square and Alexander Garden';
      break;
    }
    case 'mesmerize':
      need = MESMERIZED_AT;
      have = view.relationship(objective.npc);
      text = `Mesmerize ${NPC_BY_ID.get(objective.npc)?.name ?? objective.npc}`;
      break;
    case 'recruit':
      need = objective.count;
      have = view.joinedCount;
      text = `Recruit ${objective.count} people to the kingdom`;
      break;
    case 'collect':
      need = objective.count;
      have = countOf(view.bag, objective.item);
      text = `Bring ${ITEMS[objective.item].name}`;
      break;
    case 'level':
      need = objective.level;
      have = view.level;
      text = `Reach level ${objective.level}`;
      break;
  }
  return {
    text,
    have: Math.min(have, need),
    need,
    done: have >= need,
    countable: objective.kind !== 'mesmerize',
  };
}

export const objectiveStates = (
  def: QuestDef,
  progress: QuestProgress,
  view: WorldView,
): ObjectiveState[] => def.objectives.map((o, i) => objectiveState(o, i, progress, view));

export const isReady = (def: QuestDef, progress: QuestProgress, view: WorldView): boolean =>
  objectiveStates(def, progress, view).every((o) => o.done);

/** Short progress label for the HUD tracker: the first unfinished objective. */
export function trackerLine(def: QuestDef, progress: QuestProgress, view: WorldView): string {
  const next = objectiveStates(def, progress, view).find((s) => !s.done);
  if (!next) return `${def.title}: claim at the board`;
  return next.countable ? `${def.title}: ${next.have}/${next.need}` : `${def.title}: ${next.text}`;
}

export function acceptQuest(log: QuestLog, id: string, rank: number): QuestLog | null {
  const def = QUEST_BY_ID.get(id);
  if (!def || log.completed.includes(id) || log.active[id] || def.minRank > rank) return null;
  const progress: QuestProgress = { counts: def.objectives.map(() => 0), visited: [] };
  return { ...log, active: { ...log.active, [id]: progress } };
}

export function recordKill(log: QuestLog, kind: EnemyKind): QuestLog {
  let changed = false;
  const active: Record<string, QuestProgress> = {};
  for (const [id, progress] of Object.entries(log.active)) {
    const def = QUEST_BY_ID.get(id);
    const counts = [...progress.counts];
    def?.objectives.forEach((o, i) => {
      if (o.kind === 'kill' && (!o.enemy || o.enemy === kind)) {
        counts[i] = Math.min(o.count, (counts[i] ?? 0) + 1);
        changed = true;
      }
    });
    active[id] = { ...progress, counts };
  }
  return changed ? { ...log, active } : log;
}

export function recordVisit(log: QuestLog, zoneId: string): QuestLog {
  let changed = false;
  const active: Record<string, QuestProgress> = {};
  for (const [id, progress] of Object.entries(log.active)) {
    const def = QUEST_BY_ID.get(id);
    const wants = def?.objectives.some((o) => o.kind === 'visit' && o.zones.includes(zoneId));
    if (wants && !progress.visited.includes(zoneId)) {
      active[id] = { ...progress, visited: [...progress.visited, zoneId] };
      changed = true;
    } else {
      active[id] = progress;
    }
  }
  return changed ? { ...log, active } : log;
}

export type ClaimResult =
  { ok: true; log: QuestLog; bag: Bag } | { ok: false; reason: 'not-ready' | 'bag-full' };

/** Completes a ready quest: consumes collected items, then adds rewards. Refuses if the bag cannot hold them. */
export function claimQuest(log: QuestLog, id: string, view: WorldView): ClaimResult {
  const def = QUEST_BY_ID.get(id);
  const progress = log.active[id];
  if (!def || !progress || !isReady(def, progress, view)) return { ok: false, reason: 'not-ready' };
  let bag = view.bag;
  for (const o of def.objectives) {
    if (o.kind !== 'collect') continue;
    let left = o.count;
    while (left > 0) {
      const index = bag.findIndex((s) => s?.id === o.item);
      if (index < 0) break;
      const qty = Math.min(left, bag[index]?.qty ?? 0);
      bag = removeFromBag(bag, index, qty).bag;
      left -= qty;
    }
  }
  for (const item of def.reward.items ?? []) {
    const added = addToBag(bag, item.id, item.qty);
    if (added.leftover > 0) return { ok: false, reason: 'bag-full' };
    bag = added.bag;
  }
  const rest = Object.fromEntries(Object.entries(log.active).filter(([key]) => key !== id));
  return { ok: true, log: { active: rest, completed: [...log.completed, id] }, bag };
}
