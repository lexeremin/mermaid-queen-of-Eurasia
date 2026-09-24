import type { AssetId } from '@/data/assets';
import type { Method } from '@/data/dialogue-types';

export type MethodLines = { option: string; reaction: string; delta: number };

export type NpcDef = {
  id: string;
  name: string;
  title: string;
  asset: AssetId;
  accent: string;
  initial: number;
  joinAt: number;
  greet: { low: string; mid: string; high: string };
  invite: string;
  joined: string;
  methods: Record<Method, MethodLines>;
};

export const NPCS: readonly NpcDef[] = [
  {
    id: 'grisha',
    name: 'Maksim',
    title: 'Gate Guard',
    asset: 'npcGrisha',
    accent: '#6b8a3c',
    initial: 6,
    joinAt: 70,
    greet: {
      low: 'Halt. There is nothing here to guard, really, but halt anyway.',
      mid: 'You again. The gate is still here. So am I. Small victories.',
      high: "Rosa! I straightened my hat for you. Don't tell the gate.",
    },
    invite:
      'If I leave my post, who will guard nothing? ...Yes. Yes, I want to come. A kingdom needs a guard.',
    joined: "Guard of the Queen's gate! Best post I ever had. The hat approves.",
    methods: {
      kindness: {
        option: 'You have kept this post so faithfully. That matters.',
        reaction: "Eleven years and no one said that. Give me a moment. It's the wind. In my eyes.",
        delta: 22,
      },
      humor: {
        option: 'Is that a hat, or a small, very serious animal?',
        reaction: "It's an ushanka. ...The animal thing is fair. Ha. Hah. Ow, my face forgot how.",
        delta: 10,
      },
      song: {
        option: 'Rosa hums a slow melody. It rings out across the empty gate.',
        reaction: "What is that sound? My chest is doing something. Please don't stop.",
        delta: 30,
      },
      silence: {
        option: 'You stand beside him and watch the empty gate together.',
        reaction: 'Nobody stands with me. Nice. Quiet. Better than guarding alone.',
        delta: 15,
      },
    },
  },
  {
    id: 'tolik',
    name: 'Vitalik',
    title: 'Accordionist of Sad Waltzes',
    asset: 'npcTolik',
    accent: '#a4442f',
    initial: 8,
    joinAt: 70,
    greet: {
      low: 'Requests? Only in a minor key. Funeral or wedding, it is the same waltz.',
      mid: 'Your voice would go well with this tune. Sad, but with hips.',
      high: 'For you: the first major chord I have played in nine years.',
    },
    invite: 'A kingdom needs a court musician. I know exactly one song. It is about you now.',
    joined: "The Queen's Musician! Requests welcome. Except sad ones. ...Fine, sad ones too.",
    methods: {
      kindness: {
        option: 'You play beautifully. It reaches the whole square.',
        reaction: 'The whole square? The pigeons left. But... thank you.',
        delta: 15,
      },
      humor: {
        option: 'Do you know any songs that are not about sadness?',
        reaction: "'Sad Waltz, Slightly Less Sad.' Same notes. A wink.",
        delta: 12,
      },
      song: {
        option: 'Rosa sings over the accordion. The notes circle them both.',
        reaction: 'Two voices. The bellows breathe. I forgot the instrument could laugh.',
        delta: 38,
      },
      silence: {
        option: 'You sit and listen to the whole waltz without applauding.',
        reaction: 'Someone listened to the end. I need a napkin.',
        delta: 12,
      },
    },
  },
  {
    id: 'lyoha',
    name: 'Malinin',
    title: 'Chess Hustler',
    asset: 'npcLyoha',
    accent: '#3a6ea8',
    initial: 5,
    joinAt: 70,
    greet: {
      low: 'Ten rubles a game. The winner keeps his dignity, the loser keeps nothing.',
      mid: "You are not bad at conversation. Let's see how you are at losing.",
      high: "I let you win. Don't tell anyone. My reputation is my only asset.",
    },
    invite: 'Court strategist? Fine. But I reserve the right to hustle the tsar.',
    joined: 'Chief Strategist to the Queen! Every move is a pawn and I am the bishop.',
    methods: {
      kindness: {
        option: 'You must be terribly clever to play this fast.',
        reaction: 'Clever? I am broke and clever. Thank you, though.',
        delta: 8,
      },
      humor: {
        option: 'Is the knight allowed to jump because he is tired of the rest of you?',
        reaction: 'That is... hah! I am stealing that. Ten rubles per use.',
        delta: 25,
      },
      song: {
        option: 'Rosa hums a tune. The pieces seem to sway on the board.',
        reaction: 'Stop it, the queen is tempting the whole board. I am losing to music.',
        delta: 28,
      },
      silence: {
        option: 'You sit beside him and watch the game without a word.',
        reaction: 'A patient spectator. I could get used to you.',
        delta: 14,
      },
    },
  },
  {
    id: 'mikhalych',
    name: 'Sasha Prince',
    title: 'Kefir Seller',
    asset: 'npcMikhalych',
    accent: '#e0742c',
    initial: 10,
    joinAt: 70,
    greet: {
      low: 'Kefir, cold kefir. Nobody buys it in summer. Tastes better sad.',
      mid: 'Take a mug, Rosa. On the house. The house is a barrel.',
      high: 'You drank my kefir and smiled. I have waited eleven summers for that.',
    },
    invite: "Royal kefir supply? Yes! I'll ferment the Queen's own. A little bitter, mostly proud.",
    joined: "The Queen's Kefir Master! Cold, sparkling, and only slightly existential.",
    methods: {
      kindness: {
        option: 'This looks like the best kefir in Moscow.',
        reaction: 'The best? In Moscow? Sit, sit. Take two.',
        delta: 26,
      },
      humor: {
        option: 'Do you sell kefir, or bottled optimism?',
        reaction: 'Both. The optimism is watered down.',
        delta: 14,
      },
      song: {
        option: 'Rosa sings a warm folk melody across the stall.',
        reaction: 'My babushka sang that. Where did you learn... never mind. Keep going.',
        delta: 32,
      },
      silence: {
        option: 'You sit at his stall and share a quiet mug.',
        reaction: 'A quiet customer. Rarer than sunshine.',
        delta: 10,
      },
    },
  },
  {
    id: 'boris',
    name: 'Polish Prince',
    title: 'Clerk of Form 27-B',
    asset: 'npcBoris',
    accent: '#5f7590',
    initial: 4,
    joinAt: 70,
    greet: {
      low: 'Do you have the form? No form, no problem. Well, yes. Problem.',
      mid: "I stamped your smile as 'pending.' It is the nicest thing I have stamped.",
      high: 'I forgot to file three things because you were talking. Unheard of.',
    },
    invite: "The Queen's Chancellor of Forms? I accept. In triplicate.",
    joined: "Royal Chancellor! I have stamped the kingdom 'approved.' Provisionally.",
    methods: {
      kindness: {
        option: 'You work so hard. Someone should notice.',
        reaction: 'Noticed? By a human? I will need a form for this feeling.',
        delta: 20,
      },
      humor: {
        option: 'I heard the stamp files itself when you are not looking.',
        reaction: 'Bureaucracy is not a laughing matter. ...Though the stamp does that.',
        delta: -8,
      },
      song: {
        option: 'Rosa sings a lullaby to the stack of forms.',
        reaction: 'The forms are... quiet. They never quiet down. Thank you.',
        delta: 26,
      },
      silence: {
        option: 'You wait patiently while he sorts his papers.',
        reaction: 'Nobody waits. Everybody sighs. You wait.',
        delta: 30,
      },
    },
  },
  {
    id: 'sergei',
    name: 'Sergey',
    title: 'Tour Guide With Nobody to Guide',
    asset: 'npcSergei',
    accent: '#d6b04a',
    initial: 9,
    joinAt: 70,
    greet: {
      low: 'To your left: history. To your right: more history. Behind you: the exit.',
      mid: 'You are my first real listener. Ask me anything. Nobody ever asks.',
      high: 'I cancelled my whole tour. You are the only group I need.',
    },
    invite: "Head of the Queen's Tours? Finally, a group that follows me.",
    joined: 'Official Guide! Please stay with the group. The group is you. Hello.',
    methods: {
      kindness: {
        option: 'Your stories make the old stones come alive.',
        reaction: 'Alive? They usually just sit there. I like your version.',
        delta: 16,
      },
      humor: {
        option: 'Does the umbrella still work when there is no group to lead?',
        reaction: 'It is a beacon of hope. Rain or none.',
        delta: 20,
      },
      song: {
        option: 'Rosa sings a marching tune for the tour of one.',
        reaction: 'A soundtrack! For my tour! I have waited my entire career.',
        delta: 24,
      },
      silence: {
        option: 'You let him finish an entire story without interrupting.',
        reaction: 'Nobody lets me finish. I am almost frightened.',
        delta: 24,
      },
    },
  },
  {
    id: 'arkady',
    name: 'Gumelnik',
    title: 'Watch Seller of GUM',
    asset: 'npcArkady',
    accent: '#7a5aa8',
    initial: 7,
    joinAt: 70,
    greet: {
      low: 'Genuine watches. Genuinely running. Genuinely, buy one.',
      mid: 'For you, a special price: zero rubles and a short conversation.',
      high: 'I stopped counting sales. I started counting your visits.',
    },
    invite: "Court Jeweler? I'll make the Queen's crown tick, if you like.",
    joined: "Royal Watchmaker! Time is on the Queen's side. I bribed it.",
    methods: {
      kindness: {
        option: 'Your watches are works of art.',
        reaction: 'Art? These? They are loud and mostly right. ...Thank you.',
        delta: 18,
      },
      humor: {
        option: 'Are they all late, or fashionably late?',
        reaction: 'Fashionably. The lateness is imported.',
        delta: 14,
      },
      song: {
        option: 'Rosa sings, and every watch on the tray ticks in time.',
        reaction: 'They are synchronized! Forty watches and one time! A miracle.',
        delta: 36,
      },
      silence: {
        option: 'You browse the tray without haggling, just admiring.',
        reaction: 'A customer who does not haggle. I need to sit down.',
        delta: 8,
      },
    },
  },
  {
    id: 'kolya',
    name: 'Ukrainian Prince',
    title: 'Pigeon Feeder',
    asset: 'npcKolya',
    accent: '#8a5a34',
    initial: 12,
    joinAt: 65,
    greet: {
      low: "Shh. They are nervous. So am I, if we're honest.",
      mid: 'Take some crumbs, Rosa. Pigeons do not talk. You do. It is a nice change.',
      high: 'I named them after my old colleagues. You are the first person I told.',
    },
    invite: "The Queen's Royal Pigeon Keeper? Only if the pigeons get a vote.",
    joined: 'Keeper of the Royal Pigeons! Your Majesty, they all bowed. ...Or pecked.',
    methods: {
      kindness: {
        option: 'The pigeons are lucky to have someone who cares.',
        reaction: 'Cares? They are all I have. ...They do seem lucky.',
        delta: 30,
      },
      humor: {
        option: 'Has any of them asked for a raise?',
        reaction: 'Grigori wants a bigger bench. Yes.',
        delta: 14,
      },
      song: {
        option: 'Rosa sings softly. The pigeons gather at her feet.',
        reaction: 'They never gather for me! ...Never mind. Keep singing.',
        delta: 30,
      },
      silence: {
        option: 'You sit on the bench and scatter crumbs together.',
        reaction: 'This is the good stuff, is it not? Sitting.',
        delta: 20,
      },
    },
  },
];

export const NPC_BY_ID: ReadonlyMap<string, NpcDef> = new Map(NPCS.map((n) => [n.id, n]));
