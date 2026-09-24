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

---

## Current Phase

**Phase 2 complete (engine core).** Next: **Phase 3 — Asset pipeline PoC** (`docs/phases/phase-3.md` — write it first, it does not exist yet).

---

## Work Order

1. Run `git log --oneline -20` — phases in the log are done, skip their docs.
2. Read the context files listed above (only the ones relevant to the phase).
3. Read `docs/phases/phase-3.md` for the specific task. If the doc for the current phase does not exist yet, write it first (goal, scope, steps, DoD) and add it to the commit.
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
| Phase 3 — Asset pipeline PoC | ⬜ Next | Blender MCP end to end: Rosa placeholder, one house, one tree → GLB under budget, retro texture pass, licence ledger | Validates style + perf before content |
| Phase 4 — Village map | ⬜ Todo | Terrain, river, houses, collision, forest entrance, Rosa movement/animation | |
| Phase 5 — NPCs + dialogue | ⬜ Todo | 8 NPCs, dialogue, tap/E interact, relationships, Mermaid Aura persuasion | |
| Phase 6 — Save + Supabase | ⬜ Todo | localStorage save/load, Supabase anon auth, schema + RLS, stats sync with offline queue, opt-out | Needs user-created Supabase project |
| Phase 7 — Combat core | ⬜ Todo | Trident attack, dash, Mermaid Aura, AoE spell, damage, 3 enemy types + AI | |
| Phase 8 — Progression + inventory | ⬜ Todo | HP/mana/XP/levels, inventory + equipment UI (touch), loot | |
| Phase 9 — Quests + kingdom | ⬜ Todo | Quest board, quest log, kingdom reputation | |
| Phase 10 — Forest | ⬜ Todo | Herbs, pearls, monsters, hidden shrine | |
| Phase 11 — Dungeon + boss | ⬜ Todo | 3 rooms, loot, boss arena + fight | |
| Phase 12 — Transformations | ⬜ Todo | 4 forms, appearance swap, one modifier each, unlock flow | |
| Phase 13 — Polish | ⬜ Todo | Audio, VFX (mist/snow/particles), HUD juice, title screen, settings | |
| Phase 14 — Mobile QA + perf | ⬜ Todo | iPhone Safari pass, budgets, fixes | |
| Phase 15 — Deploy | ⬜ Todo | Hosting (Cloudflare Pages or Vercel), env config, release | |

Order rationale: asset pipeline (3) comes before content so style and performance risk is found early; Supabase (6) comes before gameplay data grows so the save schema stays stable.

---

## How to Update This File

When a phase is complete (all DoD items pass and the phase commit is pushed):
1. Mark it ✅ in Phase History with the commit hash.
2. Mark the next phase ⬜ Next and update "Current Phase".
3. Update Work Order step 3 with the new phase number.
4. Commit this update: `chore: advance to phase N`, then push.
