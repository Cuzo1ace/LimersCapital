/**
 * Representative ETF holdings used when the worker endpoints aren't
 * reachable (local dev without ALPHAVANTAGE_API_KEY / R2 cache). The
 * numbers are approximate snapshots, not live — swap in the worker
 * routes as soon as secrets are provisioned.
 *
 * Source: public filings / fund fact sheets as of 2026-Q1.
 */

export const MOCK_HOLDINGS = {
  SPY: [
    { ticker: 'AAPL',  name: 'Apple',              weight_pct: 7.20 },
    { ticker: 'MSFT',  name: 'Microsoft',          weight_pct: 6.80 },
    { ticker: 'NVDA',  name: 'NVIDIA',             weight_pct: 6.50 },
    { ticker: 'AMZN',  name: 'Amazon',             weight_pct: 3.80 },
    { ticker: 'META',  name: 'Meta Platforms',     weight_pct: 2.40 },
    { ticker: 'GOOGL', name: 'Alphabet A',         weight_pct: 2.10 },
    { ticker: 'GOOG',  name: 'Alphabet C',         weight_pct: 1.80 },
    { ticker: 'BRK.B', name: 'Berkshire Hathaway', weight_pct: 1.60 },
    { ticker: 'TSLA',  name: 'Tesla',              weight_pct: 1.50 },
    { ticker: 'LLY',   name: 'Eli Lilly',          weight_pct: 1.40 },
    { ticker: 'JPM',   name: 'JPMorgan',           weight_pct: 1.30 },
    { ticker: 'V',     name: 'Visa',               weight_pct: 1.10 },
  ],
  QQQ: [
    { ticker: 'AAPL',  name: 'Apple',            weight_pct: 9.20 },
    { ticker: 'MSFT',  name: 'Microsoft',        weight_pct: 8.70 },
    { ticker: 'NVDA',  name: 'NVIDIA',           weight_pct: 8.40 },
    { ticker: 'AMZN',  name: 'Amazon',           weight_pct: 5.60 },
    { ticker: 'META',  name: 'Meta Platforms',   weight_pct: 4.90 },
    { ticker: 'AVGO',  name: 'Broadcom',         weight_pct: 4.20 },
    { ticker: 'GOOGL', name: 'Alphabet A',       weight_pct: 3.20 },
    { ticker: 'TSLA',  name: 'Tesla',            weight_pct: 3.00 },
    { ticker: 'COST',  name: 'Costco',           weight_pct: 2.40 },
    { ticker: 'NFLX',  name: 'Netflix',          weight_pct: 2.20 },
    { ticker: 'ADBE',  name: 'Adobe',            weight_pct: 1.70 },
    { ticker: 'AMD',   name: 'AMD',              weight_pct: 1.40 },
  ],
  ARKK: [
    { ticker: 'TSLA',  name: 'Tesla',             weight_pct: 12.50 },
    { ticker: 'COIN',  name: 'Coinbase',          weight_pct: 10.80 },
    { ticker: 'RBLX',  name: 'Roblox',            weight_pct: 7.20 },
    { ticker: 'PATH',  name: 'UiPath',            weight_pct: 5.40 },
    { ticker: 'CRSP',  name: 'CRISPR Therapeutics', weight_pct: 5.10 },
    { ticker: 'HOOD',  name: 'Robinhood',         weight_pct: 4.80 },
    { ticker: 'PLTR',  name: 'Palantir',          weight_pct: 4.60 },
    { ticker: 'SHOP',  name: 'Shopify',           weight_pct: 4.30 },
    { ticker: 'U',     name: 'Unity',             weight_pct: 3.40 },
    { ticker: 'TDOC',  name: 'Teladoc',           weight_pct: 3.20 },
    { ticker: 'BEAM',  name: 'Beam Therapeutics', weight_pct: 2.90 },
    { ticker: 'NVDA',  name: 'NVIDIA',            weight_pct: 2.60 },
  ],
  VTI: [
    { ticker: 'AAPL', name: 'Apple',            weight_pct: 6.50 },
    { ticker: 'MSFT', name: 'Microsoft',        weight_pct: 6.10 },
    { ticker: 'NVDA', name: 'NVIDIA',           weight_pct: 5.80 },
    { ticker: 'AMZN', name: 'Amazon',           weight_pct: 3.40 },
    { ticker: 'META', name: 'Meta Platforms',   weight_pct: 2.10 },
    { ticker: 'GOOGL',name: 'Alphabet A',       weight_pct: 1.80 },
    { ticker: 'TSLA', name: 'Tesla',            weight_pct: 1.40 },
    { ticker: 'JPM',  name: 'JPMorgan',         weight_pct: 1.10 },
  ],
  IBIT: [
    { ticker: 'BTC', name: 'Bitcoin', weight_pct: 99.50 },
  ],
  TLT: [
    { ticker: 'T-BOND-30Y', name: 'US Treasury 30Y', weight_pct: 99.00 },
  ],
  IWM: [
    { ticker: 'SMCI', name: 'Super Micro Computer', weight_pct: 1.80 },
    { ticker: 'MSTR', name: 'MicroStrategy',        weight_pct: 1.40 },
    { ticker: 'ELF',  name: "e.l.f. Beauty",        weight_pct: 0.80 },
    { ticker: 'HIMS', name: 'Hims & Hers',          weight_pct: 0.60 },
  ],
};

/**
 * Return a holdings doc in the same shape as /ark/holdings/:SYM /
 * /ishares/holdings/:SYM return. Returns null if no mock is known.
 */
export function mockHoldings(etfSymbol) {
  const rows = MOCK_HOLDINGS[String(etfSymbol || '').toUpperCase()];
  if (!rows) return null;
  return {
    asOf: new Date().toISOString().slice(0, 10),
    rows: rows.map(r => ({
      etf_symbol:  etfSymbol,
      ticker:      r.ticker,
      name:        r.name,
      weight_pct:  r.weight_pct,
      asset_class: 'equity',
      source:      'mock',
    })),
  };
}
