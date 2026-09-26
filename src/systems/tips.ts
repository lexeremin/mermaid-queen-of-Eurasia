/** Tips for new players: short cards that appear once, at the moment they become useful. */

/** What the tips need to know about the game right now. */
export type TipContext = {
  touch: boolean;
  /** Seconds of play in this visit (time with a menu open does not count). */
  playSeconds: number;
  level: number;
  /** Quests finished so far. */
  questsDone: number;
  /** Health as a fraction of the maximum. */
  hpFraction: number;
  /** Someone is close enough to talk to. */
  nearPerson: boolean;
  /** A monster that is awake and about is close. */
  monsterNear: boolean;
  underground: boolean;
  /** The bag holds something. */
  hasItems: boolean;
  /** Something in the bag heals. */
  hasPotion: boolean;
  /** The mark over the notice board, if any. */
  boardMark: 'available' | 'ready' | null;
};

export type Tip = {
  id: string;
  title: string;
  text: (touch: boolean) => string;
  when: (c: TipContext) => boolean;
};

/** Anyone who has played a while does not need the basics again (this also keeps old saves from seeing them). */
export const isVeteran = (c: TipContext): boolean => c.level >= 4 || c.questsDone >= 2;

/** In the order they are offered when several are due. */
export const TIPS: readonly Tip[] = [
  {
    id: 'move',
    title: 'Welcome, Rosa',
    text: (touch) =>
      touch
        ? 'Use the stick at the bottom left to walk. The buttons at the bottom right are your trident and skills.'
        : 'Walk with W A S D or the arrow keys. Or click the ground, and Rosa finds her own way there.',
    when: (c) => !isVeteran(c) && c.playSeconds >= 2,
  },
  {
    id: 'board',
    title: 'The notice board',
    text: (touch) =>
      `A gold ! over the notice board means a quest is waiting. Walk up to it and ${touch ? 'tap the prompt' : 'press E'} to take one. A ? means a quest is ready to hand in. The map (${touch ? 'top right' : 'M'}) shows the mark too.`,
    when: (c) => !isVeteran(c) && c.playSeconds >= 14 && c.boardMark !== null,
  },
  {
    id: 'people',
    title: 'Talk to people',
    text: (touch) =>
      `${touch ? 'Tap the prompt' : 'Press E'} next to someone to talk. Try kindness, humor, song and silence: each person likes different things. Win them over and they may join your kingdom.`,
    when: (c) => !isVeteran(c) && c.nearPerson && c.playSeconds >= 8,
  },
  {
    id: 'fight',
    title: 'A gloomy man ahead',
    text: (touch) =>
      touch
        ? 'Tap ATK to swing the trident, three different swings in a row. Bigger attacks paint a red shape on the ground first: step out of it.'
        : 'Hold Space to swing the trident, three different swings in a row. Or hold the right mouse button to strike toward the cursor. Bigger attacks paint a red shape on the ground first: step out of it.',
    when: (c) => !isVeteran(c) && c.monsterNear && !c.underground,
  },
  {
    id: 'health',
    title: 'Running low',
    text: (touch) =>
      `${touch ? 'Tap a potion button at the bottom left' : 'Press 1 or 2'} to drink a potion. Health also comes back slowly while nothing is hitting you, and getting up after a faint costs nothing.`,
    when: (c) => c.hpFraction < 0.4 && c.hasPotion && c.level < 12,
  },
  {
    id: 'bag',
    title: 'Your bag',
    text: (touch) =>
      `What you pick up goes in the bag (${touch ? 'the bag icon' : 'press I'}). Open it to wear gear and to drink potions, and set which ones sit on the quick buttons.`,
    when: (c) => !isVeteran(c) && c.hasItems && c.playSeconds >= 30,
  },
  {
    id: 'map',
    title: 'Finding your way',
    text: (touch) =>
      touch
        ? 'The little map shows monsters, people and the notice board. Tap it for the whole district. The swirl button at the bottom left brings Rosa back to Red Square.'
        : 'The little map shows monsters, people and the notice board; M opens the whole district. T brings Rosa back to Red Square if she gets lost.',
    when: (c) => !isVeteran(c) && c.playSeconds >= 100,
  },
  {
    id: 'aura',
    title: 'The Aura song',
    text: (touch) =>
      `${touch ? 'Tap AURA' : 'Press Q'} near people to sing: rings of notes charm everyone they touch. Monsters caught in them stumble around, blinded.`,
    when: (c) => c.level >= 3 && c.level < 8,
  },
  {
    id: 'blink',
    title: 'Blink',
    text: (touch) =>
      `${touch ? 'Tap BLINK' : 'Press Shift'} to jump a short way, over walls if need be. Rosa cannot be hurt while she hops: use it to leave a red shape at the last moment.`,
    when: (c) => c.level >= 6 && c.level < 12,
  },
  {
    id: 'surge',
    title: 'Surge',
    text: (touch) =>
      `${touch ? 'Tap SPELL' : 'Press R'} for a wave of sea water that hits everything around Rosa and throws it back.`,
    when: (c) => c.level >= 10 && c.level < 16,
  },
  {
    id: 'underground',
    title: 'Below Moscow',
    text: () =>
      'Each layer has stairs at both ends. Monsters get tougher with every layer, and every tenth layer ends in a boss. The Depth panel at the metro pavilion takes you back down quickly.',
    when: (c) => c.underground && c.level < 20,
  },
];

export const TIP_IDS: readonly string[] = TIPS.map((t) => t.id);
export const isTipId = (value: unknown): value is string =>
  typeof value === 'string' && TIP_IDS.includes(value);

/** The first tip that is due and has not been shown, or null. */
export function pickTip(context: TipContext, seen: readonly string[]): Tip | null {
  for (const tip of TIPS) {
    if (!seen.includes(tip.id) && tip.when(context)) return tip;
  }
  return null;
}

/** How long a tip stays up if it is not closed, and the pause before the next one may appear. */
export const TIP_SECONDS = 15;
export const TIP_GAP_SECONDS = 8;
