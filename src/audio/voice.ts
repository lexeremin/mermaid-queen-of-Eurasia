import { VOICE_FILES, pickVariant, playbackRate, type VoiceKind } from '@/audio/variants';
import { useSettingsStore } from '@/store/settings-store';

const VOLUME: Readonly<Record<VoiceKind, number>> = { attack: 0.85, spell: 0.95, aura: 0.9 };

type Engine = {
  ctx: AudioContext;
  buffers: Map<string, AudioBuffer>;
  loading: Map<string, Promise<AudioBuffer | null>>;
};

let engine: Engine | null = null;
const last: Record<VoiceKind, number> = { attack: -1, spell: -1, aura: -1 };
let singing: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

/** Dev-only record of what played, for headless verification. */
export const voiceLog: { kind: VoiceKind; file: string; rate: number }[] = [];

function createEngine(): Engine | null {
  const Ctor: typeof AudioContext | undefined =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  return { ctx: new Ctor(), buffers: new Map(), loading: new Map() };
}

async function load(e: Engine, url: string): Promise<AudioBuffer | null> {
  const cached = e.buffers.get(url);
  if (cached) return cached;
  const pending = e.loading.get(url);
  if (pending) return pending;
  const promise = fetch(url)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((data) => e.ctx.decodeAudioData(data))
    .then((buffer) => {
      e.buffers.set(url, buffer);
      return buffer;
    })
    .catch(() => null);
  e.loading.set(url, promise);
  return promise;
}

/**
 * Browsers only start audio after a user gesture. Call from the first pointer or key press: it creates
 * the audio context, resumes it, and preloads the voice samples.
 */
export function unlockAudio(): void {
  engine ??= createEngine();
  if (!engine) return;
  if (engine.ctx.state === 'suspended') void engine.ctx.resume().catch(() => undefined);
  for (const files of Object.values(VOICE_FILES)) for (const url of files) void load(engine, url);
}

function start(e: Engine, kind: VoiceKind, url: string, buffer: AudioBuffer, rate: number) {
  const source = e.ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const gain = e.ctx.createGain();
  gain.gain.value = VOLUME[kind];
  source.connect(gain).connect(e.ctx.destination);
  source.start();
  if (import.meta.env.DEV) voiceLog.push({ kind, file: url, rate });
  return { source, gain };
}

/** Plays one of Rosa's voice samples. The Aura song replaces any song still ringing. */
export function playVoice(kind: VoiceKind): void {
  if (!useSettingsStore.getState().soundOn) return;
  engine ??= createEngine();
  const e = engine;
  if (!e) return;
  if (e.ctx.state === 'suspended') void e.ctx.resume().catch(() => undefined);
  const files = VOICE_FILES[kind];
  const index = pickVariant(files.length, last[kind]);
  last[kind] = index;
  const url = files[index];
  if (!url) return;
  void load(e, url).then((buffer) => {
    if (!buffer) return;
    if (kind === 'aura') stopVoice(0.15);
    const played = start(e, kind, url, buffer, playbackRate(kind));
    if (kind === 'aura') {
      singing = played;
      played.source.onended = () => {
        if (singing === played) singing = null;
      };
    }
  });
}

/** Fades out the Aura song (Rosa fainted, or the sound was switched off). */
export function stopVoice(fadeSeconds = 0.3): void {
  if (!singing || !engine) return;
  const { source, gain } = singing;
  singing = null;
  const now = engine.ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
  source.stop(now + fadeSeconds + 0.02);
}
