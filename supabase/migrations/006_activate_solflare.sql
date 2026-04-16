-- ============================================================
-- Limer's Capital — Activate Solflare scraper (Phase 2.2)
--
-- The ingest-news edge function now has an HTML-scraper branch
-- for Solflare's /news/ page. Flipping the row live.
-- ============================================================

update public.news_sources
  set active = true,
      last_error = null,
      last_error_at = null,
      consecutive_errors = 0
where kind = 'scraper'
  and url = 'https://www.solflare.com/news/';
