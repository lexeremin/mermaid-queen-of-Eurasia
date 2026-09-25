# Phase 15b — Environment polish

**Status:** ✅ Complete

## Goal
Requested after Phase 15: stop the GUM store from flickering and make the existing environment (ground textures, buildings, props) look more finished.

## Findings and changes

### The flicker: coplanar faces (z-fighting)
- **Cause:** the models are built from boxes with flat palette colors, and details (windows, trim, panels) were drawn exactly flush with the surface behind them. Two faces on the same plane with different colors fight for the depth buffer, so which one shows changes with the camera position and the pattern shimmers as you move. An analyzer that placed every model in world space found 290 such pairs on the GUM facade alone (about 556 m² of flush overlap), and more on the Kremlin wall (1044 pairs), the GUM back walls and the towers.
- **Fix, once, in the pipeline:** `Part.separate_coplanar()` (`tools/blender/lib.py`) lifts the later face of each overlapping different-colour pair by 6 mm per layer along its normal (boxes share vertices, so nothing cracks). All 35 environment models were rebuilt and optimized. The analyzer now reports none on the GUM facade, walls, towers, gates, shops and props; a few angled facets on Basil's domes and the spruce cones (under 1 m² in total) remain and are nearly parallel rather than coplanar.
- Depth precision was already fine (camera near 1, far 200), so no camera change was needed.

### Ground textures
- **Shimmer:** both tiles used nearest sampling with no mipmaps, so the fine grass speckle and grout aliased when the camera moved. They now use nearest magnification (still pixel-crisp up close) and mipmapped, anisotropic (8×) minification.
- **Art:** tiles are 64×64 (less repetition: 4 m cobble, 6 m grass). Cobbles are irregular stones in a running bond, each with its own tone, a lit top edge, a shaded bottom edge, occasional dark flecks and moss in the grout. The grass has soft clumps of three greens with short blades and a few flowers.
- **Kerb:** every plaza gets a light stone kerb (35 cm) so the cobbles no longer stop in a hard cut into the lawn.

### Grounding objects
- **Contact shadows** (`ContactShadows`): soft dark discs under trees, lampposts, stalls, benches, barrels, flowerbeds, hedges, the fountain, kiosk, obelisk and hut, as one instanced mesh (one draw call), sized per asset and turned with each placement.

### GUM gallery camera
- The roof ribs and the iron footbridges sat between the camera and Rosa and blocked the view of the gallery. They now hide while Rosa is inside the gallery zone (the glass roof stays), so the fountain, kiosk, benches and Rosa are clearly visible.

## Verification
- Analyzer before and after (coplanar different-colour overlaps per asset); before/after screenshots of the facade, gallery, Kremlin wall, gate and lawn; 297 tests, typecheck, lint, prettier, build and the asset check pass.
- Draw calls in the browser: 59 at spawn, 41–48 elsewhere (budget 70), on desktop and at 375×812. No errors from the game; the only console messages are three.js's Clock deprecation notice and the software renderer's read-pixels notice.

## Notes
- The raw models live in the git-ignored `assets-src/`, so the analyzer is not part of the test suite; the fix is in the build pipeline and documented in `docs/asset-pipeline.md`.
- Characters (Rosa, NPCs, enemies) were not rebuilt; they are made of separate rigid parts with few flush details.
- Real-time shadows were not added: they would double the draw calls past the budget. Contact shadows give most of the grounding for one draw call.
