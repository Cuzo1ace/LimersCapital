-- ============================================================
-- Limer's Capital — Supabase Initial Schema
-- Tables: users, leaderboard (view), waitlist
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. USERS ────────────────────────────────────────────────
-- Core user record, created on wallet connect.
-- wallet_address is the primary identity (no Supabase Auth).
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  email          text unique,
  display_name   text,
  referral_code  text unique,
  referred_by    text references public.users(referral_code),
  xp             integer not null default 0,
  limer_points   integer not null default 0,
  tier           text not null default 'Guppy',
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  trades_count   integer not null default 0,
  lessons_count  integer not null default 0,
  country        text,                            -- ISO 3166-1 alpha-2
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Index for leaderboard queries (xp desc, limer_points desc)
create index if not exists idx_users_xp on public.users (xp desc);
create index if not exists idx_users_lp on public.users (limer_points desc);
create index if not exists idx_users_referral on public.users (referral_code);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.users;
create trigger set_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- ── 2. LEADERBOARD VIEW ─────────────────────────────────────
-- No separate table needed — just a view on users.
create or replace view public.leaderboard as
select
  row_number() over (order by xp desc, limer_points desc) as rank,
  wallet_address,
  display_name,
  xp,
  limer_points,
  tier,
  current_streak,
  trades_count,
  country
from public.users
where xp > 0
order by xp desc, limer_points desc
limit 100;

-- ── 3. WAITLIST ─────────────────────────────────────────────
-- Pre-launch email capture. No auth required.
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  country    text,                              -- ISO 3166-1 alpha-2
  source     text default 'website',            -- 'website', 'referral', 'colosseum', etc.
  wallet_address text,                          -- optional, if they already have one
  created_at timestamptz not null default now()
);

create index if not exists idx_waitlist_created on public.waitlist (created_at desc);

-- ── 4. ROW LEVEL SECURITY ───────────────────────────────────
-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.waitlist enable row level security;

-- Users: anyone can read the leaderboard fields, but only the
-- row owner can update their own data.
-- Since we use anon key (no Supabase Auth), we use a permissive
-- read policy and restrict writes via the API layer + wallet signature.

-- Public read (leaderboard, profile lookups)
create policy "Users are publicly readable"
  on public.users for select
  using (true);

-- Insert: allow anon inserts (wallet connect creates the row)
create policy "Anyone can create a user profile"
  on public.users for insert
  with check (true);

-- Update: allow anon updates (API layer validates wallet ownership)
create policy "Anyone can update user profiles"
  on public.users for update
  using (true);

-- Waitlist: anyone can insert, public read for count
create policy "Anyone can join waitlist"
  on public.waitlist for insert
  with check (true);

create policy "Waitlist is publicly readable"
  on public.waitlist for select
  using (true);

-- ── 5. REALTIME ─────────────────────────────────────────────
-- Enable realtime for leaderboard updates
alter publication supabase_realtime add table public.users;
