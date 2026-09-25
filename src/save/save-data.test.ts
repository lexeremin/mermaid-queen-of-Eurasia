import { describe, expect, it } from 'vitest';
import { MAX_LEVEL } from '@/systems/progression';
import {
  defaultSavedProgress,
  migrateSave,
  parseSave,
  pickNewer,
  SAVE_VERSION,
  type SaveData,
} from '@/save/save-data';

const good = (over: Record<string, unknown> = {}) => ({
  version: SAVE_VERSION,
  savedAt: '2026-09-24T12:00:00.000Z',
  playSeconds: 120.5,
  hero: { form: 'mermaid', x: 3.5, z: -8, facingX: 1, facingZ: 0 },
  progress: { forms: ['mermaid'] },
  npcs: {
    grisha: { relationship: 58, used: ['song', 'kindness'], joined: false },
    tolik: { relationship: 80, used: ['song'], joined: true },
  },
  ...over,
});

describe('parseSave', () => {
  it('accepts a valid save', () => {
    const save = parseSave(good())!;
    expect(save.hero).toEqual({ form: 'mermaid', x: 3.5, z: -8, facingX: 1, facingZ: 0 });
    expect(save.npcs.grisha).toEqual({
      relationship: 58,
      used: ['kindness', 'song'],
      joined: false,
      following: false,
    });
    expect(save.npcs.tolik?.joined).toBe(true);
    expect(save.playSeconds).toBe(120.5);
  });

  it('rejects things that are not saves', () => {
    for (const bad of [
      null,
      undefined,
      42,
      'x',
      [],
      {},
      { version: 'one' },
      { version: 0 },
      { version: 1.5 },
    ]) {
      expect(parseSave(bad)).toBeNull();
    }
  });

  it('rejects saves without a valid date or hero', () => {
    expect(parseSave(good({ savedAt: 'yesterday' }))).toBeNull();
    expect(parseSave(good({ hero: null }))).toBeNull();
  });

  it('ignores saves from a newer game version', () => {
    expect(parseSave(good({ version: SAVE_VERSION + 1 }))).toBeNull();
  });

  it('clamps and sanitizes values instead of trusting them', () => {
    const save = parseSave(
      good({
        playSeconds: -5,
        hero: { form: 'dragon', x: 'far', z: Infinity, facingX: null },
        npcs: {
          grisha: { relationship: 9999, used: ['song', 'hax', 5], joined: 'yes' },
          tolik: { relationship: -30, used: 'song' },
          stranger: { relationship: 50 },
          lyoha: 'nope',
        },
      }),
    )!;
    expect(save.playSeconds).toBe(0);
    expect(save.hero.form).toBe('human');
    expect(Number.isNaN(save.hero.x)).toBe(true);
    expect(save.hero.facingZ).toBe(1);
    expect(save.npcs.grisha).toEqual({
      relationship: 100,
      used: ['song'],
      joined: false,
      following: false,
    });
    expect(save.npcs.tolik).toEqual({
      relationship: 0,
      used: [],
      joined: false,
      following: false,
    });
    expect(save.npcs).not.toHaveProperty('stranger');
    expect(save.npcs).not.toHaveProperty('lyoha');
  });

  it('tolerates a missing npcs section', () => {
    expect(parseSave(good({ npcs: undefined }))!.npcs).toEqual({});
  });
});

describe('migrateSave', () => {
  it('upgrades step by step through the registry', () => {
    const migrations = {
      1: (d: Record<string, unknown>) => ({ ...d, addedInV2: true }),
      2: (d: Record<string, unknown>) => ({ ...d, addedInV3: true }),
    };
    const out = migrateSave({ version: 1, keep: 'me' }, migrations, 3)!;
    expect(out).toMatchObject({ version: 3, keep: 'me', addedInV2: true, addedInV3: true });
  });

  it('gives up when a step is missing', () => {
    expect(migrateSave({ version: 1 }, {}, 2)).toBeNull();
  });

  it('leaves a current save untouched', () => {
    expect(migrateSave({ version: 1, a: 1 }, {}, 1)).toEqual({ version: 1, a: 1 });
  });
});

describe('pickNewer', () => {
  const at = (savedAt: string): SaveData => parseSave(good({ savedAt }))!;
  it('keeps the newer save, and local on ties', () => {
    expect(pickNewer(at('2026-01-01T00:00:00Z'), at('2026-01-02T00:00:00Z'))).toBe('cloud');
    expect(pickNewer(at('2026-01-03T00:00:00Z'), at('2026-01-02T00:00:00Z'))).toBe('local');
    expect(pickNewer(at('2026-01-02T00:00:00Z'), at('2026-01-02T00:00:00Z'))).toBe('local');
    expect(pickNewer(null, at('2026-01-02T00:00:00Z'))).toBe('cloud');
    expect(pickNewer(at('2026-01-02T00:00:00Z'), null)).toBe('local');
    expect(pickNewer(null, null)).toBe('none');
  });
});

describe('save v2: progress', () => {
  const v1 = () => ({
    version: 1,
    savedAt: '2026-09-24T12:00:00.000Z',
    playSeconds: 30,
    hero: { form: 'human', x: 1, z: 1, facingX: 0, facingZ: 1 },
    npcs: { grisha: { relationship: 70, used: ['song'], joined: false } },
  });

  it('migrates a v1 save: NPC state kept, progress defaults added', () => {
    const save = parseSave(v1())!;
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.npcs.grisha?.relationship).toBe(70);
    expect(save.progress).toEqual(defaultSavedProgress());
    expect(save.progress.equipment).toEqual({
      weapon: 'trident',
      outfit: 'tweedJacket',
      charm: null,
    });
    expect(save.progress.bag).toHaveLength(20);
  });

  it('keeps valid progress', () => {
    const bag = Array.from({ length: 20 }, () => null) as unknown[];
    bag[0] = { id: 'healingTea', qty: 4 };
    bag[7] = { id: 'silverTrident', qty: 1 };
    const save = parseSave(
      good({
        progress: {
          level: 4,
          xp: 50,
          awarded: ['mes:grisha', 'join:tolik'],
          bag,
          equipment: { weapon: 'pearlTrident', outfit: 'rainCloak', charm: null },
        },
      }),
    )!;
    expect(save.progress.level).toBe(4);
    expect(save.progress.xp).toBe(50);
    expect(save.progress.awarded).toEqual(['mes:grisha', 'join:tolik']);
    expect(save.progress.bag[0]).toEqual({ id: 'healingTea', qty: 4 });
    expect(save.progress.bag[7]).toEqual({ id: 'silverTrident', qty: 1 });
    expect(save.progress.equipment.weapon).toBe('pearlTrident');
  });

  it('sanitizes hostile progress instead of trusting it', () => {
    const save = parseSave(
      good({
        progress: {
          level: 999,
          xp: -5,
          awarded: ['a', 'a', 7, 'x'.repeat(200)],
          bag: [
            { id: 'healingTea', qty: 99999 },
            { id: 'hackerSword', qty: 1 },
            'nope',
            { id: 'silverTrident', qty: -3 },
            ...Array.from({ length: 50 }, () => ({ id: 'pearl', qty: 1 })),
          ],
          equipment: { weapon: 'rainCloak', outfit: 'velvetGown', charm: 'healingTea' },
        },
      }),
    )!;
    expect(save.progress.level).toBe(MAX_LEVEL);
    expect(save.progress.xp).toBe(0);
    expect(save.progress.awarded).toEqual(['a']);
    expect(save.progress.bag).toHaveLength(20);
    expect(save.progress.bag[0]).toEqual({ id: 'healingTea', qty: 1000 });
    expect(save.progress.bag[1]).toBeNull();
    expect(save.progress.bag[3]).toEqual({ id: 'silverTrident', qty: 1 });
    expect(save.progress.equipment).toEqual({
      weapon: 'trident',
      outfit: 'velvetGown',
      charm: null,
    });
  });

  it('caps xp below the next level threshold', () => {
    const save = parseSave(good({ progress: { level: 2, xp: 500 } }))!;
    expect(save.progress.xp).toBe(69);
  });

  it('falls back to defaults when progress is junk', () => {
    expect(parseSave(good({ progress: 'junk' }))!.progress).toEqual(defaultSavedProgress());
  });
});

describe('save v3: quests', () => {
  it('migrates a v2 save to an empty quest log', () => {
    const v2 = good({ version: 2, progress: defaultSavedProgress() });
    const save = parseSave(v2)!;
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.quests).toEqual({ active: {}, completed: [] });
  });

  it('migrates a v1 save all the way up', () => {
    const save = parseSave(good({ version: 1 }))!;
    expect(save.quests).toEqual({ active: {}, completed: [] });
    expect(save.progress.level).toBe(1);
  });

  it('keeps valid quest state', () => {
    const save = parseSave(
      good({
        quests: {
          active: {
            'clear-the-gloom': { counts: [2], visited: [] },
            'the-grand-tour': { counts: [0], visited: ['gum', 'manezh'] },
          },
          completed: ['first-notes'],
        },
      }),
    )!;
    expect(save.quests.active['clear-the-gloom']?.counts).toEqual([2]);
    expect(save.quests.active['the-grand-tour']?.visited).toEqual(['gum', 'manezh']);
    expect(save.quests.completed).toEqual(['first-notes']);
  });

  it('drops or repairs hostile quest data', () => {
    const save = parseSave(
      good({
        quests: {
          active: {
            'clear-the-gloom': { counts: [999], visited: 'x' },
            'a-court-forms': { counts: [5] },
            'first-notes': { counts: [], visited: [] },
            bogus: { counts: [1], visited: [] },
            'the-grand-tour': { counts: [0], visited: ['gum', 'gum', 'moon', 7] },
            'rising-tide': 'nope',
          },
          completed: ['first-notes', 'first-notes', 'bogus', 12],
        },
      }),
    )!;
    expect(save.quests.completed).toEqual(['first-notes']);
    expect(save.quests.active.bogus).toBeUndefined();
    expect(save.quests.active['first-notes']).toBeUndefined();
    expect(save.quests.active['rising-tide']).toBeUndefined();
    expect(save.quests.active['clear-the-gloom']).toEqual({ counts: [3], visited: [] });
    expect(save.quests.active['a-court-forms']?.counts).toEqual([0]);
    expect(save.quests.active['the-grand-tour']?.visited).toEqual(['gum']);
  });

  it('survives non-object quest data', () => {
    for (const bad of [null, 5, 'x', [], { active: 4, completed: 'y' }]) {
      expect(parseSave(good({ quests: bad }))!.quests).toEqual({ active: {}, completed: [] });
    }
  });
});

describe('save: companion following flag', () => {
  it('keeps following for an NPC who can be a companion and drops it for anyone else', () => {
    const save = parseSave(
      good({
        npcs: {
          mikhalych: { relationship: 80, used: [], joined: false, following: true },
          grisha: { relationship: 80, used: [], joined: false, following: true },
        },
      }),
    )!;
    expect(save.npcs.mikhalych?.following).toBe(true);
    expect(save.npcs.grisha?.following).toBe(false);
  });

  it('defaults to not following for older saves', () => {
    const save = parseSave(
      good({ npcs: { mikhalych: { relationship: 80, used: [], joined: true } } }),
    )!;
    expect(save.npcs.mikhalych?.following).toBe(false);
  });
});

describe('save v4: garden', () => {
  it('migrates a v3 save to an empty garden', () => {
    const save = parseSave(
      good({ version: 3, progress: defaultSavedProgress(), quests: { active: {}, completed: [] } }),
    )!;
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.garden).toEqual({ pearlsTaken: [], shrineGift: false });
  });

  it('keeps known pearls and the gift flag, drops everything else', () => {
    const save = parseSave(
      good({
        garden: { pearlsTaken: ['pearl-1', 'pearl-1', 'rose-1', 'nope', 3], shrineGift: true },
      }),
    )!;
    expect(save.garden.pearlsTaken).toEqual(['pearl-1']);
    expect(save.garden.shrineGift).toBe(true);
  });

  it('survives hostile garden data', () => {
    for (const bad of [null, 4, 'x', [], { pearlsTaken: 'all', shrineGift: 'yes' }]) {
      expect(parseSave(good({ garden: bad }))!.garden).toEqual({
        pearlsTaken: [],
        shrineGift: false,
      });
    }
  });
});

describe('save v5 and v6: the underground', () => {
  const v4 = () => ({
    version: 4,
    savedAt: '2026-09-25T12:00:00.000Z',
    playSeconds: 30,
    hero: { form: 'human', x: 1, z: 1, facingX: 0, facingZ: 1 },
    npcs: {},
    garden: { pearlsTaken: ['pearl-1'], shrineGift: true },
  });

  it('migrates a v4 save: everything kept, an untouched dungeon added', () => {
    const save = parseSave(v4())!;
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.garden.shrineGift).toBe(true);
    expect(save.dungeon).toEqual({
      hallsCleared: false,
      bossDefeated: false,
      cachesTaken: [],
      layer: 0,
      deepest: 0,
      bossLayers: [],
    });
  });

  it('migrates a v5 save: the stamp era becomes cleared halls, quests are renamed', () => {
    const save = parseSave({
      ...v4(),
      version: 5,
      dungeon: {
        stampFound: true,
        gateOpen: false,
        bossDefeated: false,
        cachesTaken: ['chest-hall'],
      },
      quests: {
        active: { 'tear-up-the-paperwork': { counts: [0], visited: [] } },
        completed: ['the-registrars-stamp'],
      },
    })!;
    // The old chests are gone in v10; having cleared the halls counts as having reached layer 1.
    expect(save.dungeon).toEqual({
      hallsCleared: true,
      bossDefeated: false,
      cachesTaken: [],
      layer: 0,
      deepest: 1,
      bossLayers: [],
    });
    expect(save.quests.completed).toEqual(['clear-the-halls']);
    expect(Object.keys(save.quests.active)).toEqual(['end-the-corruption']);
  });

  it('keeps a saved dungeon and drops unknown chests', () => {
    const save = parseSave(
      good({
        dungeon: {
          hallsCleared: true,
          bossDefeated: false,
          cachesTaken: ['L3-c1', 'L3-c1', 'chest-hall', 'L101-c1', 'L7-c2', 7],
        },
      }),
    )!;
    expect(save.dungeon.hallsCleared).toBe(true);
    expect(save.dungeon.cachesTaken).toEqual(['L3-c1', 'L7-c2']);
  });

  it('never contradicts itself: a beaten boss means cleared halls', () => {
    const save = parseSave(good({ dungeon: { bossDefeated: true } }))!;
    expect(save.dungeon).toMatchObject({ bossDefeated: true, hallsCleared: true });
  });

  it('survives a garbage dungeon section', () => {
    expect(parseSave(good({ dungeon: 'nope' }))!.dungeon.bossDefeated).toBe(false);
    expect(parseSave(good({ dungeon: { cachesTaken: 'all' } }))!.dungeon.cachesTaken).toEqual([]);
  });
});

describe('save v6: quest items take no bag slot', () => {
  it('moves pearls out of the bag of an older save into the tally', () => {
    const save = parseSave(
      good({
        progress: {
          level: 1,
          xp: 0,
          bag: [
            { id: 'pearl', qty: 3 },
            { id: 'healingTea', qty: 2 },
            { id: 'pearl', qty: 4 },
          ],
        },
      }),
    )!;
    expect(save.progress.keepsakes).toEqual({ pearl: 7 });
    expect(save.progress.bag.filter(Boolean)).toEqual([{ id: 'healingTea', qty: 2 }]);
  });

  it('keeps and sanitizes a saved tally', () => {
    const save = parseSave(
      good({ progress: { keepsakes: { pearl: 12, healingTea: 5, nothing: 3, roseHip: -2 } } }),
    )!;
    expect(save.progress.keepsakes).toEqual({ pearl: 12 });
  });
});

describe('save v7: the world snapshot', () => {
  const world = (over: Record<string, unknown> = {}) => ({
    hp: 60,
    mana: 40,
    downed: false,
    cooldowns: { blink: 2.5, aura: 99999, nothing: 3 },
    enemies: {
      'tycoon-basil': { hp: 5, dead: false, deadFor: 0, dormant: false, x: -3, z: -26 },
      'speaker-basil': { hp: 0, dead: true, deadFor: 30, dormant: false, x: 4, z: -21 },
      'not-an-enemy': { hp: 1, dead: false, deadFor: 0, dormant: false, x: 0, z: 0 },
      'tycoon-manezh': { hp: 99999, dead: false, deadFor: 0, dormant: false, x: 5000, z: 5000 },
    },
    gateOpen: true,
    pickups: [
      { item: 'pearl', x: 1, z: 1, age: 10 },
      { item: 'not-an-item', x: 1, z: 1, age: 0 },
      { item: 'healingTea', x: 9999, z: 0, age: 0 },
    ],
    herbs: { 'rose-1': 40, 'pearl-1': 40, nothing: 10, 'rose-2': 99999 },
    ...over,
  });

  it('migrates a v6 save with no world (null)', () => {
    const save = parseSave({
      ...good({ version: 6 }),
      dungeon: {},
      progress: {},
      quests: {},
      garden: {},
    })!;
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.world).toBeNull();
  });

  it('keeps a valid world and drops or clamps everything impossible', () => {
    const save = parseSave(good({ world: world() }))!;
    const w = save.world!;
    expect(w.hp).toBe(60);
    expect(w.gateOpen).toBe(true);
    expect(w.cooldowns.blink).toBe(2.5);
    expect(w.cooldowns.aura).toBe(8);
    expect(w.cooldowns).not.toHaveProperty('nothing');
    expect(Object.keys(w.enemies).sort()).toEqual(['speaker-basil', 'tycoon-basil']);
    expect(w.enemies['speaker-basil']!.dead).toBe(true);
    expect(w.pickups).toEqual([{ item: 'pearl', x: 1, z: 1, age: 10 }]);
    expect(Object.keys(w.herbs)).toEqual(['rose-1', 'rose-2']);
    expect(w.herbs['rose-2']).toBe(90);
  });

  it('is null for garbage', () => {
    expect(parseSave(good({ world: 'nope' }))!.world).toBeNull();
    expect(parseSave(good({ world: [] }))!.world).toBeNull();
  });
});

describe('save v8: forms', () => {
  it('migrates a v7 save: a mermaid hero keeps the form unlocked, a human has none', () => {
    const v7 = (form: string) => ({
      version: 7,
      savedAt: '2026-09-25T12:00:00.000Z',
      playSeconds: 1,
      hero: { form, x: 1, z: 1, facingX: 0, facingZ: 1 },
      npcs: {},
    });
    const mermaid = parseSave(v7('mermaid'))!;
    expect(mermaid.version).toBe(SAVE_VERSION);
    expect(mermaid.progress.forms).toEqual(['mermaid']);
    expect(mermaid.hero.form).toBe('mermaid');
    const human = parseSave(v7('human'))!;
    expect(human.progress.forms).toEqual([]);
  });

  it('turns a mermaid hero human when the form was never unlocked', () => {
    const save = parseSave(good({ progress: {} }))!;
    expect(save.hero.form).toBe('human');
    expect(save.progress.forms).toEqual([]);
  });

  it('keeps only known forms', () => {
    const save = parseSave(good({ progress: { forms: ['dragon', 'mermaid', 7] } }))!;
    expect(save.progress.forms).toEqual(['mermaid']);
  });
});

describe('save v9: archangels', () => {
  it('migrates a v8 save to no archangels saved', () => {
    const save = parseSave(good({ version: 8 }))!;
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.archangels).toEqual({ saved: [] });
  });

  it('keeps known children once, drops everything else', () => {
    const save = parseSave(
      good({ archangels: { saved: ['michael', 'michael', 'serafima', 'nope', 3] } }),
    )!;
    expect(save.archangels.saved).toEqual(['michael', 'serafima']);
  });

  it('survives hostile archangel data', () => {
    for (const bad of [null, 4, 'x', [], { saved: 'all' }]) {
      expect(parseSave(good({ archangels: bad }))!.archangels).toEqual({ saved: [] });
    }
  });
});

describe('save v10: the endless dungeon', () => {
  it('migrates a hero below ground to the metro pavilion, with the boss as layer 10', () => {
    const save = parseSave(
      good({
        version: 9,
        hero: { form: 'human', x: 13, z: 150, facingX: 0, facingZ: -1 },
        dungeon: { hallsCleared: true, bossDefeated: true, cachesTaken: ['chest-hall'] },
      }),
    )!;
    expect(save.hero).toMatchObject({ x: 25, z: 69.4 });
    expect(save.dungeon).toEqual({
      hallsCleared: true,
      bossDefeated: true,
      cachesTaken: [],
      layer: 0,
      deepest: 10,
      bossLayers: [10],
    });
  });

  it('keeps a hero on the surface where she was', () => {
    const save = parseSave(good({ version: 9 }))!;
    expect(save.hero).toMatchObject({ x: 3.5, z: -8 });
    expect(save.dungeon).toMatchObject({ layer: 0, deepest: 0 });
  });

  it('keeps the layer, the deepest layer and the paid bosses, and clamps the rest', () => {
    const save = parseSave(
      good({
        hero: { form: 'human', x: 13, z: 150, facingX: 0, facingZ: -1 },
        dungeon: { layer: 42, deepest: 30, bossLayers: [10, 10, 20, 15, 0, 110, 'x'] },
      }),
    )!;
    expect(save.dungeon.layer).toBe(42);
    // The deepest layer is never above the current one being wrong: it is at least the current layer.
    expect(save.dungeon.deepest).toBe(42);
    expect(save.dungeon.bossLayers).toEqual([10, 20]);
    expect(parseSave(good({ dungeon: { deepest: 900 } }))!.dungeon.deepest).toBe(100);
  });

  it('makes the layer and the hero position agree', () => {
    // A layer but a hero on the surface: back to the surface.
    expect(parseSave(good({ dungeon: { layer: 5 } }))!.dungeon.layer).toBe(0);
    // A hero below ground with no layer: the position is dropped (the hero starts at the spawn).
    const stray = parseSave(
      good({ hero: { form: 'human', x: 13, z: 150 }, dungeon: { layer: 0 } }),
    )!;
    expect(Number.isNaN(stray.hero.x)).toBe(true);
  });

  it('accepts a saved layer enemy by id and drops impossible ones', () => {
    const id = 'L12-r1-1';
    const save = parseSave(
      good({
        hero: { form: 'human', x: 13, z: 150 },
        dungeon: { layer: 12 },
        world: {
          hp: 50,
          mana: 10,
          downed: false,
          enemies: {
            [id]: { hp: 1e9, dead: false, x: 13, z: 150 },
            'L12-nope': { hp: 5, dead: false, x: 13, z: 150 },
            'L500-r1-1': { hp: 5, dead: false, x: 13, z: 150 },
          },
        },
      }),
    )!;
    expect(Object.keys(save.world!.enemies)).toEqual([id]);
    expect(save.world!.enemies[id]!.hp).toBeLessThan(200);
  });
});
