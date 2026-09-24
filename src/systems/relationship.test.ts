import { describe, expect, it } from 'vitest';
import { clampRelationship, showsHeart, tierOf } from '@/systems/relationship';

describe('relationship', () => {
  it('maps values to tiers', () => {
    expect(tierOf(0)).toBe('gloomy');
    expect(tierOf(29)).toBe('gloomy');
    expect(tierOf(30)).toBe('warming');
    expect(tierOf(59)).toBe('warming');
    expect(tierOf(60)).toBe('mesmerized');
    expect(tierOf(100)).toBe('mesmerized');
  });

  it('clamps to 0..100', () => {
    expect(clampRelationship(-5)).toBe(0);
    expect(clampRelationship(140)).toBe(100);
    expect(clampRelationship(42)).toBe(42);
  });

  it('shows the heart when mesmerized or joined', () => {
    expect(showsHeart(59, false)).toBe(false);
    expect(showsHeart(60, false)).toBe(true);
    expect(showsHeart(10, true)).toBe(true);
  });
});
