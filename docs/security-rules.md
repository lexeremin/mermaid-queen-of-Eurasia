# Security Rules

## Secrets
- Never commit real credentials in any tracked file (code, docs, `.env.example`, migrations, screenshots).
- `.env` and `.env.*` (except `.env.example`) are in `.gitignore` from Phase 1.
- Client may hold only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The service-role key never enters the repo, the client bundle, or docs.
- AI-generation keys (Hunyuan3D, Rodin, Sketchfab, etc.) stay in the Blender MCP addon / local environment.

## Vite env exposure
- Vite bundles **every `VITE_` variable** into the browser. Only the project URL and the publishable/anon key may use that prefix. A secret or service-role key must never be named `VITE_…`; keep it as `SUPABASE_SECRET_KEY` (or better, out of `.env` entirely).
- The client reads each variable explicitly (never the whole env object), and `src/net/env-safety.test.ts` fails the build if that changes or a secret-looking `VITE_` name appears in source. `src/net/config.ts` refuses `sb_secret_` and `service_role` keys at runtime; `npm run supabase:check` refuses to run when a `VITE_` variable holds one.
- History: on 2026-09-24 a secret key was added as `VITE_SUPABASE_SECRET_KEY`. It was renamed before any build or push contained it (verified: 0 matches in a fresh `dist/`), but the dev server on localhost had served it to the page. Rotating that key is recommended.

## Supabase
- RLS enabled on every table; policies defined in migrations and documented in `docs/database-schema.md`.
- Anonymous auth only; no PII collected. No user-supplied free text stored in slice (payload is structured, size-limited).
- Rate-limit and size-limit client writes (batching, check constraints).
- Test policies: a user must not read or write another user's rows.

## Privacy
- Stats opt-out in Settings, effective immediately (clears queue).
- Short in-game privacy note explaining anonymous stats (Phase 6/13).

## Git safety
- Commit specific files, review `git status` and `git diff --staged` before each commit.
- No force-push, no `--no-verify`.
- If a secret is ever committed: rotate it immediately, then clean history with the user's approval.

## Reference material and likeness
- The hero reference photo stays in `assets-src/reference/` (git-ignored). Never commit, upload or paste it. See `docs/likeness-and-consent.md`.
- Before any `git add`, check `git status` for anything under `assets-src/`.

## Content
- Only the hero is based on a real person (stylized, with consent). No other real people depicted. No copied third-party assets. Every asset in the licence ledger.
