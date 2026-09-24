# Global Definition of Done

Every phase must satisfy all of these before its commit (in addition to the phase's own DoD):

1. `npm run typecheck` passes (once the scaffold exists, Phase 1+).
2. `npm run lint` passes.
3. `npm test` passes; new logic in `src/systems`, `src/save`, `src/net` has tests.
4. The game starts with `npm run dev` and the changed feature works in the browser at a desktop size **and** a mobile viewport (375×812 portrait, and landscape).
5. No hover-only interactions; touch targets ≥ 44 pt for anything new.
6. No console errors or unhandled promise rejections in normal play.
7. Works offline (Supabase env unset or network blocked): no crash, no blocking.
8. Performance: no regression against budgets in `docs/asset-pipeline.md` (from Phase 3 on: 60 fps desktop; check iPhone/mobile emulation for obvious problems, full device pass in Phase 14).
9. New assets: passed the pipeline, in the manifest, in the licence ledger.
10. No secrets in the diff (`git diff --staged` reviewed). `.env` untouched.
11. `docs/phases/phase-N.md` written/updated; `docs/Task.md` updated with status and commit hash.
12. Committed and pushed to `origin main`.

Docs-only phases (e.g. Phase 0): items 1–8 are N/A; check that links and referenced files exist.
