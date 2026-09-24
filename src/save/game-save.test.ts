import { beforeEach, describe, expect, it } from 'vitest';
import { currentMap } from '@/game/world/current-map';
import { resetSim, sim } from '@/game/sim';
import { applySave, collectSave } from '@/save/game-save';
import { parseSave, SAVE_VERSION } from '@/save/save-data';
import { useGameStore } from '@/store/game-store';
import { useNpcStore } from '@/store/npc-store';

const save = (hero: Record<string, unknown>, npcs: Record<string, unknown> = {}) =>
  parseSave({
    version: SAVE_VERSION,
    savedAt: '2026-09-24T12:00:00.000Z',
    playSeconds: 90,
    hero,
    npcs,
  })!;

describe('game save', () => {
  beforeEach(() => {
    resetSim();
    useNpcStore.getState().reset();
    useGameStore.getState().setForm('human');
  });

  it('round-trips progress through apply and collect', () => {
    applySave(
      save(
        { form: 'mermaid', x: 5, z: 24, facingX: 0, facingZ: -1 },
        { grisha: { relationship: 66, used: ['song', 'silence'], joined: true } },
      ),
    );
    const out = collectSave();
    expect(out.hero.form).toBe('mermaid');
    expect(out.hero.x).toBeCloseTo(5);
    expect(out.hero.z).toBeCloseTo(24);
    expect(out.hero.facingZ).toBeCloseTo(-1);
    expect(out.npcs.grisha).toEqual({ relationship: 66, used: ['song', 'silence'], joined: true });
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
});
