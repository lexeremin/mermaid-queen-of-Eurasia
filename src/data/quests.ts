import type { EnemyKind } from '@/data/enemies';
import type { ItemId } from '@/data/items';
import type { Form } from '@/systems/abilities';

export type Objective =
  | { kind: 'kill'; count: number; enemy?: EnemyKind }
  | { kind: 'visit'; zones: readonly string[]; label: string }
  | { kind: 'mesmerize'; npc: string }
  | { kind: 'recruit'; count: number }
  | { kind: 'collect'; item: ItemId; count: number }
  | { kind: 'level'; level: number }
  /** A dungeon milestone (see the dungeon store): the halls cleared, the boss beaten. */
  | { kind: 'flag'; flag: DungeonFlag; label: string };

export type DungeonFlag = 'hallsCleared' | 'bossDefeated';

export type QuestReward = {
  xp: number;
  rep: number;
  /** Transformations this quest unlocks. */
  unlocks?: readonly Form[];
  items?: readonly { id: ItemId; qty: number }[];
};

export type QuestDef = {
  id: string;
  title: string;
  blurb: string;
  /** Minimum kingdom rank index (see RANKS). */
  minRank: number;
  objectives: readonly Objective[];
  reward: QuestReward;
};

export const JOIN_REPUTATION = 8;

export const RANKS = [
  { min: 0, name: 'Stranger' },
  { min: 25, name: 'Guest of the Square' },
  { min: 60, name: 'Favorite of Moscow' },
  { min: 100, name: 'Lady of the District' },
  { min: 150, name: 'Queen of the Square' },
] as const;

export const QUESTS: readonly QuestDef[] = [
  {
    id: 'first-notes',
    title: 'First Notes',
    blurb: 'Sergey has narrated the same fountain for years. Sing until he really listens.',
    minRank: 0,
    objectives: [{ kind: 'mesmerize', npc: 'sergei' }],
    reward: { xp: 30, rep: 8, items: [{ id: 'healingTea', qty: 2 }] },
  },
  {
    id: 'clear-the-gloom',
    title: 'Clear the Gloom',
    blurb: 'Loud men with loud props are souring the square. Send three of them home.',
    minRank: 0,
    objectives: [{ kind: 'kill', count: 3 }],
    reward: { xp: 40, rep: 8, items: [{ id: 'coldKvass', qty: 2 }] },
  },
  {
    id: 'pearls-for-the-board',
    title: 'Pearls for the Board',
    blurb: 'The notice board insists on shiny proof that you exist. Bring three pearls.',
    minRank: 0,
    objectives: [{ kind: 'collect', item: 'pearl', count: 3 }],
    reward: { xp: 30, rep: 10, items: [{ id: 'healingTea', qty: 2 }] },
  },
  {
    id: 'a-court-forms',
    title: 'A Court Forms',
    blurb: 'A queen needs a court. Win two people over until they follow you.',
    minRank: 1,
    objectives: [{ kind: 'recruit', count: 2 }],
    reward: { xp: 60, rep: 12, items: [{ id: 'roseBrooch', qty: 1 }] },
  },
  {
    id: 'gavel-down',
    title: 'Overrule Sosunok',
    blurb: 'Uncle Sosunok keeps ruling that joy is out of order. Overrule him twice.',
    minRank: 1,
    objectives: [{ kind: 'kill', count: 2, enemy: 'speaker' }],
    reward: { xp: 70, rep: 12, items: [{ id: 'rainCloak', qty: 1 }] },
  },
  {
    id: 'the-grand-tour',
    title: 'The Grand Tour',
    blurb: 'Show yourself in GUM, on Manezhnaya Square and in Alexander Garden.',
    minRank: 1,
    objectives: [
      {
        kind: 'visit',
        zones: ['gum', 'manezh', 'alexander-garden'],
        label: 'Visit GUM, Manezhnaya Square and Alexander Garden',
      },
    ],
    reward: { xp: 50, rep: 12, items: [{ id: 'amberPendant', qty: 1 }] },
  },
  {
    id: 'a-necklace-for-the-queen',
    title: 'A Necklace for the Queen',
    blurb: 'Six pearls, one string, no questions asked. The board is very insistent.',
    minRank: 2,
    objectives: [{ kind: 'collect', item: 'pearl', count: 6 }],
    reward: { xp: 90, rep: 18, items: [{ id: 'silverTrident', qty: 1 }] },
  },
  {
    id: 'rising-tide',
    title: 'Rising Tide',
    blurb: 'Grow into your song. Reach level 5.',
    minRank: 2,
    objectives: [{ kind: 'level', level: 5 }],
    reward: { xp: 80, rep: 15, items: [{ id: 'velvetGown', qty: 1 }] },
  },
  {
    id: 'the-full-court',
    title: 'The Full Court',
    blurb: 'Every last man of the square at your side. Then Moscow may call you Queen.',
    minRank: 3,
    objectives: [{ kind: 'recruit', count: 8 }],
    reward: { xp: 150, rep: 25, items: [{ id: 'songbirdWhistle', qty: 1 }] },
  },
  {
    id: 'herbalist-of-the-garden',
    title: 'Herbalist of the Garden',
    blurb:
      'The garden grows what the square cannot buy. Gather three rose hips and three moon mint.',
    minRank: 1,
    objectives: [
      { kind: 'collect', item: 'roseHip', count: 3 },
      { kind: 'collect', item: 'moonMint', count: 3 },
    ],
    reward: { xp: 60, rep: 12, items: [{ id: 'healingTea', qty: 3 }] },
  },
  {
    id: 'the-hidden-shrine',
    title: 'The Hidden Shrine',
    blurb: 'Gardeners whisper of a shrine behind the hedges in the far north-east corner. Find it.',
    minRank: 1,
    objectives: [{ kind: 'visit', zones: ['pearl-shrine'], label: 'Find the Pearl Shrine' }],
    reward: { xp: 50, rep: 10, items: [{ id: 'coldKvass', qty: 2 }] },
  },
  {
    id: 'thin-the-thorns',
    title: 'Thin the Thorns',
    blurb: 'The garden paths are thick with gloomy men. Send six of them home.',
    minRank: 1,
    objectives: [{ kind: 'kill', count: 6 }],
    reward: {
      xp: 80,
      rep: 14,
      items: [
        { id: 'healingTea', qty: 2 },
        { id: 'coldKvass', qty: 1 },
      ],
    },
  },
  {
    id: 'return-to-the-water',
    title: 'Return to the Water',
    blurb:
      'The old song remembers the sea. Carry four pearls to the Pearl Shrine in the garden, and the tide will remember you.',
    minRank: 1,
    objectives: [
      { kind: 'visit', zones: ['pearl-shrine'], label: 'Visit the Pearl Shrine' },
      { kind: 'collect', item: 'pearl', count: 4 },
    ],
    reward: { xp: 90, rep: 14, unlocks: ['mermaid'], items: [{ id: 'coldKvass', qty: 2 }] },
  },
  {
    id: 'into-the-depths',
    title: 'Into the Depths',
    blurb:
      'A metro pavilion has appeared on Manezhnaya Square, and it hums. Go down and see what waits in the Ticket Hall.',
    minRank: 2,
    objectives: [
      { kind: 'visit', zones: ['ug-hall'], label: 'Descend into the Moscow underground' },
    ],
    reward: {
      xp: 90,
      rep: 15,
      items: [
        { id: 'healingTea', qty: 3 },
        { id: 'coldKvass', qty: 2 },
      ],
    },
  },
  {
    id: 'clear-the-halls',
    title: 'Silence the Halls',
    blurb:
      'The Records Cellar and its halls are crawling with gloomy clerks. Defeat every monster of the three halls and the way to the Vault opens by itself.',
    minRank: 2,
    objectives: [
      { kind: 'flag', flag: 'hallsCleared', label: 'Defeat every monster in the three halls' },
    ],
    reward: {
      xp: 120,
      rep: 18,
      items: [
        { id: 'healingTea', qty: 2 },
        { id: 'coldKvass', qty: 2 },
      ],
    },
  },
  {
    id: 'end-the-corruption',
    title: 'End the Corruption',
    blurb:
      'Behind the Vault gate waits the Father of Corruption, who has filed the whole square under "denied". Put an end to him.',
    minRank: 3,
    objectives: [{ kind: 'flag', flag: 'bossDefeated', label: 'Defeat the Father of Corruption' }],
    reward: {
      xp: 300,
      rep: 30,
      items: [
        { id: 'healingTea', qty: 4 },
        { id: 'coldKvass', qty: 4 },
      ],
    },
  },
];

export const QUEST_BY_ID: ReadonlyMap<string, QuestDef> = new Map(QUESTS.map((q) => [q.id, q]));
