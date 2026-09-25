import { describe, expect, it } from 'vitest';
import { ITEMS } from '@/data/items';

describe('stack sizes', () => {
  it('holds a thousand of every consumable', () => {
    const consumables = Object.values(ITEMS).filter((i) => i.kind === 'consumable');
    expect(consumables.length).toBeGreaterThan(0);
    for (const item of consumables) expect(item.stack, item.id).toBe(1000);
  });
});
