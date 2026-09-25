# Phase 18 — Mermaid Queen

**Status:** ✅ Complete

## Goal
Rosa's mermaid form becomes a real, persistent transformation: earned through a quest, switched on and off with one button, with its own song (Tidal Song), its own way of moving, and the one thing only a mermaid can do: swim. The model and the temporary mermaid look during Aura and Surge already exist.

## Design
- **Unlock:** the quest *Return to the Water* (rank 1): visit the Pearl Shrine and bring four pearls (level 4 is not required; pearls are the gate). Its reward unlocks the form (`QuestReward.unlocks`), shows a banner and a toast. Unlocked forms are saved (`progress.forms`).
- **Switching:** a small round form icon in the corner dock (only once unlocked) and the `F` key. Instant, with a burst of bubbles and a 2 s pause before it can be used again. Not while fainted or fading between areas. It interrupts a Recall channel.
- **Modifier (mermaid form):** +2 mana per second; 10% slower on land; 35% faster while swimming.
- **Tidal Song** replaces the Aura song while in mermaid form (same key, same 30 mana and 8 s cooldown, new name and icon): rings reach 12 m instead of 8, four rings instead of three, charm lasts 24 s instead of 12, monsters are blinded for 8 s instead of 5 (the boss still only a quarter of that).
- **Swimming:** the mermaid form ignores water colliders (the garden pond), so she can swim in it; the walk grid and Blink's region test follow. Two hidden pearls sit in the water at the pond's ends, out of reach on foot. If she switches back to human in the water she is pushed to the bank.
- **Save v8:** `progress.forms` (a save whose hero is a mermaid keeps the form unlocked); the current form is still `hero.form` (a mermaid hero without the unlock is made human on load).
- Events: `form_unlocked`, `form_switched`.

## Scope
1. Stats and movement per form, Tidal Song constants, combat variant (tested).
2. Forms in the progress store, save v8, quest unlock flow.
3. Water crossing (world colliders, swim speed) and the two pond pearls.
4. UI: form button and key, Tidal Song name/icon on the skill slot and in the controls popup, cast visuals sized to the song.
5. Verification in the browser, docs, commit.

## Out of scope
Forest Spirit, Elvish Form and Tsarina (stretch list); new mermaid art; audio for the switch beyond the existing bubble sound.

## DoD
- The quest unlocks the form; before that there is no form button and `F` does nothing.
- Switching works, changes the model, the song and the speed, and survives a reload.
- In mermaid form Rosa can swim into the garden pond and take its pearls; as a human she cannot.
- typecheck, lint, prettier, tests, build pass; draw calls unchanged.

## As built
- `src/game/form-sim.ts`: `toggleForm` (locked / busy / switched), `unlockMermaid`, and `syncWaterToForm`, which removes the water colliders from the live world while Rosa is a mermaid and puts them back for a human (and re-warms the walk grid). `CollisionWorld.water` lists them; `src/systems/water.ts` `isInWater` drives the swim speed.
- `abilities.ts`: `TIDAL`, `MERMAID`, `songFor(form)`; combat keeps the song it was cast with (`aura.song`), so the effects and the timers follow it. `computeStats(level, equipment, form)` adds the mana regeneration; `stepPlayer` takes a speed multiplier.
- Quest *Return to the Water* (rank 1: visit the Pearl Shrine, four pearls) with `reward.unlocks: ['mermaid']`; a banner "MERMAID QUEEN / FORM UNLOCKED". Two extra pearls (`pearl-6`, `pearl-7`) lie in the pond's blocked ends.
- Save v8 (`progress.forms`, migration 7 to 8, a mermaid hero without the unlock becomes human). Forms are part of the cloud progress key.
- UI: round form icon (glows teal while mermaid) beside Recall, key `F`; the Aura slot becomes "Tidal Song" with its own icon (touch: TIDE); controls popup updated.
- Fixed on the way: Rosa's X-ray twins were created twice when an effect ran twice (two extra draw calls per part in dev); creation is idempotent now.

## Verification
- Headless: no form button and `F` does nothing before the unlock; after it the button appears, `F` switches (the slot reads Tidal Song, the ring reaches 12 m), a human is stopped at the pond bank while the mermaid swims in and takes `pearl-6`, the form and the unlock survive a reload. Draw calls at spawn: 63 human, 67 mermaid. 460 unit tests (Tidal Song reach and duration, form switching rules, water colliders, swim speed, stats, the unlock quest, save v8).
