import { useSettingsStore } from '@/store/settings-store';

let ctx: AudioContext | null = null;

/** Dev-only record of what played, for headless verification. */
export const audioLog: string[] = [];

export const soundEnabled = (): boolean => useSettingsStore.getState().soundOn;

/** What the master gain should be: silent when sound is off, otherwise the volume on a perceptual (squared) curve. */
export const masterLevel = (soundOn: boolean, volume: number): number =>
  soundOn ? Math.min(1, Math.max(0, volume)) ** 2 : 0;

let master: GainNode | null = null;

function applyMaster(): void {
  if (!master || !ctx) return;
  const { soundOn, volume } = useSettingsStore.getState();
  master.gain.setTargetAtTime(masterLevel(soundOn, volume), ctx.currentTime, 0.03);
}
useSettingsStore.subscribe(applyMaster);

/** Everything Rosa hears goes through this one gain (the volume setting), never straight to the speakers. */
export function masterBus(context: AudioContext): AudioNode {
  if (!master) {
    master = context.createGain();
    master.connect(context.destination);
    const { soundOn, volume } = useSettingsStore.getState();
    master.gain.value = masterLevel(soundOn, volume);
  }
  return master;
}

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
