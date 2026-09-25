import { create } from 'zustand';
import { useSettingsStore } from '@/store/settings-store';
import {
  effectiveLevel,
  settingsFor,
  stepLevel,
  type Level,
  type LevelSettings,
} from '@/systems/quality';

const TOUCH = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

type GraphicsState = {
  /** The level Auto has settled on (it steps down when frames drop and back up when they recover). */
  auto: Level;
  stepAuto: (direction: 'down' | 'up') => void;
};

export const useGraphicsStore = create<GraphicsState>((set, get) => ({
  auto: 'high',
  stepAuto: (direction) => set({ auto: stepLevel(get().auto, direction) }),
}));

/** The settings in force right now (a fixed choice, or what Auto has picked). */
export function currentGraphics(): LevelSettings & { level: Level } {
  const level = effectiveLevel(
    useSettingsStore.getState().quality,
    useGraphicsStore.getState().auto,
  );
  return { level, ...settingsFor(level, TOUCH) };
}

/** React hook form of `currentGraphics`. */
export function useGraphics(): LevelSettings & { level: Level } {
  const quality = useSettingsStore((s) => s.quality);
  const auto = useGraphicsStore((s) => s.auto);
  const level = effectiveLevel(quality, auto);
  return { level, ...settingsFor(level, TOUCH) };
}
