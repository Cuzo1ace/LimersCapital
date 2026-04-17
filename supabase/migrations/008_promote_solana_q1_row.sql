-- ============================================================
-- Limer's Capital — Fix secondary promotion target (Phase 2.4)
--
-- Migration 007's UPDATE targeted a MoonPay headline that is no
-- longer on Solflare's first page, so it no-op'd. Promoting the
-- strongest available financial-milestone headline instead:
-- "Solana Records $1.1T in Q1 Economic Activity".
-- ============================================================

update public.news_items
   set priority = 30
 where source_name = 'Solflare — news'
   and title = 'Solana Records $1.1T in Q1 Economic Activity, A New All-Time High';
