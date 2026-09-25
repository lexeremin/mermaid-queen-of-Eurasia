import { getContext, log, masterBus } from '@/audio/engine';
import { weather } from '@/game/feedback';
import { useDungeonStore } from '@/store/dungeon-store';
import { useGameStore } from '@/store/game-store';
import { useSettingsStore } from '@/store/settings-store';
import {
  CEILING,
  MIXES,
  nextBellDelay,
  nextDripDelay,
  pickBell,
  rainHiss,
  sceneFor,
  type AmbienceScene,
} from '@/systems/ambience';

/** Generative ambience: wind and a soft pad on the surface, a drone and drips below, a pulse in a boss arena. */
type Layers = {
  bus: GainNode;
  wind: GainNode;
  pad: GainNode;
  drone: GainNode;
  pulse: GainNode;
  rain: GainNode;
};

let layers: Layers | null = null;
let timer: number | undefined;
let scene: AmbienceScene = 'surface';
let nextBell = 0;
let nextDrip = 0;

const TAU = 1.2;

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function noise(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.start();
  return source;
}

function build(ctx: AudioContext): Layers {
  const bus = ctx.createGain();
  bus.connect(masterBus(ctx));
  const gain = (): GainNode => {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(bus);
    return g;
  };
  const buffer = noiseBuffer(ctx);

  const wind = gain();
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.6;
  noise(ctx, buffer).connect(windFilter).connect(wind);
  const gust = ctx.createOscillator();
  gust.frequency.value = 0.09;
  const gustDepth = ctx.createGain();
  gustDepth.gain.value = 0.02;
  gust.connect(gustDepth).connect(wind.gain);
  gust.start();

  const pad = gain();
  for (const [freq, detune] of [
    [110, 0],
    [164.81, 4],
    [220, -3],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(pad);
    osc.start();
  }

  const drone = gain();
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 180;
  droneFilter.connect(drone);
  for (const freq of [55, 55.4]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(droneFilter);
    osc.start();
  }

  const pulse = gain();
  const pulseOsc = ctx.createOscillator();
  pulseOsc.frequency.value = 55;
  const beat = ctx.createGain();
  beat.gain.value = 0.5;
  const beatLfo = ctx.createOscillator();
  beatLfo.frequency.value = 1.3;
  const beatDepth = ctx.createGain();
  beatDepth.gain.value = 0.5;
  beatLfo.connect(beatDepth).connect(beat.gain);
  pulseOsc.connect(beat).connect(pulse);
  pulseOsc.start();
  beatLfo.start();

  const rain = gain();
  const rainFilter = ctx.createBiquadFilter();
  rainFilter.type = 'highpass';
  rainFilter.frequency.value = 2500;
  noise(ctx, buffer).connect(rainFilter).connect(rain);

  return { bus, wind, pad, drone, pulse, rain };
}

function bell(ctx: AudioContext, l: Layers, freq: number): void {
  const t = ctx.currentTime + 0.02;
  for (const [mult, level] of [
    [1, 1],
    [2.01, 0.35],
    [3.02, 0.12],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035 * level, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
    osc.connect(g).connect(l.bus);
    osc.start(t);
    osc.stop(t + 4.1);
  }
  log('ambience-bell');
}

function drip(ctx: AudioContext, l: Layers, random: () => number): void {
  const freq = 1300 + random() * 900;
  for (const [delay, level] of [
    [0, 1],
    [0.2, 0.3],
  ] as const) {
    const t = ctx.currentTime + 0.02 + delay;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.03 * level, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g).connect(l.bus);
    osc.start(t);
    osc.stop(t + 0.15);
  }
  log('ambience-drip');
}

function tick(): void {
  const ctx = getContext();
  if (!ctx || !layers) return;
  const game = useGameStore.getState();
  const inArena = game.zone?.id === 'ug-arena';
  scene = sceneFor(game.underground && useDungeonStore.getState().layer > 0, inArena);
  const mix = MIXES[scene];
  const now = ctx.currentTime;
  const to = (node: GainNode, value: number) => node.gain.setTargetAtTime(value, now, TAU);
  to(layers.wind, mix.wind * CEILING.wind);
  to(layers.pad, mix.pad * CEILING.pad);
  to(layers.drone, mix.drone * CEILING.drone);
  to(layers.pulse, mix.pulse * CEILING.pulse);
  to(layers.rain, scene === 'surface' ? rainHiss(weather.state.rain) : 0);
  const ambience = useSettingsStore.getState().ambience;
  layers.bus.gain.setTargetAtTime(ambience * ambience, now, 0.1);

  if (mix.bells && now >= nextBell) {
    if (nextBell > 0) bell(ctx, layers, pickBell(Math.random));
    nextBell = now + nextBellDelay(Math.random);
  }
  if (mix.drips && now >= nextDrip) {
    if (nextDrip > 0) drip(ctx, layers, Math.random);
    nextDrip = now + nextDripDelay(Math.random);
  }
}

/** Starts the ambience (once); call from the first gesture, after the audio context is allowed to run. */
export function startAmbience(): void {
  const ctx = getContext();
  if (!ctx || layers) return;
  layers = build(ctx);
  timer = window.setInterval(tick, 250);
  tick();
  log('ambience-start');
}

export function stopAmbience(): void {
  window.clearInterval(timer);
  timer = undefined;
  if (layers) layers.bus.disconnect();
  layers = null;
}
