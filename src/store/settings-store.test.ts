import { describe, expect, it, vi } from 'vitest';
import { masterLevel } from '@/audio/engine';
import { parseSettings } from '@/store/settings-store';
import { soundsOnClick } from '@/ui/ui-sounds';

vi.mock('@/audio/sfx', () => ({ playSfx: vi.fn() }));

describe('settings', () => {
  it('start with everything on, full volume, gentle ambience', () => {
    expect(parseSettings(undefined)).toEqual({
      statsOptOut: false,
      soundOn: true,
      volume: 1,
      ambience: 0.6,
      quality: 'auto',
      shake: true,
      weather: true,
      damageNumbers: true,
    });
  });

  it('keep what was saved when it is valid, and clamp or drop the rest', () => {
    const s = parseSettings({
      soundOn: false,
      volume: 0.25,
      ambience: 7,
      quality: 'medium',
      shake: false,
      weather: false,
      damageNumbers: false,
      statsOptOut: true,
    });
    expect(s).toMatchObject({
      soundOn: false,
      volume: 0.25,
      ambience: 1,
      quality: 'medium',
      shake: false,
      weather: false,
      damageNumbers: false,
      statsOptOut: true,
    });
    expect(
      parseSettings({ volume: 'loud', ambience: NaN, quality: 'ultra', shake: 'yes' }),
    ).toMatchObject({ volume: 1, ambience: 0.6, quality: 'auto', shake: true });
    for (const junk of [null, 4, 'x', []]) expect(parseSettings(junk).volume).toBe(1);
    expect(parseSettings({ volume: -3 }).volume).toBe(0);
  });

  it('turns the screen shake off by default for people who ask for less motion, unless they chose', () => {
    expect(parseSettings({}, true).shake).toBe(false);
    expect(parseSettings({ shake: true }, true).shake).toBe(true);
  });

  it('sets the master gain from the switch and the volume, on a squared curve', () => {
    expect(masterLevel(false, 1)).toBe(0);
    expect(masterLevel(true, 1)).toBe(1);
    expect(masterLevel(true, 0.5)).toBeCloseTo(0.25);
    expect(masterLevel(true, 5)).toBe(1);
    expect(masterLevel(true, -1)).toBe(0);
  });
});

describe('button sounds', () => {
  const el = (matches: string[]) =>
    ({
      closest: (selector: string) => (matches.some((m) => selector.includes(m)) ? {} : null),
    }) as unknown as Element;

  it('tick for menu and panel buttons, not for the action buttons or the map', () => {
    expect(soundsOnClick(el(['.panel button']))).toBe(true);
    expect(soundsOnClick(el(['button.hud-btn']))).toBe(true);
    expect(soundsOnClick(el(['.panel button', '.action-btn']))).toBe(false);
    expect(soundsOnClick(el([]))).toBe(false);
    expect(soundsOnClick(null)).toBe(false);
  });
});
