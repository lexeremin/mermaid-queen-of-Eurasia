import { describe, expect, it } from 'vitest';
import { ENEMIES } from '@/data/enemies';
import { generateLayer, layerPower } from '@/data/maps/underground';
import { canUse } from '@/systems/abilities';
import { directionTo } from '@/systems/combat-math';
import { createCombatState, stepCombat, type CombatState } from '@/systems/combat';
import { computeStats } from '@/systems/progression';
import { overlapsHazard, type Hazard } from '@/systems/hazards';
import { PLAYER_RADIUS, stepPlayer, type PlayerState } from '@/systems/movement';
import { STARTER_EQUIPMENT } from '@/data/items';
import type { CollisionWorld } from '@/systems/collision';
import type { Vec2 } from '@/utils/vec2';

const DT = 1 / 60;
const layer = generateLayer(10);
const arena = layer.arena!;
const world: CollisionWorld = {
  bounds: { minX: 0, maxX: 60, minZ: 90, maxZ: 130 },
  // The four columns and the arena walls.
  colliders: [
    { kind: 'box', cx: arena.cx, cz: arena.cz - arena.hz - 1, hx: arena.hx + 2, hz: 1 },
    { kind: 'box', cx: arena.cx, cz: arena.cz + arena.hz + 1, hx: arena.hx + 2, hz: 1 },
    { kind: 'box', cx: arena.cx - arena.hx - 1, cz: arena.cz, hx: 1, hz: arena.hz + 2 },
    { kind: 'box', cx: arena.cx + arena.hx + 1, cz: arena.cz, hx: 1, hz: arena.hz + 2 },
  ],
};

/** The nearest spot outside a marked hazard, straight out from its middle (or across its narrow side). */
function escapePoint(from: Vec2, danger: Hazard | undefined): Vec2 | null {
  if (!danger) return null;
  const shape = danger.shape;
  if (shape.kind === 'circle') {
    const dir = directionTo({ x: shape.x, z: shape.z }, from);
    const d = shape.r + PLAYER_RADIUS + 1;
    return { x: shape.x + dir.x * d, z: shape.z + dir.z * d };
  }
  const nx = -Math.sin(shape.rot);
  const nz = Math.cos(shape.rot);
  const side = (from.x - shape.x) * nx + (from.z - shape.z) * nz >= 0 ? 1 : -1;
  const d = shape.hz + PLAYER_RADIUS + 1;
  const across = (from.x - shape.x) * nx + (from.z - shape.z) * nz;
  const push = d - Math.abs(across);
  return { x: from.x + nx * side * push, z: from.z + nz * side * push };
}

/**
 * A simple, honest bot: it walks up to the boss and stabs, and it steps out of any marked hazard (blinking out when the
 * marker is about to land). It does not dodge darts on purpose and never drinks a potion.
 */
function fight(
  level: number,
  seconds: number,
  power = 1,
): { won: boolean; hp: number; time: number; state: CombatState } {
  const stats = computeStats(level, STARTER_EQUIPMENT);
  const spawns = layer.enemies
    .filter((e) => e.kind === 'boss' || e.dormant)
    .map((e) => ({ ...e, power }));
  const s = createCombatState(spawns);
  s.hp = stats.maxHp;
  s.mana = stats.maxMana;
  let player: PlayerState = { pos: { x: arena.cx, z: arena.cz + 9 }, facing: { x: 0, z: -1 } };
  const boss = s.enemies.find((e) => e.kind === 'boss')!;
  let time = 0;
  while (time < seconds) {
    time += DT;
    let move: Vec2 = { x: 0, z: 0 };
    let dash = false;
    const danger = s.hazards.find(
      (h) => !h.hit && overlapsHazard(h.shape, player.pos, PLAYER_RADIUS + 0.7),
    );
    if (danger) {
      if (danger.shape.kind === 'circle') {
        move = directionTo({ x: danger.shape.x, z: danger.shape.z }, player.pos);
      } else {
        const s2 = danger.shape;
        const nx = -Math.sin(s2.rot);
        const nz = Math.cos(s2.rot);
        const side = (player.pos.x - s2.x) * nx + (player.pos.z - s2.z) * nz >= 0 ? 1 : -1;
        move = { x: nx * side, z: nz * side };
      }
      dash = danger.delay - danger.age < 0.3 && canUse(s.cooldowns, s.mana, 'blink');
    } else {
      const toBoss = directionTo(player.pos, boss.pos);
      const d = Math.hypot(boss.pos.x - player.pos.x, boss.pos.z - player.pos.z);
      if (d > 4.6) move = toBoss;
    }
    const d = Math.hypot(boss.pos.x - player.pos.x, boss.pos.z - player.pos.z);
    const frame = stepCombat(s, {
      dt: DT,
      playerPos: player.pos,
      playerFacing: player.facing,
      move,
      actions: {
        attack: !danger && d < 5,
        blink: dash,
        aura: false,
        spell: !danger && d < 4.2 && canUse(s.cooldowns, s.mana, 'spell'),
      },
      npcs: [],
      world,
      arena,
      stats,
      // Blink away from the marked spot (straight out of the hazard).
      resolveBlink: (from) => escapePoint(from, danger),
    });
    player = stepPlayer(player, { move }, DT, world);
    if (frame.blinkTo) player = { ...player, pos: frame.blinkTo };
    if (frame.faceOverride) player = { ...player, facing: frame.faceOverride };
    if (boss.state === 'dead') return { won: true, hp: s.hp, time, state: s };
    if (s.downed) return { won: false, hp: 0, time, state: s };
  }
  return { won: false, hp: s.hp, time, state: s };
}

describe('the fight is beatable', () => {
  it.skipIf(!process.env.BOSS_REPORT)('report', () => {
    for (const power of [1, layerPower(10), layerPower(30)]) {
      for (const level of [3, 5, 7, 10]) {
        const r = fight(level, 300, power);
        console.log(
          `power ${power.toFixed(2)} level ${level}: ${r.won ? 'WON' : 'lost'} in ${r.time.toFixed(0)} s, hp left ${Math.round(r.hp)}`,
        );
      }
    }
  });

  it('a level-5 Rosa with starter gear wins with basic dodging', () => {
    const result = fight(5, 300);
    expect(result.won, `hp ${result.hp} after ${result.time.toFixed(0)} s`).toBe(true);
  });

  it('is a real fight: it takes a while and it hurts', () => {
    const result = fight(5, 300);
    expect(result.time).toBeGreaterThan(25);
    expect(result.hp).toBeLessThan(computeStats(5, STARTER_EQUIPMENT).maxHp);
  });

  it('gets harder with depth: the layer-10 boss beats a level-7 Rosa in starter gear, a level-10 one wins', () => {
    const power = layerPower(10);
    expect(fight(7, 300, power).won).toBe(false);
    expect(fight(10, 300, power).won).toBe(true);
    const boss = createCombatState(layer.enemies.map((e) => ({ ...e, power }))).enemies.find(
      (e) => e.kind === 'boss',
    )!;
    expect(boss.hp).toBeCloseTo(ENEMIES.boss.maxHp * power, 0);
  });

  it('the boss has the health the design promises', () => {
    expect(ENEMIES.boss.maxHp).toBe(900);
  });
});
