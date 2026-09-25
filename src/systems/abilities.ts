export type AbilityId = 'attack' | 'dash' | 'aura' | 'spell' | 'teleport';

export type AbilityDef = { cooldown: number; mana: number };

export const ABILITIES: Readonly<Record<AbilityId, AbilityDef>> = {
  attack: { cooldown: 0.45, mana: 0 },
  dash: { cooldown: 1.4, mana: 0 },
  aura: { cooldown: 8, mana: 30 },
  spell: { cooldown: 7, mana: 35 },
  teleport: { cooldown: 6, mana: 20 },
};

export const MAX_HP = 100;
export const MAX_MANA = 100;
export const MANA_REGEN = 5;
export const HP_REGEN = 1.5;
export const HP_REGEN_DELAY = 8;
export const HURT_INVULN = 0.5;

export const TRIDENT = {
  range: 3.4,
  halfAngle: (60 * Math.PI) / 180,
  damage: 14,
  knockback: 2.2,
} as const;
export const AIM_ASSIST = {
  range: 4.8,
  maxAngle: (80 * Math.PI) / 180,
  /** Anything this close is targeted whatever direction Rosa faces. */
  closeRange: 3.6,
} as const;
export const DASH = { distance: 4.4, duration: 0.2, invuln: 0.28 } as const;
/** Instant blink to the cursor (or straight ahead), like the Wizard's Teleport: over walls, never into another region. */
export const TELEPORT = { range: 14, invuln: 0.35, pop: 0.3 } as const;
export const AURA = {
  duration: 2.4,
  maxRadius: 8,
  rings: 3,
  ringWidth: 1.4,
  npcCharm: 12,
  enemyBlind: 5,
  /** Rosa keeps her mermaid look this long after the song ends. */
  mermaidTail: 0.5,
} as const;
export const SPELL = {
  radius: 4.8,
  damage: 28,
  knockback: 5,
  burst: 0.35,
  /** Seconds Rosa looks like a mermaid while casting. */
  mermaid: 1.3,
} as const;
/** Length of the trident swing animation. */
export const SWING_TIME = 0.34;

export type Cooldowns = Record<AbilityId, number>;

export const createCooldowns = (): Cooldowns => ({
  attack: 0,
  dash: 0,
  aura: 0,
  spell: 0,
  teleport: 0,
});

export const tickCooldowns = (cooldowns: Cooldowns, dt: number): void => {
  for (const id of Object.keys(cooldowns) as AbilityId[])
    cooldowns[id] = Math.max(0, cooldowns[id] - dt);
};

export const canUse = (cooldowns: Cooldowns, mana: number, id: AbilityId): boolean =>
  cooldowns[id] <= 0 && mana >= ABILITIES[id].mana;

/** Spends mana and starts the cooldown. Returns the new mana, or null when the ability is not available. */
export function spendAbility(cooldowns: Cooldowns, mana: number, id: AbilityId): number | null {
  if (!canUse(cooldowns, mana, id)) return null;
  cooldowns[id] = ABILITIES[id].cooldown;
  return mana - ABILITIES[id].mana;
}

/** Fraction of the cooldown remaining, 0 (ready) to 1 (just used). */
export const cooldownFraction = (cooldowns: Cooldowns, id: AbilityId): number =>
  ABILITIES[id].cooldown === 0 ? 0 : cooldowns[id] / ABILITIES[id].cooldown;
