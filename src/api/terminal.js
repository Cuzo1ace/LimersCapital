/**
 * Client-side wrappers for the Terminal data layer.
 *
 * All requests route through the Limer's Capital Cloudflare Worker
 * (VITE_API_PROXY_URL) so API keys stay server-side. Never paste upstream
 * URLs or keys here — the worker owns the whole secret perimeter.
 */

const PROXY = (import.meta.env.VITE_API_PROXY_URL || '').replace(/\/$/, '');

function url(path) {
  if (!PROXY) throw new Error('VITE_API_PROXY_URL not configured');
  return `${PROXY}${path}`;
}

async function getJson(path, { signal, cache = 'default' } = {}) {
  const res = await fetch(url(path), { signal, cache });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Terminal API ${path} ${res.status}: ${txt.slice(0, 120)}`);
  }
  return res.json();
}

// ── Alpha Vantage ────────────────────────────────────────────────────
// Stocks, crypto, economic indicators. Worker edge-caches 60s per (fn,symbol)
// to stay inside the free-tier 5/min budget.

export function avQuote(symbol) {
  return getJson(`/alpha-vantage/quote?symbol=${encodeURIComponent(symbol)}`);
}

export function avDaily(symbol, outputsize = 'compact') {
  return getJson(`/alpha-vantage/daily?symbol=${encodeURIComponent(symbol)}&outputsize=${outputsize}`);
}

export function avOverview(symbol) {
  return getJson(`/alpha-vantage/overview?symbol=${encodeURIComponent(symbol)}`);
}

export function avEcon(indicator) {
  // indicator: 'FEDERAL_FUNDS_RATE' | 'CPI' | 'TREASURY_YIELD' | 'REAL_GDP' | 'UNEMPLOYMENT' | 'INFLATION'
  return getJson(`/alpha-vantage/econ?indicator=${encodeURIComponent(indicator)}`);
}

// ── Artemis ──────────────────────────────────────────────────────────

export function artemisAsset(assetId) {
  return getJson(`/artemis/asset/${encodeURIComponent(assetId)}`);
}

export function artemisMetric(assetId, metric) {
  return getJson(`/artemis/metric?asset=${encodeURIComponent(assetId)}&metric=${encodeURIComponent(metric)}`);
}

// ── Flipside (async SQL) ─────────────────────────────────────────────

export async function flipsideQuery(sql, { signal } = {}) {
  const res = await fetch(url('/flipside/query'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
    signal,
  });
  if (!res.ok) throw new Error(`Flipside query ${res.status}`);
  const { jobId } = await res.json();
  return jobId;
}

export async function flipsidePoll(jobId, { signal } = {}) {
  return getJson(`/flipside/poll?jobId=${encodeURIComponent(jobId)}`, { signal });
}

export async function flipsideRun(sql, { timeoutMs = 30_000, pollIntervalMs = 1500 } = {}) {
  const jobId = await flipsideQuery(sql);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = await flipsidePoll(jobId);
    if (r.status === 'succeeded') return r.rows || [];
    if (r.status === 'failed')    throw new Error(`Flipside failed: ${r.error || 'unknown'}`);
    await new Promise(res => setTimeout(res, pollIntervalMs));
  }
  throw new Error(`Flipside timed out after ${timeoutMs}ms`);
}

// ── ETF holdings ─────────────────────────────────────────────────────

import { mockHoldings } from './etfHoldingsMock';

export async function fetchEtfHoldings(etfSymbol) {
  const sym = String(etfSymbol || '').toUpperCase();
  const source = sym.startsWith('ARK') ? 'ark' : 'ishares';
  try {
    return await getJson(`/${source}/holdings/${encodeURIComponent(sym)}`);
  } catch (err) {
    // Fall back to bundled mock (approximate Q1 2026 snapshot) so the
    // dashboard still demonstrates look-through exposure when the worker
    // proxy or upstream provider isn't reachable.
    const mock = mockHoldings(sym);
    if (mock) return { ...mock, _fallback: true, _error: err.message };
    throw err;
  }
}

// Batch fetch. Returns a map { etfSymbol: { asOf, rows: [...] } }.
export async function fetchEtfHoldingsBatch(symbols) {
  const pairs = await Promise.all(symbols.map(async s => {
    try { return [s, await fetchEtfHoldings(s)]; }
    catch (e) {
      console.warn(`[terminal] holdings fetch failed for ${s}:`, e.message);
      return [s, null];
    }
  }));
  return Object.fromEntries(pairs.filter(([, v]) => v));
}
