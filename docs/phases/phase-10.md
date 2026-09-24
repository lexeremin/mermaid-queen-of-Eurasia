# Phase 10 — NPCs + dialogue

**Status:** ✅ Complete

## Goal
Populate the district with 8 gloomy Russian men (fictional archetypes), let Rosa talk to them, and let her win them over: dialogue, relationship values, the heart buff, and the first version of Mermaid Aura persuasion (dialogue side). The singing Aura VFX and combat use of Aura come in Phase 12.

## The eight (all fictional, none based on real people)
| NPC | Where | Persona |
|---|---|---|
| Grisha, Gate Guard | Resurrection Gate passage, Red Square side | Guards a gate nobody uses |
| Tolik, Accordionist | Manezhnaya Square, by the fountain | Sad waltzes only |
| Lyoha, Chess Hustler | Alexander Garden bench | Hustles chess for ten rubles |
| Mikhalych, Kvass Vendor | Red Square stalls | Sells kvass nobody buys |
| Boris, Clerk of Form 27-B | outside GUM | Needs a form for every feeling |
| Sergei, Tour Guide | Red Square near the spawn | A tour for nobody |
| Arkady, Watch Seller | GUM gallery | Haggles, "genuine" watches |
| Uncle Kolya, Pigeon Feeder | Alexander Garden promenade | Named the pigeons after old colleagues |

## Design
- **Persuasion methods** (each usable once per NPC): kindness, humor, song (the Aura), silence. Each NPC reacts differently (deltas from −8 to +38). Relationship is 0…100.
- **Tiers:** below 30 gloomy, 30…59 warming, **60 and up mesmerized** (floating heart above the head), at the NPC's `joinAt` (65–75) Rosa can invite him to her kingdom (`joined`). Every NPC's best-case total is at least `joinAt` even if the player avoids every bad option (tested).
- **Dialogue engine** (`src/systems/dialogue.ts`): data-driven graph of nodes. A node is a router (`branches` with conditions), a line (text + `next`), or a menu (text + `choices`). Conditions: relationship at least/below, method unused, joined. Effects: relationship delta, mark method used, join. `buildPersuasionTree(npc)` generates each NPC's tree from his lines.
- **Interaction:** press **E** within 2.8 m; **click an NPC** (walks there, then talks); **tap an NPC** on touch (TALK button also appears in range). While a dialogue is open the simulation is paused; Esc closes it; 1–4 pick choices; Space/E/Enter continue.
- **Rendering:** each NPC is one static mesh (1 draw call) with a procedural idle bob and sway, turning to face Rosa when near. NPCs collide (circle r 0.5) so click-to-move paths avoid them.

## Scope
1. Data: `src/data/npcs.ts`, `src/data/dialogue-types.ts`, `src/data/persuasion.ts`; NPC spots in `MapData`.
2. Systems (pure, tested): `relationship`, `dialogue`, `interaction`.
3. Stores: `npc-store` (relationship, used methods, joined), `dialogue-store` (active dialogue), `game-store` gains `dialogueOpen`, `nearbyNpc`.
4. Assets: 8 NPC models (`tools/blender/build_npcs.py`, class `npc`, ≤ 1 500 tris), manifest, ledger.
5. Game: `NpcActor`, `HeartBuff`, interaction in `GameLoop` (E, click, tap, walk-then-talk).
6. UI: `DialogueBox` (portrait, name, affection bar, choices), interaction prompt, TALK button on touch.
7. Tests, docs.

## Result
- **Data:** `src/data/npcs.ts` (8 NPCs with greetings at three tiers, four persuasion methods each, invitation and joined lines), `dialogue-types.ts`, `persuasion.ts` (`buildPersuasionTree`), NPC spots in `MapData.npcs`.
- **Balance:** each NPC starts at 4–12, `joinAt` 65–70; a test asserts that picking only the positive options always reaches `joinAt` (song is the strongest method for most; Boris prefers silence and is offended by the stamp joke, -8).
- **Systems (pure, tested):** `relationship` (tiers at 30 and 60), `dialogue` (conditions, routers, effects), `interaction` (talk range 2.8 m, ground pick radius 1.4 m, ray-vs-body picking with radius 0.75 m).
- **Stores:** `npc-store` (relationship, used methods, joined), `dialogue-store` (active node, choose, close), `game-store` gets `dialogueOpen` and `nearbyNpc`; the sim stops while a dialogue is open and inventory cannot open over it.
- **World:** 8 NPC models (324–468 tris each, 7–9 KB, class `npc`), `NpcActor` (idle bob and sway, turns to face Rosa within 6 m), `HeartBuff` (floating spinning heart above mesmerized or joined men), NPC circle colliders (r 0.5) that click-walk paths avoid.
- **Interaction:** E within range; left click on an NPC's body walks over and talks (arrival triggers the dialogue); on touch, a tap on an NPC does the same and a TALK button shows when in range. Manual movement cancels the walk-and-talk.
- **UI:** `DialogueBox` (portrait, name, title, affection bar with tier markers, tier label, method-tagged numbered choices, close button; keys 1–4/5, Space/Enter/E to continue, Esc closes). Talk prompt button in the HUD.
- **Tests:** 89 in total, including NPC placement (one spot each, in bounds, on free ground, at least 2 m apart, reachable from the spawn within talking range) and the persuasion tree (routing by tier, unused methods only, effects, invitation and join, no dangling targets).

## Verification (headless Chromium)
- Full Grisha run with real key presses: E opens (prompt "E · Grisha"), song +30 → warming greeting, kindness +22 → 58, silence +15 → 73 → invitation, "Join my kingdom" → joined; reopening gives the joined line; Esc closes.
- Frozen sim while talking: position identical after holding W and clicking; unfrozen afterwards.
- Real mouse click on Sergei's body from 8 m away: walks 1 waypoint, arrives at 20.5, dialogue opens; tap on touch (375×812) does the same and tapping a choice applies kindness (+16).
- 44 assets pass `assets:check`; draw calls 50–53 in the NPC areas (NPCs add about 8), no console errors, no page scroll at 375×812.

## Notes for later phases
- Relationships and joined NPCs are not saved yet (Phase 11). `useNpcStore.reset()` exists.
- The singing Aura in dialogue is just a choice; the notes-and-rings VFX, mana cost and area effect are Phase 12.
- Joined NPCs stay in place; the kingdom feature (reputation, followers) is Phase 14.
- Dialogue text is English, one language for the slice.
- Mobile dialogue card is tall with five options; consider a compact layout in the polish phase.

## Out of scope
Persistence of relationships (Phase 11), the singing Aura VFX and mana cost (Phase 12), quests and kingdom reputation (Phase 14), NPC schedules or walking, voice or audio.

## Steps
1. Doc, types, data, systems + tests.
2. Stores, map spots, collision.
3. Blender NPC models, optimize, manifest.
4. NpcActor / HeartBuff / interaction.
5. Dialogue UI and input routing.
6. Verify (headless: talk, choices, hearts, click-to-talk, touch, collisions), docs, commit.

## DoD
- All 8 NPCs stand in reachable spots, are visible, and can be talked to by E, click and tap.
- A full run wins an NPC over: hearts at 60, invitation at `joinAt`, `joined` state, no dead ends.
- Dialogue pauses the game; Esc, numbers and touch buttons work.
- Draw calls stay ≤ 65; no console errors; works at 375×812; typecheck, lint, prettier, tests, build pass.

## Rename (after Phase 13)
NPC display names changed; ids, asset keys and save data are unchanged. Sergei → Sergey, Mikhalych → Sasha Prince (now a Kefir Seller, dialogue updated), Arkady → Gumelnik, Grisha → Maksim, Tolik → Vitalik, Lyoha → Malinin, Boris → Polish Prince, Uncle Kolya → Ukrainian Prince. Older sections of this doc use the original names.
