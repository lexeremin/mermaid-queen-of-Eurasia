# Phase 5 — Hero redesign + direction change

**Status:** ✅ Complete

## Goal
Two direction changes requested by the user after Phase 4:
1. Hero: a stylized low-poly character based on the look of a real, consenting person (reference photo, kept out of git) instead of a cartoon mermaid. Mermaid becomes a transformation with a special skill.
2. Setting: Red Square in Moscow replaces the winter village (built in Phase 6).

Phase 5 lands the docs for both and delivers the new hero models. Phase 6 builds the map.

## Decisions (2026-09-24)
| Topic | Decision |
|---|---|
| Person | The user or someone who agreed (confirmed in chat). See `docs/likeness-and-consent.md` |
| Fidelity | Stylized low-poly inspired by the look. No face scan, no photo textures |
| Setting | Red Square district replaces the village. Winter/snow stays |
| Mermaid | A transformation (form 1) with special skill **Tidal Song** |
| Name | Rosa |
| Location mapping | village → Red Square district, forest → Alexander Garden, dungeon → Moscow underground |
| Roadmap | Old phases 5–15 become 7–17 |

## Hero design (from the reference; described, not identified)
- **Hair:** dark brown/black updo with a top bun, soft wavy strands framing the face, slightly lighter brown highlights on the bun.
- **Roses:** cluster of 5 stacked roses on the head's left side (viewer's right): cream, blush and lilac-pearl, largest at the top.
- **Face (simplified):** warm light skin, dark almond eyes with a small brow, nude-pink lips.
- **Outfit:** ivory tweed jacket with a wide boat neckline and structured shoulders, dark winter boots; loose white and pale-blue petals drifting near the shoulders (a `petals` node that sways).
- **Trident:** gold shaft, aqua prongs, held in the right hand.
- **Mermaid form:** same head, hair, roses and petals; jacket becomes a rose-and-pearl shell top; legs replaced by the teal tail chain and pearl fin.

## Scope
1. **Docs:** `Description.md`, product overview, design direction, features, Task.md (phases 5–6 inserted), security rules, `likeness-and-consent.md`.
2. **Palette v2:** about 44 colors in a 128×128 atlas (64 slots). Rebuild every existing asset from its script and re-optimize (UVs depend on atlas size).
3. **Hero builders** `tools/blender/build_hero.py`: `char_rosa` (human) and `char_rosa_mermaid`, sharing head/hair/roses/petals/trident code. Rigid-part node hierarchy with `idle` and `walk` clips.
4. **Engine:** manifest entries `rosa` and `rosaMermaid`; `form` in `useGameStore`; `Player` picks the model by form; dev-only `?form=mermaid` to view the mermaid model.
5. **Ledger and budgets:** both models registered; ≤ 3 000 triangles each.

## Result
- Docs: `Description.md` (pitch, style, guardrails, locations, transformations), product overview, design direction, features, Task.md (phases renumbered), security rules, new `docs/likeness-and-consent.md`.
- **Palette v2:** 46 colors on a 128×128 atlas (added hair_dark, hair_brown, ivory, blush, lilac, stone, ruby, brick_dark/light, dome_green/blue/red, cobble_dark/light). All 17 assets rebuilt from their scripts and re-optimized (same triangle counts; proves reproducibility).
- **Hero builders** `tools/blender/build_hero.py`; shared `author_clips()` in `lib.py`. `char_rosa` 906 tris / 26 KB (human: updo with bun, 7 roses, ivory boat-neck jacket with gold buttons, dark trousers and boots, drifting petals, trident, clips idle/walk). `char_rosa_mermaid` 894 tris / 33 KB (same head, hair, roses and petals with rose-and-pearl top and a teal tail chain, clips idle/walk).
- **Engine:** `HeroForm` in `useGameStore`; `Player` renders `RosaModel` keyed by form; dev hook `window.__mq.setForm()` / `?form=mermaid`, plus `__mq.input` to switch off mouse aim for screenshots.
- **Verified in browser:** human walk peaks at 0.50 rad (authored 0.5), mermaid idle 0.05 / walk 0.22 (authored), form switching both ways works, front view matches the reference styling notes. `assets:check` passes for 17 assets; reference photo is git-ignored (`git check-ignore` confirms).
- Not verified: iPhone hardware.

## Notes for later phases
- The village and its assets stay until Phase 6 replaces them; palette rebuild kept them consistent.
- Idle has no leg motion (legs only swing in `walk`).
- Petals sway in both forms; consider a petal particle effect in the polish phase.

## Mermaid skill: Tidal Song (design note)
Area charm wave centered on Rosa: nearby men are mesmerized (become allies for a short time or join the kingdom if relationship is high enough), enemies are slowed, and while the mermaid form is active she can cross water (river, fountains). Costs mana, has a cooldown. Implemented in Combat / Transformations phases.

## Out of scope
Form-switch unlock flow and VFX (Transformations phase), NPC art, the Red Square map (Phase 6).

## Steps
1. Docs and roadmap edits (this file first).
2. Palette v2 + atlas + tests; rebuild and re-optimize all assets.
3. Build the human hero and check it against the reference in Blender.
4. Build the mermaid form with the shared head.
5. Engine wiring, browser verification (both forms, idle/walk).
6. Commit, push, advance Task.md.

## DoD
- Both hero GLBs pass `npm run assets:check` (triangle, size, texture, manifest, ledger).
- Human Rosa plays `idle`/`walk` in game; `?form=mermaid` shows the mermaid model with its clips.
- Styling matches the reference notes (updo + bun, rose cluster, ivory boat-neck jacket, petals).
- The reference photo is not tracked by git; consent recorded.
- typecheck, lint, prettier, tests, build pass; no console errors on desktop and 375×812.
