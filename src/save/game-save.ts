import { currentWorld } from '@/game/world/current-map';
import { resetSim, sim } from '@/game/sim';
import { KEYS, readJson, removeKey, writeJson } from '@/save/storage';
import { parseSave, SAVE_VERSION, type SaveData } from '@/save/save-data';
import { isSimRunning, useGameStore } from '@/store/game-store';
import { useNpcStore, type NpcRuntime } from '@/store/npc-store';
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
    npcs[id] = { relationship: n.relationship, used: [...n.used], joined: n.joined };
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
  };
}

/** Applies a parsed save to the stores and the player. A blocked or invalid position falls back to the spawn. */
export function applySave(save: SaveData): void {
  const npcs: Record<string, NpcRuntime> = {};
  for (const [id, n] of Object.entries(save.npcs)) {
    npcs[id] = { relationship: n.relationship, used: n.used, joined: n.joined };
  }
  useNpcStore.getState().hydrate(npcs);
  useGameStore.getState().setForm(save.hero.form);
  playSeconds = save.playSeconds;

  const { x, z } = save.hero;
  if (Number.isFinite(x) && Number.isFinite(z)) {
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
  useNpcStore.getState().reset();
  useGameStore.getState().setForm('human');
  resetSim();
  writeLocalSave();
}

/** Loads the local save, then keeps it up to date. Call once at startup, before rendering. */
export function startPersistence(): void {
  const save = loadLocalSave();
  if (save) applySave(save);

  let timer: number | undefined;
  const scheduleSave = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(writeLocalSave, DEBOUNCE_MS);
  };
  useNpcStore.subscribe(scheduleSave);
  useGameStore.subscribe((state, prev) => {
    if (state.form !== prev.form) scheduleSave();
  });

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
