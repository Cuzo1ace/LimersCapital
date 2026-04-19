/**
 * Representative market data snapshots used when live provider routes
 * (Alpha Vantage, Artemis, Flipside) aren't reachable.
 *
 * Values approximate Q1 2026 reality and are deterministic so the
 * dashboard demos stay stable across reloads.
 */

// Caribbean-first ticker universe. TTSE + JSE + BSE equities that the
// platform's user base actually holds — listed ahead of US tickers so they
// surface first in every selector. Prices in each exchange's local
// currency (TTD / JMD / BBD).
const TICKERS = {
  // ── Trinidad & Tobago Stock Exchange (TTSE) ─ TTD ─────────────────
  RFHL:   { name: 'Republic Financial Holdings', price: 134.25, chg:  0.15, chgPct:  0.11, pe:  9.8, ps: 2.1, mcap:  21_950_000_000, divYield: 4.8, sector: 'Caribbean Financials',   exchange: 'TTSE', currency: 'TTD' },
  GHL:    { name: 'Guardian Holdings',           price:  19.80, chg: -0.05, chgPct: -0.25, pe:  8.1, ps: 0.7, mcap:   4_590_000_000, divYield: 2.1, sector: 'Caribbean Financials',   exchange: 'TTSE', currency: 'TTD' },
  TCL:    { name: 'Trinidad Cement',             price:   4.85, chg:  0.03, chgPct:  0.62, pe: 11.2, ps: 0.9, mcap:   1_810_000_000, divYield: 4.1, sector: 'Caribbean Industrial',   exchange: 'TTSE', currency: 'TTD' },
  WCO:    { name: 'West Indian Tobacco',         price:  22.10, chg: -0.20, chgPct: -0.90, pe: 14.8, ps: 3.2, mcap:   5_590_000_000, divYield: 5.2, sector: 'Caribbean Consumer',     exchange: 'TTSE', currency: 'TTD' },
  AGL:    { name: "Agostini's",                  price:  85.20, chg:  0.40, chgPct:  0.47, pe: 13.5, ps: 0.7, mcap:   5_890_000_000, divYield: 1.8, sector: 'Caribbean Conglomerate', exchange: 'TTSE', currency: 'TTD' },
  ANSA:   { name: 'ANSA McAL',                   price:  54.75, chg: -0.15, chgPct: -0.27, pe:  9.3, ps: 0.6, mcap:   9_430_000_000, divYield: 3.5, sector: 'Caribbean Conglomerate', exchange: 'TTSE', currency: 'TTD' },
  FCI:    { name: 'First Citizens Group',        price:  48.60, chg:  0.10, chgPct:  0.21, pe: 10.4, ps: 1.8, mcap:  12_250_000_000, divYield: 3.9, sector: 'Caribbean Financials',   exchange: 'TTSE', currency: 'TTD' },

  // ── Jamaica Stock Exchange (JSE) ─ JMD ────────────────────────────
  NCBFG:  { name: 'NCB Financial Group',         price:  62.50, chg: -0.30, chgPct: -0.48, pe:  8.2, ps: 1.6, mcap: 153_000_000_000, divYield: 3.2, sector: 'Caribbean Financials',   exchange: 'JSE',  currency: 'JMD' },
  JMMB:   { name: 'JMMB Group',                  price:  28.40, chg:  0.10, chgPct:  0.35, pe:  7.5, ps: 1.3, mcap:  57_400_000_000, divYield: 2.8, sector: 'Caribbean Financials',   exchange: 'JSE',  currency: 'JMD' },
  GKC:    { name: 'GraceKennedy',                price:  78.50, chg: -0.50, chgPct: -0.63, pe: 12.4, ps: 0.8, mcap:  78_100_000_000, divYield: 2.0, sector: 'Caribbean Consumer',     exchange: 'JSE',  currency: 'JMD' },
  SJAM:   { name: 'Sagicor Group Jamaica',       price:  41.20, chg:  0.20, chgPct:  0.49, pe:  9.1, ps: 1.0, mcap: 161_000_000_000, divYield: 4.4, sector: 'Caribbean Financials',   exchange: 'JSE',  currency: 'JMD' },

  // ── Barbados Stock Exchange (BSE) ─ BBD ───────────────────────────
  FCIB:   { name: 'FirstCaribbean International Bank', price: 2.20, chg: 0.01, chgPct: 0.46, pe: 7.8, ps: 1.2, mcap: 3_470_000_000, divYield: 5.1, sector: 'Caribbean Financials', exchange: 'BSE', currency: 'BBD' },

  // ── Regional ETF proxy (tokenized basket) ─ USD ───────────────────
  CARICOM: { name: 'Caribbean Capital Markets Index (sim)', price: 112.40, chg: 0.28, chgPct: 0.25, pe: null, ps: null, mcap: null, divYield: 3.1, sector: 'Caribbean ETF', exchange: 'sim', currency: 'USD' },

  // ── US equities / ETFs / crypto ─ USD ─────────────────────────────
  AAPL:  { name: 'Apple Inc.',          price: 228.75, chg: -0.56, chgPct: -0.24, pe: 33.1, ps: 8.2,  mcap: 3_460_000_000_000, divYield: 0.44, sector: 'Technology',             exchange: 'NASDAQ', currency: 'USD' },
  NVDA:  { name: 'NVIDIA',              price: 895.00, chg:  6.24, chgPct:  0.70, pe: 68.5, ps: 32.8, mcap: 2_210_000_000_000, divYield: 0.03, sector: 'Technology',             exchange: 'NASDAQ', currency: 'USD' },
  MSFT:  { name: 'Microsoft',           price: 413.20, chg:  1.35, chgPct:  0.33, pe: 35.4, ps: 13.1, mcap: 3_070_000_000_000, divYield: 0.73, sector: 'Technology',             exchange: 'NASDAQ', currency: 'USD' },
  TSLA:  { name: 'Tesla',               price: 396.91, chg: -9.05, chgPct: -2.23, pe: 82.3, ps: 9.4,  mcap: 1_260_000_000_000, divYield: 0.00, sector: 'Consumer Discretionary', exchange: 'NASDAQ', currency: 'USD' },
  AMZN:  { name: 'Amazon',              price: 248.75, chg: -5.15, chgPct: -2.03, pe: 51.2, ps: 3.7,  mcap: 2_590_000_000_000, divYield: 0.00, sector: 'Consumer Discretionary', exchange: 'NASDAQ', currency: 'USD' },
  META:  { name: 'Meta Platforms',      price: 612.40, chg:  3.25, chgPct:  0.53, pe: 28.7, ps: 10.1, mcap: 1_540_000_000_000, divYield: 0.33, sector: 'Communication Services', exchange: 'NASDAQ', currency: 'USD' },
  GOOGL: { name: 'Alphabet A',          price: 172.10, chg: -0.95, chgPct: -0.55, pe: 24.1, ps: 6.3,  mcap: 2_120_000_000_000, divYield: 0.47, sector: 'Communication Services', exchange: 'NASDAQ', currency: 'USD' },
  SPY:   { name: 'SPDR S&P 500',        price: 540.50, chg: -2.15, chgPct: -0.40, pe:  null, ps: null, mcap: null,              divYield: 1.30, sector: 'ETF',                   exchange: 'NYSE',   currency: 'USD' },
  QQQ:   { name: 'Invesco QQQ Trust',   price: 478.20, chg: -1.85, chgPct: -0.39, pe:  null, ps: null, mcap: null,              divYield: 0.65, sector: 'ETF',                   exchange: 'NASDAQ', currency: 'USD' },
  ARKK:  { name: 'ARK Innovation ETF',  price:  46.80, chg:  0.52, chgPct:  1.12, pe:  null, ps: null, mcap: null,              divYield: 0.00, sector: 'ETF',                   exchange: 'NYSE',   currency: 'USD' },
  COIN:  { name: 'Coinbase',            price: 289.50, chg:  6.30, chgPct:  2.22, pe: 42.1, ps: 12.4, mcap:   73_000_000_000, divYield: 0.00, sector: 'Financial Services',     exchange: 'NASDAQ', currency: 'USD' },
  BTC:   { name: 'Bitcoin',             price: 75924, chg: -1554, chgPct: -2.02, pe: null, ps: null, mcap: 1_490_000_000_000, divYield: 0.00, sector: 'Crypto',                  exchange: 'crypto', currency: 'USD' },
};

// Ordered so Caribbean tickers appear first in every selector.
export const TICKER_UNIVERSE = Object.keys(TICKERS);

// Sector → region label for the OverlapPanel regional-exposure lens.
export function regionOf(ticker) {
  const t = TICKERS[String(ticker || '').toUpperCase()];
  if (t?.sector?.startsWith('Caribbean')) return 'caribbean';
  if (t?.sector === 'Crypto')             return 'crypto';
  if (t?.sector === 'ETF')                return 'us_etf';
  if (t)                                  return 'us_equity';
  // Fallback for look-through tickers we don't have in the catalog.
  if (/^T-BOND/i.test(ticker))            return 'fixed_income';
  if (ticker === 'CASH/OTHER' || ticker === 'Others') return 'other';
  return 'us_equity';
}

// Mulberry32 PRNG for stable price paths — seeded off the ticker string
// so every AAPL chart renders identically without depending on Date.now.
function prng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFor(s) {
  let h = 1779033703;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function mockQuote(symbol) {
  const t = TICKERS[String(symbol || '').toUpperCase()];
  if (!t) return null;
  return {
    symbol, name: t.name, price: t.price,
    change: t.chg, changePct: t.chgPct,
    dayLow: t.price * 0.985, dayHigh: t.price * 1.014,
    sector: t.sector,
  };
}

export function mockOverview(symbol) {
  const t = TICKERS[String(symbol || '').toUpperCase()];
  if (!t) return null;
  return {
    symbol, name: t.name, sector: t.sector,
    peRatio: t.pe, psRatio: t.ps,
    marketCap: t.mcap, dividendYield: t.divYield,
  };
}

// Generate a 90-day daily price path with realistic drift+vol.
export function mockDaily(symbol, days = 90) {
  const sym = String(symbol || '').toUpperCase();
  const t = TICKERS[sym];
  if (!t) return [];
  const rand = prng(seedFor(sym));
  // Start ~ `days` back from current price, walk forward to today.
  const endPrice = t.price;
  // Annualized vol heuristic by sector (very rough)
  const sigma = t.sector === 'Crypto' ? 0.80 : t.sector === 'ETF' ? 0.18 : 0.30;
  const dt = 1 / 252;
  const mu = 0.08; // 8% annual drift
  const steps = days;
  // Build forward from a backcast anchor to hit endPrice exactly.
  let p = endPrice * (0.85 + rand() * 0.1);
  const raw = [p];
  for (let i = 1; i < steps; i++) {
    const u1 = Math.max(rand(), 1e-9);
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    p = p * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z);
    raw.push(p);
  }
  // Scale so last point == endPrice exactly.
  const scale = endPrice / raw[raw.length - 1];
  const scaled = raw.map(v => v * scale);

  const today = new Date();
  return scaled.map((close, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (steps - 1 - i));
    return {
      date: d.toISOString().slice(0, 10),
      close,
    };
  });
}

// ── Macro indicators (latest value + 12 monthly history points) ───────

const MACRO = {
  FEDFUNDS:   { label: 'Fed Funds',    value: 4.50,  unit: '%',   series: [5.50, 5.50, 5.25, 5.00, 4.75, 4.75, 4.75, 4.50, 4.50, 4.50, 4.50, 4.50] },
  CPI:        { label: 'CPI YoY',      value: 2.80,  unit: '%',   series: [3.40, 3.20, 3.10, 3.00, 2.90, 2.70, 2.60, 2.70, 2.80, 2.90, 2.90, 2.80] },
  US10Y:      { label: '10Y Treasury', value: 4.32,  unit: '%',   series: [4.15, 4.20, 4.25, 4.40, 4.45, 4.35, 4.28, 4.22, 4.30, 4.38, 4.40, 4.32] },
  DXY:        { label: 'DXY',          value: 104.2, unit: '',    series: [103.1, 103.4, 104.0, 104.8, 105.1, 104.6, 103.9, 103.4, 103.8, 104.1, 104.5, 104.2] },
  BTC_DOM:    { label: 'BTC Dominance', value: 58.4, unit: '%',   series: [51.2, 52.8, 54.1, 55.3, 56.0, 56.8, 57.1, 57.8, 58.0, 58.3, 58.5, 58.4] },
  VIX:        { label: 'VIX',          value: 18.7,  unit: '',    series: [14.2, 15.1, 16.8, 17.4, 22.1, 19.8, 18.2, 17.6, 18.1, 19.4, 18.9, 18.7] },
};

// Caribbean FX rates vs USD — defaults showcase the mix of pegged and
// floating currencies retail traders across the region actually transact
// in. Pegged pairs display a subtle visual cue.
const CARIBBEAN_FX = {
  USD_TTD: { label: 'USD / TTD', value:   6.79, unit: '',  peg: 'soft',  country: 'Trinidad & Tobago', series: [6.78, 6.78, 6.79, 6.79, 6.79, 6.79, 6.79, 6.80, 6.80, 6.79, 6.79, 6.79] },
  USD_JMD: { label: 'USD / JMD', value: 157.20, unit: '',  peg: null,    country: 'Jamaica',            series: [155.0, 155.5, 156.1, 156.4, 156.8, 157.0, 156.9, 157.1, 157.3, 157.5, 157.2, 157.2] },
  USD_BBD: { label: 'USD / BBD', value:   2.00, unit: '',  peg: 'hard',  country: 'Barbados',           series: [2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00] },
  USD_XCD: { label: 'USD / XCD', value:   2.70, unit: '',  peg: 'hard',  country: 'OECS',               series: [2.70, 2.70, 2.70, 2.70, 2.70, 2.70, 2.70, 2.70, 2.70, 2.70, 2.70, 2.70] },
  USD_BZD: { label: 'USD / BZD', value:   2.00, unit: '',  peg: 'hard',  country: 'Belize',             series: [2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00] },
  USD_GYD: { label: 'USD / GYD', value: 211.00, unit: '',  peg: 'soft',  country: 'Guyana',             series: [209, 209, 210, 210, 210, 210, 211, 211, 211, 211, 211, 211] },
};

export function mockMacro() {
  return MACRO;
}

export function mockCaribbeanFx() {
  return CARIBBEAN_FX;
}

// ── Micro indicators per ticker ───────────────────────────────────────

export function mockMicro(symbol) {
  const sym = String(symbol || '').toUpperCase();
  const t = TICKERS[sym];
  if (!t) return null;
  const rand = prng(seedFor(sym + 'micro'));
  return {
    symbol: sym,
    rsi14:      20 + rand() * 60,                    // 20–80
    obvChange:  (rand() - 0.5) * 20,                 // ±10%
    volumeVsAvg: 0.6 + rand() * 1.6,                 // 0.6x–2.2x
    darkPoolPct: 0.10 + rand() * 0.35,               // 10–45% of total vol
    unusualOptions: {
      callPut: 0.5 + rand() * 1.8,                   // ratio
      notableStrikes: [
        { strike: Math.round(t.price * 1.05 / 5) * 5, type: 'call', contracts: Math.floor(1500 + rand() * 9000) },
        { strike: Math.round(t.price * 0.95 / 5) * 5, type: 'put',  contracts: Math.floor(800 + rand() * 4500) },
      ],
    },
  };
}

// ── On-chain flows (Flipside stand-in) ────────────────────────────────

export function mockOnChainFlows() {
  return {
    exchangeNetflow24h: -3_840_000_000,                    // USD, neg = outflow
    stablecoinMints24h: +1_210_000_000,
    whaleTransactions:  [
      { token: 'SOL', amountUsd: 142_000_000, side: 'outflow', exchange: 'Binance' },
      { token: 'USDC', amountUsd:  88_000_000, side: 'mint',    exchange: 'Circle' },
      { token: 'BTC', amountUsd:  64_000_000, side: 'inflow',  exchange: 'Coinbase' },
    ],
    topDexPairs: [
      { pair: 'SOL/USDC', volume24h: 412_000_000 },
      { pair: 'wBTC/SOL', volume24h: 158_000_000 },
      { pair: 'JTO/USDC', volume24h:  42_000_000 },
    ],
  };
}
