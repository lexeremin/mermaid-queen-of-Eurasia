import { create } from 'zustand';
import { isQuality, type Quality } from '@/systems/quality';
import { KEYS, readJson, writeJson } from '@/save/storage';

export type SettingsValues = {
  statsOptOut: boolean;
  soundOn: boolean;
  /** Master volume, 0 to 1. */
  volume: number;
  /** How loud the ambience (wind, bells, drips, drizzle) is, 0 to 1. */
  ambience: number;
  quality: Quality;
  /** The camera shakes when Rosa is hurt or something big falls. */
  shake: boolean;
  /** Mist and drizzle over the surface. */
  weather: boolean;
  /** Floating damage numbers. */
  damageNumbers: boolean;
};

type SettingsState = SettingsValues & {
  setStatsOptOut: (value: boolean) => void;
  setSoundOn: (value: boolean) => void;
  setVolume: (value: number) => void;
  setAmbience: (value: number) => void;
  setQuality: (value: Quality) => void;
  setShake: (value: boolean) => void;
  setWeather: (value: boolean) => void;
  setDamageNumbers: (value: boolean) => void;
};

const unit = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Defaults, with each saved value used when it is valid. Screen shake starts off for people who ask for less motion. */
export function parseSettings(raw: unknown, reducedMotion = false): SettingsValues {
  const obj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    statsOptOut: obj.statsOptOut === true,
    soundOn: obj.soundOn !== false,
    volume: unit(obj.volume, 1),
    ambience: unit(obj.ambience, 0.6),
    quality: isQuality(obj.quality) ? obj.quality : 'auto',
    shake: typeof obj.shake === 'boolean' ? obj.shake : !reducedMotion,
    weather: obj.weather !== false,
    damageNumbers: obj.damageNumbers !== false,
  };
}

const pick = (s: SettingsValues): SettingsValues => ({
  statsOptOut: s.statsOptOut,
  soundOn: s.soundOn,
  volume: s.volume,
  ambience: s.ambience,
  quality: s.quality,
  shake: s.shake,
  weather: s.weather,
  damageNumbers: s.damageNumbers,
});

const persist = (s: SettingsValues) => writeJson(KEYS.settings, pick(s));

export const useSettingsStore = create<SettingsState>((set, get) => {
  const change = (patch: Partial<SettingsValues>) => {
    persist({ ...get(), ...patch });
    set(patch);
  };
  return {
    ...parseSettings(readJson(KEYS.settings), prefersReducedMotion()),
    setStatsOptOut: (statsOptOut) => change({ statsOptOut }),
    setSoundOn: (soundOn) => change({ soundOn }),
    setVolume: (value) => change({ volume: unit(value, 1) }),
    setAmbience: (value) => change({ ambience: unit(value, 0.6) }),
    setQuality: (quality) => change({ quality }),
    setShake: (shake) => change({ shake }),
    setWeather: (weather) => change({ weather }),
    setDamageNumbers: (damageNumbers) => change({ damageNumbers }),
  };
});
