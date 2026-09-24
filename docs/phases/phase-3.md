# Phase 3 — Asset pipeline PoC

**Status:** ✅ Complete

## Goal
Prove the asset pipeline end to end before any content work: Blender (via MCP) → low-poly asset → shared palette/retro texture → GLB → optimize/compress → budget check → manifest + licence ledger → loaded in the game with the retro look, on desktop and mobile viewport. Style and performance risk is found here, not in Phase 10.

## Scope
1. **Shared palette** — one source of truth `tools/palette.json` (32 colors), mirrored by `src/data/palette.ts`. Palette atlas texture layout defined once (128×64, 16 px cells, one flat cell per color).
2. **Blender build scripts** (`tools/blender/`) — Python run inside Blender through MCP `execute_blender_code`. Helpers to build chunky low-poly parts, assign each face a palette cell via UVs (one shared atlas, nearest filtering), and export GLB.
3. **Three PoC assets**
   - `char_rosa` — placeholder Rosa (mermaid queen, rigid-part node hierarchy: tail chain, torso, head, crown, arms, trident), budget ≤ 3 000 tris.
   - `bld_izba` — small Slavic wooden house, ≤ 1 500 tris, warm lit window.
   - `tree_spruce` — snowy spruce, ≤ 300 tris.
4. **Optimize** — `gltf-transform` (dedup, prune, meshopt) → `public/assets/<category>/`.
5. **Budget check** — `npm run assets:check` (also run in `npm test`): triangle count, texture size, file size per class (from filename prefix), manifest entry, ledger row.
6. **Manifest + ledger** — `src/data/assets.ts`, `docs/asset-ledger.md`.
7. **In-engine** — load with drei `useGLTF`, shared retro material (Lambert + nearest-filtered atlas), replace placeholder Rosa/box/cone in `Scene`/`Player`. Verify look under fog, on desktop and mobile viewport, and note the frame-time/draw-call cost.
8. **Docs** — `asset-pipeline.md` updated with what actually worked (commands, gotchas, generator status).

## Generator status (checked at phase start)
- Blender 5.1.1 reachable via MCP once the addon server is started (a startup script enables the addon and starts it; the sidebar "Connect" button does the same).
- Poly Haven: enabled. Hunyuan3D, Hyper3D Rodin, Sketchfab: **disabled**, they need the user's credentials / opt-in in the addon panel. The installed addon is an older build without Poly Pizza.
- So the PoC assets are **procedural**. AI generation (characters/monsters) is evaluated later once the user enables a generator; see decision in Task.md notes.

## Result
- Pipeline works end to end and is reproducible from scripts: `tools/blender/{lib,build_poc_assets,start_mcp}.py`, `tools/{optimize-assets,check-assets,gltf-io}.mjs`, `tools/{palette,asset-budgets}.json`.
- Assets: `char_rosa` 456 tris / 25 KB (with `idle` + `walk` clips), `bld_izba` 464 tris / 8.6 KB, `tree_spruce` 160 tris / 5.6 KB. All well inside budget; PoC download about 40 KB.
- In game: shared nearest-filtered palette material, meshopt GLBs, cloned instances, animation crossfade driven by movement. Verified on desktop and 375×812: 19–24 draw calls, 2 000–2 800 tris, about 100 fps, each asset fetched once. Idle tail sway ±0.05 rad, walk ±0.22 rad confirmed via the dev overlay.
- Budget checker verified to fail on a violation (tightened the tree budget temporarily).
- Findings recorded in `docs/asset-pipeline.md` (axes, NLA clip export, meshopt wrapper nodes, flat palette limits).

## Open items / decisions for the user
- **AI generators not enabled** (Hunyuan3D, Rodin, Sketchfab need opt-in + credentials in the Blender addon panel). Needed before generating characters/monsters; until then everything is procedural.
- **Pixel-art surface detail:** the flat palette atlas gives the faceted retro look but no texture detail. Judge the look in context (Phase 4/13); options are tiling detail textures or a dither post effect.
- The installed Blender addon is an older build (`uvx mcp-for-blender install-addon` updates it).
- Not measured on a physical iPhone (Phase 14).

## Out of scope
Final art for any asset, skinned skeletal rigs and animation clips from Blender (rigid-part characters are animated procedurally in-engine for now), terrain kit, texture detail beyond the palette atlas, audio.

## Steps
1. Palette JSON + TS mirror + test.
2. Blender helpers + the three asset builders; screenshot each in Blender.
3. Export GLBs to `assets-src/` (git-ignored intermediates), optimize into `public/assets/`.
4. Budget checker, manifest, ledger, tests.
5. Engine integration + retro material; browser verification.
6. Docs; commit `feat: phase 3 — asset pipeline PoC`; push; advance Task.md.

## DoD
- All three GLBs are within budget and pass `npm run assets:check`.
- Rebuilding from the scripts reproduces the assets (documented commands).
- Assets render in-game with the palette look, nearest filtering, fog, no console errors, on desktop and 375×812.
- Manifest and ledger contain every shipped asset; total asset download for the PoC is small (target < 300 KB).
- `docs/asset-pipeline.md` reflects the real workflow.
