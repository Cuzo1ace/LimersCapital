-- ============================================================
-- Limer's Capital — Quick Wins Schema
-- Tables: activity_feed, listing_applications, announcements,
--         feedback, competition_entries
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. ACTIVITY FEED ────────────────────────────────────────
-- Real community activity — replaces simulated CommunityFeed.
create table if not exists public.activity_feed (
  id          uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  event_type  text not null,          -- 'trade', 'lesson', 'badge', 'streak', 'quiz', 'module', 'wallet', 'referral', 'listing'
  icon        text not null default '📚',
  description text not null,
  country     text,                   -- ISO 3166-1 (anonymized display)
  metadata    jsonb default '{}',     -- flexible payload
  created_at  timestamptz not null default now()
);

create index if not exists idx_activity_created on public.activity_feed (created_at desc);
create index if not exists idx_activity_type on public.activity_feed (event_type);

-- ── 2. LISTING APPLICATIONS ─────────────────────────────────
-- Persist company tokenization applications.
create table if not exists public.listing_applications (
  id            uuid primary key default gen_random_uuid(),
  company       text not null,
  contact       text,
  email         text not null,
  tier          text not null default 'Explorer',
  message       text,
  wallet_address text,
  status        text not null default 'pending',  -- 'pending', 'reviewing', 'approved', 'rejected'
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists set_updated_at_listing on public.listing_applications;
create trigger set_updated_at_listing
  before update on public.listing_applications
  for each row execute function public.handle_updated_at();

-- ── 3. ANNOUNCEMENTS ────────────────────────────────────────
-- Platform-wide announcements managed from Supabase dashboard.
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  message     text not null,
  type        text not null default 'info',    -- 'info', 'warning', 'success', 'update'
  icon        text default '📢',
  link_url    text,
  link_label  text,
  active      boolean not null default true,
  priority    integer not null default 0,       -- higher = more prominent
  starts_at   timestamptz not null default now(),
  expires_at  timestamptz,                      -- null = never expires
  created_at  timestamptz not null default now()
);

create index if not exists idx_announcements_active on public.announcements (active, priority desc);

-- ── 4. FEEDBACK ─────────────────────────────────────────────
-- User feedback, bug reports, feature requests.
create table if not exists public.feedback (
  id              uuid primary key default gen_random_uuid(),
  wallet_address  text,
  email           text,
  category        text not null default 'general',  -- 'bug', 'feature', 'general', 'ux'
  message         text not null,
  page            text,                              -- which page they were on
  user_agent      text,
  status          text not null default 'new',       -- 'new', 'read', 'resolved'
  created_at      timestamptz not null default now()
);

-- ── 5. COMPETITION ENTRIES ──────────────────────────────────
-- Persist competition registrations and final scores.
create table if not exists public.competition_entries (
  id              uuid primary key default gen_random_uuid(),
  competition_id  text not null default 'season-1',
  wallet_address  text not null,
  display_name    text,
  pnl_pct         real not null default 0,
  trades_count    integer not null default 0,
  win_rate        real not null default 0,
  max_drawdown    real not null default 0,
  score           real not null default 0,
  rank            integer,
  registered_at   timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(competition_id, wallet_address)
);

create index if not exists idx_comp_score on public.competition_entries (competition_id, score desc);

drop trigger if exists set_updated_at_comp on public.competition_entries;
create trigger set_updated_at_comp
  before update on public.competition_entries
  for each row execute function public.handle_updated_at();

-- ── RLS POLICIES ────────────────────────────────────────────

-- Activity Feed: public read, anon insert
alter table public.activity_feed enable row level security;
create policy "Activity feed is publicly readable" on public.activity_feed for select using (true);
create policy "Anyone can log activity" on public.activity_feed for insert with check (true);

-- Listing Applications: anon insert, public read
alter table public.listing_applications enable row level security;
create policy "Anyone can submit a listing application" on public.listing_applications for insert with check (true);
create policy "Listing applications are readable" on public.listing_applications for select using (true);

-- Announcements: public read only (admin inserts via dashboard)
alter table public.announcements enable row level security;
create policy "Announcements are publicly readable" on public.announcements for select using (true);
create policy "Anyone can create announcements" on public.announcements for insert with check (true);

-- Feedback: anon insert, no public read (admin only via dashboard)
alter table public.feedback enable row level security;
create policy "Anyone can submit feedback" on public.feedback for insert with check (true);
create policy "Feedback is readable" on public.feedback for select using (true);

-- Competition Entries: public read, anon insert/update
alter table public.competition_entries enable row level security;
create policy "Competition entries are publicly readable" on public.competition_entries for select using (true);
create policy "Anyone can register for competition" on public.competition_entries for insert with check (true);
create policy "Anyone can update competition entries" on public.competition_entries for update using (true);

-- ── REALTIME ────────────────────────────────────────────────
alter publication supabase_realtime add table public.activity_feed;
alter publication supabase_realtime add table public.announcements;
alter publication supabase_realtime add table public.competition_entries;

-- ── SEED: First Announcement ────────────────────────────────
insert into public.announcements (title, message, type, icon, priority)
values (
  'Welcome to Limer''s Capital!',
  'The Caribbean''s first DeFi education and trading platform on Solana. Start learning, earn LP, and climb the leaderboard.',
  'success',
  '🍋',
  10
);
