# Phase 14b — Renames, Prince Sasha, spell looks, icons

**Status:** ✅ Complete

## Goal
Polish pass requested after Phase 14: rename and redesign a few characters, make each of Rosa's abilities look like what it is, and give abilities and items proper icons.

## Changes

### Characters
- **Prince Sasha** (id `mikhalych`, asset `npc_mikhalych`): renamed from Sasha Prince, now a Kefir Seller who is a handsome young prince: blond swept hair, ruby crown, blue tailcoat with gold epaulettes, red sash, cape, white trousers and tall boots, a bottle in hand and a crate of kefir at his feet (`build_mikhalych` in `tools/blender/build_npcs.py`, 828 triangles). His lines were rewritten in a princely voice (mechanics and deltas unchanged). He now stands at (2.6, 21.4), a few steps from Rosa's spawn (0, 24). Saves are unaffected (the id did not change).
- **Enemy display names:** Golden-Pen Tycoon → **Zelebeba**, Gavel Speaker → **Uncle Sosunok**, Megaphone Demagogue → **Ugrumiy Putan**. Designs, weapons and ids are unchanged. The quest formerly called Gavel Down is now **Overrule Sosunok** and quest objective text no longer pluralizes enemy names.

### Rosa's abilities
- **Trident attack:** a real swing. `combat.swing` runs for 0.34 s; `RosaModel` adds a procedural rotation to the trident arm (`swingAngle`: wind-up back, overhead slash, tips forward, recovery). No new clips were needed.
- **Aura (song):** Rosa turns into the mermaid for the whole song plus 0.5 s. **Tide Surge:** she turns into the mermaid for 1.3 s while casting. A burst of bubbles marks the change. Logic lives in `combat.mermaid` (pure, tested); `Player` swaps the model, both models are preloaded.
- **Tide Surge visual:** three staggered rolling sea-wave rings (generated wave geometry with a foam-white crest and wobbling height, `wave-geometry.ts`) instead of a flat ring.
- **Dash:** a water teleport. Rosa shrinks away at the start of the dash, and pops back in at the end; bubble bursts appear where she left and where she arrives (instanced bubbles). The old streak was removed.

### Icons (`src/ui/icons.tsx`, inline SVG, no image files)
- **Abilities:** trident with a heart, water bubbles, music notes with a heart, sea wave. Shown on the desktop ability bar and on the touch action buttons (with a small label).
- **Items:** teacup, kvass mug, pearl in a shell, three tridents (gold, silver, pearl), tweed jacket, rain cloak, velvet gown, rose brooch, amber pendant, songbird whistle. Shown in the bag tiles, equipment slots, item detail and quick-use buttons. `ITEM_ICONS` is typed against `ItemId`, so a new item cannot be added without an icon.

## Verification
- 249 tests (was 243): swing, mermaid timing for Aura and Surge, no change when a spell cannot be cast, dash bubbles at both ends, faint/revive clear the looks.
- Headless Chromium with real key presses: attack sets `swing`; Aura holds the mermaid form 2.7 s and returns to human; Surge shows the waves and the mermaid; Dash fades Rosa and bursts bubbles; no console errors. Frozen-frame captures confirmed the swing arc, wave rings and bubbles.
- 375×812: icons on the touch buttons and quick-use, no overlaps. The bag shows all 12 items.
- Draw calls peak at about 73 for roughly a second during Tide Surge (the three wave layers plus the mermaid model); 51–53 otherwise.

## Notes
- The swing is procedural. If a hand-authored `attack` clip is wanted later, add it in `build_hero.py` and play it from `RosaModel`.
- Pickup gems on the ground still use the flat gem shapes; only UI uses the new icons.
