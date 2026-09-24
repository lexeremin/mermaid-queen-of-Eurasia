-- Mermaid Queen of Eurasia: players, cloud saves, anonymous stat events.
-- Run once in the Supabase SQL Editor (or `supabase db push`). Requires Anonymous sign-ins enabled
-- (Authentication > Sign In / Providers > Anonymous). Every table is owner-only via RLS.

create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  device_class text not null default 'desktop' check (device_class in ('desktop', 'mobile')),
  stats_opt_out boolean not null default false
);

create table if not exists public.saves (
  player_id uuid primary key references auth.users (id) on delete cascade,
  version int not null check (version between 1 and 1000),
  data jsonb not null check (pg_column_size(data) <= 65536),
  saved_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.stat_events (
  id uuid primary key,
  player_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (char_length(type) between 1 and 40),
  payload jsonb not null default '{}'::jsonb check (pg_column_size(payload) <= 2048),
  client_ts timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists stat_events_player_created_idx
  on public.stat_events (player_id, created_at desc);

alter table public.players enable row level security;
alter table public.saves enable row level security;
alter table public.stat_events enable row level security;

-- Only signed-in (including anonymous) users; the anon role gets nothing.
revoke all on public.players, public.saves, public.stat_events from anon;
grant select, insert, update on public.players, public.saves to authenticated;
grant select, insert on public.stat_events to authenticated;

drop policy if exists players_select_own on public.players;
drop policy if exists players_insert_own on public.players;
drop policy if exists players_update_own on public.players;
create policy players_select_own on public.players
  for select to authenticated using (id = (select auth.uid()));
create policy players_insert_own on public.players
  for insert to authenticated with check (id = (select auth.uid()));
create policy players_update_own on public.players
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists saves_select_own on public.saves;
drop policy if exists saves_insert_own on public.saves;
drop policy if exists saves_update_own on public.saves;
create policy saves_select_own on public.saves
  for select to authenticated using (player_id = (select auth.uid()));
create policy saves_insert_own on public.saves
  for insert to authenticated with check (player_id = (select auth.uid()));
create policy saves_update_own on public.saves
  for update to authenticated
  using (player_id = (select auth.uid())) with check (player_id = (select auth.uid()));

-- Stat events are append-only from the client: no update or delete policy.
drop policy if exists stat_events_select_own on public.stat_events;
drop policy if exists stat_events_insert_own on public.stat_events;
create policy stat_events_select_own on public.stat_events
  for select to authenticated using (player_id = (select auth.uid()));
create policy stat_events_insert_own on public.stat_events
  for insert to authenticated with check (player_id = (select auth.uid()));
