import { create } from 'zustand';
import { KEYS, readJson, writeJson } from '@/save/storage';

type SettingsState = {
  statsOptOut: boolean;
  soundOn: boolean;
  setStatsOptOut: (value: boolean) => void;
  setSoundOn: (value: boolean) => void;
};

function loadSettings(): { statsOptOut: boolean; soundOn: boolean } {
  const raw = readJson(KEYS.settings);
  const obj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return { statsOptOut: obj.statsOptOut === true, soundOn: obj.soundOn !== false };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),
  setStatsOptOut: (statsOptOut) => {
    writeJson(KEYS.settings, { statsOptOut, soundOn: get().soundOn });
    set({ statsOptOut });
  },
  setSoundOn: (soundOn) => {
    writeJson(KEYS.settings, { statsOptOut: get().statsOptOut, soundOn });
    set({ soundOn });
  },
}));
