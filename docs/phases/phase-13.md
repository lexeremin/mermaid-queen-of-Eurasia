# Phase 13 — Progression + inventory

**Status:** ✅ Complete

## Goal
Give the fights and conversations a payoff: experience and levels, loot that drops from enemies, a bag, and three equipment slots. All usable on touch. Health and mana already exist (Phase 12); this phase makes their maximums grow.

## Design

### XP and levels
- Levels 1–10 (slice cap). XP to go from level *L* to *L+1*: `40 + 30 × (L − 1)` (40, 70, 100 … 280). Whole slice (all enemies once, all 8 NPCs mesmerized and joined) is worth about level 6–7.
- **XP sources:** Gavel Speaker 40, Megaphone Demagogue 22, Golden-Pen Tycoon 15; NPC first mesmerized **+25**, NPC joins **+50**. Persuasion is the game's core, so it pays more than fighting. XP from NPCs is awarded once ever (`awarded` keys are saved), so reloads, cloud pulls and New game cannot double-award or farm it (New game clears them).
- **Level up:** full heal, banner, and stats grow: max HP `100 + 10 × (L−1)`, max mana `100 + 8 × (L−1)`, attack and spell damage `+6%` per level.

### Items (data-driven, `src/data/items.ts`)
- **Consumables:** Healing Tea (+45 HP), Cold Kvass (+45 mana), Pearl (keepsake for quests, no use yet). Stack up to 9 (pearls 20).
- **Equipment, 3 slots:**
  - Weapon: Trident (start, +0), Silver Trident (+15% damage), Pearl Trident (+30% damage, +10 mana).
  - Outfit: Ivory Tweed Jacket (start, +0), Rain Cloak (−12% damage taken, +10 HP), Velvet Gown (−25% damage taken, +20 mana).
  - Charm: none (start), Rose Brooch (+1.5 mana/s), Amber Pendant (+25 HP), Songbird Whistle (+20 mana, +1 mana/s).
- Rarity (common / uncommon / rare) only colors the tile. Damage reduction is capped at 60%.

### Loot
- Enemies roll a table on death (independent chances, seeded RNG so it is testable): Tycoon (tea 30%, kvass 20%, pearl 25%, gear 6%), Speaker (tea 55%, kvass 35%, pearl 40%, gear 30%), Demagogue (tea 25%, kvass 45%, pearl 25%, gear 15%).
- Drops appear as spinning colored gems on the ground near the body. Rosa collects them by walking within 1.3 m; they are pulled toward her inside 3 m; they vanish after 60 s. A full bag leaves the item on the ground with a "Bag full" toast. Dropped items cannot be picked up for 3 s.

### Bag and equipment
- 20 slots (5 × 4), consumables stack. Tap or click a tile to select it; the detail panel shows text, stats, and **big buttons: Use, Equip, Unequip, Drop** (no hover, no drag; targets ≥ 44 px). Equipping swaps the old item back into the bag (refused, with a toast, if the bag is full).
- Opening: `I` or the BAG button. Sim paused while open. Escape closes it.
- **Quick use:** keys `1` (tea) and `2` (kvass) and two on-screen buttons (touch and desktop) with counts; a use that would do nothing (already full) is refused and not consumed.

### HUD
Level badge and an XP bar under the health and mana bars; floating toasts (`+22 XP`, `Picked up Healing Tea`, `Bag full`), a level-up banner.

### Persistence
Save version 2 adds `progress { level, xp, awarded[], bag[], equipment }`. A migration 1 → 2 fills defaults (level 1, starter gear), so older local and cloud saves still load. Health and mana are not saved (full on load). Stat events: `level_up {level}`.

## Scope
1. Data: items, loot tables. Pure systems (tested): `progression`, `inventory`, `loot`.
2. `progress-store` (level, XP, bag, equipment, awarded); save v2 with migration.
3. Combat integration: derived stats (max HP/mana, damage multiplier, damage reduction, mana regen) feed `stepCombat`; enemy defeat grants XP and rolls loot.
4. World: pickups (pooled meshes), collection, magnet, expiry, drops.
5. UI: bag and equipment panel replacing the placeholder, XP bar, quick-use buttons, toasts, level-up banner.
6. Verification in a browser (loot, pickup, equip changes stats, use items, level up, reload restores, touch layout), docs, commit.

## Out of scope
Shops and currency, crafting from herbs, item rarity scaling with level, equipment visuals on the model, item tooltips on hover, drag and drop, quest items and rewards (Phase 14), boss loot (Phase 16).

## DoD
- Killing enemies grants XP, levels raise max HP and mana and damage, loot drops and is collected, the bag and the three slots work by tap, equipment changes derived stats, quick-use works and never wastes an item.
- XP for NPC milestones is awarded exactly once, including across reloads.
- Old saves (v1) load; new saves round-trip; cloud save unaffected.
- 375×812: the bag panel fits without page scroll and all buttons are ≥ 44 px; no console errors; draw calls ≤ 70.
- typecheck, lint, prettier, tests, build pass.

## Result
- **Pure systems (tested):** `progression` (levels 1–10, `xpToNext`, `computeStats`, XP rewards), `inventory` (20-slot bag, stacking, equip/unequip swap), `loot` (per-kind tables, injectable RNG), `pickups` (age, expiry, magnet, collect, bag-full block). Data in `src/data/items.ts` (3 consumable/keepsake items, 9 equipment pieces).
- **State:** `progress-store` (level, XP, awarded keys, bag, equipment), `toast-store`. Combat takes derived `PlayerStats` (max HP/mana, damage multiplier, damage reduction with a 60% cap, mana regen); `revive` and load use them.
- **Game:** enemy defeat grants XP and rolls loot (`loot-sim`, scattered gems near the body); `progress-actions` (`consumeAt`, `quickUse`, `dropAt`, `grantXp`, NPC milestone hooks with once-only `awarded` keys, level-up full heal and `level_up` event); `Pickups` renders all ground loot as one instanced mesh.
- **UI:** XP bar and level badge under the bars, toasts, level-up banner, quick-use buttons (keys 1 and 2; on touch they sit above the joystick), bag and equipment panel replacing the placeholder (5×4 grid, three slots, stats line, detail with USE / EQUIP / UNEQUIP / DROP, ≥52 px).
- **Save v2:** `progress` block with migration 1 → 2 and defensive parsing (unknown items dropped, stacks clamped, wrong-slot equipment reset). Health and mana are not saved. Stat event `level_up {level}`.
- **Tests:** 213 overall (was 162 after Phase 12).

## Verification (headless Chromium)
- Desktop: killed a Golden-Pen Tycoon with held Space (+15 XP, a pearl dropped); three placed pickups walked over and collected; equipping the Silver Trident from the bag swapped the old trident into the bag and changed damage to 115%; Use on a healthy player was refused without consuming; keys 1 and 2 healed (40 → 86) and restored mana (10 → 57); a use at empty count is refused; level 2 healed to 110/108 and showed the banner; Esc closes the bag; reload restored level, XP, bag and equipment; no console errors; 41 draw calls, ~75k triangles.
- 375×812 touch: bag panel 343×619 with no page scroll, buttons 52–60 px high, tiles 57×56, quick-use buttons 56×56 clear of the joystick, tap on quick-use healed, no console errors.

## Notes for later phases
- Quest rewards (Phase 14) should call `useProgressStore.getState().addItem` and `grantXp`; boss loot (Phase 16) can extend `LOOT_TABLES`.
- Pearls are keepsakes with no use yet; they are meant for quests.
- Equipment has no visual on the model yet.

