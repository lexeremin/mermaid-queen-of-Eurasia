# Phase 9 — Manezhnaya Square + Alexander Garden

**Status:** ✅ Complete

## Goal
Extend the same contiguous map along the real route: Red Square → Resurrection Gate → Manezhnaya Square → Alexander Garden, with the Kremlin in between. The garden is **not** reachable from Red Square directly: it lies outside the Kremlin's west wall, on the far side of the Kremlin.

## Real geography (game map is rotated 180° from real north; see Phase 8)
- The **Resurrection Gate** at the near end of Red Square opens onto **Manezhnaya Square**, which lies north of the Kremlin's north wall (game: south of the gate, z > 37).
- The Kremlin's **north wall** forms the square's edge (game z = 36, x 15…45); its corner ends at the Corner-Arsenal-position tower.
- The **Alexander Garden** runs along the outside of the Kremlin's **west** wall (game x 45.6…62), from Manezhnaya Square northwards (game −z). The **Trinity Tower** is in that wall; **Kutafya Tower** stands in front of it, joined by the **Trinity Bridge** over the old Neglinnaya stream.
- **Manege** hall lies west of the garden entrance (game: east, beyond the garden). Okhotny-Ryad-style mall to the north of Manezhnaya (game: south backdrop).
- Kremlin interior skyline (Phase 8 clusters) stays visible over the wall.
- Left out on purpose: the Tomb of the Unknown Soldier and Eternal Flame (a solemn memorial), state emblems, the Mausoleum.

## Scope
1. **New assets** (`tools/blender/build_garden_assets.py`): `bld_kutafya` (round white gate tower), `bld_manege` (long classical hall), `bld_grotto` ("Ruins" arcade), `prop_obelisk`, `prop_hedge`.
2. **Map**: bounds extend to x −28…62, z −30…76. The Kremlin block, the museum block and the corridor through the Resurrection Gate are set with colliders. New content: Kremlin north wall + corner and Trinity towers, west wall facing the garden, Manezh fountain, benches, lampposts, flower beds, market stalls, lindens; garden promenade (gravel), garden gate, Kutafya + Trinity Bridge + pond, grotto, obelisk, hedges, lawns, avenue of lindens and spruces.
3. **`MapData` refactor:** `river` → `waters` (list; Moskva and the Neglinnaya pond), `plaza` → `plazas` (list; Red Square and Manezhnaya cobble). `paths` used for garden gravel.
4. **Zones:** `manezh` ("Manezhnaya Square"), `alexander-garden` ("Alexander Garden"). The HUD zone label now shows for 3 seconds after entering instead of staying on screen.
5. **Tests:** flood fill from the spawn reaches the gate passage, Manezhnaya Square, the garden entrance, the whole promenade, grotto and obelisk; the Kremlin block, the pond and the walls stay out of reach; the bridge deck is walkable; the real relative positions (gate → Manezh → garden route; garden on the far side of the Kremlin) are asserted.
6. Docs, ledger.

## Result
- **Bounds** x −28…62, z −30…76. Colliders: a Kremlin block (x 13.2…45.4, z −30…37.3) so the garden is only reachable via Manezhnaya Square, and a museum block behind the museum and Kazan Cathedral, leaving the gate passage (x 6.95…11.05) open.
- **Manezhnaya Square** (cobble, 40 × 40): fountain (scaled Manezh-style), 4 market stalls, benches, lampposts, flower beds, lindens; Kremlin north wall with crenellations and a corner tower on its Kremlin side; museum and Resurrection Gate behind; Okhotny-Ryad-style mall (two GUM facade modules) as the far backdrop.
- **Alexander Garden** (x 45.6…62): gravel promenade (z −28…42) with a branch to the grotto, lindens and spruces on both sides, benches, lampposts, flower beds, hedges along the wall, obelisk on the west lawn, grotto arcade (x 59.5), garden entrance gate at (53, 40), Kremlin west wall with towers on the left, Manege hall as backdrop beyond the garden.
- **Kutafya + Trinity Bridge:** Trinity Tower in the wall (44, 28), stone bridge over the Neglinnaya pond (x 48) to a pocket by the tower (dead end), Kutafya Tower at (57.5, 28). Pond capsules leave a gap for the deck; bridge railings seal it.
- **New assets:** `bld_kutafya` 398 tris, `bld_manege` 460, `bld_grotto` 456, `prop_obelisk` 78, `prop_hedge` 24. 36 assets, all pass `assets:check`.
- **Refactor:** `MapData.river` → `waters` (list), `plaza` → `plazas` (list). HUD zone banner now animates in and out by CSS (3.2 s) instead of staying on screen. Gravel path color warmed for summer.
- **Tests:** flood fill reaches the gate passage, Manezhnaya Square, the garden entrance, the whole promenade, grotto, obelisk and the Trinity Bridge pocket; pond, fountain, Kutafya, obelisk and the Kremlin block stay unreachable; the real relative positions (Manezh beyond the gate, garden on the far side of the Kremlin's west wall, Manege beyond the garden) are asserted. 58 tests.

## Verification
- Headless Chromium renders (garden, Manezhnaya, Kutafya/bridge corner, 375×812): no console errors; 38–56 draw calls, 68–78k triangles.
- Scripted walks: south through the gate (z 41.3, zone `manezh`), north into the Kremlin wall (z 37.7), over the bridge into the pocket (x 46.5), pond edge (x 50.0), promenade far end (z −29.6), east bound (x 61.6), grotto (x 57.4), Kutafya (x 54.3).

## Notes
- Draw calls reach 56 on Manezhnaya (target ≤ 60). If the iPhone pass (Phase 19) needs it, merge props into per-area meshes or cull by zone.
- Garden gameplay (herbs, pearls, monsters, shrine) is Phase 15; the pocket by the Trinity Tower is a natural spot for the hidden shrine.
- The Tomb of the Unknown Soldier and Eternal Flame are intentionally not modeled.

## Out of scope
Garden gameplay (herbs, pearls, monsters, shrine: Phase 15), NPCs, the Tomb of the Unknown Soldier, water animation.

## Steps
1. Doc; refactor `MapData` (`waters`, `plazas`); zone label timer.
2. Build the 5 new assets; optimize; manifest; ledger.
3. Map data; colliders; paths.
4. Tests; headless renders; scripted walks along the whole route.
5. Commit, push, advance.

## DoD
- Rosa can walk spawn → gate → Manezhnaya Square → garden entrance → the length of the promenade, and cannot enter the Kremlin, cross the pond except on the bridge, or leave the map.
- Garden reads as a park (lawns, paths, lindens); Manezhnaya reads as an open cobbled square; Kutafya, Trinity Bridge, grotto, obelisk and Manege are recognizable.
- Draw calls ≤ 60 (desktop about 100 fps; iPhone measured in Phase 19); no console errors; works at 375×812.
- typecheck, lint, prettier, tests, build, `assets:check` pass.
