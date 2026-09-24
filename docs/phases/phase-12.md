# Phase 12 — Combat core

**Status:** ✅ Complete

## Goal
Real-time top-down combat on the existing engine: Rosa's trident attack, dash, the **singing Mermaid Aura**, one area spell, health and mana, and three bureaucratic monster types with AI. Boss, loot, XP and levels come later (Phases 13 and 16).

## Design

### Rosa
- **Health 100, mana 100.** Mana regenerates 5/s; health regenerates 1.5/s after 8 s without damage. 0.5 s of invulnerability after being hit. Not saved (full on load).
- **Trident attack** (Space, right-click, ATK): cone in front, range 2.3 m, half-angle 55°, 14 damage, knockback, 0.45 s cooldown, hold to repeat. **Aim assist:** the strike turns toward the nearest enemy within 3.6 m and 80° of her facing, so click-walkers do not need to aim.
- **Dash** (Shift, DASH): 4.4 m in 0.2 s along her movement direction (facing if standing), invulnerable 0.28 s, 1.4 s cooldown, stopped by walls.
- **Mermaid Aura, a song** (Q, AURA): 30 mana, 8 s cooldown. For 2.4 s three rings of musical notes expand around Rosa out to 8 m. Everything the rings touch is **charmed** for a while, with a floating heart: NPCs are charmed 12 s (**persuasion gains are ×1.5 while charmed**, so singing before a conversation helps); enemies are **lovestruck** for 5 s (they stop, sway and cannot attack).
- **Tide Surge** (R, SPELL): 35 mana, 7 s cooldown. A wave bursts out of Rosa to 4.8 m: 28 damage, strong knockback, to every enemy in range.
- Attacks and abilities cancel a click-walk. Nothing works during dialogue, pause, inventory or while downed.
- **Downed:** at 0 HP a "You fainted" card appears; GET UP returns Rosa to the spawn with 60% health and full mana, and enemies stand down.

### Enemies (fictional absurd bureaucratic monsters, no resemblance to real people)
| Type | Role | HP | Speed | Attack |
|---|---|---|---|---|
| **Paper Wisp** | fast melee swarm | 18 | 4.6 | 6 dmg, short lunge |
| **Stamp Golem** | slow heavy | 60 | 2.4 | 16 dmg slam with a 0.7 s ground telegraph |
| **Memo Thrower** | ranged | 28 | 3.0 | throws memos (8 dmg, speed 9), keeps 5–8 m away |

AI states: idle → chase (aggro 8–9 m) → windup → attack → recover, plus stunned (knockback), lovestruck, and dead (respawns after 40 s). They leash back to their spawn beyond 20 m and heal there. Enemies collide with the world and never spawn near NPCs (tested).

### Feedback
Attack arc, dash streak, expanding tide ring, orbiting notes for the Aura, hit flash and knockback, enemy health bars when damaged, red screen edge when hurt, HP and mana bars, cooldown sweeps on the ability buttons (desktop bar and touch buttons), stat events `enemy_defeated` and `player_downed`.

## Scope
1. Data: `src/data/enemies.ts`, enemy spawns in `MapData`.
2. Pure systems (tested): `combat-math`, `abilities` (cooldowns and mana), `enemy-ai`, `combat` (one fixed step).
3. State: `combat-sim` (mutable simulation state like `sim`), `combat-store` (HP, mana, downed, for the HUD).
4. Assets: 3 enemy models (`tools/blender/build_enemies.py`, class `enemy`).
5. Game: input to abilities in `GameLoop`, `EnemyActors`, `CombatEffects` (pooled meshes), heart above charmed men (reuses `HeartBuff`).
6. UI: HP and mana bars, ability bar with cooldowns, downed card, damage vignette.
7. Aura ↔ NPC: charmed state and the ×1.5 persuasion bonus.

## Result
- **Pure systems (tested, 162 tests overall):** `combat-math` (cone, circle, band, aim assist), `abilities` (constants, cooldowns, mana; `spendAbility`), `enemy-ai` (9-state machine: idle, chase, windup, attack, recover, stunned, lovestruck, returning, dead; leash, respawn, armor on the golem's windup), `combat` (one fixed step: trident, dash, aura, surge, enemies, projectiles, player damage and fainting, `revive`), `dialogue.charmBonus`.
- **Enemies** (`src/data/enemies.ts`, 8 spawns in `red-square.ts`: 4 Paper Wisps, 2 Stamp Golems, 2 Memo Throwers): none within 12 m of any NPC or the player spawn, all on free ground and reachable (tested). Models 172 / 252 / 240 triangles, 6 KB each; 47 assets total.
- **Game:** `combat-sim` (mutable state), `GameLoop` feeds inputs into `stepCombat` (abilities cancel a click-walk, dash overrides movement, attack briefly slows her), `EnemyActors` (hit flash, health bars that appear when damaged, golem ground telegraph, sway when lovestruck, shrink on death), `CombatEffects` (pooled meshes: trident arc, tide ring, dash streak, death puff, projectiles; instanced music notes in three counter-rotating rings plus a ground disc for the Aura), `NpcActor` shows a heart while charmed.
- **UI:** HP and mana bars, desktop ability bar (Space, Shift, Q, R) with cooldown sweeps and a dimmed state when mana is short, cooldown sweeps on the touch buttons, red hurt vignette, "You fainted" card with GET UP, Esc ignored while fainted.
- **Aura ↔ persuasion:** charmed NPCs get ×1.5 relationship gains (kindness on Sergei: +24 instead of +16); enemies become lovestruck and stop attacking.
- **Stats events:** `enemy_defeated {kind}`, `player_downed`.

## Verification (headless Chromium, real key presses and taps)
- Stamp Golem fought and killed with held Space (took one 16-damage hit: 100 → 84), telegraph and health bar visible.
- Dash: 5.35 m in 0.4 s while holding D, cooldown 1.4 s; Aura: mana 100 → 71, Sergei charmed for 12 s, heart above his head; Tide Surge killed a wisp beside her (+1 kill, 35 mana); Memo Thrower fired from 6.5 m (100 → 92 HP); wisp swarm killed with the trident.
- Fainting shows the card; GET UP returns Rosa to the spawn (0, 24) with 60 HP, full mana, enemies calmed.
- 375×812 touch: AURA tap casts, cooldown sweep darkens the button, no page scroll, no console errors. 46–53 draw calls, 74–78k triangles.

## Bugs found by playing
- A player facing away from a nearby enemy swung at nothing and lost the fight: added a close-range assist (any enemy within 2.6 m is targeted regardless of facing; the 3.6 m / 80° assist stays for farther ones).
- Pressing Esc while fainted opened the pause menu over the fainted card: Esc is now ignored while fainted.
- The Aura keeps expanding around Rosa's current position, so moving during the 2.4 s song charms whatever she walks past (kept; it reads as her song following her).

## Notes for later phases
- Enemies drop nothing and grant no XP yet (Phase 13). The boss (Phase 16) should be immune to the Aura charm.
- Tidal Song (mermaid form: wider rings, crossing water) is Phase 17; the Aura constants are in `abilities.ts`.
- Enemy respawn is 40 s at the spawn point; enemies do not attack NPCs.
- Headless software rendering runs 10–30 fps and slows the sim proportionally (the fixed step clamps at 5 steps per frame); timings in the runs above are wall-clock, so they look slower than a real GPU.

## Out of scope
Boss (Phase 16), loot, XP and levels (Phase 13), equipment, audio, Tidal Song mermaid variant (Phase 17), per-form modifiers, combat saves.

## Steps
1. Doc, data, math and ability systems with tests.
2. Enemy AI and the combat step with tests.
3. Enemy models, manifest, ledger.
4. Sim state, game-loop integration, stores.
5. Rendering and effects.
6. HUD and downed flow, Aura on NPCs.
7. Verify in a browser (fight each type, dash, aura, spell, death and revive, click-walk vs attack, mobile buttons), docs, commit.

## DoD
- Each enemy type can be fought and killed; abilities cost mana and respect cooldowns; the Aura charms NPCs (heart, ×1.5 persuasion) and enemies (stop attacking).
- Dying and getting up works; no combat during dialogue or pause.
- 60 fps target holds with all 8 enemies (draw calls ≤ 70); no console errors; works at 375×812 with touch buttons.
- typecheck, lint, prettier, tests, build pass.
