# Security Rules

## Secrets
- Never commit real credentials in any tracked file (code, docs, `.env.example`, migrations, screenshots).
- `.env` and `.env.*` (except `.env.example`) are in `.gitignore` from Phase 1.
- Client may hold only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The service-role key never enters the repo, the client bundle, or docs.
- AI-generation keys (Hunyuan3D, Rodin, Sketchfab, etc.) stay in the Blender MCP addon / local environment.

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
