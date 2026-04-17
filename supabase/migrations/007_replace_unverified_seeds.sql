-- ============================================================
-- Limer's Capital — Legal-Safety Patch (Phase 2.3)
--
-- Removes two unverified curated news_items that asserted regulatory
-- actions by named third parties (TTSE, Jamaica CBDC, Barbados) not
-- authorized to be spoken for. Replaces the featured slot with a
-- verifiable, externally-sourced SolanaFloor article, and promotes
-- an already-ingested MoonPay/Solana headline to cover the secondary
-- slot.
--
-- Non-destructive to the edge function: SHA-256 dedup_hash on the new
-- Drift row matches what the scraper would compute so future ingests
-- won't duplicate.
-- ============================================================

-- ── Remove unverified claims ────────────────────────────────
delete from public.news_items
 where source_type = 'curated'
   and source_name = 'Limer''s Capital'
   and title in (
     'TTSE announces pilot framework for tokenized equities',
     'Caribbean fintech roundup — Jamaica CBDC expansion, Barbados crypto-asset law update'
   );

-- ── Insert the Drift recovery item (featured) ───────────────
insert into public.news_items
  (source_type, source_name, source_url, title, summary,
   tags, tickers, countries, priority, published_at, dedup_hash)
values (
  'curated',
  'SolanaFloor',
  'https://solanafloor.com/news/tether-leads-150m-drift-recovery-plan-after-circle-refused-freeze-stolen-funds',
  'Tether leads $150M Drift recovery after Circle refused to freeze stolen funds',
  'Tether led a $150M recovery initiative for Drift Protocol following an April 1st exploit that caused losses exceeding $285M. Circle declined to intercept the stolen funds as they moved through its CCTP, prompting the Drift community to pursue recovery through protocol revenue allocation, with Solana Foundation participating as a partner.',
  array['solana','defi','drift','stablecoin','security'],
  array['SOL']::text[],
  array[]::text[],
  50,
  now() - interval '2 hours',
  encode(sha256(
    'tether leads $150m drift recovery after circle refused to freeze stolen funds||https://solanafloor.com/news/tether-leads-150m-drift-recovery-plan-after-circle-refused-freeze-stolen-funds'::bytea
  ), 'hex')
)
on conflict (dedup_hash) do nothing;

-- ── Promote MoonPay payments row into the featured region ───
update public.news_items
   set priority = 30
 where source_name = 'Solflare — news'
   and title = 'Solana Powers 88% of MoonPay Commerce Volume as Onchain Payments Accelerate';
