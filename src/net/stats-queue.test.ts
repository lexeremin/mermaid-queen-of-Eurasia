import { describe, expect, it } from 'vitest';
import { createStatsQueue, type StatEvent } from '@/net/stats-queue';

const event = (n: number): StatEvent => ({
  id: `e${n}`,
  type: 'test',
  payload: { n },
  client_ts: '2026-09-24T12:00:00.000Z',
});

function harness(over: { maxLength?: number; batchSize?: number; results?: boolean[] } = {}) {
  let stored: StatEvent[] = [];
  let time = 0;
  const sent: StatEvent[][] = [];
  const results = over.results ?? [];
  const queue = createStatsQueue({
    storage: { load: () => stored, save: (e) => (stored = [...e]) },
    send: async (batch) => {
      sent.push(batch);
      return results.length > 0 ? (results.shift() as boolean) : true;
    },
    now: () => time,
    maxLength: over.maxLength,
    batchSize: over.batchSize,
    baseDelayMs: 1000,
    maxDelayMs: 8000,
  });
  return { queue, sent, advance: (ms: number) => (time += ms), stored: () => stored };
}

describe('stats queue', () => {
  it('sends events in batches and removes them on success', async () => {
    const h = harness({ batchSize: 2 });
    for (let i = 1; i <= 5; i++) h.queue.enqueue(event(i));
    expect(await h.queue.flush()).toBe('sent');
    expect(h.sent[0]?.map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(h.queue.size()).toBe(3);
    await h.queue.flush();
    await h.queue.flush();
    expect(h.queue.size()).toBe(0);
    expect(await h.queue.flush()).toBe('empty');
  });

  it('keeps events and backs off exponentially after failures, then recovers', async () => {
    const h = harness({ results: [false, false, true] });
    h.queue.enqueue(event(1));
    expect(await h.queue.flush()).toBe('failed');
    expect(h.queue.retryInMs()).toBe(1000);
    expect(await h.queue.flush()).toBe('waiting');
    h.advance(1000);
    expect(await h.queue.flush()).toBe('failed');
    expect(h.queue.retryInMs()).toBe(2000);
    expect(h.queue.size()).toBe(1);
    h.advance(2000);
    expect(await h.queue.flush()).toBe('sent');
    expect(h.queue.failures()).toBe(0);
    expect(h.queue.size()).toBe(0);
  });

  it('caps the backoff delay', async () => {
    const h = harness({ results: Array(10).fill(false) });
    h.queue.enqueue(event(1));
    for (let i = 0; i < 8; i++) {
      await h.queue.flush();
      h.advance(10_000);
    }
    expect(h.queue.retryInMs()).toBeLessThanOrEqual(8000);
  });

  it('bounds the queue by dropping the oldest events', () => {
    const h = harness({ maxLength: 3 });
    for (let i = 1; i <= 6; i++) h.queue.enqueue(event(i));
    expect(h.queue.size()).toBe(3);
    expect(h.stored().map((e) => e.id)).toEqual(['e4', 'e5', 'e6']);
  });

  it('persists to storage and restores after a reload', () => {
    const h = harness();
    h.queue.enqueue(event(1));
    h.queue.enqueue(event(2));
    const restored = createStatsQueue({
      storage: { load: () => h.stored(), save: () => undefined },
      send: async () => true,
    });
    expect(restored.size()).toBe(2);
  });

  it('treats a throwing sender as a failure and never throws', async () => {
    const queue = createStatsQueue({
      storage: { load: () => [], save: () => undefined },
      send: async () => {
        throw new Error('network down');
      },
    });
    queue.enqueue(event(1));
    await expect(queue.flush()).resolves.toBe('failed');
    expect(queue.size()).toBe(1);
  });

  it('clear empties the queue and storage', () => {
    const h = harness();
    h.queue.enqueue(event(1));
    h.queue.clear();
    expect(h.queue.size()).toBe(0);
    expect(h.stored()).toEqual([]);
  });
});
