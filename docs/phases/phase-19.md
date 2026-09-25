# Phase 19 — Water and performance

**Status:** ✅ Complete

## Goal
Swimming that works and is visible, loading screens only where they belong, and a game that runs smoothly on more machines, before the art polish and the big content phases that follow (see Task.md).

## What changed
- **Swimming reworked.** Water is no longer a wall: stepping into a pond end or the river turns Rosa into a mermaid on the spot (splash, ripples, a low leaning swim pose, +35% speed), and a moment after she leaves the water she is human again, unless she chose the form herself with `F` (`stepWater` in `form-sim.ts`). Fountains stay solid props. Water is a set of swim zones (`Water.swimRuns` in the map data, `CollisionWorld.water`, `isInWater`); the middle of the pond under the Trinity Bridge is not water, so crossing the bridge never turns her.
- **The Moskva River is reachable:** the garden path continues north from the Pearl Shrine to a riverbank (lamps, lindens, benches), the map now reaches z -64, a blocker keeps everything else north of Red Square closed, the shrine nook got a hedge on its new north side, and the river is a swim zone with its own zone banner and map label.
- **Loading screens:** the loading screen is only shown while the page loads (a browser reload). Moving between areas (metro, stairs, Recall) uses the short black fade; nothing else blocks the game.
- **Performance:**
  - The palette material is split in two: the plain one has no `discard`, so the GPU keeps early depth testing (phones and Apple GPUs lose a lot when a shader can discard); only tall buildings and props that can hide Rosa get the see-through dither material and fade attribute.
  - Lantern glow only for the nearest lanterns (18 on High), updated a few times a second, instead of 54 large additive sprites everywhere.
  - **Graphics** setting (Settings): Auto, High, Medium, Low. Auto starts on High and steps down or up by frame rate (drei `PerformanceMonitor`); Medium and Low lower the pixel ratio and the glow. Saved with the settings.
  - Sound effects buffers are built at the first gesture (no stall on the first hit); HUD elements only touch the DOM when something changed.
- Profiling notes: JS on the main thread is about 15% busy in play (the rest idle), so the frame rate is limited by drawing, not by game logic; in software rendering the instanced world is about half of the frame cost.

## Verification
- Headless: a human walks into the pond and becomes a mermaid, walks out and is human again, walks up the garden path to the river and swims along it; the fountain still blocks; no console errors.
- typecheck, lint, prettier, 468 tests, build.
