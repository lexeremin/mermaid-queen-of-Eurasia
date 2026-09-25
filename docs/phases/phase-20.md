# Phase 20 — Visual polish

**Status:** ✅ Complete

## Goal
Requested after Phase 18: fix parts that stick out of buildings and objects, make shapes and textures rounder and softer. Performance stays first: no new draw calls, and the visible triangle count grows only a little.

## Findings
- **Details float or poke out on round forms.** Windows, plates and ornaments are boxes placed at the *circle* radius of a drum or tower, but the drums are 8-sided prisms whose flat faces sit at 92% of that radius (and their corners at exactly 100%). So a black window slit on Saint Basil's drums, on the Kremlin tower and on the garden gate hangs 5–15 cm off the wall or pokes through it. The same happens on stalls (counter beam), GUM (gold panels, arch trim) and trees (ornaments hanging in the air next to the crown).
- **Everything is a hard-edged box** and every cone is faceted, so domes, drums, trees, barrels and lamp posts look like crystals instead of soft toys.
- **Ground textures are crisp pixel noise** (nearest magnification, hard-edged stones).

## What changed
1. **Plate audit and repair (`tools/blender/lib.py`, `Part.embed_details`).** After a part is built, every thin plate (window, door, panel, plaque, trim: a box at most 20 cm thick) is checked with rays from its back face against the rest of the model.
   - A plate that floats off the wall is moved onto it (up to 15 cm).
   - A plate whose corners hang in the air (a flat plate on a faceted drum) gets its back face stretched into the wall.
   - A plate that lies on a wall (its front side is open air, nothing overhangs) is **sunk to stand 2 cm proud** instead of 6–16 cm, so windows, doors and panels read as painted on the wall instead of glued on. Cornices, ledges and awnings (plates that overhang) and slabs inside a body (brick courses) are left alone.
   - `build_environment.py` prints, per asset, how many plates were fixed and the worst gap before the fix. Over the 47 environment models the audit fixed 302 plates (166 of them sunk as flat decals); 62 plates have no surface behind them at all (stall boards, bench slats, bridge decks) and are left as they were.
2. **Rounder shapes.**
   - Boxes with a thinnest side of 0.9 m or more get a chamfer (`bevel="auto"`, 15% of the thin side, at most 7 cm; `bevel=` overrides per box, `Part(auto_bevel=False)` for `bld_gum_facade`, which sits at 2 120 of 2 200 triangles). The chamfer faces share the box colour, so nothing bleeds between palette cells.
   - Cones and drums with 6 or more sides are smooth-shaded (the caps and rims stay crisp) and get more sides as they get wider: 10 from 0.4 m radius, 12 from 0.8 m (`round_segments`; trees are exempt, `Part(more_segments=False)`, because they are instanced by the hundred). Domes, drums, towers, barrels and tree crowns are visibly round now.
   - Fir baubles are placed on the tier surface instead of floating beside it; the stall counter top matches the posts.
3. **Softer ground.** `tools/make-tiles.py` now draws 128×128 tiles: rounded stones with a soft dome shade and grout, and smooth two-octave grass with anti-aliased blades and flowers. Every cobble row has a joint on the tile edge and the shading is symmetric, so tiles flipped at random by the autotiler meet without seams. Sampling was already bilinear + mipmaps + 8× anisotropy.
4. **Rebuild.** All 47 environment models (and the Registrar boss, which shares the underground builder) were rebuilt from the scripts (`tools/blender/build_environment.py`) and optimized. Characters, NPCs and enemies were not touched.

## Measurements (headless software GL)
| View | Draw calls before / after | Triangles before / after |
|---|---|---|
| Spawn | 63 / 63 | 101 492 / 110 160 (+8.5%) |
| Manezhnaya | 48 / 48 | 86 046 / 92 550 (+7.6%) |
| Garden | 42 / 42 | 90 810 / 98 650 (+8.6%) |
| Underground hall | 37 / 37 | 56 470 / 62 902 (+11%) |
| Boss arena | 38 / 38 | 89 452 / 96 348 (+7.7%) |

A first pass (bevel from 0.5 m, more sides on tree crowns) cost +36% triangles at spawn, mostly from 131 lindens; trees are now exempt and the bevel threshold is 0.9 m.

## Verification
- Before/after screenshots of Basil, the Kremlin tower, the GUM gallery, stalls, the garden gate, Kutafya and the plaza; the underground hall and platform.
- typecheck, lint, prettier, 468 tests, build, `assets:check` (62 assets, all within budget).

## Notes
- Some corner overhangs are by design (cornice caps, awnings), so the audit only reports them.
- The plate audit is a build-time tool (Blender's BVH); the raw models stay git-ignored, the scripts are the source of truth.
