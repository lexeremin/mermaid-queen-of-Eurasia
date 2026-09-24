import { create } from 'zustand';
import { KEYS, readJson, writeJson } from '@/save/storage';

type SettingsState = {
  statsOptOut: boolean;
  setStatsOptOut: (value: boolean) => void;
};

function loadOptOut(): boolean {
  const raw = readJson(KEYS.settings);
  return (
    typeof raw === 'object' &&
    raw !== null &&
    (raw as { statsOptOut?: unknown }).statsOptOut === true
  );
}

export const useSettingsStore = create<SettingsState>((set) => ({
  statsOptOut: loadOptOut(),
  setStatsOptOut: (statsOptOut) => {
    writeJson(KEYS.settings, { statsOptOut });
    set({ statsOptOut });
  },
}));
