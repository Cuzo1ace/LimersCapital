-- Migration 010 — Premium "Terminal" dashboard
--
-- Adds:
--   * users.tier              — 'free' | 'pro' (default 'free'); manually flipped until Stripe
--   * users.mcp_api_key       — per-user API key exposed to external MCP agents
--   * etf_holdings            — look-through weights refreshed nightly by the
--                               /cron/etf-refresh worker endpoint (ARK + iShares adapters)
--   * user_portfolios         — uploaded CSV/JSON positions (jsonb blob per user)
--
-- RLS:
--   * users + user_portfolios remain row-owned (audit C-01 / 009 lockdown still applies)
--   * etf_holdings is public-readable so the browser can compute overlap client-side

BEGIN;

-- ── users: tier + mcp_api_key ─────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free' NOT NULL,
  ADD COLUMN IF NOT EXISTS mcp_api_key text;

ALTER TABLE public.users
  ADD CONSTRAINT users_tier_check CHECK (tier IN ('free', 'pro'));

CREATE UNIQUE INDEX IF NOT EXISTS users_mcp_api_key_uidx
  ON public.users (mcp_api_key)
  WHERE mcp_api_key IS NOT NULL;

-- ── etf_holdings: look-through weights, nightly refresh ───────────────
CREATE TABLE IF NOT EXISTS public.etf_holdings (
  etf_symbol   text NOT NULL,
  ticker       text NOT NULL,
  name         text,
  weight_pct   numeric(8,5) NOT NULL,
  asset_class  text,
  source       text NOT NULL,                -- 'ark' | 'ishares' | 'spdr' | …
  as_of        date NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (etf_symbol, ticker, as_of)
);

CREATE INDEX IF NOT EXISTS etf_holdings_etf_idx
  ON public.etf_holdings (etf_symbol, as_of DESC);
CREATE INDEX IF NOT EXISTS etf_holdings_ticker_idx
  ON public.etf_holdings (ticker);

ALTER TABLE public.etf_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY etf_holdings_public_read
  ON public.etf_holdings FOR SELECT TO anon, authenticated
  USING (true);

-- Only the service role upserts (nightly cron). No client writes.
CREATE POLICY etf_holdings_service_write
  ON public.etf_holdings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── user_portfolios: uploaded positions ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_portfolios (
  user_id        uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_address text,
  holdings       jsonb NOT NULL DEFAULT '[]'::jsonb,
  uploaded_at    timestamptz NOT NULL DEFAULT now(),
  source         text                         -- 'csv' | 'json' | 'manual'
);

CREATE INDEX IF NOT EXISTS user_portfolios_wallet_idx
  ON public.user_portfolios (wallet_address);

ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;

-- Users can read/write only their own portfolio row.
CREATE POLICY user_portfolios_self_read
  ON public.user_portfolios FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_portfolios_self_upsert
  ON public.user_portfolios FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_portfolios_self_update
  ON public.user_portfolios FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY user_portfolios_self_delete
  ON public.user_portfolios FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Service role does full management for the AI tool router.
CREATE POLICY user_portfolios_service_all
  ON public.user_portfolios FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── Helper RPC: flip a user to pro (manual admin use) ─────────────────
-- Usage from SQL editor:  select public.upgrade_to_pro('wallet-or-uuid');
CREATE OR REPLACE FUNCTION public.upgrade_to_pro(p_identifier text)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users;
  v_key  text;
BEGIN
  v_key := encode(gen_random_bytes(24), 'hex');

  UPDATE public.users
     SET tier = 'pro',
         mcp_api_key = COALESCE(mcp_api_key, v_key)
   WHERE wallet_address = p_identifier
      OR id::text = p_identifier
   RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upgrade_to_pro(text) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.upgrade_to_pro(text) TO service_role;

COMMIT;
