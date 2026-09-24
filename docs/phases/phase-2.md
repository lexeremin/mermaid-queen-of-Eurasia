# Phase 2 — Engine core

**Status:** ✅ Complete

## Result
- Fixed 60 Hz sim step with accumulator + render interpolation (`src/game/fixed-step.ts`, `sim.ts`, `GameLoop.tsx`); pure `stepPlayer` in `src/systems/movement.ts`.
- Unified input (`src/input`): keyboard/mouse, joystick math, held/pressed action flags. Mouse aim = pointer raycast onto the ground plane; joystick use drops mouse aim so facing follows movement on hybrid devices.
- Camera rig with damping; distance scale by aspect (cap 2.5×) and fog density compensation for portrait.
- `useGameStore` (pause, inventory placeholder, ESC priority: close panel first). Auto-pause on tab hidden.
- HUD: BAG + PAUSE always visible, pause overlay, inventory placeholder, touch controls (joystick 150 px; ATK 104 px; DASH/AURA/SPELL 76 px), dev-only debug overlay + FPS.
- Touch UI shows on `(pointer: coarse)`, on the first touch, or with `?touch=1` (handy for testing in a desktop browser).
- Tests: 26 unit tests across systems, input, store, camera, fixed-step.

## Verification (browser)
- Desktop: WASD/diagonals normalized, mouse aim, ESC/I/Space/Q/R/E flags, left click attack, PAUSE/RESUME buttons, hidden tab pauses, sim frozen while paused.
- Mobile 375×812 and landscape 812×375: joystick full/analog/deadzone/release, all four action buttons hold/release, no element off-screen, no page scroll.
- Vite `optimizeDeps.include` added so a cold `npm run dev` no longer re-optimizes mid-session (that caused a transient "Invalid hook call" from duplicate React/Three instances).
- Not verified on a physical iPhone (Phase 14). Synthetic pointer events were used for touch; real multi-touch (joystick + button at once) is covered by per-pointer-id handling but untested on device.

## Notes for later phases
- Action flags (`attack/dash/aura/spell/interact`) are recorded but not consumed yet; combat (Phase 7) should call `consumePressed` inside the sim step.
- Tap-to-interact on NPCs (Phase 5) needs canvas raycasting; the canvas already has `touch-action: none`.
- Real Rosa model replaces the placeholder cone in Phase 3/4; keep `Player` reading from `sim`.
- Debug overlay is dev-only (`import.meta.env.DEV`).

## Goal
A controllable placeholder Rosa in a fixed-camera scene, driven by a fixed-timestep game loop and one unified input layer, with pause and a responsive/safe-area HUD shell. This is the foundation every later phase builds on (village, NPCs, combat all plug into this loop, input and HUD).

## Scope
1. **Game loop** — single loop in R3F `useFrame`; fixed 60 Hz simulation step with accumulator, render interpolation between the last two sim states, dt clamp to avoid spiral of death. Sim halts while paused or a panel is open.
2. **Input layer** (`src/input`) — one `InputState` (keyboard move vector, joystick move vector, aim vector, held/pressed action flags). Game code never reads DOM events.
   - Keyboard/mouse: WASD/arrows move, mouse aims (pointer → ground plane raycast), left click attack, Space/Shift dash, Q aura, R spell, E interact, I inventory, ESC pause.
   - Touch: large virtual joystick (left), attack/dash/aura/spell buttons (right, ≥ 44 pt), multi-touch safe. Facing follows movement direction on touch.
3. **Player** — placeholder Rosa (procedural low-poly cone + facing nose), pure `stepPlayer` movement system with world bounds. Real model arrives in Phase 3/4.
4. **Camera** — fixed pitch follow camera with damping; distance scales with aspect ratio so portrait phones still see enough of the world; fog density scales with distance.
5. **State** (`src/store`) — Zustand `useGameStore`: `paused`, `inventoryOpen`, actions, `isSimRunning` selector. Auto-pause when the tab is hidden.
6. **HUD shell** (`src/ui`) — always-visible Pause button, Bag (inventory) button, pause overlay with Resume, inventory placeholder panel (real inventory is Phase 8), touch controls (shown on touch devices), dev-only debug overlay. Safe-area insets applied.

Out of scope: combat effects, NPC interaction, real inventory, real assets, audio.

## Control map

> Desktop mouse controls were reworked in Phase 9b (click-to-move, no aim; attack is Space or right click, dash is Shift). See `docs/phases/phase-9b.md`.

| Action | Desktop | Touch |
|---|---|---|
| Move | WASD / arrows | left joystick |
| Aim | mouse position | facing = move direction |
| Attack | left click | ATK button |
| Dash | Space / Shift | DASH button |
| Mermaid Aura | Q | AURA button |
| AoE spell | R | SPELL button |
| Interact | E | tap NPC (Phase 5) |
| Inventory | I | BAG button |
| Pause | ESC | PAUSE button |

Action flags are recorded now (`held` / `pressed`) but have no gameplay effect until Phase 7.

## Steps
1. Utilities (`vec2`, `math`), pure systems (`movement`, `fixed-step`, camera helpers) + tests.
2. Input state, keyboard/mouse attach, joystick math + tests.
3. Store + tests.
4. Scene components: `GameLoop`, `Player`, `CameraRig`; wire into `Scene`.
5. HUD components + CSS; touch-device detection.
6. Verify in browser: desktop keys/mouse/pause, mobile viewport joystick/buttons/pause, portrait camera.
7. Docs, commit `feat: phase 2 — engine core`, push, advance Task.md.

## DoD
- typecheck, lint, prettier, tests, build pass.
- Desktop: WASD moves Rosa smoothly, mouse aim rotates facing, ESC pauses/resumes, I toggles the placeholder inventory, click/keys register in debug overlay.
- Mobile 375×812 and landscape: joystick moves Rosa, all buttons ≥ 44 pt and reachable, pause always visible, no page scroll, HUD respects safe areas.
- Portrait camera shows a usable width (no heavy crop); no console errors.
- Tab hidden → game pauses.
