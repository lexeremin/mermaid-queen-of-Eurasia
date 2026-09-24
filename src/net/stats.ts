import { configCheck, getClient } from '@/net/client';
import { currentUserId } from '@/net/auth';
import { createStatsQueue, type StatEvent } from '@/net/stats-queue';
import { KEYS, readJson, writeJson } from '@/save/storage';
import { useSettingsStore } from '@/store/settings-store';

const isEvent = (value: unknown): value is StatEvent =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as StatEvent).id === 'string' &&
  typeof (value as StatEvent).type === 'string' &&
  typeof (value as StatEvent).client_ts === 'string';

export const statsQueue = createStatsQueue({
  storage: {
    load: () => {
      const raw = readJson(KEYS.statsQueue);
      return Array.isArray(raw) ? raw.filter(isEvent) : [];
    },
    save: (events) => void writeJson(KEYS.statsQueue, events),
  },
  send: async (batch) => {
    const userId = currentUserId();
    const pending = getClient();
    if (!userId || !pending) return false;
    const client = await pending;
    const rows = batch.map((e) => ({ ...e, player_id: userId }));
    const { error } = await client
      .from('stat_events')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
    return !error;
  },
});

/** Records an anonymous stat event. No-op when cloud is not configured or the player opted out. */
export function track(type: string, payload: Record<string, unknown> = {}): void {
  if (!configCheck.config || useSettingsStore.getState().statsOptOut) return;
  statsQueue.enqueue({
    id: crypto.randomUUID(),
    type: type.slice(0, 40),
    payload,
    client_ts: new Date().toISOString(),
  });
}

/** Opting out drops everything queued and stops collection immediately. */
export function watchOptOut(): void {
  useSettingsStore.subscribe((state, prev) => {
    if (state.statsOptOut && !prev.statsOptOut) statsQueue.clear();
  });
}
