# Phase 15 — Alexander Garden content

**Status:** ✅ Complete

## Goal
Make the garden worth walking through: herbs to gather, pearls hidden in it, more of the gloom to fight, and a hidden shrine tucked into the north-east corner with a reward and a place to recover. Three new quests tie it to the notice board.

## Design

### Herbs (gathering)
- Two new consumables in `src/data/items.ts`: **Rose Hip** (heals 30) and **Moon Mint** (restores 30 mana), stack 9, with icons.
- **12 herb nodes** (data in the map: `gatherables`) on the lawns: rose hips near the flowerbeds, moon mint in the shade by the lindens and hedge. Walk within 1.2 m to pick one (no button, works on touch), a chime and a toast. It regrows after 90 s (regrowth is not saved; nodes are ready again after a reload). A full bag leaves it in place with the "Bag full" toast.

### Hidden pearls
- **5 garden pearls** at fixed spots (by the grotto, behind the obelisk, beyond the east flowerbed, the far north-west corner, near the Trinity Bridge). Each can be taken **once ever** (saved), drawn as a glowing pearl on a shell. They add to the same bag pearls the pearl quests count.

### More monsters
- **7 new spawns** of the existing three enemy kinds (five spread over the far north and south of the garden, plus two guards just outside the shrine's entrance), so the garden has 10 enemies in total. Malinin and the Ukrainian Prince both stand in the middle of the garden and the 12 m no-spawn rule around NPCs applies, so the middle stays calm. Placement rules from Phase 12 apply and are tested (free ground, reachable, far from NPCs and the spawn).

### Hidden shrine (Pearl Shrine)
- A new model (`bld_shrine`, Blender, 676 triangles; filed under the `bld` budget because it is over the 300-triangle prop limit): a stone circle with two pillars, an arch of roses and a scallop-shell altar holding a glowing pearl. It stands in a **hedge nook** in the far north-east corner with a 1.6 m gap in the hedge, on the far side of the guards.
- **Discovery:** entering the nook announces "Pearl Shrine" (a zone) and gives 60 XP once (an `awarded` key).
- **Offering:** `E` (or the on-screen prompt, or a click or tap on it) within 2.8 m. The first time it gives the **Pearl Trident** and 2 pearls once ever (saved; refused with a toast if the bag is full). Every later visit restores full health and mana; if both are already full it says so and does nothing.

### Quests (data in `src/data/quests.ts`)
| # | Quest | Rank | Objectives | Reward |
|---|---|---|---|---|
| 10 | Herbalist of the Garden | 1 | Bring 3 Rose Hip and 3 Moon Mint | 60 XP, 12 rep, Healing Tea ×3 |
| 11 | The Hidden Shrine | 1 | Visit the Pearl Shrine | 50 XP, 10 rep, Cold Kvass ×2 |
| 12 | Thin the Thorns | 1 | Defeat 6 politicians | 80 XP, 14 rep, Healing Tea ×2, Cold Kvass |

The `visit` objective takes an explicit label so its text no longer names three fixed places.

### Persistence
Save version 4 adds `garden { pearlsTaken[], shrineGift }`; migration 3 → 4 adds the empty state. Parsing keeps only known pearl ids. Cloud sync includes it.

## Scope
1. Data: items and icons, gatherables, garden zones, spawns, quests, shrine placement and hedges.
2. Pure `gathering` system (radius, regrowth, one-time nodes) with tests; map tests for the new spots (free, reachable, inside the garden, shrine nook reachable through its gap only).
3. `garden-store` (taken pearls, shrine gift) and `garden-actions` (gather, discover, pray); save v4 with migration.
4. World: instanced herbs and pearls, the shrine model (Blender, ledger, manifest), shrine interaction and prompt.
5. Verification in a browser (gather, pearls, shrine discovery and offering, regrowth, reload, touch), docs, commit.

## Out of scope
Crafting or brewing, weather or day and night, new enemy models or a boss (Phase 16), herb rarity or seasons, a garden map screen.

## DoD
- Herbs can be gathered and used; regrow; a full bag loses nothing.
- Pearls are one-time and survive reloads; the shrine discovery XP and the first gift happen exactly once; later offerings heal and never waste a visit.
- The nook is reachable only through its gap; every new spawn and spot is on free, reachable ground.
- New quests work end to end; the reputation ranks are still all reachable.
- 375×812: prompts and buttons unchanged in size, no page scroll; no console errors; draw calls ≤ 70.
- typecheck, lint, prettier, tests, build, asset check pass.

## Result
- **Data:** Rose Hip and Moon Mint (`items.ts`, with icons), `gatherables` in the map (6 rose hips, 6 moon mint, 5 pearls), the shrine model and hedge nook, the `pearl-shrine` zone (listed before the garden zone so it wins), 7 new enemy spawns, and quests 10–12. The `visit` objective now carries its own label.
- **Systems (tested):** `systems/gathering` (reach, regrowth, one-time pearls, full bag), `garden-store` and `gather-sim` (state and node readiness), `garden-actions` (gather, pray, discovery hook), save v4 with migration and defensive parsing, cloud sync includes the garden.
- **World:** `Gatherables` renders herbs and pearls with three instanced meshes (pop-in growth, bobbing pearls); the shrine reuses the map's instanced placement. The notice-board interaction became a general "place" interaction (`E`, on-screen prompt, click or tap, walk-then-use) shared by the board and the shrine.
- **Sound:** a soft two-note chime when picking up a herb or pearl.
- **Tests:** 297 overall (was 274): gathering, garden actions, save v4, and map tests (everything on free reachable ground, 10 garden enemies, the nook reachable through the gap and sealed when the gap is plugged).

## Verification (headless Chromium)
- Rose hip picked by walking onto it (toast, bag), hidden pearl picked and recorded, 15 of 17 nodes left standing; entering the nook announced "Pearl Shrine" and gave 60 XP once; `E · Pearl Shrine` prompt; the first offering gave the Pearl Trident and 2 pearls; the second said "already rested"; after taking damage the offering restored health; reload kept the gift, the taken pearl and the bag; no console errors.
- 375×812: prompt is 56 px tall, tap works, no page scroll. Draw calls 36–40 in the garden.

## Notes for later phases
- The two garden NPCs (Malinin and the Ukrainian Prince) sit in the middle of the garden; any future spawn there has to respect the 12 m rule (tests enforce it).
- Herb regrowth is not saved: herbs are ready again after a reload.
- Quests 10–12 use existing rewards; new gear would need an icon (`ITEM_ICONS` is typed against `ItemId`).

