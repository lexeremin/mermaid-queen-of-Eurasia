# TASK.md — Mermaid Queen of Eurasia

This file is handed to the AI agent at the start of each work session. Update it when a phase is completed.

---

## Git rule: commit and push after every phase

After each completed phase: commit, then `git push origin main`. No approval gate (user decision, 2026-09-24).
- One phase = one commit (plus, if needed, one small follow-up `chore:` commit that records the hash below).
- Commit message: `feat: phase N — <title>` (docs-only phases: `docs: ...`).
- Never force-push. Never skip hooks.
- Never commit `.env` files or real credentials.
- If CI/CD is added later, revisit this rule (pushes will consume CI minutes).

---

## .env rule

**Never expose real credentials** in any file tracked by git (commits, diffs, `.env.example`, docs).

- Supabase **anon** key and project URL are public by design, but still live in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`); only placeholders go in `.env.example`.
- The Supabase **service-role** key must never be in the repo, the client bundle, or docs.
- AI 3D generator keys (Hunyuan3D / Rodin) live only in the Blender MCP addon config, never in the repo.
- If git worktrees are used: copy non-empty values from the main repo `.env` into the worktree `.env` right after creating it, and copy changes back when done.

---

## Token-saving rule

**At the start of every session:** run `git log --oneline -20` first. Any phase whose commit appears in the log is **complete — do NOT read its phase doc**. Only read docs for the current and upcoming phases. Rely on commit history, not file inspection, to establish what is already done.

---

## Project Context

Read these files before starting any work:

| File | Purpose |
|---|---|
| `Description.md` | Product brief (root of the repo) |
| `docs/product-overview.md` | What we're building and for whom |
| `docs/tech-stack.md` | Stack, packages, project structure |
| `docs/architecture-rules.md` | Rules that cannot be violated |
| `docs/database-schema.md` | Supabase tables, RLS, sync model |
| `docs/design-direction.md` | Palette, typography, lighting, UI style |
| `docs/asset-pipeline.md` | Blender MCP workflow, budgets, licence ledger |
| `docs/code-style.md` | Naming, formatting, forbidden patterns |
| `docs/ai-rules.md` | How to work, what to report |
| `docs/change-policy.md` | What can and cannot be modified |
| `docs/features.md` | Full feature list with phase mapping |
| `docs/dod-global.md` | Global definition of done |
| `docs/security-rules.md` | Secret handling, RLS, git safety |
| `docs/likeness-and-consent.md` | Hero likeness rules, reference photo handling |

---

## Current Phase

**Phase 19 complete (water and performance).** Next: **Phase 20 — Visual polish** (`docs/phases/phase-20.md` — write it first, it does not exist yet).

---

## Work Order

1. Run `git log --oneline -20` — phases in the log are done, skip their docs.
2. Read the context files listed above (only the ones relevant to the phase).
3. Read `docs/phases/phase-20.md` for the specific task. If the doc for the current phase does not exist yet, write it first (goal, scope, steps, DoD) and add it to the commit.
4. Implement the phase.
5. Verify against `docs/dod-global.md` and the phase's own DoD.
6. Commit as `feat: phase N — ...` and push to `origin main`.
7. Update this file (Phase History, Current Phase) with the commit hash; commit `chore: advance to phase N+1` and push.

---

## Phase History and To-Do

| Phase | Status | Outcome | Notes |
|---|---|---|---|
| Phase 0 — Docs bootstrap | ✅ Complete | Description.md rewritten, /docs created | 9f8d3c8 |
| Phase 1 — Project scaffold | ✅ Complete | Vite + React + TS strict, R3F, Zustand, lint/format, Vitest, folder layout, runs locally | 796bd60 |
| Phase 2 — Engine core | ✅ Complete | Fixed top-down camera, game loop, input (WASD + mouse aim, touch joystick + buttons), pause, responsive/safe-area layout | 5b29ffc |
| Phase 3 — Asset pipeline PoC | ✅ Complete | Blender MCP end to end: Rosa placeholder, one house, one tree → GLB under budget, retro texture pass, licence ledger | ea0000c. Procedural assets; AI generators not enabled (needs user opt-in/keys) |
| Phase 4 — Village map | ✅ Complete | Terrain, river, houses, collision, forest entrance, Rosa movement/animation | 5b9feae. 16 assets total, instanced rendering, ~26 draw calls |
| Phase 5 — Hero redesign + direction change | ✅ Complete | Person-based Rosa (stylized), mermaid as a transformation model, palette v2, docs for the Red Square setting | bd5e367. Consent + likeness rules in `docs/likeness-and-consent.md` |
| Phase 6 — Red Square map | ✅ Complete | Replace the village: cathedral, Kremlin-style wall, GUM-style arcade, museum, cobblestone plaza, river + bridge, Alexander Garden entrance | b26d27f. Cobble tile texture; village-only assets retired; 19 assets, ~26 draw calls |
| Phase 7 — Summer overcast look | ✅ Complete | Moody grey summer: atmosphere config, summer palette, assets rebuilt without snow, new trees, grass ground, Rosa warm light; docs for the singing Aura | 275e8a0. Keeps the Phase 6 layout |
| Phase 8 — Real layout + detailed GUM | ✅ Complete | Red Square in real relative positions (Kremlin right, GUM left, cathedral far end, museum/Kazan/Resurrection Gate near end), detailed GUM facade, walkable GUM gallery under a translucent glass roof | 889482d. Map rotated 180° from real north; hero X-ray silhouette; 31 assets, ~45 draw calls |
| Phase 9 — Manezhnaya Square + Alexander Garden | ✅ Complete | Through the Resurrection Gate: Manezhnaya Square, Kremlin north wall, the real Alexander Garden outside the west wall (Kutafya tower, grotto, obelisk, paths, lawns) | cd9d2f0. Same contiguous map; 36 assets; up to 56 draw calls |
| Phase 9b — Desktop controls rework | ✅ Complete | Click-to-move with pathfinding, WASD facing turns naturally, no mouse aim; attack Space/right-click, dash Shift | 21acc18 |
| Phase 10 — NPCs + dialogue | ✅ Complete | 8 NPCs (Russian men archetypes), dialogue, tap/E interact, relationships, heart-buff visual | 10d002e. 44 assets, ~53 draw calls |
| Phase 11 — Save + Supabase | ✅ Complete | localStorage save/load, Supabase anon auth, schema + RLS, stats sync with offline queue, opt-out | f2122cd. Live cloud verified (16/16 RLS checks, sync + restore) |
| Phase 12 — Combat core | ✅ Complete | Trident attack, dash, singing Mermaid Aura (orbiting notes), AoE spell, damage, 3 enemy types + AI | 1845ab7. 47 assets, ~50 draw calls |
| Phase 12b — Satirical politicians + blind debuff | ✅ Complete | Enemies replaced by three original caricatures with different weapons; the Aura blinds enemies (blindfold icon, missed attacks) | bc6741b |
| Phase 13 — Progression + inventory | ✅ Complete | XP and levels 1–10, loot drops, 20-slot bag, 3 equipment slots, quick-use, save v2 | 4e86959 |
| Phase 14 — Quests + kingdom | ✅ Complete | Notice board, 9 quests, quest log and tracker, derived kingdom reputation and ranks, save v3 | 4ad2b76 |
| Phase 14b — Renames, Prince Sasha, spell looks, icons | ✅ Complete | Prince Sasha (handsome prince, next to the start), enemy renames, trident swing, mermaid form during Aura and Surge, sea-wave Surge, bubble-teleport Dash, cute ability and item icons | 59a0f83 |
| Phase 14c — Companion, voice, menu | ✅ Complete | Prince Sasha likeness and companion (follow option, sword, fights beside Rosa), moved Sergey and Maksim, Rosa's voice (attacks, special attacks, sung Aura) from the songs folder, menu with animated mermaid, title and GitHub link | dcfb5fe |
| Phase 15 — Alexander Garden content | ✅ Complete | 12 herbs that regrow, 5 hidden pearls, 7 more monsters, the hidden Pearl Shrine (one-time gift, then heals), quests 10–12, save v4 | 02bf61a |
| Phase 15b — Environment polish | ✅ Complete | GUM flicker fixed at the source (coplanar faces), richer ground tiles with mipmapped filtering, plaza kerbs, contact shadows, GUM roof hides indoors | d41289c |
| Phase 15c — Entrances | ✅ Complete | Arched GUM portals and gates, obstacles removed from doorway axes (tested), curved garden path, glowing entrance markers | 105b02f |
| Phase 15d — Gate fixes, glow, hitbox rings | ✅ Complete | Floating seam plates removed from the gates, one united entrance glow, green/red hitbox rings, ground flicker fix, Trident reach 3.4 m | 85ba93c |
| Phase 15e — Kits and generators | ✅ Complete | Wall-run assembler with a four-piece kit and a corner tower, ground autotiler (grid, variants, kerbs, connectors through both gates), see-through fade for occluding buildings | 75457cc |
| Phase 16 — Moscow underground + boss | ✅ Complete | Generated underground level (3 rooms, corridors, boss arena) reached by a metro pavilion, dark-brick wall kit, torch-lit mood with fade transitions, chests, Chief Registrar and the stamp, boss gate, Father of Corruption (three phases, telegraphed hazards, helpers), save v5 | e7cfe72 |
| Phase 16b–16f — Underground rework, Blink/Recall, vintage HUD, menus, map | ✅ Complete | Father of Corruption, cleared-halls gate, instanced mobs, quest items off the bag, Blink replaces Dash, Recall, vintage HUD theme, welcome screen, settings/new-game popups, visible cooldowns, minimap + full map (Tab/M), lamp glow, 3 min respawn | see `git log` |
| Phase 17 — Stability pass | ✅ Complete | Persisted world (mobs, boss, hp, loot survive a reload), loading screen + startup lag fix, performance optimization, mobile joystick stuck-input fix | 239d526 |
| Phase 18 — Mermaid Queen | ✅ Complete | One persistent transformation: unlock, toggle, Tidal Song, water crossing (model and the temporary look already exist). Forest Spirit, Elvish and Tsarina moved to the stretch list | 9a129ea |
| Phase 19 — Water and performance | ✅ Complete | Swimming (stepping into water turns Rosa into a mermaid; pond ends and the reachable Moskva River), graphics quality setting (Auto/High/Medium/Low), fade-free plain material, nearby-only lantern glow, loading screen only on page load | see `git log` |
| Phase 20 — Visual polish | ⬜ Next | Fix parts that stick out of buildings and objects, rounder shapes (bevels, rounded roofs and props), softer textures without colour bleeding; keep the triangle and draw-call budgets | |
| Phase 21 — Archangels | ⬜ Todo | Quest "Save the archangels": Michael, Gabriel and Serafima, the small winged children of Rosa and Prince Sasha, hidden around the world; a unique dialogue with each, happy sounds when saved, each counts for the quest | |
| Phase 22 — Endless dungeon | ⬜ Todo | Rework the underground into 100 automatically generated layers (random paths and monsters), with fixed entrance and exit rooms between layers | |
| Phase 23 — Downtown Moscow | ⬜ Todo | More detailed areas around Red Square based on the real map, more quests | |
| Phase 24 — Bosses and people | ⬜ Todo | More bosses (original satirical evil-politician and foreign-lobbyist archetypes, no real people), generic NPCs such as "Russian guy" | |
| Phase 25 — Polish | ⬜ Todo | SFX (UI, level-up, quest, loot, blink, recall, boss, hits), ambient loop/music, volume slider, mist/drizzle particles, damage numbers, screen shake, title screen for returning players | |
| Phase 26 — Real-device QA | ⬜ Todo | iPhone Safari pass, budgets, fixes | |
| Phase 27 — Deploy | ⬜ Todo | Hosting (Cloudflare Pages or Vercel), env config, release | |

Order rationale: asset pipeline (3) comes before content so style and performance risk is found early; the direction changes (5–9) land before NPCs so characters are built for the final setting; Supabase (11) comes before gameplay data grows so the save schema stays stable.

---

## How to Update This File

When a phase is complete (all DoD items pass and the phase commit is pushed):
1. Mark it ✅ in Phase History with the commit hash.
2. Mark the next phase ⬜ Next and update "Current Phase".
3. Update Work Order step 3 with the new phase number.
4. Commit this update: `chore: advance to phase N`, then push.
