export type Rarity = 'common' | 'uncommon' | 'rare';
export type EquipSlot = 'weapon' | 'outfit' | 'charm';

export type Bonuses = {
  maxHp: number;
  maxMana: number;
  /** Percent added to attack and spell damage. */
  damagePct: number;
  /** Percent of incoming damage ignored. */
  reductionPct: number;
  manaRegen: number;
};

export type ItemDef = {
  id: string;
  name: string;
  description: string;
  glyph: string;
  color: string;
  rarity: Rarity;
  stack: number;
} & (
  | { kind: 'consumable'; heal?: number; mana?: number }
  | { kind: 'keepsake' }
  | { kind: 'equipment'; slot: EquipSlot; bonuses: Partial<Bonuses> }
);

const item = <const T extends ItemDef>(def: T): T => def;

export const ITEMS = {
  healingTea: item({
    id: 'healingTea',
    name: 'Healing Tea',
    description: 'Hot, sweet, and heals 45 health.',
    glyph: '+',
    color: '#e0742c',
    rarity: 'common',
    stack: 9,
    kind: 'consumable',
    heal: 45,
  }),
  coldKvass: item({
    id: 'coldKvass',
    name: 'Cold Kvass',
    description: 'Restores 45 mana. Tastes like bread and hope.',
    glyph: '~',
    color: '#6be3d1',
    rarity: 'common',
    stack: 9,
    kind: 'consumable',
    mana: 45,
  }),
  roseHip: item({
    id: 'roseHip',
    name: 'Rose Hip',
    description: 'A tart red berry from the garden. Heals 30 health.',
    glyph: 'r',
    color: '#e0506a',
    rarity: 'common',
    stack: 9,
    kind: 'consumable',
    heal: 30,
  }),
  moonMint: item({
    id: 'moonMint',
    name: 'Moon Mint',
    description: 'Cool leaves that glow faintly at dusk. Restores 30 mana.',
    glyph: 'm',
    color: '#8fe3c4',
    rarity: 'common',
    stack: 9,
    kind: 'consumable',
    mana: 30,
  }),
  pearl: item({
    id: 'pearl',
    name: 'Pearl',
    description: 'A keepsake from the deep. Someone will want it.',
    glyph: 'o',
    color: '#f4d0df',
    rarity: 'uncommon',
    stack: 20,
    kind: 'keepsake',
  }),
  trident: item({
    id: 'trident',
    name: 'Trident',
    description: "Rosa's trusty gold trident.",
    glyph: 'Y',
    color: '#e9bd56',
    rarity: 'common',
    stack: 1,
    kind: 'equipment',
    slot: 'weapon',
    bonuses: {},
  }),
  silverTrident: item({
    id: 'silverTrident',
    name: 'Silver Trident',
    description: '+15% damage.',
    glyph: 'Y',
    color: '#b9c9dc',
    rarity: 'uncommon',
    stack: 1,
    kind: 'equipment',
    slot: 'weapon',
    bonuses: { damagePct: 15 },
  }),
  pearlTrident: item({
    id: 'pearlTrident',
    name: 'Pearl Trident',
    description: '+30% damage, +10 mana.',
    glyph: 'Y',
    color: '#f4d0df',
    rarity: 'rare',
    stack: 1,
    kind: 'equipment',
    slot: 'weapon',
    bonuses: { damagePct: 30, maxMana: 10 },
  }),
  tweedJacket: item({
    id: 'tweedJacket',
    name: 'Ivory Tweed Jacket',
    description: 'Boat neckline, structured shoulders.',
    glyph: 'T',
    color: '#f1e9dc',
    rarity: 'common',
    stack: 1,
    kind: 'equipment',
    slot: 'outfit',
    bonuses: {},
  }),
  rainCloak: item({
    id: 'rainCloak',
    name: 'Rain Cloak',
    description: '12% less damage taken, +10 health.',
    glyph: 'T',
    color: '#5f7590',
    rarity: 'uncommon',
    stack: 1,
    kind: 'equipment',
    slot: 'outfit',
    bonuses: { reductionPct: 12, maxHp: 10 },
  }),
  velvetGown: item({
    id: 'velvetGown',
    name: 'Velvet Gown',
    description: '25% less damage taken, +20 mana.',
    glyph: 'T',
    color: '#7a5aa8',
    rarity: 'rare',
    stack: 1,
    kind: 'equipment',
    slot: 'outfit',
    bonuses: { reductionPct: 25, maxMana: 20 },
  }),
  roseBrooch: item({
    id: 'roseBrooch',
    name: 'Rose Brooch',
    description: '+1.5 mana per second.',
    glyph: '*',
    color: '#efc7c0',
    rarity: 'uncommon',
    stack: 1,
    kind: 'equipment',
    slot: 'charm',
    bonuses: { manaRegen: 1.5 },
  }),
  amberPendant: item({
    id: 'amberPendant',
    name: 'Amber Pendant',
    description: '+25 health.',
    glyph: '*',
    color: '#f2b04a',
    rarity: 'uncommon',
    stack: 1,
    kind: 'equipment',
    slot: 'charm',
    bonuses: { maxHp: 25 },
  }),
  songbirdWhistle: item({
    id: 'songbirdWhistle',
    name: 'Songbird Whistle',
    description: '+20 mana, +1 mana per second.',
    glyph: '*',
    color: '#ffe28f',
    rarity: 'rare',
    stack: 1,
    kind: 'equipment',
    slot: 'charm',
    bonuses: { maxMana: 20, manaRegen: 1 },
  }),
  registrarSeal: item({
    id: 'registrarSeal',
    name: "Registrar's Seal",
    description: '+40 health, +2 mana per second, +10% damage. Officially approved.',
    glyph: '*',
    color: '#d94a5c',
    rarity: 'rare',
    stack: 1,
    kind: 'equipment',
    slot: 'charm',
    bonuses: { maxHp: 40, manaRegen: 2, damagePct: 10 },
  }),
  archangelFeather: item({
    id: 'archangelFeather',
    name: "Archangel's Feather",
    description: '+30 health, +15 mana, +1.5 mana per second. Still warm from three small hugs.',
    glyph: '*',
    color: '#fff4d6',
    rarity: 'rare',
    stack: 1,
    kind: 'equipment',
    slot: 'charm',
    bonuses: { maxHp: 30, maxMana: 15, manaRegen: 1.5 },
  }),
} as const satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9fb0c4',
  uncommon: '#6be3a0',
  rare: '#ffb85c',
};

export const isItemId = (value: unknown): value is ItemId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(ITEMS, value);

export const itemDef = (id: ItemId): ItemDef => ITEMS[id];

export const STARTER_EQUIPMENT: Record<EquipSlot, ItemId | null> = {
  weapon: 'trident',
  outfit: 'tweedJacket',
  charm: null,
};
