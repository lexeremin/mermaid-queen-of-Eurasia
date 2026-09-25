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

### Sound (revised after review)
- **Aura:** one quiet sung "ah" (`rosa_aura.mp3`, 4 s of "Vocalise" from the songs folder; chosen by measuring voicing and loudness, not by listening). It fades out if Rosa faints. The other voice clips (attack and special-attack cries, two more Aura phrases) were removed.
- **Trident attack:** a synthesized swing whoosh when she swings, and a soft thud on every hit that lands (Rosa's or the companion's).
- **Dash:** a short run of cute rising bubble pops. **Tide Surge:** a cozy rolling wave (filtered noise swell with a soft three-note pad underneath, 2 s).
- All of it is WebAudio (`src/audio`: `engine`, `voice`, `sfx`, `recipes`), unlocked on the first key press or click, quiet by design (nothing above gain 0.35). `SOUND: ON/OFF` in the menu. The sounds are driven by pure combat events (`cast`, `enemyHit`), so they always match an ability that actually fired.

### Menu
- The pause menu now has the animated mermaid Rosa on top (a small separate canvas, idle clip, slow turn), the game name **Mermaid Queen of Eurasia**, a controls hint (now including `J` quests and `1`/`2` quick use), the sound and stats toggles, and a **GITHUB PROJECT** link (opens in a new tab). The menu scrolls inside the panel on small screens.

### Fix found on the way
- Pressing `E` or `Space` to continue a dialogue line also left a pending interact or attack press, so the dialogue reopened (or Rosa swung) the moment it closed. Dialogue key handling now clears pending presses.

## Verification
- 274 tests (was 249): companion movement, walls, fighting, strike rate and lunge, no stuttering while keeping pace; combat `cast` and `enemyHit` events and companion integration; the follow dialogue in every state; saves for the `following` flag; sound recipes.
- Headless Chromium, real key presses: attack played swing then hit, dash bubbles, surge wave, and aura the sung sample; the follow option, reply and toast; the companion followed Rosa through a walk and killed an enemy (26 → 15 → 0 HP) with the kill credited to Rosa; no console errors. Menu: 440×728 panel on desktop, 343×717 with no page scroll on 375×812, mermaid animating, link points at the repository.
- Audio was verified by playback log and decoding, not by listening.

## Notes
- The companion is invulnerable and always fights on Rosa's side; a later phase could give him health, a downed state and equipment.
- A title screen at game start was planned for a later phase; the welcome screen (16d) covers new games, a title screen for returning players is in Phase 19.

## Follow-up fixes
- **Old dialogue spot:** a following NPC stayed "talkable" at his original map position (walking there showed the prompt and opened his dialogue). He is now removed from talk spots, click picking and Aura charm targets while he follows. A **TALK** button (portrait and label; bottom right on desktop, left column on touch) appears only while someone follows and opens his dialogue from anywhere; it hides during dialogue, menus and panels.
- **Follower animation:** he is now interpolated between simulation steps like Rosa, turns smoothly, and the walk clip is chosen from his per-step movement (the old per-frame check flickered between walk and idle). He matches Rosa's speed while she walks instead of stopping and restarting, so the legs run a steady walk cycle (2 clip switches over a 6 s walk-and-stop, down from 17).

