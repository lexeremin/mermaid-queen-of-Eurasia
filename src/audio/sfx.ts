import { HIT, SWING, WAVE, bubbleBlips, swell, type SfxKind } from '@/audio/recipes';
import { getContext, log, soundEnabled } from '@/audio/engine';

let noise: AudioBuffer | null = null;

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

function noiseSource(ctx: AudioContext): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  source.loop = true;
  return source;
}

function swing(ctx: AudioContext, t: number): void {
  const source = noiseSource(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.1;
  filter.frequency.setValueAtTime(SWING.from, t);
  filter.frequency.exponentialRampToValueAtTime(SWING.to, t + SWING.dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(SWING.gain, t + SWING.dur * 0.35);
  gain.gain.linearRampToValueAtTime(0.0001, t + SWING.dur);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(t);
  source.stop(t + SWING.dur + 0.02);
}

function hit(ctx: AudioContext, t: number): void {
  const source = noiseSource(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = HIT.lowpass;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(HIT.noiseGain, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + HIT.noiseDur);
  source.connect(filter).connect(noiseGain).connect(ctx.destination);
  source.start(t);
  source.stop(t + HIT.noiseDur + 0.02);

  const thump = ctx.createOscillator();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(HIT.thumpFrom, t);
  thump.frequency.exponentialRampToValueAtTime(HIT.thumpTo, t + HIT.thumpDur);
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(HIT.thumpGain, t);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + HIT.thumpDur);
  thump.connect(thumpGain).connect(ctx.destination);
  thump.start(t);
  thump.stop(t + HIT.thumpDur + 0.02);
}

function bubbles(ctx: AudioContext, t: number): void {
  for (const blip of bubbleBlips()) {
    const start = t + blip.at;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(blip.from, start);
    osc.frequency.exponentialRampToValueAtTime(blip.to, start + blip.dur * 0.8);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(blip.gain, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + blip.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + blip.dur + 0.02);
  }
}

function wave(ctx: AudioContext, t: number): void {
  const source = noiseSource(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(WAVE.cutoffFrom, t);
  filter.frequency.linearRampToValueAtTime(WAVE.cutoffPeak, t + WAVE.attack);
  filter.frequency.exponentialRampToValueAtTime(WAVE.cutoffTo, t + WAVE.dur);
  const gain = ctx.createGain();
  const steps = 24;
  gain.gain.setValueAtTime(0.0001, t);
  for (let i = 1; i <= steps; i++) {
    const at = (i / steps) * WAVE.dur;
    gain.gain.linearRampToValueAtTime(
      Math.max(0.0001, swell(at, WAVE.attack, WAVE.dur) * WAVE.gain),
      t + at,
    );
  }
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(t);
  source.stop(t + WAVE.dur + 0.05);

  for (const freq of WAVE.pad) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.0001, t);
    for (let i = 1; i <= steps; i++) {
      const at = (i / steps) * WAVE.dur;
      padGain.gain.linearRampToValueAtTime(
        Math.max(0.0001, swell(at, WAVE.attack * 1.3, WAVE.dur) * WAVE.padGain),
        t + at,
      );
    }
    osc.connect(padGain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + WAVE.dur + 0.05);
  }
}

const PLAYERS: Record<SfxKind, (ctx: AudioContext, t: number) => void> = {
  swing,
  hit,
  bubbles,
  wave,
};

/** Plays one of the synthesized sounds (no sample files needed). */
export function playSfx(kind: SfxKind): void {
  if (!soundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  PLAYERS[kind](ctx, ctx.currentTime + 0.005);
  log(kind);
}
