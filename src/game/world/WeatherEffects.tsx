import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  LineBasicMaterial,
  PointsMaterial,
  type LineSegments,
  type Points,
} from 'three';
import { weather } from '@/game/feedback';
import { getRenderPosition } from '@/game/sim';
import { useGraphics } from '@/store/graphics-store';
import { mulberry32 } from '@/utils/random';
import { useGameStore } from '@/store/game-store';
import { useSettingsStore } from '@/store/settings-store';

const BOX = 34;
const HEIGHT = 16;
const FALL = 15;
const SLANT = -2.2;
const STREAK = 0.75;
const MIST_COUNT = 10;
const MIST_BOX = 46;

const wrap = (value: number, center: number, size: number): number => {
  const half = size / 2;
  let v = value;
  while (v - center > half) v -= size;
  while (v - center < -half) v += size;
  return v;
};

/** Lets the drops fall (their positions live around the player and wrap), and writes each streak's two ends. */
function moveRain(
  drops: Float32Array,
  out: BufferAttribute,
  count: number,
  dt: number,
  player: { x: number; z: number },
): void {
  for (let i = 0; i < count; i++) {
    let y = drops[i * 3 + 1]! - FALL * dt;
    const x = drops[i * 3]! + SLANT * dt;
    if (y < 0) y += HEIGHT;
    drops[i * 3] = x;
    drops[i * 3 + 1] = y;
    const wx = wrap(x + player.x, player.x, BOX);
    const wz = wrap(drops[i * 3 + 2]! + player.z, player.z, BOX);
    out.setXYZ(i * 2, wx, y, wz);
    out.setXYZ(i * 2 + 1, wx - (SLANT / FALL) * STREAK, y + STREAK, wz);
  }
  out.needsUpdate = true;
}

function moveMist(
  puffs: Float32Array,
  out: BufferAttribute,
  dt: number,
  player: { x: number; z: number },
): void {
  for (let i = 0; i < MIST_COUNT; i++) {
    puffs[i * 3] = puffs[i * 3]! + (0.4 + (i % 3) * 0.15) * dt;
    out.setXYZ(
      i,
      wrap(puffs[i * 3]! + player.x, player.x, MIST_BOX),
      puffs[i * 3 + 1]!,
      wrap(puffs[i * 3 + 2]! + player.z, player.z, MIST_BOX),
    );
  }
  out.needsUpdate = true;
}

/** `count` points in a box of `size` metres (x and z, centred) and `height` (y, from `base`), from a fixed seed. */
function scatter(
  count: number,
  size: number,
  height: number,
  seed: number,
  base = 0,
): Float32Array {
  const random = mulberry32(seed);
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    data[i * 3] = (random() - 0.5) * size;
    data[i * 3 + 1] = base + random() * height;
    data[i * 3 + 2] = (random() - 0.5) * size;
  }
  return data;
}

type SkyParts = {
  drops: Float32Array;
  puffs: Float32Array;
  rainGeometry: BufferGeometry;
  mistGeometry: BufferGeometry;
  rainMaterial: LineBasicMaterial;
  mistMaterial: PointsMaterial;
  count: number;
};

/** One frame of the sky: the streaks show and fall while it rains, the mist thickens with the rain. */
function updateSky(
  objects: { rain: LineSegments | null; mist: Points | null },
  parts: SkyParts,
  dt: number,
  player: { x: number; z: number },
): void {
  const level = weather.state.rain;
  if (objects.rain) {
    objects.rain.visible = level > 0.03;
    if (objects.rain.visible) {
      parts.rainMaterial.opacity = 0.45 * level;
      moveRain(
        parts.drops,
        parts.rainGeometry.getAttribute('position') as BufferAttribute,
        parts.count,
        dt,
        player,
      );
    }
  }
  if (objects.mist) {
    parts.mistMaterial.opacity = 0.09 + 0.1 * level;
    moveMist(
      parts.puffs,
      parts.mistGeometry.getAttribute('position') as BufferAttribute,
      dt,
      player,
    );
  }
}

function radialTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const c = canvas.getContext('2d');
  if (c) {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(210,222,235,0.9)');
    g.addColorStop(0.5, 'rgba(210,222,235,0.35)');
    g.addColorStop(1, 'rgba(210,222,235,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(canvas);
}

/** Drizzle streaks and drifting mist around Rosa: two draw calls, only above ground and only when wanted. */
export function WeatherEffects() {
  const enabled = useSettingsStore((s) => s.weather);
  const underground = useGameStore((s) => s.underground);
  const { level } = useGraphics();
  if (!enabled || underground || level === 'low') return null;
  return <Sky count={level === 'high' ? 220 : 120} />;
}

function Sky({ count }: { count: number }) {
  const rain = useRef<LineSegments>(null);
  const mist = useRef<Points>(null);
  const drops = useMemo(() => scatter(count, BOX, HEIGHT, 7), [count]);
  const rainGeometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3));
    return g;
  }, [count]);
  const rainMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: '#cfdcf0',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  const puffs = useMemo(() => scatter(MIST_COUNT, MIST_BOX, 3, 11, 0.6), []);
  const mistGeometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(MIST_COUNT * 3), 3));
    return g;
  }, []);
  const texture = useMemo(() => radialTexture(), []);
  const mistMaterial = useMemo(
    () =>
      new PointsMaterial({
        map: texture,
        size: 11,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    [texture],
  );
  useEffect(
    () => () => {
      rainGeometry.dispose();
      rainMaterial.dispose();
      mistGeometry.dispose();
      mistMaterial.dispose();
      texture.dispose();
    },
    [rainGeometry, rainMaterial, mistGeometry, mistMaterial, texture],
  );

  const player = useMemo(() => ({ x: 0, z: 0 }), []);
  useFrame((_, delta) => {
    getRenderPosition(player);
    updateSky(
      { rain: rain.current, mist: mist.current },
      { drops, puffs, rainGeometry, mistGeometry, rainMaterial, mistMaterial, count },
      Math.min(delta, 0.05),
      player,
    );
  });

  return (
    <>
      <lineSegments
        ref={rain}
        geometry={rainGeometry}
        material={rainMaterial}
        frustumCulled={false}
        visible={false}
      />
      <points ref={mist} geometry={mistGeometry} material={mistMaterial} frustumCulled={false} />
    </>
  );
}
