# Phase 14c — Prince Sasha companion, Rosa's voice, menu

**Status:** ✅ Complete

## Goal
Requested after Phase 14b: move two NPCs that were hard to see, give Prince Sasha the owner's look and a way to fight beside Rosa, give Rosa a voice from the owner's recordings, and dress up the menu.

## Changes

### NPC positions
- **Maksim** (`grisha`) was behind a wall from the camera: now at (4.2, 11.5) on the plaza. **Sergey** (`sergei`) is at (−3.4, 5.5), away from Prince Sasha and the board. Both are on free ground and reachable (existing placement tests).

### Prince Sasha
- **Likeness:** face and hair restyled after the owner's photo (swept brown hair with volume on top, light grey-blue eyes, straight brows, light stubble, a slight smile) while keeping the prince costume. Stylized, no scan or texture. Consent and handling are recorded in `docs/likeness-and-consent.md` and the ledger.
- **Follow option:** once he is mesmerized (relationship ≥ 60), or after he joined, Rosa gets the option "Prince, ride with me and fight beside me." He answers "I will follow you, my queen! My sword is yours." While he follows, talking to him offers "Wait here for me, Prince." (he stays and polishes his sword). Data-driven: an NPC with a `companion` block in `src/data/npcs.ts` gets these nodes; dialogue gained a `following` condition and a `follow` effect.
- **Companion:** `systems/companion.ts` (pure, tested). He keeps beside Rosa (behind and to the side, faster than her so he never falls behind, appears next to her if she gets more than 22 m away), targets the nearest enemy within 7.5 m of Rosa, charges it, winds up 0.16 s, strikes for 11 damage (scaled by her damage stat) with a lunge forward, and recovers 0.45 s. Kills he makes give Rosa the XP and loot. He is not hurt by enemies (a slice simplification) and does not fight while Rosa is down.
- **Look while following:** `npc_prince_knight.glb`: no bottle and no crate, a sword in his right hand, rigid parts with `idle` and `walk` clips; the sword arm swings procedurally like Rosa's trident. His kefir-selling model is hidden while he follows. The follow state is saved (`following` on each saved NPC; older saves load as not following).

### Rosa's voice
- **Samples:** 9 short MP3 clips (about 130 KB) cut from the songs folder by `tools/audio/extract-voice.py`. Selection was measured, not heard: every recording was analysed for voicing (pitch by autocorrelation) and loudness. Attack cries are isolated 0.27–0.41 s sung notes with a clean onset; special-attack cries are isolated 0.8 s and 1.2 s strong high notes; the Aura song is 4 s of sustained voiced singing from "Vocalise" starting on a note onset. Any entry in the script can be swapped.
- **Playback (`src/audio`):** WebAudio, unlocked on the first key press or click, samples preloaded then. Trident attack: one of 4 cries, never the same twice in a row, pitch varied ±7%. Tide Surge: one of 2 cries. Aura: one of 3 sung phrases, which fades out if Rosa faints. `SOUND: ON/OFF` in the menu (saved in settings). Events come from the pure combat step (`cast` events), so voice always matches an ability that actually fired.

### Menu
- The pause menu now has the animated mermaid Rosa on top (a small separate canvas, idle clip, slow turn), the game name **Mermaid Queen of Eurasia**, a controls hint (now including `J` quests and `1`/`2` quick use), the sound and stats toggles, and a **GITHUB PROJECT** link (opens in a new tab). The menu scrolls inside the panel on small screens.

### Fix found on the way
- Pressing `E` or `Space` to continue a dialogue line also left a pending interact or attack press, so the dialogue reopened (or Rosa swung) the moment it closed. Dialogue key handling now clears pending presses.

## Verification
- 273 tests (was 249): companion movement, walls, fighting, strike rate and lunge; combat `cast` events and companion integration; the follow dialogue in every state; saves for the `following` flag; voice variant selection.
- Headless Chromium, real key presses: attack, aura and spell each played a voice sample (with pitch variation on attacks); the follow option, reply and toast; the companion followed Rosa through a walk and killed an enemy (26 → 15 → 0 HP) with the kill credited to Rosa; no console errors. Menu: 440×728 panel on desktop, 343×717 with no page scroll on 375×812, mermaid animating, link points at the repository.
- Audio was verified by playback log and decoding, not by listening.

## Notes
- The companion is invulnerable and always fights on Rosa's side; a later phase could give him health, a downed state and equipment.
- A title screen at game start is still planned for Phase 18 (the menu here is the pause menu).
