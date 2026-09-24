# Phase 4 — Village map

**Status:** ✅ Complete

## Goal
Replace the Phase 3 test scene with the real village: a walkable, collidable, data-driven map that contains everything the brief lists for the village except NPCs (Phase 5) and quest logic (Phase 9). Rosa already moves and animates (Phases 2–3); this phase makes the world she moves in.

## Village contents (from the brief)
- river (with a bridge), forest entrance (gate + trigger zone), quest board (prop only), shops (two market stalls), a small house (Rosa's), several izbas, a village square with a well, lanterns, fences, barrels, crates, log piles, spruce and birch trees.
- 8 NPCs, quests and shop interaction are **not** here (Phase 5 / 8 / 9).

## Scope
1. **Map data** (`src/data/maps/`): typed `MapData` (bounds, spawn, placements, river, paths, zones). The village is one data file; systems and rendering read it. Adding the forest/dungeon later means adding a map file.
2. **Collision** (`src/systems/collision.ts`, pure, tested): circle-vs-box / circle / capsule with push-out sliding, map bounds, footprints per asset rotated in quarter turns. Rosa is a circle (r 0.4). River = capsule chain with a gap under the bridge; bridge railings keep her on the deck.
3. **Zones** (`src/systems/zones.ts`): forest entrance trigger; HUD shows a hint when inside (real transition is Phase 10).
4. **New assets** (Blender pipeline from Phase 3): `bld_shop`, `bld_shop_herbs`, `bld_hut`, `bld_bridge`, `bld_gate`, `prop_questboard`, `prop_fence`, `prop_well`, `prop_lantern`, `prop_barrel`, `prop_crate`, `prop_logs`, `tree_birch`. All within budget, in manifest and ledger.
5. **Rendering**: ground, frozen river ribbon (ice edge + water), trampled-snow paths and square, all placements drawn with **instancing** per asset (one draw call per asset), perimeter forest ring outside the walkable bounds.
6. **Player**: spawns at the map spawn; `stepPlayer` resolves collisions (world bounds now come from the map).
7. **Cleanup**: remove `PocVillage` and the test grid.

## Layout (world units, +x east, +z south, camera looks north)
Village south of the river, forest entrance north of it.
- Bounds x ±30, z −30…28. Spawn (3, 13).
- Square + well at (0, 2); quest board north-west of the square.
- River meanders along z ≈ −14; bridge at x = 0; path continues north over the bridge to the gate at (0, −26); forest zone just beyond it.
- Shops on both sides of the square facing it; izbas around; Rosa's hut at the south end facing the square.

## Result
- **Map data** `src/data/maps/village.ts` (typed by `types.ts`): bounds x ±30 / z −30…28, spawn (3, 13), 6 izbas, 2 shops (`shop`, `shopHerbs`), Rosa's hut, well + square, quest board, bridge, forest gate, 6 lanterns, fences, barrels, crates, log piles, 20 interior trees (colliding) and a 220-tree perimeter forest (visual only), river with ice edge, 7 trampled-snow paths.
- **Collision** `src/systems/collision.ts` (box / circle / capsule push-out, bounds, quarter-turn footprints) + `map-collision.ts`. Asset footprints live in the manifest (`src/data/assets.ts`). River = capsule chain with a gap; two filler boxes and the bridge railings seal the gap edges.
- **Village traversability test** (`village.test.ts`) flood-fills the map from the spawn: the forest zone is reachable, the bridge deck is walkable, and no reachable cell lies in the river band away from the bridge.
- **Rendering**: `InstancedModel` (one draw call per mesh per asset), ribbon geometry (`ribbon.ts`, tested), `Village` scene component. Old test scene and grid removed.
- **Zone** `forest-entrance` shows a "Forest path" HUD hint (transition is Phase 10).
- **13 new assets** via `tools/blender/build_village_assets.py`, all in manifest and ledger; `npm run assets:check` passes for 16 assets. The bridge deck is flush with the ground because the river is a flat ribbon.
- **Dev aids** (DEV only): `?zoom=N` scales the camera for map overview screenshots; `window.__mq.teleport(x, z)` for deterministic browser tests.

## Verification (browser)
Scripted teleport + key-hold runs, all as expected: blocked by lantern, fence, river (north bank and mid-river), izba wall (stop at footprint + 0.4), well (r 0.95 + 0.4), gate post; slides around an izba corner; crosses the bridge, passes between the gate posts into the forest zone and stops at the map edge; west edge stops at −29.6. Mobile 375×812: joystick drives into the well and slides around it; no console errors; no page scroll.

Performance (dev build, desktop pane): 21–29 draw calls, 41–43k triangles, about 100 fps. Mobile emulation 26 draw calls, 41.8k triangles.

## Known issues / notes for later phases
- **Occlusion:** tall props (gate, izbas, trees) can hide Rosa when she stands north of them (top-down camera). Needs a fade/silhouette approach (Phase 13 polish).
- Quest board, shops, NPC positions: shop counters face the square, but no interaction points are defined yet (Phase 5 adds NPC spots and interaction ranges).
- Birch crowns read as grey blobs in shade; revisit with the polish pass.
- Not measured on a physical iPhone (Phase 14). 220 forest trees are cheap only because of instancing.

## Out of scope
NPCs, dialogue, shops UI, quest board interaction, real forest/dungeon transition, audio, water animation, dynamic lights.

## Steps
1. Collision + zones systems with tests; movement uses them.
2. Map types, village data, footprints in the asset manifest.
3. Build the 13 assets in Blender, optimize, manifest, ledger, check.
4. Instanced model helper, ribbon geometry (tested), `Village` scene component; remove `PocVillage`.
5. Zone hint in HUD, debug overlay additions.
6. Browser verification: walk around, hit every collider type (house, fence, well, river, bridge deck, gate posts, bounds), forest zone hint, desktop + mobile, frame stats.
7. Docs, commit, push, advance Task.md.

## DoD
- Rosa cannot walk through buildings, props, trees (interior), the river or map edges, but can cross the bridge and enter the gate zone. Sliding along walls works (no sticking).
- Draw calls stay low (target ≤ 45) and 60 fps on desktop; no console errors; works at 375×812.
- All new assets pass `npm run assets:check`; ledger and manifest updated.
- Collision and zone logic covered by unit tests.
