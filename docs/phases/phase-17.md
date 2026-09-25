# Phase 17 — Stability pass

**Status:** ✅ Complete

## Goal
Fix what hurts in real play before adding more content: the world must survive a reload (no refilling mobs, the boss or health by refreshing), the game must load without freezing (with a loading screen), run smoother, and the mobile joystick must never stay stuck.

## Scope
1. **Persisted world (save v7, local only):** player hp, mana, downed, cooldowns; every enemy that differs from its spawn defaults (hp, state, time dead, position, boss brain); the boss gate; ground pickups; herb regrow timers. Dead mobs keep their respawn timer (play-time, no credit for time away). Not uploaded to the cloud.
2. **Startup:** nav grid fill rewritten to be fast (broadphase, no allocation) with a ready promise and re-warm after a reset; loading screen that waits for assets, the first scene commit, shader compile and the nav grid; the sim is frozen until it finishes; the menu mermaid's second WebGL context only exists while a menu is open; the main render loop pauses behind blocking overlays; equal light counts so descending underground does not recompile shaders.
3. **Performance:** dpr cap on touch and adaptive dpr, throttled occlusion, minimap redraw only when needed, merged HUD ticker loops, fewer per-frame allocations, tree culling; keep draw calls at 70 or fewer.
4. **Joystick:** the stick and attack button release on cancel, lost capture, unmount, backgrounding and any pause; a watchdog resets input when no finger is down.
5. **Roadmap revision** (Task.md, features.md): transformations shrink to one Mermaid Queen phase; polish lists only what is missing.

## DoD
- Reload keeps mobs dead or damaged, the boss's health and phase, health, mana and cooldowns, loot on the ground and herb timers (tested); the cloud copy never contains the world snapshot.
- Cold reload: no main-thread task over 100 ms after the loading screen is gone (measured); the loading screen shows and fades; nothing moves or attacks while it is up.
- Draw calls at most 70 on the surface, underground and in the boss arena.
- Touch emulation: holding the stick while a panel opens, a pointer cancel or a page hide all leave the stick at zero and working.
- typecheck, lint, prettier, tests, build, asset check pass.

## As built
- **Save v7, local only.** `SavedWorld` (`src/save/save-data.ts`, collected and applied in `src/save/world-save.ts`): vitals, downed, cooldowns, every enemy that is hurt, dead, woken or displaced (hp, dead, time dead, dormant, position), the boss gate, ground pickups and herb regrow timers. Dead mobs keep their respawn timers (play time only, no credit for time away). A fainted player is still fainted after a reload (GET UP revives at 60%, so a reload never refills). The boss keeps his health while Rosa is in his arena (he still walks home and heals when she is away, as before). Written on the 10 s tick, on `pagehide` and `visibilitychange`, and shortly after any hit, kill, cast, pickup or gather (`requestSave`, debounced). Never uploaded: `pushSave` strips `world`, and a cloud copy only clamps vitals and does not move Rosa once the game is running.
- **Nav grid:** `createFreeTest` (bucket grid, no allocation) replaces pushing a circle out of every collider; identical answers (tested over a dense sample and the whole real map with the gate shut). A full fill went from about 2.7 s in 38 blocking chunks to about 8 ms; `reset()` re-warms, so Blink after a gate change never stalls.
- **Loading screen** (`LoadingScreen`, `LoadingGate`, `loading-state`): a vintage screen with a progress bar and a status line; it waits for the loaders (three's loading manager, kept as a plain object because writing a store from inside a render made the suspended scene render forever), the first scene commit, a shader compile with the underground's lights mounted and a second compile without them (so descending never recompiles), and the walk grid; the sim is frozen until it fades out. Welcome mounts after it.
- **Performance:** dpr capped at 1.5 on phones (2 on desktop, with multisampling off at dpr 2) plus adaptive dpr; the main render loop stops behind the pause menu, welcome screen, bag, quest log and the blocking map; the buildings' see-through fade only tests boxes near the camera-to-Rosa line; Rosa's X-ray twins (8 extra draw calls) exist only while something really hides her; one shared frame loop for the HUD tickers; the minimap redraws at about 20 Hz; the boss lookup is cached. Draw calls now: 63 at spawn (was 71 on a 1200x800 desktop), 48 Manezhnaya, 42 garden, 37 to 45 underground, 39 in the boss arena.
- **Joystick:** `pointer-tracker.ts` (a new press takes over a lost one), stick and buttons release on pointer cancel, lost capture, window pointer/touch end and unmount; `resetPointerInput` runs when the sim stops running (a panel opened over a held finger), on `visibilitychange` and `pagehide`; a watchdog clears a stick or a finger-held attack when no finger is on the screen (only once real touch events have been seen). Verified with touch-emulated scenarios (panel over a held stick, cancel, lost release, page hide, watchdog, held attack under a pause).

## Verification
- Reload test (headless): dead mob still dead with its timer, hurt monsters hurt, helper still awake, health, mana and both cooldowns kept, herb timer kept, the save contains the world. Descending after loading: no long task.
- Cold load under software GL: about 9.5 s behind the loading screen, every long task inside it, none in the following 3 s; no console errors.
