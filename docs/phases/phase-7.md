# Phase 7 — Summer overcast look

**Status:** ✅ Complete

## Goal
Turn the snowy Red Square into a dark, moody **summer** day that reads as gloom and depression, with Rosa as the warm point of hope. Keep the current layout (Phase 8 re-lays it out); change look, lighting, assets and ground. Also record the new design for the singing Aura.

## Decisions (2026-09-24)
| Topic | Decision |
|---|---|
| Season | Summer, no snow anywhere |
| Mood | Dark, moody, overcast; grey-green haze; desaturated; "depression" that Rosa lifts |
| Rosa | "Saviour": warm colors, soft warm light following her |
| Aura | It is a song: orbiting music notes in circles; mesmerized men get a floating heart buff above their heads (implemented in Combat / NPC phases) |
| Map plan | Phase 8: real relative layout + detailed GUM + walkable gallery; Phase 9: Manezhnaya Square + real Alexander Garden, same map |

## Scope
1. **Atmosphere config** `src/game/atmosphere.ts`: sky/background, fog color and density, hemisphere and directional light colors and intensities, Rosa light. `Scene.tsx` and `CameraRig.tsx` read it (single source for the mood).
2. **Palette:** add summer colors (lawn, leaf, flowers) to `tools/palette.json`.
3. **Assets without snow:** rebuild every existing asset from its script with snow caps removed or replaced (stone caps, bare roof strips, green spruce bands); make birch lush; new `tree_linden` (round summer crown); new `prop_flowerbed`.
4. **Ground:** grass tile texture (`tools/make-tiles.py` replaces `make-cobble.py`, generates cobble and grass tiles) under the plaza; cobble colors slightly darker and wetter.
5. **Rosa light:** a soft warm point light attached to the player.
6. **Docs:** Description, design direction, features, roadmap (done at phase start), asset pipeline and ledger.

## Result
- **`src/game/atmosphere.ts`**: single source of the mood (grey-green background and fog `#7d858a`, density 0.03, hemisphere 1.25, sun 1.0, Rosa light `#ffb8cc` intensity 24). `Scene` and `CameraRig` read it; `BASE_FOG_DENSITY` moved there.
- **Rosa light:** a soft warm point light follows the player, the "hope in a grey city" cue.
- **Palette** grew to 55 colors (lawn, leaf, flower, wet stone, bark). All snow removed from every builder; spruce bands are green; birch is lush; new `tree_linden` (140 tris) and `prop_flowerbed` (216 tris). 21 assets pass `assets:check`.
- **Ground:** `tools/make-tiles.py` (replaces `make-cobble.py`) generates `cobble_tile.png` (wet cobble colors) and `grass_tile.png`; `MapScene` uses a generic `TiledGround` for grass (400 × 400, 3 m tiles) and the plaza.
- Map still the Phase 6 layout (re-laid out in Phase 8); trees around it are now 45% linden, 25% birch, 30% spruce; four flower beds added.

## Verification
- Rendered with a headless Chromium (Playwright installed in a scratch folder, not in the repo) because the desktop app window was in the background and the in-app pane froze: overview (`?zoom=3`), gameplay (`?zoom=0.6`) and 375×812 with touch controls. Mood reads overcast and gloomy, landmarks and Rosa stay readable, Rosa's warm glow visible on the cobbles.
- 26–31 draw calls, 40–43k triangles; no console errors; typecheck, lint, prettier, 55 tests, build pass.
- Headless software rendering runs at 20–50 fps; real-GPU numbers (about 100 fps) were measured in earlier phases.

## Notes
- The mood is tunable in one file. If it turns out too dark on phones, raise `hemisphere.intensity` first.
- Drizzle/mist particles and sky gradient are left for the polish phase.

## Out of scope
Layout changes (Phase 8–9), rain/drizzle particles (polish phase), the Aura VFX itself (Combat phase), sound.

## Steps
1. Docs and roadmap (done).
2. Palette + builders (remove snow) + new assets, rebuild everything, optimize.
3. Tiles generator, ground.
4. Atmosphere config, Scene/CameraRig wiring, Rosa light.
5. Browser verification (desktop, 375×812), tune the mood.
6. Commit, push, advance Task.md.

## DoD
- No snow color visible anywhere in the scene; assets pass `npm run assets:check`; ledger updated.
- Mood reads overcast and gloomy but stays readable (Rosa, NPC spots and landmarks are clear).
- Draw calls ≤ 45; about 100 fps; no console errors; works at 375×812.
- typecheck, lint, prettier, tests, build pass.
