import { METHODS, type Method } from '@/data/dialogue-types';
import { NPCS } from '@/data/npcs';
import { QUEST_BY_ID } from '@/data/quests';
import { RED_SQUARE } from '@/data/maps/red-square';
import { ITEMS, STARTER_EQUIPMENT, isItemId, type EquipSlot, type ItemId } from '@/data/items';
import { ENEMIES } from '@/data/enemies';
import { ABILITIES, type Form } from '@/systems/abilities';
import { HERB_REGROW_SECONDS } from '@/systems/gathering';
import { PICKUP_LIFE } from '@/systems/pickups';
import { BAG_SIZE, MAX_KEEPSAKES, isKeepsake } from '@/systems/inventory';
import { MAX_LEVEL, xpToNext } from '@/systems/progression';
import { clampRelationship } from '@/systems/relationship';

export const SAVE_VERSION = 8;

export type SavedNpc = {
  relationship: number;
  used: Method[];
  joined: boolean;
  following: boolean;
};

export type SavedProgress = {
  level: number;
  xp: number;
  awarded: string[];
  bag: ({ id: ItemId; qty: number } | null)[];
  /** Quest items, which take no bag slot. */
  keepsakes: Record<string, number>;
  /** Unlocked transformations (the human form is always there). */
  forms: Form[];
  equipment: Record<EquipSlot, ItemId | null>;
};

export type SavedQuests = {
  active: Record<string, { counts: number[]; visited: string[] }>;
  completed: string[];
};

export type SavedGarden = { pearlsTaken: string[]; shrineGift: boolean };

export type SavedDungeon = {
  hallsCleared: boolean;
  bossDefeated: boolean;
  cachesTaken: string[];
};

/** One enemy that is not in its spawn state (hurt, dead, woken). Alive ones come back calm at this spot. */
export type SavedEnemy = {
  hp: number;
  dead: boolean;
  /** Seconds it has been dead (play time; it respawns when this reaches the respawn time). */
  deadFor: number;
  dormant: boolean;
  x: number;
  z: number;
};

/**
 * The state of the world at save time, so a reload cannot refill mobs, the boss, health or cooldowns. Local only:
 * it is never uploaded to the cloud.
 */
export type SavedWorld = {
  hp: number;
  mana: number;
  downed: boolean;
  /** Seconds left on each ability's cooldown. */
  cooldowns: Record<string, number>;
  enemies: Record<string, SavedEnemy>;
  gateOpen: boolean;
  pickups: { item: ItemId; x: number; z: number; age: number }[];
  /** Seconds until each picked herb regrows. */
  herbs: Record<string, number>;
};

export type SaveData = {
  version: number;
  savedAt: string;
  playSeconds: number;
  hero: { form: 'human' | 'mermaid'; x: number; z: number; facingX: number; facingZ: number };
  npcs: Record<string, SavedNpc>;
  progress: SavedProgress;
  quests: SavedQuests;
  garden: SavedGarden;
  dungeon: SavedDungeon;
  /** Null in older saves and in cloud copies. */
  world: SavedWorld | null;
};

type Raw = Record<string, unknown>;
export type Migrations = Readonly<Record<number, (data: Raw) => Raw>>;

/** `MIGRATIONS[n]` upgrades a version-n save to version n + 1. */
export const MIGRATIONS: Migrations = {
  1: (data) => ({ ...data, progress: defaultSavedProgress() }),
  2: (data) => ({ ...data, quests: defaultSavedQuests() }),
  3: (data) => ({ ...data, garden: defaultSavedGarden() }),
  4: (data) => ({ ...data, dungeon: defaultSavedDungeon() }),
  // v8: unlocked forms (a hero saved as a mermaid keeps the form).
  7: (data) => {
    const hero = isRecord(data.hero) ? data.hero : {};
    const progress = isRecord(data.progress) ? data.progress : {};
    return {
      ...data,
      progress: { ...progress, forms: hero.form === 'mermaid' ? ['mermaid'] : [] },
    };
  },
  // v7: a local-only world snapshot is added (none for old saves).
  6: (data) => ({ ...data, world: null }),
  // v6: the boss gate opens when the halls are cleared (no stamp), and two quests were renamed.
  5: (data) => {
    const d = isRecord(data.dungeon) ? data.dungeon : {};
    const renamed: Record<string, string> = {
      'the-registrars-stamp': 'clear-the-halls',
      'tear-up-the-paperwork': 'end-the-corruption',
    };
    const rename = (id: string) => renamed[id] ?? id;
    const q = isRecord(data.quests) ? data.quests : {};
    const quests = {
      completed: Array.isArray(q.completed)
        ? q.completed.map((id) => (typeof id === 'string' ? rename(id) : id))
        : [],
      active: isRecord(q.active)
        ? Object.fromEntries(Object.entries(q.active).map(([id, v]) => [rename(id), v]))
        : {},
    };
    return {
      ...data,
      quests,
      dungeon: {
        hallsCleared: d.stampFound === true || d.gateOpen === true || d.bossDefeated === true,
        bossDefeated: d.bossDefeated === true,
        cachesTaken: d.cachesTaken,
      },
    };
  },
};

export const defaultSavedGarden = (): SavedGarden => ({ pearlsTaken: [], shrineGift: false });

export const defaultSavedDungeon = (): SavedDungeon => ({
  hallsCleared: false,
  bossDefeated: false,
  cachesTaken: [],
});

export const defaultSavedQuests = (): SavedQuests => ({ active: {}, completed: [] });

export const defaultSavedProgress = (): SavedProgress => ({
  level: 1,
  xp: 0,
  awarded: [],
  bag: Array.from({ length: BAG_SIZE }, () => null),
  keepsakes: {},
  forms: [],
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
  const keepsakes: Record<string, number> = {};
  const addKeepsake = (id: ItemId, qty: number) => {
    keepsakes[id] = Math.min(MAX_KEEPSAKES, (keepsakes[id] ?? 0) + qty);
  };
  if (isRecord(raw.keepsakes)) {
    for (const [id, qty] of Object.entries(raw.keepsakes)) {
      if (isItemId(id) && isKeepsake(id)) addKeepsake(id, Math.max(0, Math.floor(finite(qty, 0))));
    }
  }
  if (Array.isArray(raw.bag)) {
    raw.bag.slice(0, BAG_SIZE).forEach((entry, i) => {
      if (!isRecord(entry) || !isItemId(entry.id)) return;
      const qty = Math.min(ITEMS[entry.id].stack, Math.max(1, Math.floor(finite(entry.qty, 1))));
      // Older saves kept quest items in the bag: move them to the slot-free tally.
      if (isKeepsake(entry.id)) addKeepsake(entry.id, qty);
      else bag[i] = { id: entry.id, qty };
    });
  }
  for (const id of Object.keys(keepsakes)) if (!keepsakes[id]) delete keepsakes[id];

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
  const forms: Form[] =
    Array.isArray(raw.forms) && raw.forms.includes('mermaid') ? ['mermaid'] : [];
  return { level, xp, awarded, bag, keepsakes, forms, equipment };
}

const PEARL_IDS: ReadonlySet<string> = new Set(
  (RED_SQUARE.gatherables ?? []).filter((g) => g.kind === 'pearl').map((g) => g.id),
);

function parseGarden(raw: unknown): SavedGarden {
  const result = defaultSavedGarden();
  if (!isRecord(raw)) return result;
  if (Array.isArray(raw.pearlsTaken)) {
    result.pearlsTaken = [
      ...new Set(
        raw.pearlsTaken.filter((id): id is string => typeof id === 'string' && PEARL_IDS.has(id)),
      ),
    ];
  }
  result.shrineGift = raw.shrineGift === true;
  return result;
}

const CHEST_IDS: ReadonlySet<string> = new Set((RED_SQUARE.chests ?? []).map((c) => c.id));

function parseDungeon(raw: unknown): SavedDungeon {
  const result = defaultSavedDungeon();
  if (!isRecord(raw)) return result;
  result.bossDefeated = raw.bossDefeated === true;
  // Beating the boss implies the halls were cleared.
  result.hallsCleared = raw.hallsCleared === true || result.bossDefeated;
  if (Array.isArray(raw.cachesTaken)) {
    result.cachesTaken = [
      ...new Set(
        raw.cachesTaken.filter((id): id is string => typeof id === 'string' && CHEST_IDS.has(id)),
      ),
    ];
  }
  return result;
}

const ENEMY_KIND = new Map(RED_SQUARE.enemies.map((e) => [e.id, e.kind]));
const HERB_IDS: ReadonlySet<string> = new Set(
  (RED_SQUARE.gatherables ?? []).filter((g) => g.kind !== 'pearl').map((g) => g.id),
);
const MAX_PICKUPS = 40;
const bounded = (value: unknown, min: number, max: number, fallback: number): number =>
  Math.min(max, Math.max(min, finite(value, fallback)));

/** Turns untrusted data into a valid world snapshot, or null. Unknown ids and impossible numbers are dropped. */
function parseWorld(raw: unknown): SavedWorld | null {
  if (!isRecord(raw)) return null;
  const b = RED_SQUARE.bounds;
  const inMap = (x: number, z: number) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;

  const cooldowns: Record<string, number> = {};
  if (isRecord(raw.cooldowns)) {
    for (const [id, def] of Object.entries(ABILITIES)) {
      const left = bounded(raw.cooldowns[id], 0, def.cooldown, 0);
      if (left > 0) cooldowns[id] = left;
    }
  }

  const enemies: Record<string, SavedEnemy> = {};
  if (isRecord(raw.enemies)) {
    for (const [id, entry] of Object.entries(raw.enemies)) {
      const kind = ENEMY_KIND.get(id);
      if (!kind || !isRecord(entry)) continue;
      const x = finite(entry.x, NaN);
      const z = finite(entry.z, NaN);
      if (!inMap(x, z)) continue;
      enemies[id] = {
        hp: bounded(entry.hp, 0, ENEMIES[kind].maxHp, ENEMIES[kind].maxHp),
        dead: entry.dead === true,
        deadFor: bounded(entry.deadFor, 0, 3600, 0),
        dormant: entry.dormant === true,
        x,
        z,
      };
    }
  }

  const pickups: SavedWorld['pickups'] = [];
  if (Array.isArray(raw.pickups)) {
    for (const p of raw.pickups.slice(0, MAX_PICKUPS)) {
      if (!isRecord(p) || !isItemId(p.item)) continue;
      const x = finite(p.x, NaN);
      const z = finite(p.z, NaN);
      if (!inMap(x, z)) continue;
      pickups.push({ item: p.item, x, z, age: bounded(p.age, 0, PICKUP_LIFE, 0) });
    }
  }

  const herbs: Record<string, number> = {};
  if (isRecord(raw.herbs)) {
    for (const [id, left] of Object.entries(raw.herbs)) {
      if (!HERB_IDS.has(id)) continue;
      const seconds = bounded(left, 0, HERB_REGROW_SECONDS, 0);
      if (seconds > 0) herbs[id] = seconds;
    }
  }

  return {
    hp: bounded(raw.hp, 0, 100000, 1),
    mana: bounded(raw.mana, 0, 100000, 0),
    downed: raw.downed === true,
    cooldowns,
    enemies,
    gateOpen: raw.gateOpen === true,
    pickups,
    herbs,
  };
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
        following: entry.following === true && def.companion !== undefined,
      };
    }
  }

  const progress = parseProgress(data.progress);
  return {
    version: SAVE_VERSION,
    savedAt,
    playSeconds: Math.max(0, finite(data.playSeconds, 0)),
    hero: {
      // The mermaid form only counts once it has been unlocked.
      form: hero.form === 'mermaid' && progress.forms.includes('mermaid') ? 'mermaid' : 'human',
      x: finite(hero.x, NaN),
      z: finite(hero.z, NaN),
      facingX: finite(hero.facingX, 0),
      facingZ: finite(hero.facingZ, 1),
    },
    npcs,
    progress,
    quests: parseQuests(data.quests),
    garden: parseGarden(data.garden),
    dungeon: parseDungeon(data.dungeon),
    world: parseWorld(data.world),
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
