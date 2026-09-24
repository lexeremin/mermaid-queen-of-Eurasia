# Mermaid Queen of Eurasia — Game Description

A browser-based 3D low-poly action RPG (fixed top-down camera) with online stats.

> Working docs live in [`/docs`](docs/Task.md). This file is the product brief. Technical detail is in `docs/tech-stack.md`, `docs/architecture-rules.md`, `docs/asset-pipeline.md` and `docs/database-schema.md`.

---

## 1. Pitch

Rosa is a radiant, rose-crowned woman with a secret: she is a mermaid queen from Eurasia. She arrives in a surreal fantasy version of central Moscow on a heavy, overcast summer day. The city and its people feel worn down and depressed, and Rosa is their saviour: warm color and music in a grey world. She decides to build her own kingdom there.

Her primary power is **Mermaid Aura**, and it is a **song**: when Rosa sings, rings of musical notes circle around her. Lonely, confused or unhappy Russian men (and other NPCs) caught by the rings are mesmerized, a floating **heart buff** appears above their heads, and they join her kingdom through dialogue, kindness, humor and magical charisma.

Rosa's default form is human. She can **transform into a mermaid** (transformation 1) and gain a special skill, **Tidal Song**: a stronger, wider song whose rings mesmerize everyone nearby and let her cross water.

The world contains fictional corrupt politicians and absurd bureaucratic monsters. They are completely fictional characters and must not resemble or directly represent real politicians.

---

## 2. Technical requirements

### Stack
- Browser game, no install for players.
- **Vite + React 19 + TypeScript (strict)**.
- **Three.js via `@react-three/fiber` + `@react-three/drei`** for rendering.
- **Zustand** for game and UI state.
- **Supabase** (hosted Postgres) for online stats and optional cloud save.
- Architecture must stay simple and easy to modify: data-driven content, small pure systems, one network module.
- Fully playable locally after `npm install` + dev server (Supabase keys optional locally; the game runs offline without them).

### Platforms
- Desktop browsers, responsive 16:9 layout.
- iPhone Safari, portrait and landscape, safe-area insets respected.
- Touch and keyboard + mouse input. No hover-only interactions anywhere.

### Persistence and network
- **Offline-first.** Game state is saved to `localStorage` on every meaningful change. The game must be fully playable with no network.
- **Anonymous online identity.** Supabase anonymous auth. No login screen, no email, no personal data.
- When online, stats (and optionally the save) sync to Supabase through an offline queue. Sync failures never block or interrupt play.
- Player can opt out of stats collection in Settings.
- The Supabase service-role key is never in the repo or the client. Row-level security is mandatory on every table.

### Performance budgets (enforced from the asset PoC phase onward)
- Desktop: 60 fps target. iPhone Safari: 30 fps minimum, 60 fps target.
- Concrete limits (draw calls, triangles per scene, texture sizes, GLB size, total download) are defined in `docs/asset-pipeline.md` and `docs/dod-global.md`.
- Nice to have: PWA / Add to Home Screen.

---

## 3. Visual style

Original visual style inspired by:
- late-1980s / early-1990s fantasy computer games
- chunky low-poly 3D geometry
- limited-resolution pixel-art textures (nearest filtering, roughly 64–128 px, palette-quantized)
- dark fantasy atmosphere
- central Moscow in summer, stylized and surreal: Red Square, GUM, the Kremlin wall, Manezhnaya Square and the Alexander Garden, with cobblestones, red-brick walls and towers, onion domes and lush but muted greenery
- a dark, moody, overcast day: low grey sky, heavy haze, desaturated colors that read as gloom and depression
- warm colors as hope: Rosa (rose, ivory, gold), lit shop windows and lamps stand out against the grey city

Rendering approach: fixed angled top-down camera, flat or vertex lighting, fog and mist, low-res textures, restrained post-processing. Exact rules are in `docs/design-direction.md`.

Do NOT copy Stardew Valley or Diablo II assets, characters, maps, UI, music, or artwork. Create original assets and designs.

---

## 4. Asset pipeline (summary)

High-quality assets are produced through a repeatable pipeline, documented in `docs/asset-pipeline.md`:

1. **Generate** with Blender MCP: AI 3D generators (Hunyuan3D, Hyper3D Rodin) for characters and props, procedural Blender scripts for buildings, trees and terrain, and Poly Haven / Poly Pizza CC0 sources as references or bases.
2. **Reduce** to the polygon budget: retopology / decimation for the chunky low-poly look.
3. **Retro-texture**: downscale and palette-quantize textures to the shared palette, so all assets look like one game.
4. **Export** as GLB (meshopt / Draco compression) and register in an asset manifest.
5. **Track licences** in an asset ledger. Every asset is original, generated with terms that allow commercial use, or CC0 with the source recorded.

The pipeline is validated with a small proof of concept (Rosa placeholder, one house, one tree) before any content phase begins.

---

## 5. Online stats

Purpose: understand how the game is played and keep an optional cloud save.

- Tracked (anonymous player id, no personal data): runs, playtime, level reached, quests completed, boss kills, transformations unlocked, deaths, device class (desktop / mobile).
- Player can opt out in Settings.
- Stretch goals (not part of the vertical slice): cloud save restore on another device, simple leaderboard.

Schema and policies: `docs/database-schema.md`.

---

## 6. Game concept and story

The tone is surreal, romantic, darkly humorous and absurd. The story should feel like Rosa's exaggerated fantasy world rather than a realistic political story.

**Real people and symbols (see `docs/likeness-and-consent.md`):**
- Only the hero is based on a real person: a stylized character inspired by the look of someone who agreed. No face scan, no photo-derived textures, and the reference photo is never committed.
- No other real person is depicted. The corrupt politicians and bureaucratic monsters are fictional and must not resemble real politicians.
- No real political figures, state emblems, flags or party symbols. Landmarks appear in stylized, surreal form (no Lenin Mausoleum; tower crowns are a fantasy ruby-crystal spire, not a state star).

---

## 7. Combat

Simple real-time top-down combat.

- Rosa has a magical trident.
- Basic attack.
- Mermaid Aura ability: Rosa sings. Musical notes orbit her in expanding circles; every man the rings touch is mesmerized and shows a floating heart buff above his head.
- Dash.
- One area-of-effect spell.
- 3 enemy types.
- One boss.

---

## 8. Exploration

One connected central-Moscow district, one park, one underground dungeon. Relative positions follow the real city (the map is rotated 180° so the camera looks toward St. Basil's: from the museum end, the Kremlin wall is on the right and GUM on the left).

**Red Square district**
- St. Basil's-style cathedral at the far end; Kremlin wall with a clock tower (Spasskaya-style) and other towers along one side; **GUM** along the other; State Historical Museum, Kazan-style cathedral and the Resurrection Gate at the near end
- **GUM**: detailed facade with towers and arched entrances, and a walkable central gallery under a glass roof with a fountain and shop windows
- 8 NPCs (Russian men of many kinds, all waiting to be mesmerized)
- shops (GUM shop windows and market stalls)
- a small house (Rosa's lodge at the plaza's edge)
- quest board

**Manezhnaya Square** (through the Resurrection Gate): open square with the Manege hall, the Kremlin's north wall and the way to the garden

**Alexander Garden** (park along the outside of the Kremlin's west wall, reached via Manezhnaya Square; not directly from Red Square)
- Kutafya Tower and the Trinity bridge, paths, the grotto, an obelisk, lawns and flower beds
- collectible herbs
- pearls
- monsters
- hidden shrine

**Moscow underground** (metro-palace halls and cellars, entered from the district)
- 3 rooms
- enemies
- loot
- boss arena

---

## 9. Progression

- health
- mana
- experience
- levels
- inventory
- equipment
- quests
- NPC relationships
- simple kingdom reputation

---

## 10. Fantasy system: transformations

Four unlockable transformations:

1. Mermaid Queen
2. Slavic Forest Spirit
3. Elvish Form
4. Tsarina of Eurasia

Each transformation changes Rosa's appearance and provides one gameplay modifier. Rosa starts in human form; the Mermaid Queen form is the first one she unlocks and adds the Tidal Song skill. (Forest Spirit and Elvish Form are kept for now and will be reviewed for the Moscow setting.)

---

## 11. Controls and UX

### Mobile
- Large virtual joystick on the left.
- Large attack/action buttons on the right.
- Tap NPCs to interact.
- Inventory works on touch screens.
- Minimum touch target 44 pt. No tiny buttons.
- Pause button always visible.
- Game works without hover interactions.

### Desktop
- **Left click on the ground: Rosa walks there** (pathfinding around buildings, water and props; a ring marks the destination; any movement key cancels the walk).
- WASD / arrow keys move; Rosa turns smoothly to face the direction she is moving. There is no mouse aiming; attacks go in the facing direction.
- Space or right click: attack.
- Shift: dash. Q: Mermaid Aura (song). R: area spell.
- E interact.
- I inventory.
- ESC pause.

---

## 12. MVP: playable vertical slice

Prioritize a playable vertical slice over quantity. Acceptance criteria — the player can:

1. Start the game.
2. Move around the village.
3. Talk to NPCs.
4. Accept a quest.
5. Enter the forest.
6. Fight enemies.
7. Collect loot.
8. Enter the dungeon.
9. Defeat the boss.
10. Unlock one transformation.
11. Save and reload progress (local, and cloud when online).

Also required: works on desktop and iPhone Safari, works offline, stats sync when online.

The game should feel polished despite its small scope.

### Out of scope for the vertical slice
Multiplayer, accounts/login, in-app purchases, more than one village/forest/dungeon, localization beyond one language, leaderboards and cross-device restore (stretch).

---

## 13. Development process

- Work is split into numbered phases. A phase is one completed task.
- `docs/Task.md` holds the rules, the current phase, the roadmap and the to-do summary.
- Each phase has a detailed doc in `docs/phases/phase-N.md`.
- After each completed phase: commit and push to git.
