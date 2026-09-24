# Phase 12b — Satirical politician enemies + blind debuff

**Status:** ✅ Complete

## Request and decision (2026-09-24)
The user asked to replace the enemies with characters that look like three named real, living political leaders, with different weapons, and to make Rosa's song blind them instead of charming them.

- **Likenesses of real politicians: declined.** The project brief (and `docs/likeness-and-consent.md`) says the politicians must not resemble real people, and I would not build recognizable versions of real, living leaders as targets to fight. Offered alternatives; the user chose **original satirical politicians**.
- **Weapons and blind debuff: done as asked** (blind = blindfold icon and missed attacks).

## The enemies (original caricatures, defined by costume and weapon)
| Enemy | Weapon | Role | HP | Notes |
|---|---|---|---|---|
| **Gavel Speaker** | enormous gavel | slow heavy | 70 | robed, powdered wig; 18-damage slam with a 0.75 s ground telegraph; armored windup |
| **Golden-Pen Tycoon** | giant golden fountain pen | fast lunger | 24 | top hat, monocle, gold waistcoat; 8 damage, lunges during the stab |
| **Megaphone Demagogue** | megaphone | ranged | 32 | on a soapbox; sound-wave blasts (9 damage), keeps 5–8 m away |

They replace Stamp Golem, Paper Wisp and Memo Thrower one for one (same AI roles; `EnemyKind` is now `speaker | tycoon | demagogue`). Costume choices deliberately avoid any real person's signature look. Models 418–436 triangles, about 8 KB each, single static mesh.

## Blind debuff (replaces "lovestruck" for enemies)
- The Aura blinds every enemy its rings reach for 5 s (`AURA.enemyBlind`).
- A blinded enemy wanders at 45% speed (direction re-rolled every 0.7 s, deterministic per enemy id), and flails every 1.4 s: melee swings **hit only if Rosa is practically touching it (0.9 m)**; ranged blasts fly in a random direction.
- Damage does not break the debuff; it ends by itself and the enemy re-aggros.
- Visuals: a dark blindfold band across the head and a floating crossed-out eye above it (`BlindMark`), plus a flailing lean.
- NPC men still get the heart and the ×1.5 persuasion bonus.
- Projectiles are now sound-wave arcs; enemy health bars, telegraphs and debuff icons no longer rotate with the enemy's facing (they used to inherit its yaw).

## Verification
- 165 tests: blinded enemies wander and swing flagged as blind, ranged blind shots are not aimed, behavior is deterministic per id, damage keeps the state, and in the combat step a swing at 1.6 m misses while a swing at 0.6 m hits.
- Browser: all three visible in the plaza, the song blinds them (states `blinded`), crossed-out eyes and blindfolds visible, no console errors, 52–67 draw calls with three enemies on screen.
- `assets:check` passes (47 assets); ledger updated, old `enemy_wisp`, `enemy_stamper`, `enemy_memo` retired.

## Notes
- `docs/phases/phase-12.md` describes the original monster names; this file supersedes them.
- The boss (Phase 16) should be immune to the blind debuff.
