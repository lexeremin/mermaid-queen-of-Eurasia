import { ensureUser, currentUserId } from '@/net/auth';
import { pullSave, pushSave, upsertPlayer } from '@/net/cloud-save';
import { configCheck } from '@/net/client';
import { useNetStore } from '@/net/net-store';
import { statsQueue, track, watchOptOut } from '@/net/stats';
import { applySave, collectSave, loadLocalSave, onSaved, writeLocalSave } from '@/save/game-save';
import { pickNewer, type SaveData } from '@/save/save-data';
import { useNpcStore } from '@/store/npc-store';
import { useSettingsStore } from '@/store/settings-store';

const TICK_MS = 15_000;
const PUSH_MIN_INTERVAL_MS = 30_000;
const RECONNECT_BASE_MS = 30_000;
const RECONNECT_MAX_MS = 600_000;

const progressKey = (save: SaveData): string =>
  JSON.stringify([
    save.hero.form,
    save.npcs,
    save.progress,
    save.quests,
    save.garden,
    save.dungeon,
  ]);

/**
 * Cloud sync: anonymous sign-in, pull the newer save, push progress, flush stats.
 * Everything here is best effort and can never throw into the game.
 */
export function startSync(): void {
  const { setStatus } = useNetStore.getState();
  if (configCheck.problem) return setStatus('misconfigured', configCheck.problem);
  if (!configCheck.config) return setStatus('off');

  watchOptOut();
  let lastPushed = '';
  let lastPushAt = 0;
  let latest: SaveData | null = null;
  let reconnectDelay = RECONNECT_BASE_MS;
  let timer: number | undefined;

  const push = async (force: boolean): Promise<void> => {
    const userId = currentUserId();
    const save = force ? (latest = collectSave()) : latest;
    if (!userId || !save || progressKey(save) === lastPushed) return;
    if (!force && Date.now() - lastPushAt < PUSH_MIN_INTERVAL_MS) return;
    lastPushAt = Date.now();
    if (await pushSave(userId, save).catch(() => false)) lastPushed = progressKey(save);
  };

  onSaved((save) => {
    latest = save;
  });

  const tick = () => {
    void statsQueue.flush().catch(() => undefined);
    void push(false);
  };

  const connect = async (): Promise<void> => {
    setStatus('connecting');
    const auth = await ensureUser();
    if (!auth.ok) {
      if (auth.reason === 'disabled') return setStatus('auth-disabled', auth.message);
      setStatus('offline', auth.message);
      timer = window.setTimeout(() => void connect(), reconnectDelay);
      reconnectDelay = Math.min(RECONNECT_MAX_MS, reconnectDelay * 2);
      return;
    }
    reconnectDelay = RECONNECT_BASE_MS;
    void upsertPlayer(auth.userId, useSettingsStore.getState().statsOptOut).catch(() => false);

    const local = loadLocalSave();
    const cloud = await pullSave(auth.userId).catch(() => null);
    if (pickNewer(local, cloud) === 'cloud' && cloud) {
      applySave(cloud);
      latest = writeLocalSave();
      lastPushed = progressKey(latest);
    } else {
      latest = local;
    }
    setStatus('online');
    track('session_started', {
      device: window.matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop',
    });
    window.setInterval(tick, TICK_MS);
    tick();
  };

  const wireEvents = () => {
    useNpcStore.subscribe((state, prev) => {
      for (const [id, n] of Object.entries(state.npcs)) {
        const before = prev.npcs[id];
        if (!before) continue;
        const method = n.used.find((m) => !before.used.includes(m));
        if (method) track('npc_method_used', { npc: id, method });
        if (n.relationship >= 60 && before.relationship < 60) track('npc_mesmerized', { npc: id });
        if (n.joined && !before.joined) {
          track('npc_joined', { npc: id });
          void push(true);
        }
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) return;
      latest = collectSave();
      void push(true);
      void statsQueue.flush().catch(() => undefined);
    });
  };

  wireEvents();
  void connect();
  window.addEventListener('pagehide', () => window.clearTimeout(timer));
}
