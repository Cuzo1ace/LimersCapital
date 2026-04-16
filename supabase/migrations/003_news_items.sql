-- ============================================================
-- Limer's Capital — News & Events Schema (Phase 1)
-- Table: news_items (single table, discriminated by source_type)
--
-- Feeds the /news tab: curated items, RSS pulls, AI-summarized
-- briefs, and regional events calendar — all ranked in one timeline.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── news_items ──────────────────────────────────────────────
create table if not exists public.news_items (
  id            uuid primary key default gen_random_uuid(),
  source_type   text not null check (source_type in ('curated','rss','ai_summary','event')),
  source_name   text,                -- 'TTSE', 'Colosseum', 'CoinDesk Caribbean RSS', 'manual'
  source_url    text,                -- original link (nullable for curated)
  title         text not null,
  summary       text,                -- 2-sentence AI or human blurb
  body_md       text,                -- optional long form
  hero_image    text,
  tags          text[] default '{}', -- ['solana','ttse','caribbean','defi','hackathon']
  tickers       text[] default '{}', -- ['SOL','BTC','NGL.TT']
  countries     text[] default '{}', -- ['TT','JM','BB']
  priority      integer not null default 0,           -- manual boost, -100..100
  published_at  timestamptz not null default now(),   -- for freshness ranking
  event_at      timestamptz,                           -- only source_type='event'
  expires_at    timestamptz,                           -- cut from feed after this
  dedup_hash    text unique,                           -- sha256(title || source_url) to prevent duplicates
  ai_model      text,                                  -- 'claude-haiku-4-5' if AI-generated
  ai_cost_usd   numeric(8,6),
  created_at    timestamptz not null default now()
);

-- ── indexes ─────────────────────────────────────────────────
create index if not exists idx_news_source_published
  on public.news_items (source_type, published_at desc);

-- Full index on published_at — primary query path.
-- (Postgres forbids now() in a partial-index predicate because now() is STABLE
-- not IMMUTABLE; we filter at query time instead.)
create index if not exists idx_news_active_published
  on public.news_items (published_at desc);

-- Event-specific index for countdowns. Can be partial on source_type (immutable)
-- but NOT on event_at > now() (not immutable) — we filter event_at at query time.
create index if not exists idx_news_events_upcoming
  on public.news_items (event_at asc)
  where source_type = 'event';

-- Personalization filters
create index if not exists idx_news_tags    on public.news_items using gin (tags);
create index if not exists idx_news_tickers on public.news_items using gin (tickers);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.news_items enable row level security;

-- Public can only read active (non-expired) items
create policy "News items are publicly readable when active"
  on public.news_items for select
  using (expires_at is null or expires_at > now());

-- Writes restricted to service role (edge function / admin)
-- No insert/update/delete policies defined for anon → blocked by default.
-- Service role bypasses RLS so the ingest edge function can write.

-- ── REALTIME ─────────────────────────────────────────────────
-- NOT enabling realtime on news_items to conserve Supabase connection budget.
-- Client polls on tab focus + every 60s. Announcements already on realtime.

-- ── SEED: a few curated items + one upcoming event ──────────
insert into public.news_items (source_type, source_name, title, summary, tags, tickers, countries, priority, published_at)
values
  ('curated', 'Limer''s Capital',
    'TTSE announces pilot framework for tokenized equities',
    'The Trinidad & Tobago Stock Exchange published draft rules for a tokenized-equity pilot. The framework references custodial attestations and a regulator bridge approach similar to Layer-1 on Solana.',
    array['ttse','caribbean','tokenization','regulation'],
    array['NGL.TT','FCI.TT'],
    array['TT'],
    50,
    now() - interval '2 hours'
  ),
  ('curated', 'Solana Foundation',
    'Token-2022 transfer-hook adoption grows across RWA projects',
    'Several real-world-asset issuers moved to Token-2022 this quarter, citing the programmable transfer-hook extension as a fit for KYC-gated transfers and attestation-aware compliance.',
    array['solana','defi','rwa','tokenization'],
    array['SOL'],
    array['US'],
    25,
    now() - interval '1 day'
  ),
  ('curated', 'Limer''s Capital',
    'Caribbean fintech roundup — Jamaica CBDC expansion, Barbados crypto-asset law update',
    'Jamaica''s CBDC pilot expanded to three additional parishes; Barbados tabled a draft crypto-asset business bill with tiered licensing thresholds.',
    array['caribbean','cbdc','regulation'],
    array[]::text[],
    array['JM','BB'],
    30,
    now() - interval '6 hours'
  ),
  ('event', 'Colosseum Hackathon',
    'Colosseum Breakout Hackathon — final submission deadline',
    'Submit your project, demo video, and pitch deck by this date. Eligible projects compete for grants and founder accelerator slots.',
    array['hackathon','solana'],
    array[]::text[],
    array['US'],
    60,
    now() - interval '1 day'
  );

-- The event row needs event_at — update in a follow-up statement (literal date 30 days out)
update public.news_items
  set event_at = now() + interval '30 days',
      expires_at = now() + interval '31 days'
  where source_type = 'event'
    and title = 'Colosseum Breakout Hackathon — final submission deadline';
