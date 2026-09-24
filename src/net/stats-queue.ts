export type StatEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  client_ts: string;
};

export type QueueStorage = { load: () => StatEvent[]; save: (events: StatEvent[]) => void };

export type FlushResult = 'empty' | 'sent' | 'failed' | 'waiting';

export type StatsQueueOptions = {
  storage: QueueStorage;
  /** Resolves true when the whole batch was accepted by the server. Must not throw (a throw counts as failure). */
  send: (batch: StatEvent[]) => Promise<boolean>;
  now?: () => number;
  maxLength?: number;
  batchSize?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

export type StatsQueue = {
  enqueue: (event: StatEvent) => void;
  flush: () => Promise<FlushResult>;
  size: () => number;
  clear: () => void;
  failures: () => number;
  retryInMs: () => number;
};

export function createStatsQueue(options: StatsQueueOptions): StatsQueue {
  const {
    storage,
    send,
    now = Date.now,
    maxLength = 200,
    batchSize = 25,
    baseDelayMs = 15_000,
    maxDelayMs = 600_000,
  } = options;
  let events = storage.load().slice(-maxLength);
  let failures = 0;
  let notBefore = 0;
  let flushing = false;

  const persist = () => storage.save(events);

  return {
    enqueue(event) {
      events.push(event);
      if (events.length > maxLength) events = events.slice(events.length - maxLength);
      persist();
    },
    async flush() {
      if (flushing) return 'waiting';
      if (events.length === 0) return 'empty';
      if (now() < notBefore) return 'waiting';
      flushing = true;
      const batch = events.slice(0, batchSize);
      let ok: boolean;
      try {
        ok = await send(batch);
      } catch {
        ok = false;
      } finally {
        flushing = false;
      }
      if (ok) {
        const sent = new Set(batch.map((e) => e.id));
        events = events.filter((e) => !sent.has(e.id));
        failures = 0;
        notBefore = 0;
        persist();
        return 'sent';
      }
      failures += 1;
      notBefore = now() + Math.min(maxDelayMs, baseDelayMs * 2 ** (failures - 1));
      return 'failed';
    },
    size: () => events.length,
    clear() {
      events = [];
      persist();
    },
    failures: () => failures,
    retryInMs: () => Math.max(0, notBefore - now()),
  };
}
