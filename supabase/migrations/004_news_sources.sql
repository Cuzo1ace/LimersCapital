-- ============================================================
-- Limer's Capital — News Sources Config (Phase 2)
-- Table: news_sources — drives the ingest-news edge function.
--
-- Keeps RSS / X-bridge / scraper endpoints as DATA (editable via
-- Supabase Studio) instead of code. The edge function reads from
-- this table each tick, so you can add/pause sources without a
-- redeploy.
--
-- Run after: 003_news_items.sql
-- ============================================================

-- ── news_sources ───────────────────────────────────────────
create table if not exists public.news_sources (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,                -- display name, e.g. "SolanaFloor (X)"
  kind              text not null check (kind in ('rss','x_twitter','scraper','api')),
  url               text not null,                 -- actual feed URL (RSSHub for X)
  profile_url       text,                          -- user-facing URL (twitter.com/...) for reference
  tags              text[] default '{}',           -- auto-applied to every item from this source
  countries         text[] default '{}',           -- auto-applied to every item
  priority_boost    integer not null default 0,    -- -100..100, added to news_items.priority on insert
  active            boolean not null default true,
  requires_bridge   boolean not null default false,-- true = URL is via RSSHub / third-party bridge
  max_items_per_tick integer not null default 10,  -- cap so one chatty source can't dominate
  fetch_timeout_ms  integer not null default 10000,
  -- Operational telemetry (updated by edge function, not by humans)
  last_success_at   timestamptz,
  last_error        text,
  last_error_at     timestamptz,
  consecutive_errors integer not null default 0,   -- edge fn auto-disables after N in a row
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (url)
);

create index if not exists idx_news_sources_active
  on public.news_sources (active, kind);

drop trigger if exists set_updated_at_news_sources on public.news_sources;
create trigger set_updated_at_news_sources
  before update on public.news_sources
  for each row execute function public.handle_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
alter table public.news_sources enable row level security;

-- Admins (service role) bypass RLS — edge function writes telemetry.
-- Anon users should NOT see RSS bridge URLs (might leak self-hosted endpoints).
-- So: no select policy for anon → blocked.

-- ── Seed: core RSS sources ─────────────────────────────────
insert into public.news_sources
  (name, kind, url, profile_url, tags, countries, priority_boost, requires_bridge, max_items_per_tick)
values
  -- Native RSS (reliable)
  ('Solana Foundation blog',
   'rss',
   'https://solana.com/news/rss.xml',
   'https://solana.com/news',
   array['solana','defi'],
   array[]::text[],
   10, false, 10),

  ('CoinDesk — headlines',
   'rss',
   'https://www.coindesk.com/arc/outboundfeeds/rss/',
   'https://www.coindesk.com',
   array['crypto','market'],
   array[]::text[],
   0, false, 6),

  ('Colosseum blog',
   'rss',
   'https://www.colosseum.org/blog/rss.xml',
   'https://www.colosseum.org',
   array['hackathon','solana','founders'],
   array[]::text[],
   20, false, 5),

  -- X / Twitter accounts — via RSSHub bridge
  -- ⚠️ You need a working RSSHub endpoint (self-host or rsshub.app).
  -- If using a self-hosted instance, replace the host below.
  ('SolanaFloor (X)',
   'x_twitter',
   'https://rsshub.app/twitter/user/SolanaFloor',
   'https://x.com/SolanaFloor',
   array['solana','alpha','onchain'],
   array[]::text[],
   15, true, 8),

  ('MarketWatch (X)',
   'x_twitter',
   'https://rsshub.app/twitter/user/MarketWatch',
   'https://x.com/MarketWatch',
   array['market','finance','macro'],
   array['US']::text[],
   0, true, 6),

  ('TheStreet (X)',
   'x_twitter',
   'https://rsshub.app/twitter/user/TheStreet',
   'https://x.com/TheStreet',
   array['market','finance','equities'],
   array['US']::text[],
   0, true, 6),

  ('Whale Insider (X)',
   'x_twitter',
   'https://rsshub.app/twitter/user/WhaleInsider',
   'https://x.com/WhaleInsider',
   array['crypto','onchain','whale-watch'],
   array[]::text[],
   10, true, 8)
on conflict (url) do nothing;

-- ── Helper: list active sources for the edge function ─────
-- The edge function will just query this, but it's nice to read here too.
comment on table public.news_sources is
  'Config for ingest-news edge function. Edit via Supabase Studio. '
  'Set active=false to pause a source without deleting it. '
  'consecutive_errors >= 5 auto-disables (set back to 0 to re-enable).';
