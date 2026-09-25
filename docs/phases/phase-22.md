# Phase 22 — Endless dungeon

**Status:** ✅ Complete

## Goal
Rework the Moscow underground into **100 layers**, each generated automatically with random rooms, paths and monsters. Only the **entrance** and **exit** areas of a layer are fixed, so the stairs always sit in the same familiar place.

## Design
- **One generator, 100 layers.** `generateLayer(n)` (`src/data/maps/underground.ts`) builds a layer from a seed derived from its number, so a layer looks the same every time it is entered and every reload, and the save only has to remember the layer number. Layer 1 is the first stop below the metro pavilion; layer 100 is the bottom.
- **Fixed areas.** Every layer has the same **Landing** (entrance hall, stairs up, safe: no monsters) at the south end and the same **Stairs hall** (exit, stairs down, safe) at the north end, in the same cells on the same 2 m grid. Between them is a random middle: 3–6 rooms of random size and place, joined by 2 m corridors (a path from the landing through the rooms to the stairs, plus the odd loop), decorated with columns and paper stacks, with a random number of chests and monsters. Layers are checked in tests: the way from the landing to the stairs is always open.
- **Boss layers.** Every 10th layer (10, 20 … 100) ends in the boss arena. The Father of Corruption waits there (the story boss of the old underground), his gate opens once the layer's monsters are down, and the stairs down lie beyond the arena. He returns each time, stronger with depth; the reward (pearls and a charm) is paid once per boss layer.
- **Depth makes it harder.** Monsters get `power` from the layer: health ×(1 + 0.06 per layer), damage ×(1 + 0.025 per layer), XP ×(1 + 0.02 per layer), so layer 100 is roughly seven times as tanky and three and a half times as hard-hitting as layer 1. Deeper layers hold more monsters and elites (Chief Registrars).
- **Going up and down.** `E` at the stairs. Up from layer 1 leads to the metro pavilion; up from layer n leads to the stairs of layer n − 1; down from the last stairs leads to the next landing. A layer is generated when it is entered and its monsters are fresh each time (they do not respawn while you are in it), like the old instance rule.
- **Depth shortcut.** The deepest layer reached is saved. At the metro pavilion, after layer 1 has been reached, the door opens a small **Depth** panel: layer 1, every 10th layer reached, and the deepest layer, so nobody has to walk 100 layers twice.
- **What was kept.** The Ticket Hall is layer 1's landing (zone `ug-hall`, so "Into the Depths" still counts), "Silence the Halls" now asks to clear every monster of a layer, "End the Corruption" is the first boss (layer 10). Chests are per layer (`L12-c1`) and open once ever.
- **Save.** `SAVE_VERSION` 10 adds `dungeon.layer`, `dungeon.deepest` and `dungeon.bossLayers`; old saves are migrated (a hero underground surfaces at the pavilion, the boss counts as layer 10).

## Result
- **Generator** (`src/data/maps/underground.ts`): a 26 × 47 grid of 2 m cells; fixed Landing (rows 39–46) and Stairs hall (rows 0–7) with their doors; 3–7 random rooms in between (2–3 on boss layers), joined by 2 m corridors along the path landing → rooms → stairs plus the odd loop; a topology pass closes one-cell rock gaps and checkerboard corners (locked cells around the fixed rooms never change); every roll is checked with the game's own nav grid (landing → stairs, and to every monster and chest) and thrown away if a column or stack blocks the way. A layer takes 8–30 ms to make.
- **Runtime** (`dungeon-sim.ts`): the layer's walls and monsters are installed into the shared collision world and combat state and removed again; entering makes the layer fresh. Enemy actors, the layer scene (floors, wall instances, four lights, chests, gate), the minimap and the full map ("Depth N" in the corner, both stairs, chests, gate) all follow the current layer.
- **Difficulty**: `power` per layer (health ×(1 + 0.06 per layer), damage 42% of that, XP a third of it); a level-10 Rosa in starter gear beats the layer-10 boss with a simple bot, a level-7 one does not. At most 6 monsters to a room.
- **Chests** per layer (`L12-c1`), contents from the id: potions, sometimes pearls, gear by tier.
- **Boss rewards** per boss layer: the Registrar's Seal on layer 10, pearls plus a rotating piece of gear after.
- **Save v10** (`dungeon.layer/deepest/bossLayers`), migration from v9; a reload inside a layer restores the layer, monsters and their health.
- **Checked in the browser:** metro → layer 1 → stairs down/up (prompts, toasts), reload inside layer 2 with a wounded monster, the Depth panel (1, 10, 20, deepest), layer 20 (boss layer). Draw calls: 48 on layers 1 and 10, 62 on layer 60 and 70 (the budget) on layer 100 while standing in its biggest crowd (nine monsters within 12 m).
- 520 tests (new: 100-layer generator invariants, fixed halls identical on every layer, walkability, boss gates, layer install/swap, stairs, depth choices, boss rewards, chest loot, save v10), lint, prettier, build, `assets:check`.

## Steps
1. Enemy `power` (health, damage, XP).
2. Generator: fixed halls, random middle, boss layers, mobs, chests, decor, four lights; tests over many layers.
3. Runtime: the active layer (colliders, enemies, nav, zones, chests, gate) replaces the static underground; stairs both ways; store and save v10.
4. Rendering and maps: layer scene, enemy actors per layer, minimap and map painting per layer.
5. HUD: layer readout; Depth panel at the pavilion.
6. Quests, docs, headless run-through of several layers, performance check.

## Definition of done
- 100 layers generate quickly (< 30 ms each), are always connected, never place monsters in the fixed halls, and differ from one another.
- Walking down through several layers, a boss layer, back up, a reload inside a layer and the Depth panel all work in the browser.
- Draw calls ≤ 70 in every layer; typecheck, lint, prettier, tests, build, `assets:check`.
