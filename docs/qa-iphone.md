# iPhone QA checklist

For the real-device pass of Phase 27. Everything here needs a real phone; the layout, leaks, offline and console checks are already done in phone emulation (see `docs/phases/phase-27.md`). Aim: find what only a real iPhone in Safari shows, and bring back numbers.

## Open the game on the phone
- **From the Mac** (same Wi-Fi): `npm run build && npm run preview -- --host`, then open `http://<the Mac's address>:4173/?perf=1` in Safari. (`npm run dev -- --host` works too, but its numbers are slower than a build.)
- **From the internet** after Phase 28: the same address with `?perf=1` at the end.
- `?perf=1` puts a small green panel on the screen with live numbers and two buttons. **Copy report** puts a text report on the clipboard (Safari asks for permission on plain `http`; if it shows a box with the text instead, copy it from there). **Reset** starts the counters again. The counters ignore pauses (menus, another tab).
- Also try "Share, Add to Home Screen" and open it from the icon (full-screen mode): safe areas and the status bar behave differently there.

## Bring back
For each scenario below: a report (Copy report), one line on how it felt, and any screenshot of something wrong. Report the phone model and iOS version.

| # | Scenario (60 s each) | What to look at |
|---|---|---|
| 1 | Red Square spawn, standing still | fps, draw calls (about 66), heap |
| 2 | Walk across the square, the garden and Zaryadye Park | stutters when new areas come into view |
| 3 | Fight three or four gloomy men with the trident and Space held | fps under load, stutters |
| 4 | Wait for drizzle (or stay a few minutes), then fight | fps with rain and mist |
| 5 | The metro pavilion, down the stairs, Layer 1, Layer 2 | loading hitches, fps underground |
| 6 | The boss on Layer 10 (needs level ~10, see the Depth panel) | fps, boss bar, effects |
| 7 | 10 minutes of normal play | phone heat, battery, whether fps falls over time, heap growth |

Targets: 30 fps or more all the time (55–60 is the goal), fewer than 1 stutter (frame over 50 ms) per 100 frames, draw calls 70 or fewer, no crash or reload in 10 minutes. If Auto graphics lowers the quality, note when.

## Feel and controls
- [ ] The stick starts wherever the thumb lands on the left half, never sticks after lifting the finger, after a second finger, after a phone call or after swiping up to the app switcher and back.
- [ ] Attack, Blink, Aura, Surge and Recall buttons are easy to hit and do not overlap the stick, the minimap or the potion buttons, in both orientations. Locked skills are dimmed and say their level.
- [ ] Two thumbs at once (stick + attack) works; holding attack keeps swinging.
- [ ] Text is readable at arm's length: bars, damage numbers, dialogue, quest log, bag.
- [ ] Panels (Bag, Quests, Settings, Depth, dialogue, welcome) fit in portrait and landscape; the buttons you need are reachable without hunting; the bag scrolls under a fixed Close button.
- [ ] The notch / Dynamic Island, the rounded corners and the home bar never cover a control or a bar.
- [ ] Rotating the phone mid-game does not break anything (camera, controls, panels).
- [ ] No accidental page zoom (double-tap, pinch), no pull-to-refresh, no text selection or magnifier when holding buttons.

## Sound
- [ ] Sound starts after the first tap (Begin / Continue). Nothing plays before.
- [ ] With the ringer switch on silent: note what happens (Web Audio may be muted by the switch; that is normal for Safari).
- [ ] Loudness on the phone speaker and on earphones: is the noise (swing, hit, wave, rain, wind) comfortable? Does the ambience disappear or stay too loud? (Settings has Volume and Ambience sliders.)
- [ ] Sound comes back after a phone call or leaving the app for a minute.

## Saves and network
- [ ] Play a few minutes, close the tab, open it again: "Welcome back", the same level, place and mobs.
- [ ] Airplane mode: the game keeps working, and the cloud label in Settings says it is offline.
- [ ] Private browsing: the game still starts (saves may not last).

## Report format
Paste into a message: model, iOS version, Safari or home-screen app, the reports for the scenarios, and the failed checkbox lines with one sentence each.
