import {
  GATHER,
  HIT,
  JOY_ARPEGGIO,
  SPECS,
  SWING,
  WAVE,
  bubbleBlips,
  giggleChirps,
  swell,
  type SfxKind,
  type SfxSpec,
  type SpecKind,
} from '@/audio/recipes';
import { getContext, log, masterBus, soundEnabled } from '@/audio/engine';

let noise: AudioBuffer | null = null;

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** Builds the shared noise buffer ahead of time so the first sound effect does not stall a frame. */
export function warmSfx(): void {
  const ctx = getContext();
  if (ctx) noiseBuffer(ctx);
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
  source.connect(filter).connect(gain).connect(masterBus(ctx));
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
  source.connect(filter).connect(noiseGain).connect(masterBus(ctx));
  source.start(t);
  source.stop(t + HIT.noiseDur + 0.02);

  const thump = ctx.createOscillator();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(HIT.thumpFrom, t);
  thump.frequency.exponentialRampToValueAtTime(HIT.thumpTo, t + HIT.thumpDur);
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(HIT.thumpGain, t);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + HIT.thumpDur);
  thump.connect(thumpGain).connect(masterBus(ctx));
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
    osc.connect(gain).connect(masterBus(ctx));
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
  source.connect(filter).connect(gain).connect(masterBus(ctx));
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
    osc.connect(padGain).connect(masterBus(ctx));
    osc.start(t);
    osc.stop(t + WAVE.dur + 0.05);
  }
}

function gatherChime(ctx: AudioContext, t: number): void {
  GATHER.notes.forEach((freq, i) => {
    const start = t + i * GATHER.gap;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(GATHER.gain, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + GATHER.dur);
    osc.connect(gain).connect(masterBus(ctx));
    osc.start(start);
    osc.stop(start + GATHER.dur + 0.02);
  });
}

/** Happy sounds for a saved archangel: a bright bell arpeggio with an echo, then a giggle of rising chirps. */
function joy(ctx: AudioContext, t: number): void {
  const { notes, gap, dur, gain, echoDelay, echoGain } = JOY_ARPEGGIO;
  notes.forEach((freq, i) => {
    for (const [delay, level] of [
      [0, 1],
      [echoDelay, echoGain],
    ] as const) {
      const start = t + i * gap + delay;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const shimmer = ctx.createOscillator();
      shimmer.type = 'sine';
      shimmer.frequency.value = freq * 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(gain * level, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      const shimmerGain = ctx.createGain();
      shimmerGain.gain.value = 0.3;
      osc.connect(g);
      shimmer.connect(shimmerGain).connect(g);
      g.connect(masterBus(ctx));
      osc.start(start);
      shimmer.start(start);
      osc.stop(start + dur + 0.02);
      shimmer.stop(start + dur + 0.02);
    }
  });
  for (const chirp of giggleChirps()) {
    const start = t + chirp.at;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(chirp.from, start);
    osc.frequency.exponentialRampToValueAtTime(chirp.to, start + chirp.dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(chirp.gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + chirp.dur);
    osc.connect(g).connect(masterBus(ctx));
    osc.start(start);
    osc.stop(start + chirp.dur + 0.02);
  }
}

/** Plays a sound described as data (see `SPECS`): tones with an optional glide, and filtered noise bursts. */
function playSpec(ctx: AudioContext, t: number, spec: SfxSpec): void {
  for (const tone of spec.tones) {
    const start = t + tone.at;
    const osc = ctx.createOscillator();
    osc.type = tone.type ?? 'sine';
    osc.frequency.setValueAtTime(tone.freq, start);
    if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, start + tone.dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(tone.gain, start + Math.min(0.012, tone.dur / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);
    osc.connect(gain).connect(masterBus(ctx));
    osc.start(start);
    osc.stop(start + tone.dur + 0.03);
  }
  for (const burst of spec.noise ?? []) {
    const start = t + burst.at;
    const source = noiseSource(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = burst.filter;
    filter.Q.value = burst.q ?? 0.8;
    filter.frequency.setValueAtTime(burst.from, start);
    if (burst.to) filter.frequency.exponentialRampToValueAtTime(burst.to, start + burst.dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(burst.gain, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + burst.dur);
    source.connect(filter).connect(gain).connect(masterBus(ctx));
    source.start(start);
    source.stop(start + burst.dur + 0.03);
  }
}

const HAND_MADE: Partial<Record<SfxKind, (ctx: AudioContext, t: number) => void>> = {
  swing,
  hit,
  bubbles,
  wave,
  gather: gatherChime,
  joy,
};

/** Plays one of the synthesized sounds (no sample files needed). */
export function playSfx(kind: SfxKind): void {
  if (!soundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime + 0.005;
  const handMade = HAND_MADE[kind];
  if (handMade) handMade(ctx, t);
  else playSpec(ctx, t, SPECS[kind as SpecKind]);
  log(kind);
}
