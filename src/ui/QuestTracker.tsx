import { QUEST_BY_ID } from '@/data/quests';
import { worldView } from '@/game/quest-actions';
import { useNpcStore } from '@/store/npc-store';
import { useProgressStore } from '@/store/progress-store';
import { useQuestStore } from '@/store/quest-store';
import { trackerLine } from '@/systems/quests';

/** One line under the bars for the first active quest. */
export function QuestTracker() {
  const log = useQuestStore((s) => s.log);
  useProgressStore((s) => s.bag);
  useProgressStore((s) => s.level);
  useNpcStore((s) => s.npcs);
  const first = Object.entries(log.active)[0];
  if (!first) return null;
  const def = QUEST_BY_ID.get(first[0]);
  if (!def) return null;
  return <div className="quest-tracker">{trackerLine(def, first[1], worldView())}</div>;
}
