import { combat, resetCombat } from '@/game/combat-sim';
import { currentWorld } from '@/game/world/current-map';
import { resetSim, sim } from '@/game/sim';
import { KEYS, readJson, removeKey, writeJson } from '@/save/storage';
import { parseSave, SAVE_VERSION, type SaveData } from '@/save/save-data';
import { isSimRunning, useGameStore } from '@/store/game-store';
import { useNpcStore, type NpcRuntime } from '@/store/npc-store';
import { useProgressStore, currentStats } from '@/store/progress-store';
import { useGardenStore } from '@/store/garden-store';
import { useDungeonStore } from '@/store/dungeon-store';
import { syncDungeonWorld } from '@/game/dungeon-sim';
import { applyWorld, collectWorld } from '@/save/world-save';
import { onSaveRequest } from '@/save/save-requests';
import { useQuestStore } from '@/store/quest-store';
import { rebuildGather } from '@/game/gather-sim';
import { resolveCircle } from '@/systems/collision';
import { PLAYER_RADIUS } from '@/systems/movement';

const AUTOSAVE_MS = 10_000;
const DEBOUNCE_MS = 500;

let playSeconds = 0;
const savedListeners: Array<(save: SaveData) => void> = [];

/** Called after every local write, e.g. to schedule a cloud push. */
export function onSaved(listener: (save: SaveData) => void): void {
  savedListeners.push(listener);
}

export function collectSave(): SaveData {
  const { form } = useGameStore.getState();
  const npcs: SaveData['npcs'] = {};
  for (const [id, n] of Object.entries(useNpcStore.getState().npcs)) {
    npcs[id] = {
      relationship: n.relationship,
      used: [...n.used],
      joined: n.joined,
      following: n.following,
    };
  }
  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    playSeconds: Math.round(playSeconds),
    hero: {
      form,
      x: sim.curr.pos.x,
      z: sim.curr.pos.z,
      facingX: sim.curr.facing.x,
      facingZ: sim.curr.facing.z,
    },
    npcs,
    progress: collectProgress(),
    quests: collectQuests(),
    garden: {
      pearlsTaken: [...useGardenStore.getState().pearlsTaken],
      shrineGift: useGardenStore.getState().shrineGift,
    },
    world: collectWorld(),
    dungeon: {
      hallsCleared: useDungeonStore.getState().hallsCleared,
      bossDefeated: useDungeonStore.getState().bossDefeated,
      cachesTaken: [...useDungeonStore.getState().cachesTaken],
    },
  };
}

function collectQuests(): SaveData['quests'] {
  const { log } = useQuestStore.getState();
  return {
    active: Object.fromEntries(
      Object.entries(log.active).map(([id, p]) => [
        id,
        { counts: [...p.counts], visited: [...p.visited] },
      ]),
    ),
    completed: [...log.completed],
  };
}

function collectProgress(): SaveData['progress'] {
  const p = useProgressStore.getState();
  return {
    level: p.level,
    xp: p.xp,
    awarded: [...p.awarded],
    bag: p.bag.map((s) => (s ? { ...s } : null)),
    forms: [...p.forms],
    keepsakes: Object.fromEntries(Object.entries(p.keepsakes).map(([id, n]) => [id, n ?? 0])),
    equipment: { ...p.equipment },
  };
}

/** Applies a parsed save to the stores and the player. A blocked or invalid position falls back to the spawn. */
export function applySave(save: SaveData, options: { keepPosition?: boolean } = {}): void {
  const npcs: Record<string, NpcRuntime> = {};
  for (const [id, n] of Object.entries(save.npcs)) {
    npcs[id] = {
      relationship: n.relationship,
      used: n.used,
      joined: n.joined,
      following: n.following,
    };
  }
  useProgressStore.getState().hydrate({
    level: save.progress.level,
    xp: save.progress.xp,
    awarded: [...save.progress.awarded],
    bag: save.progress.bag.map((s) => (s ? { ...s } : null)),
    forms: [...save.progress.forms],
    keepsakes: { ...save.progress.keepsakes },
    equipment: { ...save.progress.equipment },
  });
  useQuestStore
    .getState()
    .hydrate({ active: save.quests.active, completed: save.quests.completed });
  useGardenStore.getState().hydrate({
    pearlsTaken: [...save.garden.pearlsTaken],
    shrineGift: save.garden.shrineGift,
  });
  useDungeonStore.getState().hydrate(save.dungeon);
  syncDungeonWorld();
  rebuildGather();
  useNpcStore.getState().hydrate(npcs);
  useGameStore.getState().setForm(save.hero.form);
  playSeconds = save.playSeconds;
  if (save.world) applyWorld(save.world);
  else if (!applied) refreshVitals();
  else clampVitals();
  applied = true;

  const { x, z } = save.hero;
  if (!options.keepPosition && Number.isFinite(x) && Number.isFinite(z)) {
    const pos = resolveCircle({ x, z }, PLAYER_RADIUS, currentWorld);
    const moved = Math.hypot(pos.x - x, pos.z - z) > 1;
    if (!moved) {
      const facing = { x: save.hero.facingX, z: save.hero.facingZ };
      const len = Math.hypot(facing.x, facing.z);
      const safeFacing = len > 0.01 ? { x: facing.x / len, z: facing.z / len } : { x: 0, z: 1 };
      sim.prev = { pos, facing: safeFacing };
      sim.curr = { pos, facing: safeFacing };
    }
  }
}

let applied = false;

/** A save without a world snapshot (a cloud copy) must not refill what is already running. */
function clampVitals(): void {
  const stats = currentStats();
  combat.hp = Math.min(combat.hp, stats.maxHp);
  combat.mana = Math.min(combat.mana, stats.maxMana);
}

/** Saves from before the world snapshot have no health or mana: start at the maximums of the level and gear. */
function refreshVitals(): void {
  const stats = currentStats();
  combat.hp = stats.maxHp;
  combat.mana = stats.maxMana;
}

export function loadLocalSave(): SaveData | null {
  return parseSave(readJson(KEYS.save));
}

export function writeLocalSave(): SaveData {
  const save = collectSave();
  writeJson(KEYS.save, save);
  for (const listener of savedListeners) listener(save);
  return save;
}

/** New game: forget everything local and reset the world. The cloud copy is replaced by the next push. */
export function resetProgress(): void {
  removeKey(KEYS.save);
  playSeconds = 0;
  useProgressStore.getState().reset();
  useQuestStore.getState().reset();
  useGardenStore.getState().reset();
  useDungeonStore.getState().reset();
  rebuildGather();
  useNpcStore.getState().reset();
  useGameStore.getState().setForm('human');
  useGameStore.getState().setWelcomeOpen(true);
  resetSim();
  resetCombat();
  syncDungeonWorld();
  refreshVitals();
  writeLocalSave();
}

/** Loads the local save, then keeps it up to date. Call once at startup, before rendering. */
export function startPersistence(): void {
  const save = loadLocalSave();
  if (save) applySave(save);
  // A brand new game opens with the welcome screen (dev: ?welcome=0 skips it for scripted runs).
  const skip =
    import.meta.env.DEV && new URLSearchParams(window.location.search).get('welcome') === '0';
  useGameStore.getState().setWelcomeOpen(!save && !skip);

  let timer: number | undefined;
  const scheduleSave = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(writeLocalSave, DEBOUNCE_MS);
  };
  useNpcStore.subscribe(scheduleSave);
  useGameStore.subscribe((state, prev) => {
    if (state.form !== prev.form) scheduleSave();
  });
  useProgressStore.subscribe(scheduleSave);
  useQuestStore.subscribe(scheduleSave);
  useGardenStore.subscribe(scheduleSave);
  useDungeonStore.subscribe(scheduleSave);
  onSaveRequest(scheduleSave);

  window.setInterval(() => {
    if (isSimRunning(useGameStore.getState()) && !document.hidden)
      playSeconds += AUTOSAVE_MS / 1000;
    writeLocalSave();
  }, AUTOSAVE_MS);

  const flush = () => {
    window.clearTimeout(timer);
    writeLocalSave();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush();
  });
  window.addEventListener('pagehide', flush);
}
