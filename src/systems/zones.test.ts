import { describe, expect, it } from 'vitest';
import { zoneAt, type Zone } from '@/systems/zones';

const zones: Zone[] = [{ id: 'forest', label: 'Forest', box: { cx: 0, cz: -10, hx: 2, hz: 1 } }];

describe('zoneAt', () => {
  it('finds the zone containing the position', () => {
    expect(zoneAt(zones, { x: 1, z: -10.5 })?.id).toBe('forest');
  });
  it('returns null outside', () => {
    expect(zoneAt(zones, { x: 3, z: -10 })).toBeNull();
    expect(zoneAt(zones, { x: 0, z: 0 })).toBeNull();
  });
});
