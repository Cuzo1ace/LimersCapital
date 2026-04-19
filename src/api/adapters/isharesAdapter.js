/**
 * iShares / BlackRock holdings adapter.
 *
 * iShares product pages expose a JSON "holdings" payload. We use the
 * "1467271812596.ajax" endpoint pattern which accepts ?fileType=json
 * and returns an array-of-arrays of [Ticker, Name, AssetClass, Weight, ...].
 *
 * For MVP we hard-code a whitelist of tickers and their product URL stubs.
 * All params encoded at the worker edge — this module only normalizes.
 *
 * Active ETFs we track (MVP):
 *   SPY (SPDR, same schema as iShares JSON pass-through via proxy) — excluded here
 *   IVV · IWM · EFA · EEM · TLT · HYG · GLD (via SPDR, proxied)
 *   IBIT — iShares Bitcoin Trust (Bitcoin exposure, sanity ticker)
 *
 * NOTE: We don't ship the full list of 500+ holdings for IVV in a single
 * payload on every request. The worker caches by (symbol, as_of) in R2 and
 * only hits iShares when the cache is older than 24h.
 */

const ISHARES_PRODUCTS = {
  IVV:  { url: 'https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf/1467271812596.ajax',   name: 'iShares Core S&P 500' },
  IWM:  { url: 'https://www.ishares.com/us/products/239710/ishares-russell-2000-etf/1467271812596.ajax', name: 'iShares Russell 2000' },
  EFA:  { url: 'https://www.ishares.com/us/products/239623/ishares-msci-eafe-etf/1467271812596.ajax',     name: 'iShares MSCI EAFE' },
  EEM:  { url: 'https://www.ishares.com/us/products/239637/ishares-msci-emerging-markets-etf/1467271812596.ajax', name: 'iShares MSCI Emerging Markets' },
  TLT:  { url: 'https://www.ishares.com/us/products/239454/ishares-20-year-treasury-bond-etf/1467271812596.ajax', name: 'iShares 20+ Year Treasury' },
  HYG:  { url: 'https://www.ishares.com/us/products/239565/ishares-iboxx-high-yield-corporate-bond-etf/1467271812596.ajax', name: 'iShares High Yield Corp' },
  IBIT: { url: 'https://www.ishares.com/us/products/333011/ishares-bitcoin-trust-etf/1467271812596.ajax', name: 'iShares Bitcoin Trust' },
};

export const ISHARES_ETFS = Object.keys(ISHARES_PRODUCTS);

export function ishareHoldingsUrl(symbol) {
  const p = ISHARES_PRODUCTS[symbol];
  if (!p) throw new Error(`Unknown iShares ETF: ${symbol}`);
  // fileType=json returns the holdings as an aaData array
  return `${p.url}?fileType=json`;
}

export function parseIsharesJson(payload, etfSymbol) {
  // iShares payload shape varies; the holdings table is keyed as 'aaData'
  // or nested under 'result'/'data'. We defensively probe.
  let rows = null;
  if (payload?.aaData) rows = payload.aaData;
  else if (payload?.data?.aaData) rows = payload.data.aaData;
  else if (Array.isArray(payload)) rows = payload;
  if (!Array.isArray(rows)) {
    throw new Error(`iShares payload shape unknown for ${etfSymbol}`);
  }

  // Row shape (typical): [ticker, name, sector, assetClass, marketValue, weight, notionalValue, ...]
  // Weight is the 5th element in the common layout but we scan for a valid pct.
  const out = [];
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 4) continue;
    const ticker = String(r[0] || '').toUpperCase();
    const name   = String(r[1] || '') || null;
    const assetClass = String(r[2] || r[3] || 'equity').toLowerCase();
    // Probe for a weight value: first numeric field between 0.0001 and 100.
    let weight = null;
    for (let i = 3; i < Math.min(r.length, 10); i++) {
      const v = numeric(r[i]);
      if (v !== null && v > 0.0001 && v <= 100) { weight = v; break; }
    }
    if (!ticker || weight === null) continue;
    out.push({
      etf_symbol:  etfSymbol,
      ticker,
      name,
      weight_pct:  weight,
      asset_class: assetClass,
      source:      'ishares',
    });
  }
  return {
    asOf: new Date().toISOString().slice(0, 10),
    rows: out,
  };
}

function numeric(v) {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[,%\s$]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export async function fetchIsharesHoldings(symbol, fetchImpl = fetch) {
  const url = ishareHoldingsUrl(symbol);
  const res = await fetchImpl(url, {
    headers: {
      'User-Agent': 'limerscapital/1.0 (+https://limerscapital.com)',
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`iShares fetch ${symbol} ${res.status}`);
  const data = await res.json();
  return parseIsharesJson(data, symbol);
}
