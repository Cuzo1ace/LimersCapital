/**
 * ARK Invest holdings adapter.
 *
 * ARK publishes daily CSVs at a stable URL pattern:
 *   https://www.ark-funds.com/wp-content/uploads/funds-etf-csv/
 *     ARK_<NAME>_ETF_<SYMBOL>_HOLDINGS.csv
 *
 * Active ETFs we track (MVP):
 *   ARKK · ARKQ · ARKW · ARKG · ARKF · ARKX
 *
 * CSV columns (as of 2026-Q1):
 *   date, fund, company, ticker, cusip, shares, "market value ($)", weight (%)
 *
 * Notes:
 *   - Header casing drifts; we normalize to lowercase
 *   - Trailing footer rows (disclaimers) are filtered by requiring weight > 0
 *   - This module is ESM + fetch-only so it runs in Cloudflare Workers
 */

export const ARK_ETFS = ['ARKK', 'ARKQ', 'ARKW', 'ARKG', 'ARKF', 'ARKX'];

const NAME_MAP = {
  ARKK: 'INNOVATION',
  ARKQ: 'AUTONOMOUS_TECH._%26_ROBOTICS',
  ARKW: 'NEXT_GENERATION_INTERNET',
  ARKG: 'GENOMIC_REVOLUTION',
  ARKF: 'FINTECH_INNOVATION',
  ARKX: 'SPACE_EXPLORATION_%26_INNOVATION',
};

export function arkHoldingsUrl(symbol) {
  const name = NAME_MAP[symbol];
  if (!name) throw new Error(`Unknown ARK ETF: ${symbol}`);
  return `https://www.ark-funds.com/wp-content/uploads/funds-etf-csv/ARK_${name}_ETF_${symbol}_HOLDINGS.csv`;
}

// Minimal CSV splitter: handles simple quoted fields (no escaped quotes
// inside quoted fields, which ARK doesn't produce).
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

export function parseArkCsv(csvText, etfSymbol) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length);
  if (lines.length < 2) return { asOf: null, rows: [] };

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
  const idx = {
    date:   headers.findIndex(h => h === 'date'),
    name:   headers.findIndex(h => h === 'company'),
    ticker: headers.findIndex(h => h === 'ticker'),
    weight: headers.findIndex(h => /^weight/.test(h)),
  };

  if (idx.ticker < 0 || idx.weight < 0) {
    throw new Error(`ARK CSV header mismatch for ${etfSymbol}: ${lines[0]}`);
  }

  let asOf = null;
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 4) continue;
    const ticker = (cells[idx.ticker] || '').toUpperCase();
    const weight = parseFloat((cells[idx.weight] || '').replace(/[,%\s]/g, ''));
    if (!ticker || !Number.isFinite(weight) || weight <= 0) continue;
    const name = cells[idx.name] || null;
    if (!asOf && idx.date >= 0) asOf = normalizeDate(cells[idx.date]);
    rows.push({
      etf_symbol:  etfSymbol,
      ticker,
      name,
      weight_pct:  weight,
      asset_class: 'equity',
      source:      'ark',
    });
  }

  return {
    asOf: asOf || new Date().toISOString().slice(0, 10),
    rows,
  };
}

function normalizeDate(d) {
  if (!d) return null;
  // ARK uses "MM/DD/YYYY" mostly, sometimes "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const mm = m[1].padStart(2, '0');
    const dd = m[2].padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  return null;
}

export async function fetchArkHoldings(symbol, fetchImpl = fetch) {
  const url = arkHoldingsUrl(symbol);
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': 'limerscapital/1.0 (+https://limerscapital.com)' },
  });
  if (!res.ok) throw new Error(`ARK fetch ${symbol} ${res.status}`);
  const text = await res.text();
  return parseArkCsv(text, symbol);
}
