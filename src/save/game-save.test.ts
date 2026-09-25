import { beforeEach, describe, expect, it } from 'vitest';
import { combat, resetCombat } from '@/game/combat-sim';
import { gather, rebuildGather } from '@/game/gather-sim';
import { loot } from '@/game/loot-sim';
import { currentMap } from '@/game/world/current-map';
import { useDungeonStore } from '@/store/dungeon-store';
import { useGardenStore } from '@/store/garden-store';
import { resetSim, sim } from '@/game/sim';
import { applySave, collectSave } from '@/save/game-save';
import { parseSave, SAVE_VERSION } from '@/save/save-data';
import { useGameStore } from '@/store/game-store';
import { useNpcStore } from '@/store/npc-store';
import { useProgressStore } from '@/store/progress-store';
import { useQuestStore } from '@/store/quest-store';

const save = (hero: Record<string, unknown>, npcs: Record<string, unknown> = {}) =>
  parseSave({
    version: SAVE_VERSION,
    savedAt: '2026-09-24T12:00:00.000Z',
    playSeconds: 90,
    hero,
    npcs,
    progress: { forms: ['mermaid'] },
  })!;

describe('game save', () => {
  beforeEach(() => {
    resetSim();
    useNpcStore.getState().reset();
    useProgressStore.getState().reset();
    useQuestStore.getState().reset();
    useGameStore.getState().setForm('human');
    useGardenStore.getState().reset();
    useDungeonStore.getState().reset();
    resetCombat();
    rebuildGather();
  });

  it('round-trips progress through apply and collect', () => {
    applySave(
      save(
        { form: 'mermaid', x: 5, z: 24, facingX: 0, facingZ: -1 },
        { grisha: { relationship: 66, used: ['song', 'silence'], joined: true, following: false } },
      ),
    );
    const out = collectSave();
    expect(out.hero.form).toBe('mermaid');
    expect(out.hero.x).toBeCloseTo(5);
    expect(out.hero.z).toBeCloseTo(24);
    expect(out.hero.facingZ).toBeCloseTo(-1);
    expect(out.npcs.grisha).toEqual({
      relationship: 66,
      used: ['song', 'silence'],
      joined: true,
      following: false,
    });
    expect(out.npcs.tolik?.relationship).toBe(8);
    expect(out.playSeconds).toBe(90);
    expect(parseSave(JSON.parse(JSON.stringify(out)))).not.toBeNull();
  });

  it('keeps NPCs missing from the save at their starting values', () => {
    applySave(save({ form: 'human', x: 0, z: 24 }, { grisha: { relationship: 50 } }));
    expect(useNpcStore.getState().npcs.kolya?.relationship).toBe(12);
  });

  it('keeps the spawn when the saved position is NaN or inside a wall', () => {
    applySave(save({ form: 'human', x: 'far', z: null }));
    expect(sim.curr.pos).toEqual(currentMap.spawn);
    applySave(save({ form: 'human', x: -16.5, z: 5 }));
    expect(sim.curr.pos).toEqual(currentMap.spawn);
  });

  it('normalizes a zero facing vector', () => {
    applySave(save({ form: 'human', x: 0, z: 24, facingX: 0, facingZ: 0 }));
    expect(Math.hypot(sim.curr.facing.x, sim.curr.facing.z)).toBeCloseTo(1);
  });

  it('round-trips level, xp, bag, equipment and awarded keys', () => {
    const p = useProgressStore.getState();
    p.gainXp(60);
    p.award('mes:grisha', 25);
    p.addItem('healingTea', 3);
    p.addItem('silverTrident', 1);
    p.equip(1);
    const out = collectSave();
    expect(out.progress.level).toBe(2);
    expect(out.progress.equipment.weapon).toBe('silverTrident');
    expect(out.progress.awarded).toEqual(['mes:grisha']);
    useProgressStore.getState().reset();
    applySave(parseSave(JSON.parse(JSON.stringify(out)))!);
    const restored = useProgressStore.getState();
    expect(restored.level).toBe(out.progress.level);
    expect(restored.xp).toBe(out.progress.xp);
    expect(restored.equipment.weapon).toBe('silverTrident');
    expect(restored.bag.filter((s) => s?.id === 'healingTea')[0]?.qty).toBe(3);
    expect(restored.awarded).toEqual(['mes:grisha']);
  });

  it('round-trips the quest log', () => {
    const base = save({ form: 'human', x: 0, z: 24, facingX: 0, facingZ: 1 });
    applySave({
      ...base,
      quests: {
        active: { 'clear-the-gloom': { counts: [2], visited: [] } },
        completed: ['first-notes'],
      },
    });
    expect(useQuestStore.getState().log.completed).toEqual(['first-notes']);
    const out = collectSave();
    expect(out.quests.active['clear-the-gloom']).toEqual({ counts: [2], visited: [] });
    expect(out.quests.completed).toEqual(['first-notes']);
    expect(parseSave(JSON.parse(JSON.stringify(out)))?.quests).toEqual(out.quests);
  });

  describe('the world survives a reload', () => {
    const enemy = (id: string) => combat.enemies.find((e) => e.id === id)!;
    const reload = () => {
      const saved = parseSave(JSON.parse(JSON.stringify(collectSave())))!;
      resetCombat();
      rebuildGather();
      applySave(saved);
    };

    it('keeps dead mobs dead with their respawn timer, and hurt ones hurt', () => {
      const dead = enemy('tycoon-basil');
      dead.hp = 0;
      dead.state = 'dead';
      dead.deadFor = 100;
      const hurt = enemy('speaker-basil');
      hurt.hp = 12;
      reload();
      expect(enemy('tycoon-basil').state).toBe('dead');
      expect(enemy('tycoon-basil').deadFor).toBe(100);
      expect(enemy('speaker-basil').hp).toBe(12);
      expect(enemy('speaker-basil').state).not.toBe('dead');
      expect(enemy('tycoon-manezh').hp).toBeGreaterThan(0);
    });

    it('keeps health, mana, cooldowns and the fainted state', () => {
      combat.hp = 37;
      combat.mana = 11;
      combat.cooldowns.blink = 3;
      reload();
      expect(combat.hp).toBe(37);
      expect(combat.mana).toBe(11);
      expect(combat.cooldowns.blink).toBe(3);
      combat.downed = true;
      combat.hp = 0;
      reload();
      expect(combat.downed).toBe(true);
      expect(useGameStore.getState().downed).toBe(true);
    });

    it('keeps the boss hurt, his woken helpers and the open gate', () => {
      const boss = enemy('ug-boss');
      boss.hp = 300;
      const helper = enemy('ug-helper-1');
      helper.dormant = false;
      useDungeonStore.getState().openGate();
      reload();
      expect(enemy('ug-boss').hp).toBe(300);
      expect(enemy('ug-helper-1').dormant).toBe(false);
      expect(enemy('ug-helper-2').dormant).toBe(true);
      expect(useDungeonStore.getState().gateOpen).toBe(true);
    });

    it('keeps ground loot and herb timers', () => {
      loot.pickups = [{ id: 1, item: 'pearl', pos: { x: 0, z: 20 }, age: 12, collectAfter: 0 }];
      const herb = gather.nodes.find((n) => n.kind === 'roseHip')!;
      herb.readyAt = gather.time + 50;
      reload();
      expect(loot.pickups).toHaveLength(1);
      expect(loot.pickups[0]!.age).toBe(12);
      expect(gather.nodes.find((n) => n.id === herb.id)!.readyAt).toBeCloseTo(50, 3);
    });

    it('a cloud copy (no world) does not refill what is running', () => {
      combat.hp = 20;
      const cloud = parseSave({ ...JSON.parse(JSON.stringify(collectSave())), world: null })!;
      applySave(cloud);
      expect(combat.hp).toBe(20);
    });
  });
});
