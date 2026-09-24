# Design Direction

## Look
Late-80s / early-90s fantasy computer games seen through a 3D lens: chunky low-poly geometry, low-resolution pixel textures, dark fantasy atmosphere in a stylized, surreal winter Red Square. Original designs only.

## Rendering rules
- Fixed angled top-down camera (roughly 50–60° pitch), slight follow-lag, no player camera rotation in the slice.
- Textures: one shared palette atlas (128×128, one flat cell per color), nearest-neighbour filtering, no mipmaps, one shared `MeshLambertMaterial`. No PBR maps beyond base color. Surface detail beyond flat palette colors is deferred (see `docs/asset-pipeline.md`).
- Lighting: hemisphere + one directional light, baked-look vertex colors where possible. Few or no real-time shadows; use blob shadows on iPhone.
- Fog/mist: exponential fog tinted per area. Snow/mist particles kept cheap (points/instancing).
- Optional post-processing (dither, slight palette crush, vignette) must be disable-able and off by default on low-end mobile.
- Warm interiors (amber/orange, low fog) vs cold outdoors (blue-grey, heavy fog, snow).

## Palette
A single shared palette (32 colors) lives in `tools/palette.json` (mirrored by `src/data/palette.ts`) and drives the atlas, the Blender scripts and, later, the UI. Direction:
- Cold outdoors: slate blues, pale grey-greens, snow white, cobblestone greys, deep spruce and fir green.
- Red Square: brick reds (light and dark), cream and white stone, gold and teal onion domes, ruby-crystal accents.
- Warm interiors: amber, ember orange, dark walnut, candle yellow.
- Magic (Aura, trident, spells): teal/aquamarine and pearl pink.
- Menace (corrupt/bureaucratic enemies): sickly yellow-green, ink black, paper cream.

## UI
- React DOM HUD over the canvas. Chunky, bordered, pixel-style panels. Pixel font (open licence, recorded in the asset ledger).
- Large touch controls: joystick left, attack/action buttons right, pause always visible top corner. Min 44 pt targets, safe-area insets applied.
- Dialogue: bottom panel, tap to advance, portrait + name.
- Inventory: grid with tap-to-select and explicit Use/Equip/Drop buttons, no drag-only or hover-only interactions.

## Characters
- Rosa (human): dark updo with a top bun, cluster of cream/blush/lilac roses on one side, ivory jacket, dark boots, drifting petals, gold trident. Readable silhouette at top-down distance. Mermaid form keeps the same head, hair and roses with a teal/pearl tail. Every form must be distinguishable by silhouette and color alone.
- NPCs: distinct silhouette + color per NPC, so 8 NPCs are recognisable at a glance.
- Enemies (3 + boss): absurd bureaucratic monsters (e.g. stamp-wielding clerks, paper-swarm, form-golem). Fictional; no resemblance to real people.
