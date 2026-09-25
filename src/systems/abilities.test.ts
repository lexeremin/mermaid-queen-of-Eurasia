import { describe, expect, it } from 'vitest';
import {
  ABILITIES,
  canUse,
  cooldownFraction,
  createCooldowns,
  tickCooldowns,
  spendAbility,
} from '@/systems/abilities';

describe('abilities', () => {
  it('spends mana and starts the cooldown', () => {
    const cd = createCooldowns();
    expect(spendAbility(cd, 100, 'aura')).toBe(70);
    expect(cd.aura).toBe(ABILITIES.aura.cooldown);
    expect(canUse(cd, 100, 'aura')).toBe(false);
  });

  it('refuses when on cooldown or short on mana, and changes nothing', () => {
    const cd = createCooldowns();
    expect(spendAbility(cd, 29, 'aura')).toBeNull();
    expect(cd.aura).toBe(0);
    spendAbility(cd, 100, 'spell');
    expect(spendAbility(cd, 100, 'spell')).toBeNull();
  });

  it('cooldowns tick down to zero and free abilities need no mana', () => {
    const cd = createCooldowns();
    expect(spendAbility(cd, 0, 'attack')).toBe(0);
    tickCooldowns(cd, 0.2);
    expect(cd.attack).toBeCloseTo(0.25);
    tickCooldowns(cd, 5);
    expect(cd.attack).toBe(0);
    expect(canUse(cd, 0, 'attack')).toBe(true);
  });

  it('reports the remaining fraction for the HUD', () => {
    const cd = createCooldowns();
    spendAbility(cd, 100, 'blink');
    expect(cooldownFraction(cd, 'blink')).toBe(1);
    tickCooldowns(cd, ABILITIES.blink.cooldown / 2);
    expect(cooldownFraction(cd, 'blink')).toBeCloseTo(0.5);
  });
});
