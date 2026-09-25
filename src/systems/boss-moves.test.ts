import { describe, expect, it } from 'vitest';
import { BOSS_KINDS, BOSS_LINES, ENEMIES, isBossKind, type EnemyKind } from '@/data/enemies';
import { BOSS, bossMoves, bossTuning, stepBoss, type BossOutput } from '@/systems/boss';
import { createEnemy, maxHpOf } from '@/systems/enemy-ai';

const DT = 1 / 60;
const arena = { cx: 0, cz: 0, hx: 12, hz: 12 };
const world = { bounds: { minX: -40, maxX: 40, minZ: -40, maxZ: 40 }, colliders: [], water: [] };

/** Runs a boss against a Rosa standing still for `seconds`, collecting everything he throws. */
function run(kind: EnemyKind, seconds: number, player = { x: 9, z: 0 }, power = 1) {
  const enemy = createEnemy('b', kind, { x: -4, z: 0 }, { power });
  const seen: BossOutput[] = [];
  for (let t = 0; t < seconds; t += DT) {
    seen.push(
      stepBoss(enemy, { player, playerAlive: true, time: t, world, arena, dormantLeft: 4 }, DT),
    );
  }
  return { enemy, seen };
}

describe('the bosses', () => {
  it('are five, each with a name, a health, a model and a line for backup and for fury', () => {
    expect(BOSS_KINDS).toHaveLength(5);
    expect(new Set(BOSS_KINDS.map((k) => ENEMIES[k].name)).size).toBe(5);
    expect(new Set(BOSS_KINDS.map((k) => ENEMIES[k].asset)).size).toBe(5);
    for (const kind of BOSS_KINDS) {
      expect(isBossKind(kind)).toBe(true);
      expect(BOSS_LINES[kind]?.angry.length, kind).toBeGreaterThan(10);
      expect(BOSS_LINES[kind]?.furious.length, kind).toBeGreaterThan(10);
      expect(ENEMIES[kind].maxHp, kind).toBeGreaterThanOrEqual(900);
    }
    expect(isBossKind('tycoon')).toBe(false);
  });

  it('have their own moves in every phase, and none is empty', () => {
    const rows = BOSS_KINDS.map((kind) =>
      JSON.stringify([1, 2, 3].map((p) => bossMoves(kind, p as 1 | 2 | 3))),
    );
    expect(new Set(rows).size).toBe(5);
    for (const kind of BOSS_KINDS) {
      for (const phase of [1, 2, 3] as const)
        expect(bossMoves(kind, phase).length, `${kind} ${phase}`).toBeGreaterThan(2);
    }
  });

  it('keep Father of Corruption exactly as he was', () => {
    expect(bossTuning('boss')).toBe(BOSS);
    expect(bossMoves('boss', 1)).toEqual(['stamp', 'stomp', 'darts', 'stomp', 'stamp', 'darts']);
  });

  it('every boss wakes, fights and marks the floor before he hits', () => {
    for (const kind of BOSS_KINDS) {
      const { seen } = run(kind, 12);
      const hazards = seen.flatMap((o) => o.hazards);
      const darts = seen.flatMap((o) => o.darts);
      expect(hazards.length + darts.length, kind).toBeGreaterThan(0);
      for (const h of hazards) expect(h.delay, kind).toBeGreaterThan(0.4);
    }
  });
});

describe('the rain (the Lobbyist and the Spin Doctor)', () => {
  it('drops marked circles one after another, the first where Rosa stands, the rest around her', () => {
    const { seen } = run('lobbyist', 8);
    const drops = seen
      .map((o) => o.hazards)
      .find((h) => h.length >= 6 && h.every((x) => x.shape.kind === 'circle'))!;
    expect(drops).toBeDefined();
    const shapes = drops.map((h) => h.shape as { x: number; z: number; r: number });
    expect(Math.hypot(shapes[0]!.x - 9, shapes[0]!.z)).toBeLessThan(0.01);
    for (const s of shapes)
      expect(Math.hypot(s.x - 9, s.z)).toBeLessThan(bossTuning('lobbyist').rain.spread + 0.01);
    const delays = drops.map((h) => h.delay);
    expect([...delays].sort((a, b) => a - b)).toEqual(delays);
    expect(delays[delays.length - 1]! - delays[0]!).toBeGreaterThan(0.5);
  });

  it('is the same every time (it rolls from the boss’s own seed)', () => {
    const a = run('lobbyist', 8).seen.flatMap((o) => o.hazards);
    const b = run('lobbyist', 8).seen.flatMap((o) => o.hazards);
    expect(a).toEqual(b);
  });
});

describe('the charge (the Yacht Baron)', () => {
  it('marks a lane first, then runs down it', () => {
    const { seen, enemy } = run('baron', 4);
    const lane = seen.flatMap((o) => o.hazards).find((h) => h.shape.kind === 'rect')!;
    expect(lane).toBeDefined();
    const shape = lane.shape as {
      kind: 'rect';
      x: number;
      z: number;
      hx: number;
      hz: number;
      rot: number;
    };
    expect(shape.hz).toBeCloseTo(bossTuning('baron').charge.halfWidth);
    expect(lane.delay).toBeCloseTo(bossTuning('baron').charge.windup);
    // He ends the move well away from where he started, on the lane's line.
    expect(enemy.pos.x).toBeGreaterThan(-4 + shape.hx);
    expect(Math.abs(enemy.pos.z)).toBeLessThan(0.5);
  });

  it('stops at a wall instead of running through it', () => {
    const enemy = createEnemy('b', 'baron', { x: -4, z: 0 });
    const walled = {
      ...world,
      colliders: [{ kind: 'box' as const, cx: 2, cz: 0, hx: 0.5, hz: 6 }],
    };
    for (let t = 0; t < 4; t += DT) {
      stepBoss(
        enemy,
        {
          player: { x: 9, z: 0 },
          playerAlive: true,
          time: t,
          world: walled,
          arena,
          dormantLeft: 4,
        },
        DT,
      );
    }
    expect(enemy.pos.x).toBeLessThan(2 - 0.5);
  });
});

describe('the boss’s health with depth', () => {
  it('follows the layer power for every kind', () => {
    for (const kind of BOSS_KINDS) {
      const e = createEnemy('b', kind, { x: 0, z: 0 }, { power: 3 });
      expect(maxHpOf(e)).toBeCloseTo(ENEMIES[kind].maxHp * 3);
      expect(e.hp).toBeCloseTo(ENEMIES[kind].maxHp * 3);
    }
  });
});
