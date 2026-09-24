import { create } from 'zustand';
import { emptyLog, type QuestLog } from '@/systems/quests';

type QuestState = {
  log: QuestLog;
  setLog: (log: QuestLog) => void;
  hydrate: (log: QuestLog) => void;
  reset: () => void;
};

export const useQuestStore = create<QuestState>((set) => ({
  log: emptyLog(),
  setLog: (log) => set({ log }),
  hydrate: (log) => set({ log }),
  reset: () => set({ log: emptyLog() }),
}));
