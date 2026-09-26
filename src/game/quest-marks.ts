import { currentBoardMark } from '@/game/quest-actions';
import { useArchangelStore } from '@/store/archangel-store';
import { useDungeonStore } from '@/store/dungeon-store';
import { useNpcStore } from '@/store/npc-store';
import { useProgressStore } from '@/store/progress-store';
import { useQuestStore } from '@/store/quest-store';
import type { BoardMark } from '@/systems/quests';

/**
 * The mark over the notice board, kept up to date: it is worked out again whenever anything a quest can depend on
 * changes (the log, the bag, the level, who has joined, the dungeon, the archangels).
 */
export function useBoardMark(): BoardMark | null {
  useQuestStore((s) => s.log);
  useProgressStore((s) => s.bag);
  useProgressStore((s) => s.keepsakes);
  useProgressStore((s) => s.level);
  useNpcStore((s) => s.npcs);
  useDungeonStore((s) => s.hallsCleared);
  useDungeonStore((s) => s.bossDefeated);
  useArchangelStore((s) => s.saved);
  return currentBoardMark();
}
