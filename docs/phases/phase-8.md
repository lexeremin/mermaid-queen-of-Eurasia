# Phase 8 — Real layout + detailed GUM

**Status:** ✅ Complete

## Goal
Re-lay Red Square with the buildings in their real relative positions, and make GUM a detailed, walkable building. Manezhnaya Square and the Alexander Garden follow in Phase 9 on the same map.

## Real relative positions (rotated 180° from real north)
The camera looks "up" the screen. The map is rotated 180° from true north so the camera looks toward St. Basil's and tall buildings sit behind the player. Rotation preserves handedness: standing at the museum end looking toward St. Basil's, the **Kremlin wall is on the right and GUM on the left**.
| Real | In the game map |
|---|---|
| St. Basil's (south end of the square) | far end (z ≈ −37), left of Spasskaya |
| Spasskaya clock tower (south end of the Kremlin wall) | right side, far end (15, −29) |
| Kremlin east wall with Senate tower in the middle | right side, x = 15 |
| Nikolskaya tower (north end of the wall) | right side, near end (15, 29) |
| GUM (east side, full length) | left side, x −30…−14 |
| State Historical Museum (north end) | near end, center (0, 36) |
| Kazan Cathedral (north-east corner, GUM side) | near end, left (−12.5, 34.5) |
| Resurrection Gate (north-west corner, Kremlin side, leads to Manezhnaya Square) | near end, right (10.5, 33.5) |
| Moskva river (south of St. Basil's) | far beyond the cathedral (backdrop only) |
| Kremlin interior (cathedrals, Ivan the Great bell tower) | right of the wall, visible over it (backdrop) |
| Lenin Mausoleum | **omitted**; blue spruces and benches along the wall instead |

The invented canal from Phase 6 is removed (Red Square has no river through it).

## GUM (detailed)
- **Facade** (`bld_gum_facade`, 3 modules × 18 m along the square): stone and blush pilasters, three floors of windows (ground floor lit), string lights, a tall arched **portal** in each module (3 entrances at z = −18, 0, 18), pediment with a clock, green-tented turrets, 5 m deep so each entrance is a short vestibule.
- **Gallery** (walkable, x −27…−19, z −27…27): glass roof (translucent, see the interior from above) on iron ribs, two iron bridges, **fountain** in the center, kiosks, benches, planters, shop-front walls along the west side with lit windows and awnings.
- **End turrets** at both ends of the facade. Warm interior floor, 2 warm interior lights.
- Zone `gum` shows "GUM" in the HUD.

## Scope
1. Palette check, `prism_xz` helper in `tools/blender/lib.py`.
2. **New assets:** `bld_gum_facade`, `bld_gum_turret`, `bld_gum_wall` (storefront wall), `bld_gum_ribs` (iron roof ribs), `bld_gum_bridge`, `prop_fountain`, `prop_kiosk`, `prop_bench`, `bld_kazan`, `bld_resurrection_gate`, `lmk_kremlin_inside`. Retire `bld_gum` (old segment).
3. **Map data** `red-square.ts` rewritten with the real layout; `MapData` gains optional `floors`, `glass`, `lights`; `river` becomes optional (Moskva backdrop ribbon only).
4. **Rendering:** `MapScene` draws floors, translucent glass roofs and interior lights.
5. **Resurrection Gate** passage is present but closed by an iron gate until Phase 9.
6. **Tests:** flood fill from the spawn reaches the far end, every GUM portal, the gallery around the fountain, and the gate; fountain, kiosks, facade blocks and towers block.
7. Docs, ledger, budgets.

## Result
- **Map** `src/data/maps/red-square.ts` rewritten with the real relative layout (see table): bounds x −28…13.2, z −30…30, spawn (0, 24). Backdrop outside the bounds: St. Basil's (−3, −37), Moskva ribbon (z ≈ −52), museum, Kazan-style cathedral, Resurrection Gate, 13 Kremlin wall segments, two Kremlin-interior skyline clusters; three Kremlin towers (Spasskaya-, Senate- and Nikolskaya-position) collide.
- **GUM:** 3 facade modules with portals at z −18 / 0 / 18, 2 end turrets, storefront wall, 9 iron roof-rib modules, translucent glass roof (`glass` in `MapData`), 2 iron bridges, fountain, 4 kiosks, 4 benches, 2 planters, warm floors and 2 warm interior lights; zone `gum`.
- **Plaza:** Rosa's lodge, 8 market stalls in two rows, barrels/crates, 10 lampposts, fir tubs, flower beds, blue-spruce row and benches along the Kremlin wall, quest board.
- **Assets:** 11 new (GUM facade 1 456 tris, turret 220, wall 456, ribs 372, bridge 240, fountain 210, kiosk 96, bench 48, Kazan 528, Resurrection Gate 452, Kremlin interior 2 164). Old `bld_gum` retired. 31 assets in total, all pass `assets:check`. The facade uses 97% of the `bld` triangle budget.
- **X-ray silhouette** (`src/game/assets/xray.ts`): Rosa's visible pixels write the stencil buffer; a pink twin mesh renders only where she is hidden (depth greater, stencil not equal), so she shows through roofs, walls and gates. Needs `gl={{ stencil: true }}`. Solves the top-down occlusion problem for the hero (NPCs can reuse `applyHeroLook`).
- **Tests:** rewritten `red-square.test.ts` (spawn, both ends, all three portals, gallery around fountain and kiosks, solid blocks, Kremlin wall unreachable, real relative positions of the buildings). 57 tests.
- Retired from the previous phase: the invented canal, bridge usage, garden gate placement (assets kept for Phase 9: `archBridge` becomes the Trinity bridge, `gardenGate` a garden entrance).

## Verification
- Headless Chromium renders (Playwright in a scratch folder): overview, wide view, portal shot, 375×812 with touch controls. 45 draw calls (48 at mobile size), 47–55k triangles, no console errors.
- Scripted walks (teleport + key hold): north along the square, west through a portal into GUM (fountain deflects her, zone `gum`), blocked by a facade wing (x −13.6), gallery flower bed (z −11.4), map edge (z 29.6, x 12.8), Kremlin-side tower (x 12.4), Rosa's lodge (z 23.15).
- Note: the desktop pane froze when the app window was hidden; the game auto-pauses on `visibilitychange` by design.

## Known issues / notes
- The Resurrection Gate is beyond the walkable bounds (z 32–35), so the way to Manezhnaya Square is not open yet; Phase 9 extends the bounds through it.
- Draw calls are at 45–48; remaining budget is about 5. Merge small props or share meshes if Phase 9 needs more.
- Kremlin interior clusters are simplified and reused twice.

## Out of scope
Manezhnaya Square and the garden (Phase 9), NPCs, shop UI, floor 2 walkable, drizzle.

## Steps
1. This doc; helpers; build assets in Blender; look at the key ones.
2. Optimize, manifest, ledger.
3. Map data, `MapScene` additions, tests.
4. Verify with headless Chromium (overview, gameplay, gallery, mobile) + scripted walks.
5. Commit, push, advance.

## DoD
- Layout matches the table above; Rosa can walk into all three GUM portals, around the fountain and out again; solid facade parts, kiosks, fountain, towers and the closed gate block her.
- Interior is visible through the glass roof; draw calls ≤ 50; no console errors; works at 375×812.
- All assets pass `assets:check`; traversability test passes.
