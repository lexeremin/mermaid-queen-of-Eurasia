# Phase 26 — Skills and sixty levels

**Status:** ✅ Complete

## Goal
Rosa grows for much longer. The four abilities arrive one by one over the first ten levels, the level cap becomes 60, every tenth level after the tenth gives one of the abilities a passive effect, and at level 60 Rosa grows holy wings and a halo. The underground gets harder to match. The attack spell (Surge) gets more detail, and the white noise in the sound effects gets quieter.

## Skills by level
| Level | Gain |
|---|---|
| 1 | Trident (Space) |
| 3 | Aura (Q), needed for the first quest, "First Notes" |
| 6 | Blink (Shift) |
| 10 | Surge (R) |
| 20 | **Trident: sea wave.** Each swing also sends a wave of water along the swing that rolls about eight metres, hurting everything it passes once. The trident becomes a ranged attack as well. |
| 30 | **Aura: beams of light.** Six rays of light sweep round Rosa while she sings and hurt what they touch (once per half second each). |
| 40 | **Surge: leaping sharks.** Six small sharks jump out of the wave and crash down outside it, each with a small area blast. |
| 50 | **Blink: arcane blast.** A violet sigil opens where Rosa arrives, with an area blast. |
| 60 | **Holy wings and a halo** on the human Rosa (not on the temporary mermaid look). |

- Locked abilities do nothing and cost nothing. The ability bar and the touch buttons show them dimmed with "Lv N"; pressing a locked key says when it opens ("Aura unlocks at level 3"). Levelling up to a level that gives something adds a toast ("NEW SKILL: Aura unlocked", "NEW PASSIVE: ...", "HOLY WINGS").
- All level rules live in `src/systems/skills.ts`; `stepCombat` takes the level (default: every ability, no passives, so older tests are unchanged).

## Sixty levels
- `MAX_LEVEL` = 60. XP for the next level is 40, 70, 100... up to level 9 as before, then 350, 420... (`280 + 70 × (level − 9)`); about 105 000 XP in all. Enemies deep in the dungeon pay more, so Rosa gets to level 60 near the bottom (a full clear of every layer pays about 140 000 XP).
- Stats: levels 1–10 unchanged; each level after the tenth adds 14 health, 12 mana and 0.09 damage multiplier (instead of 10, 8 and 0.06). A level-60 Rosa has 890 health, 772 mana and a 6× damage multiplier.
- Save: `parseSave` already clamps to `MAX_LEVEL` and to the XP of the level, so old saves load as they were (a level-10 save is a level-10 Rosa with all four abilities).

## Harder dungeon
- Power of a layer: `1 + 0.06 (n − 1) + 0.0004 (n − 1)²` (layer 10: 1.6, layer 50: 4.9, layer 100: 10.0; it was 6.9 at layer 100). Health scales with it, damage with 42% of the extra, XP with a third.
- The test bot (starter gear, no potions, plain stab and Surge) needs about level 10 for layer 10, 14 for layer 20, 20 for layers 30 and 40, 22 for layer 50, 33 for layers 60 and 70, and level 45–52 for layers 80–100; tests fix a few of these numbers so the curve cannot go soft by accident.

## Sound
- The noise-based sounds are about half as loud and duller (swing, hit, wave, hurt, blink, splash, boss roar and fall, drizzle hiss, wind), and the shared noise buffer is now soft (white noise through a gentle low-pass, `fillSoftNoise`) so it hisses less. Blast has a new sound (`blast`), and passive effects play the soft splash.

## Visuals (all drawn in code, no new asset files)
- **Surge** gets foam arms swirling inside the wave and droplets thrown up in arcs; the trident swing throws foam droplets off its sweep.
- **Sea wave**: a curved wall of water with a foam edge, a wake of spray, fading out at the end of its range.
- **Light beams**: additive rays from Rosa, tapered and flickering.
- **Sharks**: small low-poly sharks (back, pale belly, dorsal, tail and side fins) on a jump arc that leaves a shower of water, and a splash ring and crown of droplets where they land.
- **Arcane blast**: an additive violet sigil (two rings and an eight-pointed star) that turns as it opens, and rising sparks.
- **Wings and halo**: three rows of leaf-shaped feathers per wing, white to pale gold, swept back, plus a thin gold ring above the head; one mesh, one draw call, swaying gently.
- New layers are instanced and additive, and refilled every frame (`SkillEffects.tsx`, geometry in `skill-geometry.ts`); when nothing is happening they cost no draw call.

## Steps
1. Skills module, level cap, XP and stats, difficulty curve.
2. Combat: unlock gates, sea waves, beams, sharks, blast; tests.
3. HUD locked state, toasts.
4. Effects, wings and halo; browser check; draw calls.
5. Sound; docs.

## Definition of done
- Abilities open at levels 1, 3, 6 and 10 and do nothing before; the four passives start exactly at 20, 30, 40 and 50; the wings and halo at 60; a level-10 save keeps working.
- Boss layers scale with depth (tests). Draw calls: the new effects add one call per kind that is showing (arms and droplets for Surge, sharks, the sigil, beams, a sea wave); a Surge or blink blast can push a busy scene a few calls past 70 for under a second (Surge already did before this phase); wings and halo add one call at level 60.
- Typecheck, lint, prettier, tests, build, `assets:check`.

## Follow-up: sword hold and a three-swing auto-attack
- **Prince Sasha's sword.** The Blender model holds it pointing straight up, so the blade ran through his own forearm. It is now tipped forward and up at rest (about 60° from vertical, pivoting at the grip), clear of the arm. This is done at load time in `CompanionActor.tsx` on the `sword` node, so the model files are unchanged. The exported weapon nodes (the sword, and Rosa's trident) sit at the centre of their meshes, not in the hand, so `poseTool` turns them about a grip point (`SWORD_GRIP`, `TRIDENT_GRIP`) instead of the node origin; the first attempt turned the sword about the wrong point and it floated away from his hand.
- **Three different auto-attacks**, in a chain for both Rosa and Sasha (`TRIDENT_COMBO` in `abilities.ts`, `COMPANION_COMBO` in `companion.ts`): 1) a **forehand** sideways slash from the right across the front to the left, 2) a wider **backhand** back again, 3) a slower **finisher** chop, raised over the head and brought down and forward with the body leaning into it, narrower, reaching 4.1 m instead of 3.4, hitting for 1.7× (Sasha 1.6×) with more knockback. The chain restarts after a pause (1.1 s for Rosa, 1.6 s for Sasha), and the finisher takes longer before the next attack (0.75 s against 0.45 s).
- **Animation** is in `entities/swing-pose.ts` (keyframed poses, unit-tested): the weapon arm, the weapon's own pitch (the trident is slid along itself so it is gripped near its butt end in the slashes), a twist of the whole body for the sideways sweep, and a lean. The slash effect on the ground sweeps the same way, and the finisher's is a long narrow chop.
- Sasha's swing now starts when he raises the sword, so the blow lands as the slash passes the front.

### Second follow-up: a normal hold, his own swings, and right-click aiming
- **Sasha at rest** now holds the sword the way a knight does at the ready: the arm a little forward from his side and the blade pointing up and slightly ahead, in front of his arm and not through it. The tilt used before made it stick out sideways.
- **His swings are his own**, not Rosa's: a diagonal cut from high right down across the body to low left, a rising cut back up to the high right, and an overhead chop as the finisher (`sword` chain in `swing-pose.ts`, which now also rolls the arm out to the side). Rosa keeps the level sweeps and the chop of the trident. Both go back to their rest pose after each swing.
- **Right mouse button** attacks toward the cursor: while it is held, Rosa turns to the cursor's direction on the ground and strikes that way (aim assist is off for it), following the mouse as it moves, like the left-click movement. Closer than 0.4 m to Rosa the cursor gives no direction, and the usual aim assist applies. Touch and keyboard attacks are unchanged.

## Verification
- 603 tests (new: `skills.test.ts`, `combat-passives.test.ts` with locks, all four passives and fainting, soft noise, deeper boss-layer balance), lint, prettier, build, `assets:check`.
- Browser (headless): level 1 shows the locked slots and "Aura unlocks at level 3" with no cast; level 60 shows halo and wings, sea wave, Aura beams, sharks around the Surge wave and the violet blast; no errors.
