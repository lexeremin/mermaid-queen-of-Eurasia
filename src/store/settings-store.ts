import { create } from 'zustand';
import { isQuality, type Quality } from '@/systems/quality';
import { KEYS, readJson, writeJson } from '@/save/storage';

type SettingsState = {
  statsOptOut: boolean;
  soundOn: boolean;
  quality: Quality;
  setStatsOptOut: (value: boolean) => void;
  setSoundOn: (value: boolean) => void;
  setQuality: (value: Quality) => void;
};

function loadSettings(): { statsOptOut: boolean; soundOn: boolean; quality: Quality } {
  const raw = readJson(KEYS.settings);
  const obj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    statsOptOut: obj.statsOptOut === true,
    soundOn: obj.soundOn !== false,
    quality: isQuality(obj.quality) ? obj.quality : 'auto',
  };
}

const persist = (s: { statsOptOut: boolean; soundOn: boolean; quality: Quality }) =>
  writeJson(KEYS.settings, {
    statsOptOut: s.statsOptOut,
    soundOn: s.soundOn,
    quality: s.quality,
  });

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),
  setStatsOptOut: (statsOptOut) => {
    persist({ ...get(), statsOptOut });
    set({ statsOptOut });
  },
  setSoundOn: (soundOn) => {
    persist({ ...get(), soundOn });
    set({ soundOn });
  },
  setQuality: (quality) => {
    persist({ ...get(), quality });
    set({ quality });
  },
}));
