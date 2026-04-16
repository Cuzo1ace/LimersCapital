-- ============================================================
-- Limer's Capital — News Sources Trim (Phase 2.1)
--
-- Disables X/Twitter sources (no RSSHub budget yet).
-- Adds Solflare News as a scraper-kind source, inactive until
-- the scraper code path is implemented.
--
-- Run after: 004_news_sources.sql
-- Safe to run twice.
-- ============================================================

-- ── Disable the 4 X sources ────────────────────────────────
-- Kept in the table (not deleted) so flipping them back on later
-- is a one-column update, not a re-seed.
update public.news_sources
  set active = false,
      last_error = 'Paused — awaiting RSSHub endpoint (no budget yet)',
      last_error_at = now()
where kind = 'x_twitter'
  and active = true;

-- ── Add Solflare News ───────────────────────────────────────
-- /news/ is an HTML marketing page, not an RSS feed, so kind='scraper'.
-- Left inactive until the edge function has an HTML-scrape branch.
insert into public.news_sources
  (name, kind, url, profile_url, tags, countries, priority_boost, requires_bridge, max_items_per_tick, active, last_error)
values
  ('Solflare — news',
   'scraper',
   'https://www.solflare.com/news/',
   'https://www.solflare.com/news/',
   array['solana','wallet','product']::text[],
   array[]::text[],
   5, false, 5, false,
   'Paused — scraper code path not yet implemented (no RSS on /news/)')
on conflict (url) do nothing;

-- ── Verify current active set ───────────────────────────────
-- After running this, the only active sources should be:
--   1. Solana Foundation blog
--   2. CoinDesk — headlines
--   3. Colosseum blog
-- Run in Studio to confirm:
--   select name, kind, active from news_sources order by active desc, name;
