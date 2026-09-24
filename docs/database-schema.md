# Database Schema (Supabase)

Status: **design only.** Implemented in Phase 6. Migrations live in `supabase/migrations/` and are created with `supabase migration new`.

## Identity
Supabase **anonymous sign-in**. `auth.uid()` is the player id. No email, no profile data. If the browser storage is cleared, the player becomes a new anonymous user (cross-device restore is a stretch goal).

## Tables (draft)

### `players`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | = `auth.uid()` |
| `created_at` | timestamptz | default now() |
| `last_seen_at` | timestamptz | |
| `device_class` | text | `desktop` \| `mobile` |
| `stats_opt_out` | boolean | default false |

### `saves`
| Column | Type | Notes |
|---|---|---|
| `player_id` | uuid PK, FK players | one cloud save per player (slice) |
| `version` | int | save schema version |
| `data` | jsonb | same shape as the localStorage save |
| `updated_at` | timestamptz | last-write-wins |

### `stat_events`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | client-generated (idempotent retries) |
| `player_id` | uuid FK | |
| `type` | text | e.g. `run_started`, `quest_completed`, `boss_defeated`, `form_unlocked`, `player_died`, `level_up` |
| `payload` | jsonb | small, no PII |
| `client_ts` | timestamptz | |
| `created_at` | timestamptz | default now() |

Optional aggregate view/table (`player_stats`) can be added if querying raw events gets slow.

## Row-level security (mandatory)
- RLS enabled on every table.
- `players`: a user can select/insert/update only the row where `id = auth.uid()`.
- `saves`: select/insert/update only where `player_id = auth.uid()`.
- `stat_events`: insert-only where `player_id = auth.uid()`; select own rows only. No update/delete from the client.
- Add size limits (check constraints) on `data` and `payload` to prevent abuse.

## Sync model
- Local queue in `localStorage`: `[event, …]`, flushed in batches (e.g. every 30 s, on `visibilitychange` hidden, on quest/boss milestones).
- Event `id` is generated client-side, so retries are idempotent (`insert … on conflict do nothing`).
- Save sync: last-write-wins by `updated_at`. Local save is always the source of truth during play.
- Opt-out: stop queueing, clear the queue, set `stats_opt_out = true`.
