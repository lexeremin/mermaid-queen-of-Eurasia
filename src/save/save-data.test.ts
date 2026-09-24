import { describe, expect, it } from 'vitest';
import { migrateSave, parseSave, pickNewer, SAVE_VERSION, type SaveData } from '@/save/save-data';

const good = (over: Record<string, unknown> = {}) => ({
  version: SAVE_VERSION,
  savedAt: '2026-09-24T12:00:00.000Z',
  playSeconds: 120.5,
  hero: { form: 'mermaid', x: 3.5, z: -8, facingX: 1, facingZ: 0 },
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
    expect(save.npcs.grisha).toEqual({ relationship: 100, used: ['song'], joined: false });
    expect(save.npcs.tolik).toEqual({ relationship: 0, used: [], joined: false });
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
