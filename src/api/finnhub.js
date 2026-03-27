/**
 * Finnhub API Layer — Financial Intelligence Data
 *
 * All calls proxied through Cloudflare Worker (API key injected server-side).
 * Every function returns clean data or throws; callers handle errors.
 */

const API_PROXY = import.meta.env.VITE_API_PROXY_URL
  || 'https://limer-api-proxy.solanacaribbean-team.workers.dev';

// ─── Economic Calendar ─────────────────────────────────────────
// Returns upcoming macro events (Fed, CPI, GDP, jobs) for next 7 days
export async function fetchEconomicCalendar() {
  const from = new Date().toISOString().split('T')[0];
  const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const res = await fetch(`${API_PROXY}/finnhub/economic-calendar?from=${from}&to=${to}`);
  if (!res.ok) throw new Error(`Finnhub economic calendar: ${res.status}`);
  const json = await res.json();
  return (json.economicCalendar || [])
    .filter(e => e.impact && e.impact !== 'low')
    .slice(0, 20)
    .map(e => ({
      event: e.event,
      country: e.country,
      impact: e.impact,          // "medium" | "high"
      actual: e.actual ?? null,
      estimate: e.estimate ?? null,
      prev: e.prev ?? null,
      time: e.time || null,
      unit: e.unit || '',
    }));
}

// ─── Earnings Calendar ─────────────────────────────────────────
// Returns upcoming earnings reports for next 14 days
export async function fetchEarningsCalendar() {
  const from = new Date().toISOString().split('T')[0];
  const to = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const res = await fetch(`${API_PROXY}/finnhub/earnings?from=${from}&to=${to}`);
  if (!res.ok) throw new Error(`Finnhub earnings: ${res.status}`);
  const json = await res.json();
  return (json.earningsCalendar || []).slice(0, 20).map(e => ({
    symbol: e.symbol,
    date: e.date,
    epsEstimate: e.epsEstimate ?? null,
    epsActual: e.epsActual ?? null,
    revenueEstimate: e.revenueEstimate ?? null,
    revenueActual: e.revenueActual ?? null,
    hour: e.hour || null,        // "bmo" | "amc" | "dmh"
  }));
}

// ─── Market News ───────────────────────────────────────────────
// Returns latest market headlines (general, forex, crypto, merger)
export async function fetchMarketNews(category = 'general') {
  const res = await fetch(`${API_PROXY}/finnhub/news?category=${category}`);
  if (!res.ok) throw new Error(`Finnhub news: ${res.status}`);
  const items = await res.json();
  return (items || []).slice(0, 12).map(n => ({
    id: n.id,
    headline: n.headline,
    source: n.source,
    url: n.url,
    summary: n.summary,
    image: n.image,
    datetime: n.datetime,        // unix timestamp
    category: n.category,
  }));
}

// ─── Congressional Trading ─────────────────────────────────────
// Returns US politician stock trades (STOCK Act disclosure)
export async function fetchCongressionalTrading(symbol = '') {
  const qs = symbol ? `&symbol=${symbol}` : '';
  const res = await fetch(`${API_PROXY}/finnhub/congressional-trading?${qs}`);
  if (!res.ok) throw new Error(`Finnhub congressional: ${res.status}`);
  const json = await res.json();
  return (json.data || []).slice(0, 20).map(t => ({
    name: t.name,
    symbol: t.symbol,
    transactionDate: t.transactionDate,
    transactionType: t.transactionType,  // "Purchase" | "Sale (Full)" | "Sale (Partial)"
    amountFrom: t.amountFrom,
    amountTo: t.amountTo,
    owner: t.ownerType,
    asset: t.assetDescription,
  }));
}

// ─── Insider Transactions ──────────────────────────────────────
export async function fetchInsiderTransactions(symbol) {
  if (!symbol) return [];
  const res = await fetch(`${API_PROXY}/finnhub/insider-transactions?symbol=${symbol}`);
  if (!res.ok) throw new Error(`Finnhub insider: ${res.status}`);
  const json = await res.json();
  return (json.data || []).slice(0, 15).map(t => ({
    name: t.name,
    share: t.share,
    change: t.change,
    transactionDate: t.transactionDate,
    transactionCode: t.transactionCode, // "P" = Purchase, "S" = Sale
    filingDate: t.filingDate,
  }));
}

// ─── News Sentiment ────────────────────────────────────────────
export async function fetchNewsSentiment(symbol) {
  if (!symbol) return null;
  const res = await fetch(`${API_PROXY}/finnhub/news-sentiment?symbol=${symbol}`);
  if (!res.ok) throw new Error(`Finnhub sentiment: ${res.status}`);
  const json = await res.json();
  return {
    buzz: json.buzz,
    companyNewsScore: json.companyNewsScore,
    sectorAverageBullishPercent: json.sectorAverageBullishPercent,
    sentiment: json.sentiment,   // { bullishPercent, bearishPercent }
  };
}

// ─── Analyst Recommendations ───────────────────────────────────
export async function fetchAnalystRecommendations(symbol) {
  if (!symbol) return [];
  const res = await fetch(`${API_PROXY}/finnhub/recommendation?symbol=${symbol}`);
  if (!res.ok) throw new Error(`Finnhub recommendation: ${res.status}`);
  const data = await res.json();
  return (data || []).slice(0, 6).map(r => ({
    period: r.period,
    strongBuy: r.strongBuy,
    buy: r.buy,
    hold: r.hold,
    sell: r.sell,
    strongSell: r.strongSell,
  }));
}

// ─── Price Targets ─────────────────────────────────────────────
export async function fetchPriceTarget(symbol) {
  if (!symbol) return null;
  const res = await fetch(`${API_PROXY}/finnhub/price-target?symbol=${symbol}`);
  if (!res.ok) throw new Error(`Finnhub price target: ${res.status}`);
  return res.json(); // { targetHigh, targetLow, targetMean, targetMedian, lastUpdated }
}

// ─── Company Profile ───────────────────────────────────────────
export async function fetchCompanyProfile(symbol) {
  if (!symbol) return null;
  const res = await fetch(`${API_PROXY}/finnhub/profile?symbol=${symbol}`);
  if (!res.ok) throw new Error(`Finnhub profile: ${res.status}`);
  return res.json(); // { name, ticker, logo, industry, marketCapitalization, ... }
}

// ─── Basic Financials (Metrics) ────────────────────────────────
export async function fetchBasicFinancials(symbol) {
  if (!symbol) return null;
  const res = await fetch(`${API_PROXY}/finnhub/metric?symbol=${symbol}&metric=all`);
  if (!res.ok) throw new Error(`Finnhub metric: ${res.status}`);
  const json = await res.json();
  const m = json.metric || {};
  return {
    peRatio: m['peNormalizedAnnual'] ?? null,
    pbRatio: m['pbAnnual'] ?? null,
    dividendYield: m['dividendYieldIndicatedAnnual'] ?? null,
    debtEquity: m['totalDebt/totalEquityAnnual'] ?? null,
    roe: m['roeRfy'] ?? null,
    eps: m['epsNormalizedAnnual'] ?? null,
    revenueGrowth: m['revenueGrowthQuarterlyYoy'] ?? null,
    high52w: m['52WeekHigh'] ?? null,
    low52w: m['52WeekLow'] ?? null,
    beta: m['beta'] ?? null,
  };
}
