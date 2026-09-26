# Phase 27 — Real-device QA

**Status:** ✅ Complete (the real-device pass itself is the owner's, see below)

## Goal
Find and fix what breaks or feels bad on a phone, and give the person with a real iPhone a short, precise way to check the rest and report numbers.

## What can and cannot be done here
There is no iPhone and no working iOS Simulator on the development machine (Xcode's command line tools do not run), and only Chromium is installed for automated tests. So this phase does **everything that can be checked with phone emulation and code review**, and ships an **on-device report** for the things only a real phone can say (real frame rate, heat, phone-speaker loudness, Safari quirks). The real-device pass itself is done by the owner, with `docs/qa-iphone.md`.

## Scope
1. **Emulated phone audit** (Chromium with iPhone 13 and iPhone SE profiles: touch, mobile user agent, device pixel ratio 3, portrait and landscape): every HUD control and panel measured for touch targets (≥ 44 pt), overlaps that a finger would hit, controls off the screen, panels that need scrolling, and horizontal scroll; fix what turns up.
2. **Compatibility review** of the build target and of browser features the code relies on, against iOS Safari 15.4 and later.
3. **Performance and memory**: draw calls and triangles in every scene with the heaviest effects on (level-60 skills, boss fight, drizzle), a soak run for leaks (JS heap and WebGL object counts), payload sizes.
4. **Offline and console sweep**: no Supabase, no network, a tour of every screen with no errors.
5. **On-device report** (`?perf=1`): a small overlay for production builds with FPS (average, worst), frame-time spikes, draw calls, triangles, pixel ratio, graphics tier, screen size and memory where the browser tells, and a button that copies a text report to paste back.
6. **`docs/qa-iphone.md`**: the checklist for the real-device pass.

## Findings and fixes
**Phone emulation audit** (iPhone SE 320×568 and iPhone 13 390×844, touch and mobile agent, portrait and landscape; welcome, HUD, Bag, Quests, Map, Pause, dialogue; every button, its size, whether it is on screen, whether it overlaps another one that is actually on top):
- **Welcome and pause menus were below the fold in landscape and on the SE**: the big 3D mermaid took the room, and Begin, Settings and Controls needed scrolling. Sideways the picture is now left out (also saving a second WebGL context on phones) and the buttons sit in a row; short portrait screens get a smaller picture and text. Nothing scrolls now.
- **Dialogue choices** were below the fold when a character had four or five (Goodbye unreachable without scrolling). Sideways they are in two columns and smaller everywhere on short screens.
- **Recall button 39 px** on the narrowest phones (the button cluster is scaled down there): made bigger so it ends up 44 px.
- Nothing else: no control off the screen, no overlap that a finger could hit, no horizontal scroll. What still scrolls is meant to (the bag grid under its fixed Close button).

**Compatibility**: the build targeted current Safari only and used syntax from Safari 16.4 (class static blocks). It now targets Safari 15 (`build.target`), with no measurable size change. The code was checked for newer browser features (structuredClone, toSorted, findLast, randomUUID, replaceAll, lookbehind and the like): none used; `Array.at` needs Safari 15.4, so **iOS 15.4 is the minimum**.

**Leak found and fixed**: soak run with a throttled CPU (six rounds of fighting, skills, boss layer and back): heap steady (about 80 MB), no growth, but the number of geometries on the graphics card grew by one or two on every visit to a dungeon layer. The merged floors and ribbons were built by hand and passed in as props, which React Three Fiber does not free. They are now freed when their component goes (`useDispose`), and the count stays flat (checked: 12 visits, 72 geometries the whole time, no orphans).

**Offline**: with every Supabase request blocked, the game loads, plays, changes layer and reloads with no page error and no unhandled rejection; the only console lines are the browser's own "failed to load" for the blocked requests. The cloud sign-in already backs off.

**On-device report (`?perf=1`)**: frame rate (average, 95th percentile, worst), stutters over 50 ms, draw calls, triangles, textures, geometries, pixel ratio, GPU name, JS heap where Safari gives it, and a Copy report button. Pauses longer than a second (menus, another tab) are left out of the numbers. It works in the production build and costs nothing when the parameter is missing.

**Numbers**: production build 1.5 MB of script (435 kB gzip) plus 214 kB for the cloud code, loaded in about 9 s on the software renderer. On a 4× slowed CPU with software GL (so the frame rates mean little), draw calls were 49–66 in every scene of the soak run and triangles about 117 000.

## Not done (needs a real iPhone)
Real frame rate and heat, the sound on phone speakers and earphones, the silent switch, Safari's own quirks (home-screen mode, safe areas on a real notch, gesture conflicts, audio resume after a call), and touch feel. `docs/qa-iphone.md` lists what to check and what to bring back.

## Definition of done
- The audits above ran with no touch target under 40 px, no control off the screen, nothing that overlaps and can be hit, and no menu whose main button is below the fold, in portrait and landscape on both profiles.
- Draw calls ≤ 70 apart from brief effect peaks; heap stable in the soak run; no console errors offline.
- `?perf=1` and the checklist exist; the not-done list says plainly what only a real phone can confirm.
- Typecheck, lint, prettier, tests, build, `assets:check`.
