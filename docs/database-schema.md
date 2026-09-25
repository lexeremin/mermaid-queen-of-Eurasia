# Database Schema (Supabase)

Status: **implemented in Phase 11** (`supabase/migrations/20260924120000_init.sql`). The game works without any of it (offline-first); Supabase adds a cloud copy of the save and anonymous play stats.

## Setup (once per project)
1. Dashboard → **Authentication → Sign In / Providers → Anonymous sign-ins: enable**.
2. Dashboard → **SQL Editor**: paste and run `supabase/migrations/20260924120000_init.sql` (idempotent), or use the Supabase CLI: `supabase db push`.
3. `.env` (git-ignored) with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or the older `VITE_SUPABASE_ANON_KEY`). Never a secret or service-role key; the client refuses those.
4. `npm run supabase:check` signs in two anonymous users and proves the security rules (see below). Restart the dev server after changing `.env`.

## Identity
Supabase **anonymous sign-in**. `auth.uid()` is the player id; the session is kept in `localStorage` (`mq.supabase.auth`). No email, no profile data. Clearing browser storage makes the player a new anonymous user (cross-device restore is a stretch goal).

## Tables (public schema, all with RLS)

### `players`
`id uuid pk → auth.users (on delete cascade)`, `created_at`, `last_seen_at`, `device_class` (`desktop` | `mobile`), `stats_opt_out boolean`.

### `saves` (one row per player)
`player_id uuid pk → auth.users`, `version int (1–1000)`, `data jsonb` (**≤ 64 KB**), `saved_at timestamptz` (client clock, used for last-write-wins), `updated_at`. `data` is the same `SaveData` object as the local save.

### `stat_events` (append-only)
`id uuid pk` (client-generated, makes retries idempotent), `player_id → auth.users`, `type text (1–40 chars)`, `payload jsonb` (**≤ 2 KB**), `client_ts`, `created_at`. Index on `(player_id, created_at desc)`.

Events sent today: `session_started {device}`, `npc_method_used {npc, method}`, `npc_mesmerized {npc}`, `npc_joined {npc}`, `enemy_defeated {kind}`, `player_downed`, `level_up {level}`, `quest_accepted {id}`, `quest_completed {id}`, `shrine_gift`, `underground_entered`, `chest_opened {id}`, `gate_opened`, `boss_defeated`.

## Row-level security
- RLS is enabled on every table; the `anon` role has **no** privileges, signed-in (including anonymous) users get only what the policies allow.
- `players`, `saves`: select / insert / update own row only (`id` or `player_id = auth.uid()`); no delete.
- `stat_events`: select and insert own rows only; **no update, no delete**.
- Size limits are enforced with check constraints, so a client cannot store large blobs.
- `tools/check-supabase.mjs` asserts: own read/write works; another user cannot read or forge someone's save or events; events cannot be edited or deleted; oversized payloads are rejected; duplicate event ids are ignored; a signed-out client sees nothing.

## Local storage keys
`mq.save.v1` (save), `mq.settings.v1` (`{ statsOptOut }`), `mq.stats-queue.v1` (pending events, max 200), `mq.supabase.auth` (session).

## Sync model
- **Local save is the source of truth during play.** It is written on NPC or form changes (0.5 s debounce), every 10 s, when the tab hides and on `pagehide`. Parsed defensively on load (`parseSave`): bad or foreign data is dropped or clamped, saves from a newer game version are ignored, versions migrate through `MIGRATIONS`.
- **Cloud save:** after sign-in, pull once; apply only if `saved_at` is newer than the local save (ties keep local). Push when progress (form, NPC state, level, XP, bag, equipment, quests, garden, dungeon) changed: at most every 30 s, and immediately when an NPC joins or the tab hides. Position alone never triggers a push.
- **Stats:** queued locally, batches of 25 upserted with `ignoreDuplicates`, exponential backoff 15 s → 10 min, queue capped at 200 (oldest dropped).
- **Opt-out** (pause menu): stops collection, empties the queue, stored locally and in `players.stats_opt_out`.
- **Failure states** (shown in the pause menu): not configured → local only; invalid settings; anonymous sign-ins disabled (one attempt per page load, no retry loop); offline (backoff 30 s → 10 min).
