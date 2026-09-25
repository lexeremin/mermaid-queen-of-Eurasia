import type { AssetId } from '@/data/assets';
import type { DialogueNode, DialogueTree } from '@/data/dialogue-types';
import type { ItemId } from '@/data/items';

export type LocalTopic = {
  /** What Rosa asks. */
  ask: string;
  /** What they answer. */
  reply: string;
};

/**
 * An ordinary person of the square: not persuadable and not recruitable, just good company. Each has a greeting,
 * three things to talk about (one of them usually a hint about something hidden or a place worth visiting), and
 * a small first-meeting XP bonus; a few also hand over a small gift, once.
 */
export type LocalDef = {
  id: string;
  name: string;
  title: string;
  asset: AssetId;
  accent: string;
  hello: string;
  topics: readonly [LocalTopic, LocalTopic, LocalTopic];
  goodbye: string;
  /** A small gift, handed over once (only if the bag has room). */
  gift?: { item: ItemId; qty: number; line: string };
  /** Where they stand. */
  spot: { x: number; z: number; rotY: number };
};

/** XP for meeting each of them for the first time. */
export const LOCAL_MEET_XP = 12;

const HALF_PI = Math.PI / 2;

export const LOCALS: readonly LocalDef[] = [
  {
    id: 'vanya',
    name: 'Vanya',
    title: 'Guy on his Heels',
    asset: 'npcVanya',
    accent: '#3a6ea8',
    hello:
      'Sit down. Seeds? No? Suit yourself. Nobody ever takes seeds. I keep bringing them anyway.',
    topics: [
      {
        ask: 'Why are you crouching?',
        reply:
          'It is not crouching, it is resting on the heels. Full-time job. Nobody has ever fallen off a squat, and you can see the whole square from down here.',
      },
      {
        ask: 'Any news from the square?',
        reply:
          'A little kid with wings was hiding among the fir trees at the far end of the square, sniffling. I offered him seeds. He said “not without Mama”. Strange kid. Nice halo, though.',
      },
      {
        ask: 'Do you know any songs?',
        reply:
          'In the middle of the square? ...Fine. La la laaa. That is all I know. The rest is seeds.',
      },
    ],
    goodbye: 'Come back any time. I will be here. On my heels. Same as yesterday.',
    spot: { x: 10.4, z: -14.6, rotY: -HALF_PI },
  },
  {
    id: 'zoya',
    name: 'Babushka Zoya',
    title: 'Bags of GUM',
    asset: 'npcBabushka',
    accent: '#d98cae',
    hello:
      'Oh, look at you, so thin! Two bags and not one biscuit in them for you. Well, here, sit a minute.',
    topics: [
      {
        ask: 'What do you carry in the bags?',
        reply:
          'Everything. Tea, a scarf, another scarf, three tomatoes, and a jar that nobody knows the contents of. Never leave home without a jar.',
      },
      {
        ask: 'Have you seen anything strange in GUM?',
        reply:
          'A boy at the far end of the gallery, by the kiosks, with a tiny golden trumpet and wings like a pigeon. He has lost his tune. I gave him a biscuit, but the tune did not come back.',
      },
      {
        ask: 'Tell me about the old days.',
        reply:
          'In my day the fountain worked and the men were louder but nicer. Now they are quieter and nastier. Take this and stop asking about my age.',
      },
    ],
    goodbye: 'Go, go. Eat something. Mind the loud men.',
    gift: {
      item: 'healingTea',
      qty: 2,
      line: 'Zoya pours you two cups of hot, sweet tea from a flask, whether you asked or not.',
    },
    spot: { x: -21.6, z: 3.6, rotY: HALF_PI * 0.4 },
  },
  {
    id: 'tim',
    name: 'Tim',
    title: 'Tourist with a Stick',
    asset: 'npcTourist',
    accent: '#c0483f',
    hello:
      'Hi! Sorry, can you hold this? No, wait, stand there, you are in the shot. Amazing light! Amazing everything!',
    topics: [
      {
        ask: 'How do you like Moscow?',
        reply:
          'It is unreal! I went down the metro and it just kept going down, like, a hundred levels?! I got lost on level nine. It was the best day of my life.',
      },
      {
        ask: 'What have you photographed?',
        reply:
          'Everything. The cathedral, the cathedral from the left, the cathedral from the right. And a girl with six wings across the river, waving at me! I could not get over: my phone is not waterproof.',
      },
      {
        ask: 'Can you take my photo?',
        reply:
          'Do I? Stand there! No, there. Say “kvass”! ...Perfect. Best mermaid queen photo I have ever taken. I will not tell anyone, promise.',
      },
    ],
    goodbye: 'Bye! Follow me on the socials! ...Wait, do you have socials? Bye!',
    spot: { x: 29.5, z: 61.5, rotY: HALF_PI },
  },
  {
    id: 'oleg',
    name: 'Oleg',
    title: 'Sunday Painter',
    asset: 'npcPainter',
    accent: '#c23a3a',
    hello:
      'Shh, do not move, the light is just right. ...No, move, it looks better when you move. Painters, honestly.',
    topics: [
      {
        ask: 'What are you painting?',
        reply:
          'The cathedral, always the cathedral. Every time it comes out different. Yesterday it had nine domes and a smile. Nobody complained.',
      },
      {
        ask: 'Any secrets in the park?',
        reply:
          'The amphitheatre has a wonderful echo. Stand on the stage and sing, they say the whole park listens. And I have seen pearls wash up under the benches and along the railings, five at least.',
      },
      {
        ask: 'Could you paint me?',
        reply:
          'A queen with a trident and a tail in a puddle? Gladly. It will take a week. The trident will be enormous. Artistic licence.',
      },
    ],
    goodbye: 'Off you go! Mind the wet paint. It is all wet paint.',
    spot: { x: -11.9, z: -34.4, rotY: HALF_PI },
  },
  {
    id: 'tamara',
    name: 'Tamara',
    title: 'Kvass Seller',
    asset: 'npcKvass',
    accent: '#f2b04a',
    hello:
      'Cold kvass, cold kvass! The only drink that tastes like bread and hope. Two rubles, or a song.',
    topics: [
      {
        ask: 'Is it good kvass?',
        reply:
          'The best in the district. The recipe is my grandmother’s, and my grandmother’s grandmother’s. It has not changed in a hundred years. Neither has the barrel.',
      },
      {
        ask: 'Where do you sell best?',
        reply:
          'On hot days, everywhere. On cold days, nowhere. On the embankment when the lanterns are lit, everybody strolls and everybody is thirsty. Somebody should light those lanterns.',
      },
      {
        ask: 'I am tired. Any advice?',
        reply:
          'Drink something cold, sit somewhere warm, and never fight three tall men in a row. Fight them one at a time, with a friend.',
      },
    ],
    goodbye: 'Come back thirsty!',
    gift: {
      item: 'coldKvass',
      qty: 2,
      line: 'Tamara fills two cold bottles of kvass for you: “A song is worth two, and you looked like you meant it.”',
    },
    spot: { x: 1.6, z: -13.4, rotY: HALF_PI },
  },
  {
    id: 'sentry',
    name: 'The Sentry',
    title: 'Not Allowed to Talk',
    asset: 'npcSentry',
    accent: '#2f6a55',
    hello: '(He stares straight ahead. Not a muscle moves.) ...',
    topics: [
      {
        ask: 'Are you allowed to talk?',
        reply:
          '(A very long pause.) ...No. (Another very long pause.) That was not talking. That was a sound.',
      },
      {
        ask: 'Would you like a joke?',
        reply:
          '(The corner of his mouth twitches once.) I saw nothing. I heard nothing. I will be thinking about the knight and the pawn until Thursday.',
      },
      {
        ask: 'Any advice for a queen?',
        reply:
          '(Without moving his lips.) The Aura works best when everything is watching you. Stand still, sing, let the loud men come. Also: the clock on the corner tower is eight minutes fast. Do not tell anyone.',
      },
    ],
    goodbye: '(He does not look at you. He nods, barely, with his eyebrows.)',
    spot: { x: 6.2, z: 29.4, rotY: Math.PI },
  },
  {
    id: 'petya',
    name: 'Petya',
    title: 'Kid with a Balloon',
    asset: 'npcKid',
    accent: '#e0742c',
    hello:
      'Look, Pasha the pigeon sat on me! He does not sit on grown-ups. He says they never look down.',
    topics: [
      {
        ask: 'What does Pasha say?',
        reply:
          'He says “coo”. And sometimes “coo coo”. Once he said “bread”, but that may have been the wind.',
      },
      {
        ask: 'Where did you get the balloon?',
        reply:
          'From a man who was giving them out, then he got sad and gave me all of them, and they all flew away but this one. That is why I hold it very hard.',
      },
      {
        ask: 'Is there anything fun to find?',
        reply:
          'The big people never look down, but Pasha and I do. There are pearls under the benches in the park by the river. And the lanterns on the embankment go “bzzz” if you stand by them long enough.',
      },
    ],
    goodbye: 'Bye! Say bye, Pasha! ...He said “coo”. That means bye.',
    spot: { x: 22, z: -38.6, rotY: Math.PI },
  },
];

export const LOCAL_BY_ID: ReadonlyMap<string, LocalDef> = new Map(LOCALS.map((l) => [l.id, l]));

/** The talk with one local: a greeting, three topics (any number of times, in any order), goodbye. */
export function buildLocalTree(def: LocalDef): DialogueTree {
  // Asking anything counts as meeting them; the gift (if any) comes with the first answer.
  const effects = [
    { type: 'meet' as const, who: def.id },
    ...(def.gift ? [{ type: 'gift' as const, who: def.id }] : []),
  ];
  const nodes: Record<string, DialogueNode> = {
    start: { speaker: 'npc', text: def.hello, next: 'menu' },
    menu: {
      speaker: 'narrator',
      text: 'What would you like to talk about?',
      choices: [
        ...def.topics.map((topic, i) => ({
          text: topic.ask,
          next: `topic_${i}`,
          effects,
        })),
        { text: 'Goodbye for now.', next: 'bye' },
      ],
    },
    bye: { speaker: 'npc', text: def.goodbye, next: 'end' },
  };
  def.topics.forEach((topic, i) => {
    nodes[`topic_${i}`] = { speaker: 'npc', text: topic.reply, next: 'menu' };
  });
  return { id: `local-${def.id}`, start: 'start', nodes };
}
