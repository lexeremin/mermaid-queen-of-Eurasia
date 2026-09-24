import { METHODS, type Method } from '@/data/dialogue-types';
import { NPCS } from '@/data/npcs';
import { QUEST_BY_ID } from '@/data/quests';
import { ITEMS, STARTER_EQUIPMENT, isItemId, type EquipSlot, type ItemId } from '@/data/items';
import { BAG_SIZE } from '@/systems/inventory';
import { MAX_LEVEL, xpToNext } from '@/systems/progression';
import { clampRelationship } from '@/systems/relationship';

export const SAVE_VERSION = 3;

export type SavedNpc = { relationship: number; used: Method[]; joined: boolean };

export type SavedProgress = {
  level: number;
  xp: number;
  awarded: string[];
  bag: ({ id: ItemId; qty: number } | null)[];
  equipment: Record<EquipSlot, ItemId | null>;
};

export type SavedQuests = {
  active: Record<string, { counts: number[]; visited: string[] }>;
  completed: string[];
};

export type SaveData = {
  version: number;
  savedAt: string;
  playSeconds: number;
  hero: { form: 'human' | 'mermaid'; x: number; z: number; facingX: number; facingZ: number };
  npcs: Record<string, SavedNpc>;
  progress: SavedProgress;
  quests: SavedQuests;
};

type Raw = Record<string, unknown>;
export type Migrations = Readonly<Record<number, (data: Raw) => Raw>>;

/** `MIGRATIONS[n]` upgrades a version-n save to version n + 1. */
export const MIGRATIONS: Migrations = {
  1: (data) => ({ ...data, progress: defaultSavedProgress() }),
  2: (data) => ({ ...data, quests: defaultSavedQuests() }),
};

export const defaultSavedQuests = (): SavedQuests => ({ active: {}, completed: [] });

export const defaultSavedProgress = (): SavedProgress => ({
  level: 1,
  xp: 0,
  awarded: [],
  bag: Array.from({ length: BAG_SIZE }, () => null),
  equipment: { ...STARTER_EQUIPMENT },
});

const isRecord = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const finite = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const validDate = (value: unknown): string | null =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;

/** Upgrades an older save step by step. Returns null for unknown or newer-than-supported versions. */
export function migrateSave(
  raw: unknown,
  migrations: Migrations = MIGRATIONS,
  target = SAVE_VERSION,
): Raw | null {
  if (!isRecord(raw)) return null;
  let version = raw.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > target)
    return null;
  let data: Raw = raw;
  while (version < target) {
    const step = migrations[version];
    if (!step) return null;
    data = { ...step(data), version: version + 1 };
    version += 1;
  }
  return data;
}

const SLOTS: readonly EquipSlot[] = ['weapon', 'outfit', 'charm'];

function parseProgress(raw: unknown): SavedProgress {
  const fallback = defaultSavedProgress();
  if (!isRecord(raw)) return fallback;

  const level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(finite(raw.level, 1))));
  const xp =
    level >= MAX_LEVEL
      ? 0
      : Math.min(xpToNext(level) - 1, Math.max(0, Math.floor(finite(raw.xp, 0))));
  const awarded = Array.isArray(raw.awarded)
    ? [
        ...new Set(raw.awarded.filter((k): k is string => typeof k === 'string' && k.length < 60)),
      ].slice(0, 64)
    : [];

  const bag = fallback.bag;
  if (Array.isArray(raw.bag)) {
    raw.bag.slice(0, BAG_SIZE).forEach((entry, i) => {
      if (!isRecord(entry) || !isItemId(entry.id)) return;
      const qty = Math.min(ITEMS[entry.id].stack, Math.max(1, Math.floor(finite(entry.qty, 1))));
      bag[i] = { id: entry.id, qty };
    });
  }

  const equipment = { ...fallback.equipment };
  if (isRecord(raw.equipment)) {
    for (const slot of SLOTS) {
      const id = raw.equipment[slot];
      if (id === null) equipment[slot] = null;
      else if (isItemId(id)) {
        const def = ITEMS[id];
        if (def.kind === 'equipment' && def.slot === slot) equipment[slot] = id;
      }
    }
  }
  return { level, xp, awarded, bag, equipment };
}

function parseQuests(raw: unknown): SavedQuests {
  const result = defaultSavedQuests();
  if (!isRecord(raw)) return result;
  if (Array.isArray(raw.completed)) {
    result.completed = [
      ...new Set(
        raw.completed.filter((id): id is string => typeof id === 'string' && QUEST_BY_ID.has(id)),
      ),
    ];
  }
  if (isRecord(raw.active)) {
    for (const [id, entry] of Object.entries(raw.active)) {
      const def = QUEST_BY_ID.get(id);
      if (!def || result.completed.includes(id) || !isRecord(entry)) continue;
      const rawCounts = Array.isArray(entry.counts) ? entry.counts : [];
      const counts = def.objectives.map((o, i) => {
        const max = o.kind === 'kill' ? o.count : 0;
        return Math.min(max, Math.max(0, Math.floor(finite(rawCounts[i], 0))));
      });
      const zones = new Set(def.objectives.flatMap((o) => (o.kind === 'visit' ? o.zones : [])));
      const visited = Array.isArray(entry.visited)
        ? [
            ...new Set(
              entry.visited.filter((z): z is string => typeof z === 'string' && zones.has(z)),
            ),
          ]
        : [];
      result.active[id] = { counts, visited };
    }
  }
  return result;
}

/** Turns untrusted data into a valid SaveData, or null if it is not a usable save. */
export function parseSave(raw: unknown, migrations: Migrations = MIGRATIONS): SaveData | null {
  const data = migrateSave(raw, migrations);
  if (!data) return null;
  const savedAt = validDate(data.savedAt);
  const hero = data.hero;
  if (!savedAt || !isRecord(hero)) return null;

  const npcs: Record<string, SavedNpc> = {};
  if (isRecord(data.npcs)) {
    for (const def of NPCS) {
      const entry = data.npcs[def.id];
      if (!isRecord(entry)) continue;
      const used = Array.isArray(entry.used)
        ? METHODS.filter((m) => (entry.used as unknown[]).includes(m))
        : [];
      npcs[def.id] = {
        relationship: clampRelationship(finite(entry.relationship, def.initial)),
        used,
        joined: entry.joined === true,
      };
    }
  }

  return {
    version: SAVE_VERSION,
    savedAt,
    playSeconds: Math.max(0, finite(data.playSeconds, 0)),
    hero: {
      form: hero.form === 'mermaid' ? 'mermaid' : 'human',
      x: finite(hero.x, NaN),
      z: finite(hero.z, NaN),
      facingX: finite(hero.facingX, 0),
      facingZ: finite(hero.facingZ, 1),
    },
    npcs,
    progress: parseProgress(data.progress),
    quests: parseQuests(data.quests),
  };
}

/** Which of two saves to keep: the newer one; ties keep the local one. */
export function pickNewer(
  local: SaveData | null,
  cloud: SaveData | null,
): 'local' | 'cloud' | 'none' {
  if (!local && !cloud) return 'none';
  if (!cloud) return 'local';
  if (!local) return 'cloud';
  return Date.parse(cloud.savedAt) > Date.parse(local.savedAt) ? 'cloud' : 'local';
}
