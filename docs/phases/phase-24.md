# Phase 24 — Bosses and people

**Status:** ✅ Complete

## Goal
More bosses for the endless dungeon (original satirical archetypes, no real people and no nationalities), and ordinary people to talk to on the square, such as the tracksuit guy who squats on his heels.

## Bosses
Every tenth layer is guarded by one of five bosses, in turn (layers 10 to 50, then again 60 to 100, tougher through the layer's power):

| Layer | Boss | Health | Style |
|---|---|---|---|
| 10, 60 | **Father of Corruption** (unchanged) | 900 | stamps, stomps, dart fans, lecterns |
| 20, 70 | **The Lobbyist** (pinstripe suit, monocle, briefcase of banknotes) | 1 100 | fans of banknotes, a rain of coins, a rush across the room |
| 30, 80 | **Senator Endless** (round, sash, megaphone, endless scroll) | 1 300 | slow; triple rings of words, long sweeping lecterns |
| 40, 90 | **The Yacht Baron** (fur coat, chains, sunglasses, captain's hat, golden anchor) | 1 300 | rams across the room, slams the floor |
| 50, 100 | **The Spin Doctor** (teal suit, spiral tie, pinwheel cap, giant microphone) | 1 000 | fast; wide dart fans, coin rain, rings of spin |

- `systems/boss.ts` now holds a table per boss: which moves in which phase, and the numbers of each move (a boss reshapes the shared numbers, and Father of Corruption keeps his own exactly). Two new moves: **rain** (marked circles falling one after another, the first where Rosa stood, the rest around her, from the boss's own seed so it is reproducible) and **charge** (a marked lane, then a dash along it that stops at walls).
- Each boss has its own arena name and floor colour (Registry Vault, The Lobby, Senate Floor, Yacht Club, Press Room), its own lines when he calls for backup and when he loses his temper, and its own health bar name. The bar now follows the layer's power (it used to go past 100% at depth).
- Models are built in `tools/blender/build_bosses.py` (rigid parts with an `idle` clip, like the Father).
- Balance (a simple bot in starter gear, `BOSS_REPORT=1 npx vitest run src/systems/boss-fight.test.ts`): all five can be beaten by a level-10 Rosa, and hurt her.

## People
Seven ordinary people, not persuadable and not recruitable, stand around the map (`data/locals.ts`):
- **Vanya** (the tracksuit guy, squatting with sunflower seeds), **Babushka Zoya** (headscarf, two bags), **Tim** (a tourist with a selfie stick), **Oleg** (a street painter), **Tamara** (a kvass seller with her barrel), **the Sentry** (a ceremonial sentry who is not allowed to talk), **Petya** (a child with a balloon and a pigeon).
- Each has a greeting, three topics and a goodbye; one topic of most of them is a hint about something hidden (the three archangels, the pearls in the park, the lanterns, the way down the metro). The first talk gives 12 XP once; Zoya and Tamara also hand over a small gift once (tea, kvass), if the bag has room.
- They use the ordinary talk interaction and dialogue box, appear on the map as pale green dots, and block movement like other people.

## Verification
- 557 tests (new: `boss-moves.test.ts`, `locals.test.ts`, the boss cycle in the generator tests, all five bosses beatable), lint, prettier, build, `assets:check`.
- Browser: every boss in its arena on layers 10–50 (model, arena, rings and lanes), all seven locals talked to and paid, no console errors. Draw calls in the arenas 41–45.
