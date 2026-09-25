import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  type InstancedMesh,
  Object3D,
  RingGeometry,
  SphereGeometry,
  type BufferGeometry,
  type Mesh,
  type MeshBasicMaterial,
} from 'three';
import { combat } from '@/game/combat-sim';
import { sim } from '@/game/sim';
import {
  createBeamGeometry,
  createCrestGeometry,
  createSharkGeometry,
  createSpiralGeometry,
  createSigilGeometry,
} from '@/game/entities/skill-geometry';
import { LIGHT_BEAMS, SEA_WAVE, SHARKS, TRIDENT } from '@/systems/abilities';
import { beamAngle, type Effect } from '@/systems/combat';

const MAX_CRESTS = 4;
const MAX_BEAMS = LIGHT_BEAMS.count;
const MAX_SHARKS = SHARKS.count * 2;
const MAX_RINGS = 24;
const MAX_SIGILS = 3;
const MAX_ARMS = 9;
const MAX_DROPS = 200;
const ARMS_PER_SURGE = 3;
const DROPS_PER_SURGE = 26;
const DROPS_PER_SWING = 9;
const DROPS_PER_SPLASH = 9;

const dummy = new Object3D();
const tint = new Color();

const rand = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const yawOf = (dir: { x: number; z: number }): number => Math.atan2(-dir.z, dir.x);
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);
const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/** One instanced mesh that is refilled every frame; colors fade toward black because the layer is additive. */
type Layer = { mesh: InstancedMesh | null; n: number; max: number };
const newLayer = (max: number): Layer => ({ mesh: null, n: 0, max });

function begin(layer: Layer): void {
  layer.n = 0;
}

function put(
  layer: Layer,
  at: { x: number; y: number; z: number },
  yaw: number,
  scale: { x: number; y: number; z: number },
  color: string,
  strength: number,
  pitch = 0,
): void {
  const mesh = layer.mesh;
  if (!mesh || layer.n >= layer.max || strength <= 0.003) return;
  dummy.position.set(at.x, at.y, at.z);
  dummy.rotation.set(0, yaw, pitch);
  dummy.scale.set(scale.x, scale.y, scale.z);
  dummy.updateMatrix();
  mesh.setMatrixAt(layer.n, dummy.matrix);
  tint.set(color).multiplyScalar(strength);
  mesh.setColorAt(layer.n, tint);
  layer.n += 1;
}

function finish(layer: Layer): void {
  const mesh = layer.mesh;
  if (!mesh) return;
  mesh.count = layer.n;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

/** A ballistic droplet thrown from `from` to `to` (u runs 0..1). */
function droplet(
  layer: Layer,
  from: { x: number; z: number },
  to: { x: number; z: number },
  peak: number,
  u: number,
  color: string,
  size: number,
): void {
  if (u <= 0 || u >= 1) return;
  const fade = 1 - u * u * u;
  put(
    layer,
    {
      x: from.x + (to.x - from.x) * u,
      y: 0.2 + peak * 4 * u * (1 - u),
      z: from.z + (to.z - from.z) * u,
    },
    0,
    { x: size * fade, y: size * fade, z: size * fade },
    color,
    1,
  );
}

type Layers = Record<'beams' | 'sharks' | 'rings' | 'sigils' | 'arms' | 'drops', Layer>;

/** The instanced layers live outside the component: they are refilled every frame, never rendered from. */
const LAYERS: Layers = {
  beams: newLayer(MAX_BEAMS),
  sharks: newLayer(MAX_SHARKS),
  rings: newLayer(MAX_RINGS),
  sigils: newLayer(MAX_SIGILS),
  arms: newLayer(MAX_ARMS),
  drops: newLayer(MAX_DROPS),
};

/** Everything Rosa's level unlocks that is not the base spell: sea waves, light beams, sharks, the arcane blast, plus finer surge and swing details. */
export function SkillEffects() {
  const crests = useRef<(Mesh | null)[]>([]);
  const layers = LAYERS;
  const geo = useMemo(
    () => ({
      crest: createCrestGeometry(),
      beam: createBeamGeometry(),
      shark: createSharkGeometry(),
      ring: new RingGeometry(0.86, 1, 48).rotateX(-Math.PI / 2),
      sigil: createSigilGeometry(),
      arm: createSpiralGeometry(),
      drop: new SphereGeometry(1, 5, 4),
    }),
    [],
  );

  // Every instanced layer gets its per-instance colors before the first draw, so the shader is built once.
  useEffect(() => {
    for (const layer of Object.values(LAYERS)) {
      const mesh = layer.mesh;
      if (!mesh) continue;
      for (let i = 0; i < layer.max; i++) mesh.setColorAt(i, tint.set('#000000'));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.count = 0;
    }
  }, []);

  useFrame(() => {
    const { beams, sharks, rings, sigils, arms, drops } = layers;
    for (const layer of [beams, sharks, rings, sigils, arms, drops]) begin(layer);

    // --- Sea waves (level-20 trident) ---
    combat.seaWaves.forEach((w, i) => {
      const m = crests.current[i];
      if (!m) return;
      m.visible = true;
      const fadeOut = clamp01((SEA_WAVE.life - w.age) / 0.25);
      const grow = clamp01(w.age / 0.1);
      m.position.set(w.pos.x - w.dir.x * 0.35, 0.02, w.pos.z - w.dir.z * 0.35);
      m.rotation.y = yawOf(w.dir);
      m.scale.set(1.6 * grow, (0.55 + 0.1 * Math.sin(w.age * 18)) * fadeOut, 1.6 * grow);
      (m.material as MeshBasicMaterial).opacity = 0.9 * fadeOut;
      // A little spray and foam trail behind the crest.
      for (let k = 0; k < 3; k++) {
        const seed = w.id * 13 + k * 5 + Math.floor(w.age * 30);
        put(
          drops,
          {
            x:
              w.pos.x -
              w.dir.x * (0.3 + 0.9 * rand(seed)) +
              (rand(seed + 1) - 0.5) * 1.6 * -w.dir.z,
            y: 0.25 + 0.5 * rand(seed + 2),
            z:
              w.pos.z - w.dir.z * (0.3 + 0.9 * rand(seed)) + (rand(seed + 1) - 0.5) * 1.6 * w.dir.x,
          },
          0,
          { x: 0.09, y: 0.09, z: 0.09 },
          '#e8fdff',
          fadeOut,
        );
      }
    });
    for (let i = combat.seaWaves.length; i < MAX_CRESTS; i++) {
      const m = crests.current[i];
      if (m) m.visible = false;
    }

    // --- Aura light beams (level 30) ---
    const aura = combat.aura;
    if (aura.active && aura.beams) {
      const progress = aura.t / aura.song.duration;
      const reach = aura.song.maxRadius * Math.min(1, progress);
      const fade = progress > 0.75 ? clamp01((1 - progress) / 0.25) : 1;
      for (let k = 0; k < LIGHT_BEAMS.count; k++) {
        const flicker = 0.8 + 0.2 * Math.sin(aura.t * 14 + k * 2);
        put(
          beams,
          { x: sim.curr.pos.x, y: 0.16, z: sim.curr.pos.z },
          -beamAngle(aura.t, k),
          { x: reach, y: 1, z: LIGHT_BEAMS.halfWidth * 2 },
          '#ffe9a0',
          fade * flicker,
        );
      }
    }

    // --- Sharks (level 40) ---
    for (const shark of combat.sharks) {
      if (shark.age < 0) continue;
      const u = shark.age / SHARKS.flight;
      const dir = { x: shark.to.x - shark.from.x, z: shark.to.z - shark.from.z };
      const len = Math.max(0.001, Math.hypot(dir.x, dir.z));
      const slope = (SHARKS.height * 4 * (1 - 2 * u)) / len;
      const size = 1.05 * Math.min(1, u * 8);
      put(
        sharks,
        {
          x: shark.from.x + dir.x * u,
          y: 0.3 + SHARKS.height * 4 * u * (1 - u),
          z: shark.from.z + dir.z * u,
        },
        yawOf(dir),
        { x: size, y: size, z: size },
        '#ffffff',
        1,
        Math.atan(slope) * 0.9,
      );
      // Water sheds from the jump.
      put(
        drops,
        {
          x: shark.from.x + dir.x * (u - 0.05) + (rand(shark.id + u * 40) - 0.5) * 0.4,
          y: 0.3 + SHARKS.height * 4 * (u - 0.05) * (1 - u + 0.05),
          z: shark.from.z + dir.z * (u - 0.05),
        },
        0,
        { x: 0.09, y: 0.09, z: 0.09 },
        '#dff9ff',
        1,
      );
    }

    // --- Effects: the Surge wave, the trident swing, shark splashes, the arcane blast ---
    for (const fx of combat.effects as Effect[]) {
      const t = clamp01(fx.age / fx.life);
      if (fx.type === 'wave') surgeDetails(layers, fx, t);
      else if (fx.type === 'arc') swingDetails(layers, fx, t);
      else if (fx.type === 'splash') splashDetails(layers, fx, t);
      else if (fx.type === 'arcane') arcaneDetails(layers, fx, t);
    }

    for (const layer of [beams, sharks, rings, sigils, arms, drops]) finish(layer);
  });

  const layerMesh = (
    layer: Layer,
    geometry: BufferGeometry,
    key: string,
    order: number,
    additive = true,
  ) => (
    <instancedMesh
      key={key}
      ref={(m: InstancedMesh | null) => {
        layer.mesh = m;
      }}
      args={[geometry, undefined, layer.max]}
      frustumCulled={false}
      renderOrder={order}
    >
      <meshBasicMaterial
        transparent={additive}
        depthWrite={!additive}
        side={DoubleSide}
        vertexColors={geometry.getAttribute('color') !== undefined}
        blending={additive ? AdditiveBlending : undefined}
      />
    </instancedMesh>
  );

  return (
    <>
      {Array.from({ length: MAX_CRESTS }, (_, i) => (
        <mesh
          key={`crest${i}`}
          ref={(m: Mesh | null) => {
            crests.current[i] = m;
          }}
          geometry={geo.crest}
          visible={false}
          renderOrder={4}
        >
          <meshBasicMaterial vertexColors transparent depthWrite={false} side={DoubleSide} />
        </mesh>
      ))}
      {layerMesh(layers.arms, geo.arm, 'arms', 4)}
      {layerMesh(layers.rings, geo.ring, 'rings', 5)}
      {layerMesh(layers.sigils, geo.sigil, 'sigils', 5)}
      {layerMesh(layers.beams, geo.beam, 'beams', 5)}
      {layerMesh(layers.sharks, geo.shark, 'sharks', 6, false)}
      {layerMesh(layers.drops, geo.drop, 'drops', 6)}
    </>
  );
}

/** Finer detail on the Surge: swirling foam arms and flying droplets (few draw calls: the wave itself is already busy). */
function surgeDetails(l: Layers, fx: Effect, t: number): void {
  const spread = easeOut(clamp01(t * 1.25));
  const at = { x: fx.x, y: 0.05, z: fx.z };
  const fade = 1 - t;
  for (let k = 0; k < ARMS_PER_SURGE; k++) {
    put(
      l.arms,
      { ...at, y: 0.09 },
      fx.age * 4.5 + (k / ARMS_PER_SURGE) * Math.PI * 2,
      { x: fx.size * 0.92 * spread, y: 1, z: fx.size * 0.92 * spread },
      '#ffffff',
      0.75 * fade,
    );
  }
  for (let k = 0; k < DROPS_PER_SURGE; k++) {
    const seed = fx.id * 29 + k * 3.1;
    const a = rand(seed) * Math.PI * 2;
    const reach = fx.size * (0.35 + 0.65 * rand(seed + 1));
    const delay = rand(seed + 2) * 0.35;
    droplet(
      l.drops,
      { x: fx.x + Math.cos(a) * reach * 0.5, z: fx.z + Math.sin(a) * reach * 0.5 },
      { x: fx.x + Math.cos(a) * reach, z: fx.z + Math.sin(a) * reach },
      1.2 + 1.8 * rand(seed + 3),
      (t - delay) / (1 - delay),
      '#e6fbff',
      0.08 + 0.1 * rand(seed + 4),
    );
  }
}

/** Foam flung off the trident's sweep. */
function swingDetails(l: Layers, fx: Effect, t: number): void {
  const base = yawOf(fx.dir);
  for (let k = 0; k < DROPS_PER_SWING; k++) {
    const seed = fx.id * 17 + k * 2.3;
    const a = -base + (rand(seed) - 0.5) * TRIDENT.halfAngle * 2;
    const far = fx.size * (0.7 + 0.5 * rand(seed + 1));
    droplet(
      l.drops,
      { x: fx.x + Math.cos(a) * fx.size * 0.5, z: fx.z + Math.sin(a) * fx.size * 0.5 },
      { x: fx.x + Math.cos(a) * far, z: fx.z + Math.sin(a) * far },
      0.6 + 0.8 * rand(seed + 2),
      t,
      '#f2fdff',
      0.06 + 0.05 * rand(seed + 3),
    );
  }
}

/** Where a shark comes down: a ring of water and a crown of droplets. */
function splashDetails(l: Layers, fx: Effect, t: number): void {
  const spread = 0.25 + 0.75 * easeOut(t);
  put(
    l.rings,
    { x: fx.x, y: 0.1, z: fx.z },
    0,
    { x: fx.size * spread, y: 1, z: fx.size * spread },
    '#bff7ff',
    (1 - t) * (1 - t),
  );
  for (let k = 0; k < DROPS_PER_SPLASH; k++) {
    const seed = fx.id * 11 + k * 4.7;
    const a = rand(seed) * Math.PI * 2;
    const reach = fx.size * (0.3 + 0.6 * rand(seed + 1));
    droplet(
      l.drops,
      { x: fx.x, z: fx.z },
      { x: fx.x + Math.cos(a) * reach, z: fx.z + Math.sin(a) * reach },
      1 + 1.6 * rand(seed + 2),
      t,
      '#dff9ff',
      0.09 + 0.07 * rand(seed + 3),
    );
  }
}

/** The arcane blast: a violet sigil (two rings and an eight-pointed star) that turns as it opens, and rising sparks. */
function arcaneDetails(l: Layers, fx: Effect, t: number): void {
  const grow = easeOut(clamp01(t * 1.5));
  const fade = (1 - t) * (1 - t);
  const size = fx.size * (0.35 + 0.65 * grow);
  put(
    l.sigils,
    { x: fx.x, y: 0.1, z: fx.z },
    fx.age * 2.4,
    { x: size, y: 1, z: size },
    '#ffffff',
    Math.min(1, fade * 1.5),
  );
  for (let k = 0; k < 10; k++) {
    const seed = fx.id * 7 + k * 5.9;
    const a = rand(seed) * Math.PI * 2;
    const r = fx.size * (0.2 + 0.7 * rand(seed + 1)) * grow;
    put(
      l.drops,
      {
        x: fx.x + Math.cos(a) * r,
        y: 0.3 + 2.2 * t * (0.4 + rand(seed + 2)),
        z: fx.z + Math.sin(a) * r,
      },
      0,
      { x: 0.1 * fade + 0.02, y: 0.1 * fade + 0.02, z: 0.1 * fade + 0.02 },
      '#d9c2ff',
      fade,
    );
  }
}
