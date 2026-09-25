# Phase 25 — Polish

**Status:** ✅ Complete

## Goal
Sound, weather and feedback: the small things that make the game feel finished. Everything is synthesized or drawn in code, so there are no new asset files.

## Sound
- **Master volume and ambience sliders** (Settings). Everything Rosa hears now goes through one master gain (`masterBus` in `audio/engine.ts`, volume on a squared curve, silent when sound is off); the ambience has its own level.
- **Twelve new sounds** (`SPECS` in `audio/recipes.ts`, described as data: tones with a glide plus filtered noise, played by one generic player): UI tick, level-up, quest accepted, quest done, loot picked up, hurt, fainted, blink, splash (entering water), the boss's roar (phase change), the boss's fall, and a bright ping for big hits. Tests keep every sound short, quiet and in range.
- **Wired in:** every button in menus, panels, dialogue and tabs ticks (one delegated listener; action buttons and the minimap do not); level-up, quest accept/claim, loot, Rosa hurt/fainted, blink, swimming, boss phases and the boss's defeat.
- **Ambience** (`audio/ambience.ts`, plan in `systems/ambience.ts`): generative and very quiet. On the surface wind, a soft pad, an occasional distant bell from an A minor scale and the drizzle's hiss; underground a low drone with drips; in a boss arena a slow pulse. Scenes cross-fade; it starts with the first click or key press, like the other sounds.

## Weather
- **Drizzle and mist** (`game/world/WeatherEffects.tsx`, state machine in `systems/weather.ts`): clear spells of 90–240 s and drizzle spells of 40–120 s with an 8 s fade. Drizzle is one draw call of streaks around Rosa, mist one draw call of ten soft drifting puffs. Off underground, off on Low graphics, fewer streaks on Medium, and switchable in Settings.

## Feedback
- **Floating damage numbers** (`ui/DamageNumbers.tsx`): white for Rosa's hits, larger and gold from 35 damage, red with a minus for damage Rosa takes; a pool of 24 HTML elements moved every frame without re-rendering; setting to turn them off.
- **Screen shake** (`systems/shake.ts`, camera rig): "trauma" builds with hurts, faints, boss phases and boss falls and drains away, shaking with its square. It starts off for people whose system asks for reduced motion, and can be switched off in Settings.
- Combat's `enemyHit` event now carries the position and amount.

## Title screen
A saved game now opens on a **Welcome back** screen with Continue, New game and Settings and a summary (level, on the surface or how deep, time played). It is also the first click of the session, which unlocks the audio. A brand new game keeps the welcome screen (which gained a Settings button). The dev parameter `?welcome=0` skips both.

## Settings
Sound, Volume, Ambience, Screen shake, Weather, Damage numbers, Anonymous stats, Graphics, Controls; saved with the other settings. The popup scrolls on small screens.

## Verification
- 580 tests (new: sound recipes, ambience plan, floating numbers, shake, weather, settings, button sounds, title summary), lint, prettier, build, `assets:check`.
- Browser: welcome then Begin (ambience starts, UI tick logged), a fight (damage number "14", swing, hit and hurt sounds, shake trauma rising), drizzle and mist rendering, volume slider saved, reload shows Welcome back with the summary and Continue enters the game, phone-size Settings scrolls; no console errors.
- Draw calls at spawn: 66 dry, 67 in drizzle (the budget is 70); a fight in the plaza plus drizzle reached 71 on the software renderer, so the drizzle is the first thing to drop when Auto lowers the graphics.

## Not done
The real-device frame rate and the sound levels on phone speakers are unchecked (Phase 26).
