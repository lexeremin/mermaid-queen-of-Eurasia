# Design Direction

## Look
Late-80s / early-90s fantasy computer games seen through a 3D lens: chunky low-poly geometry, low-resolution pixel textures, dark fantasy atmosphere in a stylized, surreal central Moscow on a gloomy overcast summer day. Original designs only.

## Rendering rules
- Fixed angled top-down camera (roughly 50–60° pitch), slight follow-lag, no player camera rotation in the slice.
- Textures: one shared palette atlas (128×128, one flat cell per color), nearest-neighbour filtering, no mipmaps, one shared `MeshLambertMaterial`. No PBR maps beyond base color. Surface detail beyond flat palette colors is deferred (see `docs/asset-pipeline.md`).
- Lighting: hemisphere + one directional light, baked-look vertex colors where possible. Few or no real-time shadows; use blob shadows on iPhone.
- Fog/mist: exponential fog, grey-green haze. Light drizzle or drifting mist particles kept cheap (points/instancing).
- Optional post-processing (dither, slight palette crush, vignette) must be disable-able and off by default on low-end mobile.
- Mood: overcast, heavy and depressive. Low grey sky, weak directional light, desaturated greens and stone. Warm colors mean hope: Rosa (a soft warm light follows her), lit windows, lamps and GUM string lights read strongly against the grey.
- Sky and lighting values live in `src/game/atmosphere.ts` (single source; changing the mood means editing that file).

## Palette
A single shared palette (32 colors) lives in `tools/palette.json` (mirrored by `src/data/palette.ts`) and drives the atlas, the Blender scripts and, later, the UI. Direction:
- Grey city: cobblestone and stone greys, slate blues, muted brick reds, wet-looking dark greens; lawns and leaves are desaturated.
- Landmarks: brick reds (light and dark), cream and white stone, gold, green and blue onion domes, ruby-crystal accents.
- Warm interiors: amber, ember orange, dark walnut, candle yellow.
- Magic (Aura, trident, spells): teal/aquamarine and pearl pink.
- Menace (corrupt/bureaucratic enemies): sickly yellow-green, ink black, paper cream.

## Aura (singing) VFX direction
- Rings of small musical notes orbit Rosa in expanding circles (rose, gold and pearl colors, additive-looking but cheap: instanced sprites or tiny meshes).
- Mesmerized men get a floating heart icon above their heads while the buff lasts.
- Implemented in the Combat / NPC phases; colors already in the palette.

## UI
- React DOM HUD over the canvas. Chunky, bordered, pixel-style panels. Pixel font (open licence, recorded in the asset ledger).
- Large touch controls: joystick left, attack/action buttons right, pause always visible top corner. Min 44 pt targets, safe-area insets applied.
- Dialogue: bottom panel, tap to advance, portrait + name.
- Inventory: grid with tap-to-select and explicit Use/Equip/Drop buttons, no drag-only or hover-only interactions.

## Characters
- Rosa (human): dark updo with a top bun, cluster of cream/blush/lilac roses on one side, ivory jacket, dark boots, drifting petals, gold trident. Readable silhouette at top-down distance. Mermaid form keeps the same head, hair and roses with a teal/pearl tail. Every form must be distinguishable by silhouette and color alone.
- NPCs: distinct silhouette + color per NPC, so 8 NPCs are recognisable at a glance.
- Enemies (3 + boss): absurd bureaucratic monsters (e.g. stamp-wielding clerks, paper-swarm, form-golem). Fictional; no resemblance to real people.
