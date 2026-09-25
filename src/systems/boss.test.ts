import { describe, expect, it } from 'vitest';
import { BOSS, phaseFor, stepBoss, type BossContext, type BossOutput } from '@/systems/boss';
import { ENEMIES } from '@/data/enemies';
import { blindEnemy, createEnemy, damageEnemy, type Enemy } from '@/systems/enemy-ai';

const ARENA = { cx: 0, cz: 0, hx: 12, hz: 12 };
const ctxFor = (overrides: Partial<BossContext> = {}): BossContext => ({
  player: { x: 0, z: 8 },
  playerAlive: true,
  time: 0,
  world: { bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 }, colliders: [] },
  arena: ARENA,
  dormantLeft: 4,
  ...overrides,
});
const boss = (): Enemy => createEnemy('boss', 'boss', { x: 0, z: -4 });
const MAX = ENEMIES.boss.maxHp;

/** Runs the boss for `seconds` and collects everything it emitted. */
function run(enemy: Enemy, seconds: number, ctx: BossContext = ctxFor()): BossOutput[] {
  const outs: BossOutput[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    ctx.time = t;
    outs.push(stepBoss(enemy, ctx, 1 / 60));
  }
  return outs;
}
const all = (outs: BossOutput[]) => ({
  hazards: outs.flatMap((o) => o.hazards),
  darts: outs.flatMap((o) => o.darts),
  summon: outs.reduce((n, o) => n + o.summon, 0),
});

describe('boss phases', () => {
  it('follows the health thresholds', () => {
    expect(phaseFor(1)).toBe(1);
    expect(phaseFor(0.61)).toBe(1);
    expect(phaseFor(0.59)).toBe(2);
    expect(phaseFor(0.31)).toBe(2);
    expect(phaseFor(0.29)).toBe(3);
  });
});

describe('boss brain', () => {
  it('sleeps until Rosa is inside the arena, then wakes and closes in', () => {
    const b = boss();
    run(b, 1, ctxFor({ player: { x: 30, z: 30 } }));
    expect(b.brain!.awake).toBe(false);
    expect(b.state).toBe('idle');
    const start = b.pos.z;
    run(b, 1);
    expect(b.brain!.awake).toBe(true);
    expect(b.pos.z).toBeGreaterThan(start);
  });

  it('opens with a telegraphed stamp slam on Rosa, landing after its delay', () => {
    const b = boss();
    const { hazards } = all(run(b, 4));
    const first = hazards[0]!;
    expect(first.shape.kind).toBe('circle');
    expect(first.delay).toBe(BOSS.stamp.windup);
    expect(first.damage).toBe(BOSS.stamp.damage);
    if (first.shape.kind === 'circle') {
      expect(first.shape.r).toBe(BOSS.stamp.radius);
      expect(Math.hypot(first.shape.x - 0, first.shape.z - 8)).toBeLessThan(0.5);
    }
  });

  it('fires a fan of five darts, and only darts, stomps and stamps in phase one', () => {
    const b = boss();
    const { hazards, darts, summon } = all(run(b, 30));
    expect(darts.length % BOSS.darts.count).toBe(0);
    expect(darts.length).toBeGreaterThan(0);
    expect(summon).toBe(0);
    expect(hazards.every((h) => h.shape.kind === 'circle')).toBe(true);
  });

  it('phase two summons helpers and unleashes the paper storm', () => {
    const b = boss();
    run(b, 0.5);
    b.hp = MAX * 0.5;
    const outs = run(b, 40);
    expect(outs.some((o) => o.phaseChanged === 2)).toBe(true);
    const { summon, darts } = all(outs);
    expect(summon).toBeGreaterThanOrEqual(BOSS.summon.count);
    expect(darts.filter((d) => d.speed === BOSS.storm.speed).length % BOSS.storm.ring).toBe(0);
    expect(darts.some((d) => d.speed === BOSS.storm.speed)).toBe(true);
  });

  it('does not summon when every helper is already awake', () => {
    const b = boss();
    b.hp = MAX * 0.5;
    expect(all(run(b, 40, ctxFor({ dormantLeft: 0 }))).summon).toBe(0);
  });

  it('phase three adds Form 27-B: three long rectangles', () => {
    const b = boss();
    b.hp = MAX * 0.2;
    const { hazards } = all(run(b, 30));
    const rects = hazards.filter((h) => h.shape.kind === 'rect');
    expect(rects.length).toBeGreaterThanOrEqual(3);
    expect(rects.length % 3).toBe(0);
    expect(rects[0]!.delay).toBe(BOSS.form.windup);
    expect(rects[0]!.damage).toBe(BOSS.form.damage);
  });

  it('a blinded boss does nothing, and Aura does not stagger his moves', () => {
    const b = boss();
    run(b, 0.5);
    blindEnemy(b, 5);
    const outs = run(b, 4, ctxFor({ time: 0 }));
    expect(all(outs).hazards).toHaveLength(0);
    expect(all(outs).darts).toHaveLength(0);
  });

  it('is never staggered by a hit and barely pushed', () => {
    const b = boss();
    run(b, 6);
    const before = b.state;
    damageEnemy(b, 10, { x: 0, z: 1 }, 6, 1);
    expect(b.state).toBe(before);
    expect(b.hp).toBe(MAX - 10);
    expect(Math.hypot(b.knock.x, b.knock.z)).toBeLessThan(0.5);
  });

  it('walks home and heals when Rosa leaves or faints, and starts over', () => {
    const b = boss();
    b.hp = MAX * 0.4;
    b.pos = { x: 8, z: 8 };
    run(b, 1);
    expect(b.brain!.phase).toBe(2);
    const outs = run(b, 30, ctxFor({ playerAlive: false }));
    expect(all(outs).hazards).toHaveLength(0);
    expect(b.brain!.awake).toBe(false);
    expect(b.brain!.phase).toBe(1);
    expect(Math.hypot(b.pos.x - b.spawn.x, b.pos.z - b.spawn.z)).toBeLessThan(0.5);
    expect(b.hp).toBe(MAX);
  });

  it('stays dead once defeated', () => {
    const b = boss();
    damageEnemy(b, MAX, { x: 0, z: 1 }, 6, 1);
    expect(b.state).toBe('dead');
    const outs = run(b, 5);
    expect(all(outs).hazards).toHaveLength(0);
    expect(b.state).toBe('dead');
  });
});
