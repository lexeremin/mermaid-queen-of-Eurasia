# Phase 0 — Docs bootstrap

**Status:** ✅ Complete

## Goal
Replace the original no-backend 2D brief with a plan for a modern stack (React + Three.js + Supabase), and set up the docs-driven workflow.

## Decisions (2026-09-24)
| Topic | Decision |
|---|---|
| Rendering | 3D low-poly, fixed angled top-down camera, React Three Fiber |
| Online DB | Supabase, anonymous auth, no login UI |
| Persistence | localStorage stays as offline-first save; Supabase for stats + optional cloud save |
| Git | Commit + push to `origin main` after every phase, no approval gate |
| Assets | AI-generated 3D via Blender MCP (Hunyuan3D / Rodin), procedural Blender geometry, CC0 bases; decimated + retro-textured; GLB |

## Delivered
- `Description.md` rewritten (tech requirements, 3D style, asset pipeline, online stats, acceptance criteria, out-of-scope).
- `docs/Task.md` (index, rules, roadmap, phase history).
- Context docs: product-overview, tech-stack, architecture-rules, database-schema, design-direction, asset-pipeline, code-style, ai-rules, change-policy, features, dod-global, security-rules.
- Phase docs 0 and 1.

## Changes vs `test-task.md` (reference template)
- "No auto-push" replaced by "push after every phase".
- Human-approval-before-commit gate removed.
- Drizzle migration-timestamp rule dropped (Supabase migrations instead).
- `.env` rule adapted for Supabase anon vs service-role keys.
- Token-saving `git log` rule kept.

## DoD
- All files in the Task.md context table exist.
- Every roadmap phase appears in `Task.md` and `features.md`.
- `Description.md` has no leftover "no backend / Phaser / localStorage-only" wording.
- Committed and pushed.
