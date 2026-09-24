# Phase 11 — Save + Supabase

**Status:** ✅ Complete (local save verified; live cloud check pending the two dashboard steps)

## Goal
Progress survives a reload (local save, offline-first), and — when Supabase is configured and reachable — the save and anonymous play stats sync to the cloud without ever blocking play.

## State at phase start (checked 2026-09-24)
- `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key, correct kind). `.env` is git-ignored and untracked. The client accepts either `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`, and refuses `sb_secret_…` keys.
- **Anonymous sign-ins are disabled** in the project (dashboard: Authentication → Sign In / Providers → Anonymous). Needed for cloud sync.
- **Tables do not exist yet.** `supabase/migrations/20260924120000_init.sql` creates them; the user runs it once in the SQL Editor (or `supabase db push`). Until both steps are done the game runs local-only, and the pause menu says so.

## Design
- **Local save** (`localStorage`, key `mq.save.v1`): `{ version, savedAt, playSeconds, hero { form, x, z, facing }, npcs { id → relationship, used methods, joined } }`. Parsed defensively (`parseSave`): wrong types, unknown NPCs, bad numbers are dropped or clamped; a save from a newer game version is ignored. Migrations are a version-indexed registry (empty for v1, tested with an injected one).
- **What triggers a write:** NPC state change (debounced 0.5 s), every 10 s (position), tab hidden, `pagehide`. Position is validated against the collision world on load (falls back to the spawn).
- **New game:** pause menu, two-step confirm; clears the save and resets stores and the player.
- **Cloud save:** one row per player, last write wins by `savedAt`. Pull once after sign-in (applied only if newer than local); push when progress changed (at most every 30 s), immediately when an NPC joins, and when the tab hides.
- **Stats:** anonymous events (`session_started`, `npc_method_used`, `npc_mesmerized`, `npc_joined`) go into a persisted queue (`mq.stats-queue.v1`, max 200, oldest dropped), sent in batches of 25 with exponential backoff (15 s doubling to 10 min). Event ids are client UUIDs, so retries are idempotent. **Opt-out** in the pause menu stops collection, clears the queue and is stored in the cloud profile.
- **Failure behavior:** no config → offline mode, silent. Auth disabled → one clear status message, no retry storm (disabled for the session). Network errors → backoff. Nothing in `src/net` can throw into gameplay; the Supabase library is loaded lazily (only when configured).
- **Privacy:** no PII; payloads are small structured objects; RLS restricts every row to its owner; the client key is publishable.

## Scope
1. Docs: this file, `docs/database-schema.md` rewritten to the real schema, `.env.example`.
2. `supabase/migrations/…init.sql` (tables, checks, RLS, grants) and `tools/check-supabase.mjs` (`npm run supabase:check`): signs in two anonymous users and proves the policies (own rows only, cross-user reads empty, oversize rejected).
3. `src/save/`: `save-data` (types, parse, migrate), `storage` (safe localStorage), `game-save` (collect, apply, autosave, reset).
4. `src/net/`: `config`, `client`, `auth`, `stats-queue` (pure), `stats`, `cloud-save`, `sync`, `net-store` (status for the UI).
5. `settings-store` (stats opt-out, persisted); pause menu: stats toggle, cloud status, New game.
6. Tests and browser checks.

## Result
- **Local save** `src/save/`: `save-data` (types, `parseSave`, `migrateSave`, `pickNewer`), `storage` (never-throwing localStorage), `game-save` (`collectSave`, `applySave`, `startPersistence`, `resetProgress`). Hooked in `src/main.tsx` before the first render.
- **Net** `src/net/`: `config` (validates settings, **refuses `sb_secret_` and `service_role` keys**), lazy `client` (supabase-js is code-split and only loaded when configured), `auth` (anonymous, one attempt per page load when disabled), `stats-queue` (pure: batching, persistence, bounded, exponential backoff), `stats`, `cloud-save`, `sync` (coordinator), `net-store` (status).
- **Settings:** `settings-store` (stats opt-out, persisted). **Pause menu** (`PauseSettings`): cloud status line, anonymous stats ON/OFF, NEW GAME with two-step confirm.
- **SQL** `supabase/migrations/20260924120000_init.sql` (parses as valid PostgreSQL, 26 statements) and `npm run supabase:check` (`tools/check-supabase.mjs`), `docs/database-schema.md` rewritten, `.env.example`, README section.
- **Tests:** 114 in total: save parsing and migration (10), game-save round trip (4), stats queue (7), config (4).

## Verification
- Headless Chromium: progress (position, mermaid form, relationships, used methods, joined) survives a reload; opt-out survives a reload; NEW GAME resets stores, position and the saved copy.
- Hostile saves (garbage JSON, wrong shape, newer version, position inside a wall, NaN position with out-of-range relationship) never crash: the game starts with defaults, or keeps the valid NPC data and the spawn position.
- Cloud states against the real project: anonymous sign-ins disabled → pause menu says so, exactly one sign-in request per page load (8 loads, 8 requests, no loop); blocked network → "offline, will retry", 1 request in 6 s, game plays normally.
- No console errors from the app (the browser logs the failed sign-in HTTP request itself).

## Pending (needs the user)
1. Enable **Anonymous sign-ins** (currently disabled; `signInAnonymously` returns `anonymous_provider_disabled`).
2. Run the migration SQL (the three tables do not exist yet; the REST API returns 404 for them).
3. Then `npm run supabase:check` (expect all PASS) and a live sync test (progress row appears in `saves`, events in `stat_events`).

## Notes
- The first probe wrongly reported the tables as existing (a `head` count request swallowed the 404); the REST API spec check showed they do not.
- Cross-device restore needs a way to link devices (magic link, code, or account); out of scope. Clearing site data makes the player a fresh anonymous user.
- `saved_at` uses the client clock; a badly wrong clock could win or lose a last-write-wins comparison. Acceptable for the slice.
- Cloud pull applies mid-session (about 1 s after load); a very slow connection could reposition Rosa after the player has started moving. Only applies when the cloud save is newer.

## Out of scope
Cross-device restore UI (the save syncs, but there is no account or code to link devices), leaderboard, save slots, encryption of the local save, server-side validation of save contents.

## Steps
1. Docs, SQL, `.env.example`, check script.
2. Save data + tests, then game-save and boot hook.
3. Net layer + tests.
4. UI.
5. Verify in a browser: save and reload, corrupt save, quota failure, offline mode, auth-disabled mode; then, once the user has completed the dashboard steps, run `npm run supabase:check` and a live sync.
6. Commit, push, advance.

## DoD
- Reload restores position, form, relationships, used methods and joined NPCs; corrupt or foreign saves never crash the game.
- With no Supabase config, or with anonymous sign-ins disabled, or offline: the game plays normally, and the pause menu shows why the cloud is off. No console error loops.
- Stats and cloud calls are batched, backed off and opt-out-able; the queue is bounded.
- Secret keys are refused; `.env` untracked; no keys in the repo, docs or bundle beyond the publishable key at build time.
- typecheck, lint, prettier, tests, build pass; live RLS check passes once the project is set up.
