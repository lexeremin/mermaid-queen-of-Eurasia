import { warmSfx } from '@/audio/sfx';
import { AURA_FILE, AURA_GAIN } from '@/audio/recipes';
import { startAmbience } from '@/audio/ambience';
import { getContext, log, masterBus, soundEnabled } from '@/audio/engine';

let buffer: Promise<AudioBuffer | null> | null = null;
let singing: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

function loadAura(ctx: AudioContext): Promise<AudioBuffer | null> {
  buffer ??= fetch(AURA_FILE)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((data) => ctx.decodeAudioData(data))
    .catch(() => null);
  return buffer;
}

/** Call from the first pointer or key press: browsers only allow audio after a gesture. */
export function unlockAudio(): void {
  const ctx = getContext();
  if (ctx) {
    void loadAura(ctx);
    warmSfx();
    startAmbience();
  }
}

/** Rosa sings the Aura: one sustained "ah", quiet. A song still ringing is replaced. */
export function playAuraSong(): void {
  if (!soundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  void loadAura(ctx).then((data) => {
    if (!data) return;
    stopVoice(0.15);
    const source = ctx.createBufferSource();
    source.buffer = data;
    const gain = ctx.createGain();
    gain.gain.value = AURA_GAIN;
    source.connect(gain).connect(masterBus(ctx));
    source.start();
    log('aura-song');
    const played = { source, gain };
    singing = played;
    source.onended = () => {
      if (singing === played) singing = null;
    };
  });
}

/** Fades out the sung Aura (Rosa fainted, or the sound was switched off). */
export function stopVoice(fadeSeconds = 0.3): void {
  const ctx = getContext();
  if (!singing || !ctx) return;
  const { source, gain } = singing;
  singing = null;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
  source.stop(now + fadeSeconds + 0.02);
}
