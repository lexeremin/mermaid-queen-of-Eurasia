import { getClient } from '@/net/client';
import { parseSave, SAVE_VERSION, type SaveData } from '@/save/save-data';

export async function pullSave(userId: string): Promise<SaveData | null> {
  const pending = getClient();
  if (!pending) return null;
  const client = await pending;
  const { data, error } = await client
    .from('saves')
    .select('version, data, saved_at')
    .eq('player_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  const body =
    typeof data.data === 'object' && data.data !== null
      ? (data.data as Record<string, unknown>)
      : null;
  return parseSave(body ? { ...body, version: data.version, savedAt: data.saved_at } : null);
}

export async function pushSave(userId: string, save: SaveData): Promise<boolean> {
  const pending = getClient();
  if (!pending) return false;
  const client = await pending;
  const { error } = await client.from('saves').upsert({
    player_id: userId,
    version: SAVE_VERSION,
    // The world snapshot (mobs, boss, health) stays on this device.
    data: { ...save, world: null },
    saved_at: save.savedAt,
  });
  return !error;
}

export async function upsertPlayer(userId: string, optOut: boolean): Promise<boolean> {
  const pending = getClient();
  if (!pending) return false;
  const client = await pending;
  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const { error } = await client.from('players').upsert({
    id: userId,
    device_class: mobile ? 'mobile' : 'desktop',
    stats_opt_out: optOut,
    last_seen_at: new Date().toISOString(),
  });
  return !error;
}
