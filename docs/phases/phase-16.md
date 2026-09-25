# Phase 16 — Moscow underground + boss

**Status:** ✅ Complete

## Goal
The slice's finale: a metro-palace beneath Manezhnaya Square with three rooms of monsters and loot, a locked boss arena, and the boss, the Great Registrar. Beating it completes the Phase 12–16 combat loop and gives the quests something to lead to.

## Design

### Where it is (architecture)
- **One world, a distant region.** The underground is built in the same world and the same `MapData`, in a region south of the surface (z 100 to 194, same x range). Everything already works there unchanged: collision, pathfinding, enemies, zones, saves (Rosa's position is saved like anywhere else). The surface bounds grow to include it; a thick blocker collider stops anyone walking into it from Manezhnaya Square, and the surrounding trees skip it.
- **Transitions are teleports with a fade.** A metro pavilion on Manezhnaya Square is the way down (`E`, prompt, or tap); stairs in the first room are the way up. The screen fades to black, Rosa is moved, the scene mood changes, and it fades back.
- **Mood.** While Rosa is in the underground zone the sky, fog and lights blend to a dark, warm torch-lit palette (a few point lights exist only while she is down there). The roof is left off so the camera sees in; walls are 3.6 m and fade see-through when they hide her (Phase 15e).
- **Fainting** in the underground revives Rosa at the underground start (a checkpoint per region), not on the surface.

### A generated level (`src/data/maps/underground.ts`)
The level is described as a small spec of rooms, corridors and features on a 2 m grid, and everything is generated from it, like the wall runs and paving: floors, walls (every floor edge next to rock becomes a wall run, filled by the wall assembler with a dark-brick kit), colliders, columns, lights, spawns and the dark rock floor around it. A test flood-fills the result from the arrival point.

| Part | Size | Contents |
|---|---|---|
| Room 1, Ticket Hall (south, arrival) | 20 × 16 m | 3 enemies, a chest, the stairs up |
| Corridor | 4 × 6 m | |
| Room 2, Grand Platform Hall | 28 × 20 m | columns in rows, 5 enemies, a chest |
| Corridor | 4 × 6 m | |
| Room 3, Records Cellar | 20 × 16 m | 3 enemies plus the **Chief Registrar** (elite), a chest |
| Boss corridor and **gate** | 4 × 6 m | glowing seal door |
| Boss arena (north) | 24 × 24 m, corners cut | 4 columns for cover, the boss and 4 dormant helpers |

### Loot and the key
- **Chests** (3, one per room, opened by walking up to them, once ever, saved): the first gives potions, the second gear, the third a rare charm.
- The **Chief Registrar** always drops the **Registrar's Stamp** (key item). With it in the bag, `E` at the gate opens it for good (saved); without it the gate says what is missing.

### The boss: the Great Registrar
An original satirical caricature (no real person): a towering golem of ledgers in a pinstripe waistcoat, a monocle, a crown of rubber stamps and an enormous stamp for a fist. Name in game: **Father of Corruption**.
- **Stats:** 900 HP, radius 1.6 m, slow (1.6 m/s), Aura blinds him for only a quarter of the usual time. A large health bar with his name appears at the top of the screen while he is engaged.
- **Phase 1 (above 60%):** *Stomp*: a red circle grows around him for 1.0 s, then hits for 32 within 5.5 m. *Stamp slam*: a circle marks where Rosa stands, lands 1.1 s later for 38. *Paper darts*: a fan of five darts (12 damage each).
- **Phase 2 (60% to 30%):** adds a *Summon* (wakes up to 2 of the 4 dormant helpers) and a *Paper storm* (two rings of 12 darts flying outward, 10 damage each).
- **Phase 3 (below 30%):** *Form 27-B*: three red rectangles telegraphed for 1.4 s, 42 damage. Everything is 30% faster and the pauses between moves shrink.
- **Rules:** he only wakes when Rosa is in the arena; if she faints or leaves he walks back and heals. Once beaten he stays beaten (saved).
- **Rewards:** 400 XP, 5 pearls, the **Registrar's Seal** charm (+40 health, +2 mana per second, +10% damage), and a big toast.

Hazards (telegraphed circles and rectangles) are a new generic part of combat (`hazards` in the combat state), so future enemies can use them.

### Quests and persistence
- **Objective kind `flag`** (dungeon flags): three new quests, all of rank 2 or 3: *Into the Depths* (visit the underground), *The Registrar's Stamp* (flag: stamp found), *Tear Up the Paperwork* (flag: boss defeated).
- **Save v5** adds `dungeon { stampFound, gateOpen, bossDefeated, cachesTaken[] }`. Events: `underground_entered`, `boss_defeated`.

## Scope
1. Level generator, kit walls (generalized assembler), map integration, tests.
2. Assets in Blender: metro pavilion, stairs, dark-brick wall pieces, column, boss gate, chandelier, paper stack, the boss.
3. Mood switching, fade transitions, places (metro, stairs, gate), checkpoint revive.
4. Dungeon store, save v5, chests, the Registrar elite and key, the gate.
5. Boss brain, hazards, adds, HP bar, drops.
6. Quests with `flag` objectives.
7. Verification in the browser (down, fight through the rooms, open the gate, beat the boss with the real controls), docs, commit.

## Out of scope
Audio and music for the underground and the boss, more than one boss, Mermaid-form combat changes (Phase 17), a minimap, a second dungeon.

## DoD
- Rosa can go down, fight three rooms, get the stamp, open the gate, defeat the boss and come back up; fainting and reloading behave.
- Boss phases, telegraphs, helpers and the health bar work, and the fight is beatable at level 5 with the starter gear (headless run).
- The generated level is fully connected (tested); the underground cannot be reached on foot from the surface.
- Draw calls stay ≤ 70 on the surface and in the underground; no console errors; 375×812 layout unchanged.
- typecheck, lint, prettier, tests, build, asset check pass.

## As built
- **Level generator** (`src/data/maps/underground.ts`): rooms and corridors on a 2 m grid; walls are the boundary of the floor cells, merged into runs and filled by `assembleWallRun` with the new `UNDERGROUND_KIT` (the assembler now takes a kit). Horizontal runs reach one wall thickness past a convex corner and stop one short at a concave one, so corners close with no overlap. Tests flood-fill the result: every room, chest and spawn is reachable, the arena is not reachable while the gate is shut, and the surface cannot reach the underground on foot.
- **Region:** z 100 to 194 (bounds now reach z 200), a 24 m solid block between it and Manezhnaya Square, trees skip it. The underground floors and lights are only mounted while Rosa is down there (`useGameStore.underground`, set by the game loop from her position). Floors are merged into one mesh per group, so the underground costs about 40 to 52 draw calls.
- **Mood:** `AtmosphereRig` blends sky, fog, hemisphere and sun by position (`mood.k`); the camera snaps on a teleport.
- **Transitions:** `travelTo` fades to black (the sim waits), moves Rosa and fades back. Fainting underground revives her at the foot of the stairs.
- **Metro pavilion** stands on Manezhnaya Square at (25, 65.5), mouth toward the camera; `E` at its door goes down, `E` at the stairs goes up.
- **Enemies:** new kinds `registrar` (elite: 260 HP, radius 1.1, 1.4x scale, drops the stamp, respawns like the rest) and `boss`; `Enemy` gained `dormant`, `helper` and `brain`. Dormant helpers are pre-created spawns that cannot be hit or targeted until woken; helpers and the boss never respawn.
- **Boss** (`src/systems/boss.ts`, pure and tested): a state machine over `MOVES` per phase; only fights while Rosa is inside the arena; leaving or fainting makes him walk home, heal and forget the fight; never staggered by hits. Aura blinds him for a quarter of the time. His moves emit `hazards` and darts; hazards (`src/systems/hazards.ts`) are a generic combat feature (circle or oriented rectangle, telegraphed, land once, dash i-frames dodge them).
- **Balance:** a bot that steps out of every marked hazard and never drinks a potion wins at level 5 with starter gear in about 30 s with roughly 45% of its health left, and only just wins at level 1 (test in `src/systems/boss-fight.test.ts`; `BOSS_REPORT=1` prints all levels). Real players take more hits, so the fight is meant to cost potions.
- **Loot:** chests open by walking up (once ever, saved, refuse when the bag cannot hold them): hall potions, platform Silver Trident and pearls, cellar Songbird Whistle and tea. The boss drops 400 XP (through the kill), 5 pearls and the Registrar's Seal on the floor (the magnet only pulls what fits the bag).
- **Quests:** new objective kind `flag` (`stampFound`, `gateOpen`, `bossDefeated`); *Into the Depths* (rank 2, visit the Ticket Hall), *The Registrar's Stamp* (rank 2), *Tear Up the Paperwork* (rank 3).
- **Save v5:** `dungeon { stampFound, gateOpen, bossDefeated, cachesTaken }` (migration 4 to 5; a beaten boss implies an open gate and a found stamp). Events: `underground_entered`, `chest_opened`, `gate_opened`, `boss_defeated`.
- **Assets** (`tools/blender/build_underground_assets.py`): four wall pieces, column, boss gate, chandelier, paper stack, stairs, metro pavilion, boss (888 tris, rigid parts with `idle`). Chests and the hazard markings are drawn in code.

## Verification
- Headless Chromium (desktop and 375 x 812 touch): metro prompt and fade, arrival, all three chests, the Chief Registrar killed with real attacks and the stamp collected, the gate refusing and then opening, walking through with `W`, the boss waking, phases, the victory banner and rewards, reload keeping everything (boss down, gate open, position underground), fainting underground and getting up at the stairs. No console errors.
- Draw calls: 61 on the surface at spawn, 41 to 47 at the metro and the arrival hall, 52 in the boss arena (limit 70).

## Follow-up (16b): changes requested after the first version
- **No ceiling fixtures:** the chandeliers are gone (asset removed); the warm light pools stay so the halls are still readable.
- **The boss is the Father of Corruption** (name, health bar, banner, quests, docs).
- **Loot is much rarer** (roughly a third of the old chances; gear a few percent; the Chief Registrar still drops well). Chests and the boss reward are unchanged.
- **Enemy health bars are always visible** (larger, drawn on top) for every awake monster, not only after a hit.
- **No stamp, no seal:** the Registrar's Stamp and its quest are removed. The boss gate opens by itself as soon as every monster of the three halls (11 monsters and the Chief Registrar) is defeated, with a toast.
- **Instanced monsters:** underground monsters never respawn on a timer. When Rosa leaves by the stairs and goes down again, all of them refill, the helpers go back to sleep and the gate shuts (a beaten boss stays beaten and his gate stays open). The gate state is not saved; `hallsCleared` and `bossDefeated` are (milestones for quests).
- **Quests:** *Silence the Halls* (flag `hallsCleared`) and *End the Corruption* (flag `bossDefeated`); old ids migrate.
- **Quest items take no bag space:** items of kind `keepsake` (pearls) live in a counted tally next to the bag, are always picked up, are shown in a "Quest items" strip in the bag, and count for `collect` objectives. Older saves move pearls out of the bag on load.
- **Save v6:** `progress.keepsakes`, `dungeon { hallsCleared, bossDefeated, cachesTaken }`, migration 5 to 6 (the stamp era counts as cleared halls, renamed quests).
- **Blink (T, "BLINK" on touch):** a new ability like the Wizard's Teleport in Diablo 3: instantly moves Rosa toward the mouse cursor (or the way she moves or faces on touch), up to 14 m, over walls and props, 20 mana, 6 s cooldown, a moment of invulnerability, bubbles at both ends. It only lands where she could walk to (`NavGrid.sameRegion`), so it cannot skip the shut boss gate or enter the underground from the surface; if the aim is blocked it lands on the nearest free spot toward her.
