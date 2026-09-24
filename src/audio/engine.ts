import { useSettingsStore } from '@/store/settings-store';

let ctx: AudioContext | null = null;

/** Dev-only record of what played, for headless verification. */
export const audioLog: string[] = [];

export const soundEnabled = (): boolean => useSettingsStore.getState().soundOn;

function create(): AudioContext | null {
  const Ctor: typeof AudioContext | undefined =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  return Ctor ? new Ctor() : null;
}

/** The shared audio context (created on first use), resumed if the browser suspended it. */
export function getContext(): AudioContext | null {
  ctx ??= create();
  if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

export function log(entry: string): void {
  if (import.meta.env.DEV) audioLog.push(entry);
}
