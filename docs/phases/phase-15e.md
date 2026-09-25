# Phase 15e — Kits and generators: walls, paving, occlusion

**Status:** ✅ Complete

## Goal
Requested after Phase 15d: the entrances themselves are fine (GUM's is fine as it was), but around the Resurrection Gate and the garden gate the Kremlin wall had gaps and overlaps with weird repeated blocks, big roofs hid the doorways, and there was bare grass between the squares and their gates. Make the pieces combine naturally, ideally with a generator like the grid algorithms used in games.

## What was wrong
- The wall was 12 + 5 + 12 identical 6 m segments dropped every 6 m: they overlapped the towers (same-height blocks fighting each other), left no tower where two wall lines meet (the south-west corner beside the gate), and ended in the middle of towers. All copies were identical.
- Red Square's paving stopped 2.5 m short of the Resurrection Gate, leaving a strip of grass under and between the gate and both squares; the way to the garden gate was a diagonal gravel band that started painted on top of the cobbles.
- The tall towers, domes and roofs sit between the fixed camera and the doorway whenever Rosa comes near, hiding her and the entrance.

## What was built

### 1. Wall kit and run assembler
- **Kit** (Blender, `_wall_piece`): four pieces with one shared cross-section: plain 6 m, 6 m with a tall arrow slit and plaque, 6 m with two buttresses, and a 3 m short piece.
- **Assembler** (`wall-runs.ts`, pure and tested): a wall is a *run* between fixed nodes. Each span between nodes is filled exactly with the fewest, least-stretched pieces (long ones preferred; a short one for remainders), in a shuffled order, with a weighted pick of long variants that never repeats the previous piece. Pieces stretch along their length only (new `Placement.stretch`), and each end reaches 15 cm into the tower.
- **Map:** the west, south and east Kremlin walls are now three runs; a new corner tower stands at the south-west corner next to the Resurrection Gate (the wall used to end there in a heap). The result: 26 wall pieces, all four kit pieces used, stretch between 0.74 and 1.31.

### 2. Ground autotiler
- **Grid:** plazas and lanes are rasterized to 1 m cells (`ground-grid.ts`); a cell is either paved or lawn. **Variants:** each 4×4 block gets one of four cobble variants and a random flip; the atlas rows stay aligned, so paving looks like patches laid by different crews rather than a repeated tile. **Kerbs:** wherever paving meets lawn, a low stone kerb is generated (one mesh), except across the mouth of an entrance.
- **Connections:** paving now runs straight through the Resurrection Gate from Red Square to Manezhnaya Square (one extra rectangle), and a paved lane (4 cells wide, centred on the gate) runs from Manezhnaya Square's east edge and straight into the garden gate. The gravel promenade starts on the garden side of the gate.
- Everything is data: adding a rectangle or lane in the map is all it takes to join two areas.

### 3. See-through fade for anything that hides Rosa
- Instanced models at least 3 m tall (in world units) whose bounding box lies on the line from the camera to Rosa fade to a 30% stipple (ordered dither on the shared material, so it costs no extra draw calls) and back within a third of a second. The gate's domes and towers ghost when she approaches from the north; inside GUM the facade ghosts and the gallery shows. Small props and distant buildings are unaffected.

## Verification
- **334 tests** (was 302): wall runs (no gaps or overlaps, deterministic, no repeated variant, stretch bounds, kit fully used, corner tower present), ground grid (rasterization, joins, kerbs, mouths left open, variants per block, UV patches), paving on the real map (unbroken through the Resurrection Gate and along the lane into the garden gate, lawn where it should be), occlusion math.
- Screenshots of both gates from both sides, the corner, and inside GUM. Draw calls peak at 62 at spawn (budget 70), 49–56 elsewhere, desktop and 375×812; no console errors from the game.

## Notes
- The four paving variants meet at 4 m block borders with unmatched vertical joints; the courses stay aligned. A wave-function-collapse pass with edge-matched tiles would remove even that, but the current result reads as natural patchwork.
- The old `cobble_tile.png` and per-plaza kerb planes were removed.
- The debug hook used while tuning the fade was removed again.
