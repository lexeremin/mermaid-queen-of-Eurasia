export type AbilityId = 'attack' | 'blink' | 'aura' | 'spell';

export type AbilityDef = { cooldown: number; mana: number };

export const ABILITIES: Readonly<Record<AbilityId, AbilityDef>> = {
  attack: { cooldown: 0.45, mana: 0 },
  blink: { cooldown: 4, mana: 15 },
  aura: { cooldown: 8, mana: 30 },
  spell: { cooldown: 7, mana: 35 },
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
/** Instant blink to the cursor (or straight ahead), like the Wizard's Teleport: over walls, never into another region. */
export const BLINK = { range: 14, invuln: 0.35, pop: 0.3 } as const;
export type Form = 'human' | 'mermaid';

/** How an Aura-type song behaves: the human Aura and the mermaid's Tidal Song share one shape. */
export type SongSpec = {
  duration: number;
  maxRadius: number;
  rings: number;
  ringWidth: number;
  npcCharm: number;
  enemyBlind: number;
  mermaidTail: number;
};

export const AURA: SongSpec = {
  duration: 2.4,
  maxRadius: 8,
  rings: 3,
  ringWidth: 1.4,
  npcCharm: 12,
  enemyBlind: 5,
  /** Rosa keeps her mermaid look this long after the song ends. */
  mermaidTail: 0.5,
};
/** The mermaid's version of the song: wider, longer and stronger (docs/phases/phase-18.md). */
export const TIDAL: SongSpec = {
  duration: 2.8,
  maxRadius: 12,
  rings: 4,
  ringWidth: 1.4,
  npcCharm: 24,
  enemyBlind: 8,
  mermaidTail: 0.5,
};

export const songFor = (form: Form | undefined): SongSpec => (form === 'mermaid' ? TIDAL : AURA);

/** Speed multipliers of the mermaid form (and how much faster it swims). */
export const MERMAID = { landSpeed: 0.9, swimSpeed: 1.35, manaRegen: 2 } as const;

export const SPELL = {
  radius: 4.8,
  damage: 28,
  knockback: 5,
  burst: 0.35,
  /** Seconds Rosa looks like a mermaid while casting. */
  mermaid: 1.3,
} as const;
/** Level 20 passive of the trident: a sea wave rolls out along the swing and hits everything it passes. */
export const SEA_WAVE = {
  speed: 9,
  life: 0.75,
  radius: 1.4,
  damageFactor: 0.7,
  knockback: 1.6,
} as const;
/** Level 30 passive of the Aura: rays of light sweep around Rosa while she sings. */
export const LIGHT_BEAMS = { count: 6, halfWidth: 0.6, spin: 1.7, tick: 0.5, damage: 9 } as const;
/** Level 40 passive of Surge: sharks leap from the wave and crash down outside it. */
export const SHARKS = {
  count: 6,
  /** Where they leave the wave, and where they land, as multiples of the Surge radius. */
  startAt: 0.55,
  landFrom: 1.05,
  landTo: 1.45,
  stagger: 0.07,
  flight: 0.75,
  height: 2.2,
  blastRadius: 1.8,
  damageFactor: 0.6,
  knockback: 3,
} as const;
/** Level 50 passive of Blink: an arcane blast where Rosa arrives. */
export const ARCANE_BLAST = { radius: 4.2, damage: 30, knockback: 4.5, life: 0.75 } as const;
/** Length of the trident swing animation. */
export const SWING_TIME = 0.34;

export type Cooldowns = Record<AbilityId, number>;

export const createCooldowns = (): Cooldowns => ({
  attack: 0,
  aura: 0,
  spell: 0,
  blink: 0,
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
