import type { AssetId } from '@/data/assets';
import type { DialogueNode, DialogueTree } from '@/data/dialogue-types';

export type ArchangelAnswer = {
  /** What Rosa says. */
  text: string;
  /** The child's reaction to a wrong answer (the prompt is asked again). Unused for the right one. */
  reaction: string;
};

export type ArchangelDef = {
  id: string;
  name: string;
  title: string;
  asset: AssetId;
  accent: string;
  intro: string;
  prompt: string;
  /** The warm, right answer. */
  right: string;
  /** Two gentle, funny mistakes. */
  wrong: readonly [ArchangelAnswer, ArchangelAnswer];
  thanks: string;
  /** Narration of the joyful moment right after saving. */
  joy: string;
  after: string;
  farewell: string;
  /** Where the child hides. */
  spot: { x: number; z: number; rotY: number };
};

const HALF_PI = Math.PI / 2;

/** The three archangels: the small winged children of Rosa and Prince Sasha. */
export const ARCHANGELS: readonly ArchangelDef[] = [
  {
    id: 'michael',
    name: 'Michael',
    title: 'Little Guardian',
    asset: 'npcMichael',
    accent: '#3a6ea8',
    intro:
      'Mama?! ...Mama! I hid from the loud men all morning, all by myself. I was very brave. Only a little bit wobbly.',
    prompt:
      'A big grey Gloom comes stomping up the square, and all I have is a wooden sword. Mama, what do we do?',
    right: 'Stand tall beside you, and sing until the Gloom forgets why it was angry.',
    wrong: [
      {
        text: 'Run! As fast as we can!',
        reaction:
          'Mama never runs! Papa says a queen only walks away when she is finished. Try again?',
      },
      {
        text: 'Ask Papa Sasha to handle it.',
        reaction:
          'Papa is busy being handsome behind his kefir crate. It is a very hard job. Try again?',
      },
    ],
    thanks:
      'Singing beside me? Then I am not scared at all! I will guard the whole square with you. Wooden sword, real courage!',
    joy: 'Michael leaps into your arms, wings a-flutter, giggling so hard his halo wobbles.',
    after:
      'I am the guardian of Red Square now! Papa’s kefir crate is my fortress. Come and see me, Mama!',
    farewell: 'Guard it well, my little knight.',
    spot: { x: -11.6, z: -27.4, rotY: HALF_PI * 0.6 },
  },
  {
    id: 'gabriel',
    name: 'Gabriel',
    title: 'Messenger of Good News',
    asset: 'npcGabriel',
    accent: '#e9bd56',
    intro:
      'Mama! I lost my trumpet’s tune! I have carried good news all over Moscow, and then the wind blew the words right out of my head.',
    prompt:
      'Every night you whispered the same message to me before I fell asleep. Can you remember what it was?',
    right: 'Sleep well, little light. Tomorrow is ours.',
    wrong: [
      {
        text: 'Brush your teeth and count the pigeons.',
        reaction: 'Hee! That was Papa’s message. It is not nearly as musical. Try again?',
      },
      {
        text: 'Mamas do not whisper messages.',
        reaction:
          'That cannot be right. My wings stopped flapping just from thinking about it. Try again?',
      },
    ],
    thanks:
      'Yes! That is it! “Sleep well, little light...” Now my trumpet has its tune back. Listen!',
    joy: 'Gabriel blows one bright, slightly out-of-tune note, and every pigeon in the gallery cheers.',
    after: 'I will carry good news from you to all of Moscow. First news: Mama is home! Toot toot!',
    farewell: 'Toot back, my little messenger.',
    spot: { x: -26.3, z: 24.6, rotY: -HALF_PI * 0.5 },
  },
  {
    id: 'serafima',
    name: 'Serafima',
    title: 'Keeper of the Small Flame',
    asset: 'npcSerafima',
    accent: '#d98cae',
    intro:
      'Mama... the river is very loud at night. I kept my little flame alive so I would not be cold. Six wings are a lot of blanket, but they do not reach the water.',
    prompt: 'The river told me a lullaby, but I forgot how it ends. Mama, do you know the ending?',
    right: 'Hum it softly: “The tide remembers every song, and always brings you home.”',
    wrong: [
      {
        text: 'It ends with a loud, sharp whistle!',
        reaction: 'That would wake the ducks. And the fish. And Papa. Try again?',
      },
      {
        text: 'Lullabies never end, they only get quieter.',
        reaction:
          'That is pretty, but I want the real ending, the one that makes my flame glow. Try again?',
      },
    ],
    thanks:
      'Yes... that is the ending. My flame is glowing again! Look, Mama, it is dancing! Now I am not afraid of the river anymore.',
    joy: 'Serafima’s six wings unfold wide, her flame flares warm and gold, and she laughs like a handful of tiny bells.',
    after: 'I will keep the river’s lullaby warm for you. Come and sit with me any time, Mama.',
    farewell: 'I will, my small flame.',
    spot: { x: 36, z: -61.6, rotY: HALF_PI * 2 },
  },
];

export const ARCHANGEL_BY_ID: ReadonlyMap<string, ArchangelDef> = new Map(
  ARCHANGELS.map((a) => [a.id, a]),
);

/** What Rosa notices when she gets close to a child she has not saved yet (once each, so it is a nudge, not a nag). */
export const ARCHANGEL_HINTS: Readonly<Record<string, { text: string; radius: number }>> = {
  michael: { text: 'Somewhere among the fir trees, someone is sniffling...', radius: 22 },
  gabriel: { text: 'A tiny trumpet toots, off-key, somewhere close by...', radius: 22 },
  serafima: { text: 'Across the water, something glows like a small flame.', radius: 28 },
};

/** The first unsaved, not yet hinted child within his notice radius of `pos`, if any. */
export function nearbyHint(
  spots: readonly { id: string; x: number; z: number }[],
  pos: { x: number; z: number },
  saved: readonly string[],
  hinted: ReadonlySet<string>,
): string | null {
  for (const s of spots) {
    const hint = ARCHANGEL_HINTS[s.id];
    if (!hint || saved.includes(s.id) || hinted.has(s.id)) continue;
    if (Math.hypot(s.x - pos.x, s.z - pos.z) <= hint.radius) return s.id;
  }
  return null;
}

export const ARCHANGEL_COUNT = ARCHANGELS.length;

/** The dialogue for one archangel: intro, the prompt with three answers, and a happy line once saved. */
export function buildArchangelTree(def: ArchangelDef): DialogueTree {
  const nodes: Record<string, DialogueNode> = {
    start: {
      speaker: 'npc',
      branches: [
        { when: [{ kind: 'saved', child: def.id, value: true }], next: 'after' },
        { when: [], next: 'intro' },
      ],
    },
    intro: { speaker: 'npc', text: def.intro, next: 'prompt' },
    prompt: {
      speaker: 'npc',
      text: def.prompt,
      choices: [
        {
          text: def.right,
          next: 'thanks',
          effects: [{ type: 'save', child: def.id }],
        },
        ...def.wrong.map((answer, i) => ({ text: answer.text, next: `wrong_${i}` })),
      ],
    },
    thanks: { speaker: 'npc', text: def.thanks, next: 'joy' },
    joy: { speaker: 'narrator', text: def.joy, next: 'end' },
    after: {
      speaker: 'npc',
      text: def.after,
      choices: [{ text: def.farewell, next: 'end' }],
    },
  };
  def.wrong.forEach((answer, i) => {
    nodes[`wrong_${i}`] = { speaker: 'npc', text: answer.reaction, next: 'prompt' };
  });
  return { id: `archangel-${def.id}`, start: 'start', nodes };
}
