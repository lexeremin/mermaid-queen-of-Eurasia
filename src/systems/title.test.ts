import { describe, expect, it } from 'vitest';
import { formatPlayTime, summaryLines } from '@/systems/title';

describe('the title screen summary', () => {
  it('writes the time played in minutes and hours', () => {
    expect(formatPlayTime(0)).toBe('1 min');
    expect(formatPlayTime(40)).toBe('1 min');
    expect(formatPlayTime(45 * 60)).toBe('45 min');
    expect(formatPlayTime(59.6 * 60)).toBe('1 h');
    expect(formatPlayTime(3 * 3600 + 20 * 60)).toBe('3 h 20 min');
    expect(formatPlayTime(2 * 3600)).toBe('2 h');
  });

  it('says where Rosa is: on the surface or how deep', () => {
    expect(summaryLines({ level: 4, layer: 0, playSeconds: 1800 })).toEqual([
      'Level 4',
      'On the surface',
      'Played 30 min',
    ]);
    expect(summaryLines({ level: 10, layer: 37, playSeconds: 7500 })[1]).toBe('Depth 37 of 100');
  });
});
