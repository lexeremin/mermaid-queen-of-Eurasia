# Design Direction

## Look
Late-80s / early-90s fantasy computer games seen through a 3D lens: chunky low-poly geometry, low-resolution pixel textures, dark fantasy Slavic atmosphere. Original designs only.

## Rendering rules
- Fixed angled top-down camera (roughly 50–60° pitch), slight follow-lag, no player camera rotation in the slice.
- Textures: nearest-neighbour filtering, 64–128 px, quantized to the shared palette. No PBR maps beyond base color (no normal/roughness maps).
- Lighting: hemisphere + one directional light, baked-look vertex colors where possible. Few or no real-time shadows; use blob shadows on iPhone.
- Fog/mist: exponential fog tinted per area. Snow/mist particles kept cheap (points/instancing).
- Optional post-processing (dither, slight palette crush, vignette) must be disable-able and off by default on low-end mobile.
- Warm interiors (amber/orange, low fog) vs cold outdoors (blue-grey, heavy fog, snow).

## Palette
A single shared palette (target 32–48 colors) is defined in Phase 3 in `src/data/palette.ts` and `tools/palette.json`, and used by the texture quantizer, materials and UI. Direction:
- Cold outdoors: slate blues, pale grey-greens, snow white, deep spruce green.
- Warm interiors: amber, ember orange, dark walnut, candle yellow.
- Magic (Aura, trident, spells): teal/aquamarine and pearl pink.
- Menace (corrupt/bureaucratic enemies): sickly yellow-green, ink black, paper cream.

## UI
- React DOM HUD over the canvas. Chunky, bordered, pixel-style panels. Pixel font (open licence, recorded in the asset ledger).
- Large touch controls: joystick left, attack/action buttons right, pause always visible top corner. Min 44 pt targets, safe-area insets applied.
- Dialogue: bottom panel, tap to advance, portrait + name.
- Inventory: grid with tap-to-select and explicit Use/Equip/Drop buttons, no drag-only or hover-only interactions.

## Characters
- Rosa: readable silhouette at top-down distance, teal/pearl accents, trident. Four forms must be distinguishable by silhouette and color alone.
- NPCs: distinct silhouette + color per NPC, so 8 NPCs are recognisable at a glance.
- Enemies (3 + boss): absurd bureaucratic monsters (e.g. stamp-wielding clerks, paper-swarm, form-golem). Fictional; no resemblance to real people.
