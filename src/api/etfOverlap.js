/**
 * ETF look-through exposure math.
 *
 * Input: a list of user positions like
 *   [{ symbol: 'SPY',  qty: 100, price: 540 },
 *    { symbol: 'ARKK', qty:  50, price:  48 },
 *    { symbol: 'NVDA', qty: 20,  price: 890 }]
 *
 * Plus a map of ETF holdings:
 *   { SPY: { rows: [{ ticker:'AAPL', weight_pct: 7.2 }, ...] }, ... }
 *
 * Output: aggregated dollar exposure per underlying ticker, with a
 * synthetic 'CASH/OTHER' bucket for positions whose ETF isn't in the
 * holdings map (or for residual weight that the ETF holdings don't resolve,
 * e.g. cash/futures/non-listed).
 *
 * Simple, one-level look-through — recursive ETF-of-ETF is Phase 2.
 */

export const OTHER_TICKER = 'CASH/OTHER';

export function computeExposure(positions, holdingsMap) {
  const exposure = Object.create(null);
  let total = 0;

  for (const p of positions) {
    const symbol = String(p.symbol || '').toUpperCase();
    const price  = Number(p.price) || 0;
    const qty    = Number(p.qty)   || 0;
    const value  = price * qty;
    if (value <= 0) continue;
    total += value;

    const etfHoldings = holdingsMap[symbol];
    if (!etfHoldings || !Array.isArray(etfHoldings.rows) || etfHoldings.rows.length === 0) {
      // Treat the whole position as single-name exposure to itself.
      exposure[symbol] = (exposure[symbol] || 0) + value;
      continue;
    }

    // Distribute the position value across the ETF's constituent weights.
    let resolved = 0;
    for (const h of etfHoldings.rows) {
      const w = Number(h.weight_pct) || 0;
      if (w <= 0) continue;
      const ticker = String(h.ticker || '').toUpperCase();
      if (!ticker) continue;
      const dollars = value * (w / 100);
      exposure[ticker] = (exposure[ticker] || 0) + dollars;
      resolved += w;
    }

    const residual = Math.max(0, 100 - resolved);
    if (residual > 0.01) {
      const dollars = value * (residual / 100);
      exposure[OTHER_TICKER] = (exposure[OTHER_TICKER] || 0) + dollars;
    }
  }

  // Sort descending and include share of total.
  const rows = Object.entries(exposure)
    .map(([ticker, value]) => ({
      ticker,
      value,
      share: total > 0 ? value / total : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return { total, rows };
}

/**
 * Identify which ETF symbols in `positions` we need to fetch holdings for.
 * A symbol is "etf-like" if it appears in the supplied etf registry OR
 * if the caller wants to opportunistically try (we default to NO probes).
 */
export function etfSymbolsFromPositions(positions, registry) {
  const set = new Set(registry.map(s => s.toUpperCase()));
  return [...new Set(
    positions
      .map(p => String(p.symbol || '').toUpperCase())
      .filter(s => set.has(s))
  )];
}

export const SUPPORTED_ETFS = [
  // ARK funds (Adapter: ark)
  'ARKK', 'ARKQ', 'ARKW', 'ARKG', 'ARKF', 'ARKX',
  // iShares / BlackRock
  'IVV', 'IWM', 'EFA', 'EEM', 'TLT', 'HYG', 'IBIT',
  // Common retail ETFs proxied as iShares-shaped JSON via the worker
  'SPY', 'QQQ', 'VTI',
];
