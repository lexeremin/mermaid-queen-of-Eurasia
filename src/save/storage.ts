/** localStorage that never throws: private windows, quota errors and blocked storage just return null/false. */
export function readJson(key: string): unknown {
  try {
    const text = window.localStorage.getItem(key);
    return text === null ? null : (JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const KEYS = {
  save: 'mq.save.v1',
  settings: 'mq.settings.v1',
  statsQueue: 'mq.stats-queue.v1',
} as const;
