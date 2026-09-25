# Phase 21 — Archangels

**Status:** ✅ Complete

## Goal
A quest line about three lost children: **Michael**, **Gabriel** and **Serafima**, the small winged archangels, children of Rosa and Prince Sasha. Each hides somewhere in the world, talks to Rosa with a prompt of their own, and once Rosa answers it right they are saved with happy sounds and count for the quest "Save the Archangels".

## Design
- **The children.** Fictional, drawn as small chibi figures with a halo, feathered wings that flap (`idle`) and a joyful `happy` clip, and a prop each: Michael a wooden sword and shield, Gabriel a little trumpet and a lily, Serafima six wings and a small flame. Built in Blender from `tools/blender/build_archangels.py` (rigid parts, the same pipeline as the companion), ≤ 1 500 triangles each.
- **Where they hide** (all on the Red Square map, reachable by walking or swimming):
  - Michael: in the far north-west nook of Red Square, between the fir tubs and the GUM wall, in the shadow of Saint Basil's.
  - Gabriel: at the south end of the GUM gallery, among the kiosks.
  - Serafima: on the far bank of the Moskva (a 4 m strip of land at z -61.6); Rosa has to swim across from the garden (she turns into a mermaid on her own). A test checks that every path from the spawn to her crosses water.
  They do not appear on the minimap until they are saved.
- **Talking.** They use the normal talk interaction (`E`, click or TALK) and the existing dialogue box. Each has a unique intro and a unique prompt with three answers: one is the warm answer, the others are gentle, funny mistakes and the child asks again (nothing is lost). The right answer saves the child: the joy jingle plays, a toast appears, the child hops and flaps (`happy` clip) and keeps hearts around them. Afterwards they have a happy line to say whenever Rosa comes back.
- **The quest.** "Save the Archangels" (rank 2, Favorite of Moscow) has one objective, `save 3`, counted from the children already saved, so saving them before accepting the quest still counts. Reward: XP, reputation and the **Archangel's Feather** charm.
- **Sounds.** A new synthesized `joy` sound (a bright arpeggio and a giggle of quick rising chirps), no sample files.
- **Save.** `SAVE_VERSION` 9 adds `archangels: { saved: string[] }` (migration 8 → 9 adds an empty list); it goes to the cloud with the rest of the progress.

## Result
- Models: Michael 880, Gabriel 884 and Serafima 1 096 triangles, about 31–36 KB each. A child adds about 10 draw calls while on screen (one per rigid part); at their spots the frame stays at 44–59 draw calls.
- Headless playthrough: all three found, talked to with `E`, a wrong answer loops back to the prompt, the right one saves (`joy` sound each time, toast "Michael is safe! (1/3 archangels)", hearts above the child, `happy` clip for 4.5 s); the state survives a reload and each child then says the "after" line.
- 495 tests (new: dialogue trees, spots, saving, quest, sound recipe, save migration and round trip), lint, prettier, build, `assets:check`.

## Steps
1. Blender builder and three models, optimize, manifest and ledger rows.
2. Data: `archangels.ts` (lines, answers, spots, tree builder), dialogue conditions/effects `saved` and `save`, speaker lookup for the dialogue box and HUD.
3. State: `archangel-store`, save v9, `saveArchangel` action, quest objective `save`, WorldView, new item.
4. World: map spots, collision, `ArchangelActor`, hint in the HUD, sfx `joy`.
5. Tests, headless run-through of all three, docs.

## Definition of done
- All three can be found, talked to and saved; a wrong answer loops back; the state survives a reload and old saves load.
- The quest tracks 0/3 → 3/3 and can be claimed at the notice board.
- Models within budget, draw calls ≤ 70, typecheck, lint, prettier, tests, build, `assets:check`.

## Follow-up: finding the children (after playtest)
A playtester found only one of the three. Two things made the others easy to miss: the quest that lists where they hide needed rank 2, and a child at the south end of the GUM gallery stands off screen (south of Rosa, the camera looks north) until she is almost on top of them. Now:
- **Save the Archangels is on the board from the start** (rank 0).
- **A golden shimmer** rises from each unsaved child.
- **A nudge the first time Rosa comes near one** (about 22 m, 28 m for Serafima across the river): a soft chime and a line ("A tiny trumpet toots, off-key, somewhere close by...").
- **The map** shows a pulsing gold question mark for an unsaved child within 45 m; saved children keep their gold dot.
