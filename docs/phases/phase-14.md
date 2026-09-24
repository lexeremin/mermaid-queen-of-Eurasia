# Phase 14 — Quests + kingdom

**Status:** ✅ Complete

## Goal
Give the district direction: a notice board with quests, a quest log that tracks them, rewards that feed Phase 13's XP and items, and a **kingdom reputation** that grows as Rosa wins people over and gates the bigger quests. All quests use content that exists today (NPCs, the three enemy types, the three zones, pearls dropped by enemies). Garden herbs and the underground come in Phases 15 and 16 and add their own quests then.

## Design

### Notice board
- The board prop at (−3, 18) becomes interactive: `E` (or the on-screen prompt, or a click/tap on the board) within 2.8 m opens the board. NPC prompts win when both are in range.
- The board lists every quest as **Ready to claim**, **Active**, **Available**, or **Locked** (needs a higher rank; shows the rank name). **Accept** and **Claim** are only possible at the board; the quest log shows the same list read-only.
- Nothing works during dialogue, pause, inventory, or while fainted; the sim is paused while the board or log is open. Escape closes it.

### Quests (`src/data/quests.ts`, data-driven)
Objective kinds:
| Kind | Progress source |
|---|---|
| `kill` (optional enemy kind, count) | counted from accept onward |
| `visit` (zone ids) | zones entered from accept onward |
| `mesmerize` (npc) | live: relationship ≥ mesmerized threshold |
| `recruit` (count) | live: NPCs that joined the kingdom |
| `collect` (item, count) | live: items in the bag; **consumed on claim** |
| `level` (level) | live: current level |

A quest is **ready** when every objective is done. Claiming needs bag space for the rewards (after the collected items are removed); if there is none, the claim is refused with a toast and nothing is lost. Rewards: XP, items, reputation. Quests cannot be abandoned or repeated in the slice.

| # | Quest | Rank | Objectives | Reward |
|---|---|---|---|---|
| 1 | First Notes | 0 | Mesmerize Sergey | 30 XP, 8 rep, 2 Healing Tea |
| 2 | Clear the Gloom | 0 | Defeat 3 politicians | 40 XP, 8 rep, Cold Kvass ×2 |
| 3 | Pearls for the Board | 0 | Collect 3 pearls | 30 XP, 10 rep, Healing Tea ×2 |
| 4 | A Court Forms | 1 | Recruit 2 people | 60 XP, 12 rep, Rose Brooch |
| 5 | Gavel Down | 1 | Defeat 2 Gavel Speakers | 70 XP, 12 rep, Rain Cloak |
| 6 | The Grand Tour | 1 | Visit GUM, Manezhnaya Square, Alexander Garden | 50 XP, 12 rep, Amber Pendant |
| 7 | A Necklace for the Queen | 2 | Collect 6 pearls | 90 XP, 18 rep, Silver Trident |
| 8 | Rising Tide | 2 | Reach level 5 | 80 XP, 15 rep, Velvet Gown |
| 9 | The Full Court | 3 | Recruit all 8 | 150 XP, 25 rep, Songbird Whistle |

### Kingdom reputation
- **Reputation = quest reputation (completed quests) + 8 per NPC who joined.** It is derived, not stored, so it can never drift or be double-awarded, and older saves work.
- **Ranks:** Stranger (0), Guest of the Square (25), Favorite of Moscow (60), Lady of the District (100), Queen of the Square (150). Ranks gate quests (table above) and are shown in the board, log and a **Kingdom** tab (rank, progress to the next, the list of subjects who joined and how many are still to win). The maximum reachable reputation is 184.
- Rank-ups announce with a toast (not on load).

### HUD
- **QUESTS** button (a compact button next to BAG and PAUSE, `J` on desktop) opens the log with tabs **Quests** and **Kingdom**.
- A one-line **tracker** under the XP bar shows the first active quest and its next unfinished objective (`Clear the Gloom: 1/3`).
- Toasts: `Quest accepted`, `Quest ready: … claim it at the board`, `Quest complete` with the items received, `Kingdom rank: …`.

### Persistence
Save version 3 adds `quests { active: { [id]: { counts[], visited[] } }, completed[] }`; migration 2 → 3 adds the empty log. Parsing drops unknown quests, clamps counts, and lets `completed` win over `active`. Stat events: `quest_accepted {id}`, `quest_completed {id}`.

## Scope
1. Data: quests and ranks. Pure `systems/quests` with tests (availability, progress, claim, reputation, ranks, and a reachability test that the rank thresholds can be met in order).
2. `quest-store`; `quest-actions` (accept, claim, kill and zone hooks, ready and rank-up toasts); save v3 with migration.
3. World: notice board interaction (`E`, prompt, click/tap, walk-to-then-open).
4. UI: board/log panel with tabs, tracker line, QUESTS button, toasts.
5. Verification in a browser (accept, kill, claim, rank up, gated quest unlocks, reload, touch layout), docs, commit.

## Out of scope
Quest-giving NPC dialogue, quest markers on the map, repeatable or timed quests, abandoning quests, kingdom buildings or perks beyond the rank gate, herb and underground quests (Phases 15 and 16).

## DoD
- Quests can be accepted at the board, tracked in the log and tracker, and claimed for XP, items and reputation; collected items are consumed; a full bag refuses the claim without loss.
- Ranks unlock quests in order and can all be reached (tested).
- Reload restores active and completed quests; older saves load.
- 375×812: board and log fit without page scroll, buttons ≥ 44 px; no console errors; draw calls ≤ 70.
- typecheck, lint, prettier, tests, build pass.

## Result
- **Data and pure system:** `src/data/quests.ts` (9 quests, 5 ranks, join reputation 8) and `src/systems/quests.ts` (status, objective progress, accept, kill and visit recording, claim with item consumption and bag-space check, derived reputation and rank, tracker line). 18 tests, including a reachability test for the rank thresholds.
- **State:** `quest-store`; `quest-actions` (accept, claim, kill and zone hooks, ready and rank-up toasts, `quest_accepted` and `quest_completed` events); `game-store` gained `questPanel` (`log` or `board`) and `nearBoard`, wired into pause, inventory, Escape and `isSimRunning`.
- **World:** the board prop is interactive through `E`, the on-screen prompt (`E · Notice Board` or `NOTICE BOARD` on touch), or a click or tap on it (walks there first when far).
- **UI:** `QuestPanel` (Quests and Kingdom tabs, accept and claim buttons at the board, read-only log elsewhere), `QuestTracker` line under the XP bar, QUESTS (LOG on touch) button, `J` key. The three top buttons were made compact so they fit next to the bars at 375 px.
- **Save v3:** `quests` block with migration 2 → 3 and defensive parsing (unknown quests dropped, kill counts clamped to the goal, visited zones filtered, `completed` wins over `active`). 243 tests overall.
- **Fix found on the way:** cloud push ignored level, XP, bag and equipment (Phase 13) as well as quests; the change key now includes them (still throttled to one push per 30 s).

## Verification (headless Chromium)
- Desktop: prompt `E · Notice Board` at the board, `E` opens it, three quests accepted, tracker shows `Clear the Gloom: 0/3`; three real kills (Gavel Speaker, Megaphone Demagogue, Golden-Pen Tycoon) counted and the ready toast appeared; four pearls plus Sergey mesmerized made the other two quests ready; clicking the board from 6 m away walked there and opened it; all three claimed (pearls consumed 4 → 1, rewards added, rank toast `Guest of the Square`), the rank-1 quests unlocked; the Grand Tour recorded GUM, Manezhnaya Square and Alexander Garden as they were entered; reload restored the log and the tracker; no console errors.
- 375×812 touch: prompt, panel (343×640, no page scroll), tabs and buttons ≥ 44 px, the three top buttons beside the bars without overlap, tracker line, Kingdom tab and LOG button work; 49–50 draw calls.

## Notes for later phases
- Phase 15 (garden) can add herb and pearl quests as data; Phase 16 adds a boss quest. A quest's rank gate uses the derived reputation, so new quests only need `minRank` and a `reward.rep`.
- `collect` objectives read the bag, so they count items already owned at accept time.
- Kill and visit objectives count only after the quest is accepted.

