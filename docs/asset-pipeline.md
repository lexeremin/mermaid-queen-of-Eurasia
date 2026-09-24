# Asset Pipeline

Goal: high-quality, consistent, original-feeling 3D assets that fit iPhone Safari budgets. Validated in Phase 3 (proof of concept) before content phases.

## Tooling
- **Blender MCP** (live Blender via `mcp__blender__*` tools): `execute_blender_code`, `generate_hunyuan3d_model`, `generate_hyper3d_model_via_text/images`, `search_polyhaven_assets`, `download_polyhaven_asset`, `search_polypizza_models`, `search_sketchfab_models`, `export_scene`, `get_viewport_screenshot`.
- `tools/` in this repo holds repeatable scripts: Blender Python (decimate, UV, bake, export), texture quantizer (palette + downscale), GLB optimizer (meshopt/Draco via gltf-transform).

## Workflow per asset
1. **Brief**: name, category, silhouette notes, budget class (see below).
2. **Source** (pick the cheapest that meets quality):
   - *Procedural* Blender scripts: buildings, fences, trees, terrain kits, props. Best style consistency.
   - *AI generated*: Hunyuan3D / Rodin for characters, monsters, unique props. Generate from text + reference image.
   - *CC0 base*: Poly Haven / Poly Pizza models as a base to restyle. Record source URL and licence.
3. **Reduce**: decimate/retopo to the poly budget; enforce chunky, flat-shaded look.
4. **Retro texture**: bake/collapse to one atlas, downscale to 64–128 px, quantize to the shared palette (`tools/palette.json`), nearest filtering.
5. **Rig/animate** (characters): simple skeleton, few clips (idle, walk, attack, hit, die); keep bone count low.
6. **Export** GLB, compress (meshopt/Draco), name per convention, drop in `public/assets/<category>/`.
7. **Register** in `src/data/assets.ts` (manifest) and in `docs/asset-ledger.md` (licence ledger).
8. **Verify in game**: viewport screenshot in Blender + in-engine check on desktop and iPhone Safari.

## Budgets (initial — tighten in Phase 3 and 14 after measuring on device)
| Class | Triangles | Texture | Notes |
|---|---|---|---|
| Hero (Rosa, per form) | ≤ 3 000 | 128×128 | ≤ 40 bones |
| NPC / enemy | ≤ 1 500 | 64–128 | ≤ 25 bones |
| Boss | ≤ 4 000 | 128×128 | |
| Building | ≤ 1 500 | shared atlas | |
| Prop / tree | ≤ 300 | shared atlas | Instance where repeated |
| Scene total (visible) | ≤ 150 000 | — | ≤ 150 draw calls target |
| GLB size | ≤ 300 KB each (hero ≤ 600 KB) | — | Total initial download target ≤ 8 MB |

## Naming
`<category>_<name>[_<variant>].glb`, lowercase snake case. Categories: `char`, `npc`, `enemy`, `boss`, `bld`, `prop`, `tree`, `terrain`, `fx`.

## Licence ledger (`docs/asset-ledger.md`, created in Phase 3)
One row per asset: file, source (procedural / generator name + prompt + date / URL), licence, commercial use OK (y/n), author, notes. No asset ships without a row. Generated assets must come from a service whose terms allow commercial use; record the terms/date.

## Fallbacks
- Generator quota/keys unavailable: procedural Blender geometry + Poly Haven CC0.
- Style drift: re-run the retro-texture pass with the shared palette and re-decimate.
