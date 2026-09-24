import type { EnemyKind } from '@/data/enemies';
import type { ItemId } from '@/data/items';

export type Objective =
  | { kind: 'kill'; count: number; enemy?: EnemyKind }
  | { kind: 'visit'; zones: readonly string[] }
  | { kind: 'mesmerize'; npc: string }
  | { kind: 'recruit'; count: number }
  | { kind: 'collect'; item: ItemId; count: number }
  | { kind: 'level'; level: number };

export type QuestReward = {
  xp: number;
  rep: number;
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
    title: 'Gavel Down',
    blurb: 'The Gavel Speakers keep ruling that joy is out of order. Overrule two.',
    minRank: 1,
    objectives: [{ kind: 'kill', count: 2, enemy: 'speaker' }],
    reward: { xp: 70, rep: 12, items: [{ id: 'rainCloak', qty: 1 }] },
  },
  {
    id: 'the-grand-tour',
    title: 'The Grand Tour',
    blurb: 'Show yourself in GUM, on Manezhnaya Square and in Alexander Garden.',
    minRank: 1,
    objectives: [{ kind: 'visit', zones: ['gum', 'manezh', 'alexander-garden'] }],
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
];

export const QUEST_BY_ID: ReadonlyMap<string, QuestDef> = new Map(QUESTS.map((q) => [q.id, q]));
