// CoinGecko fetchers for the surfaces unlocked by the Demo API key:
// token detail drill-down (sparkline + description), Pro Terminal OHLC
// gap-fill candles, and tokenized-asset category feeds. All calls route
// through the Cloudflare Worker proxy at /coingecko/* — the demo key is
// injected server-side. See workers/api-proxy.js ROUTES block.

const API_PROXY = import.meta.env.VITE_API_PROXY_URL || 'https://limer-api-proxy.solanacaribbean-team.workers.dev';
const CG = `${API_PROXY}/coingecko`;

// ─── Coin detail ─────────────────────────────────────────────────
// Returns name, symbol, image, description, ATH/ATL, market cap rank,
// 30d change, plus current price. Used by the token drill-down modal.
export async function fetchCoinDetail(id) {
  if (!id) throw new Error('fetchCoinDetail: id required');
  const qs = 'localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false';
  const res = await fetch(`${CG}/coin?id=${encodeURIComponent(id)}&${qs}`);
  if (!res.ok) throw new Error(`CoinGecko coin detail error: ${res.status}`);
  const c = await res.json();
  return {
    id: c.id,
    symbol: (c.symbol || '').toUpperCase(),
    name: c.name,
    image: c.image?.large || c.image?.small || null,
    description: c.description?.en || '',
    rank: c.market_cap_rank,
    price: c.market_data?.current_price?.usd ?? null,
    marketCap: c.market_data?.market_cap?.usd ?? null,
    volume24h: c.market_data?.total_volume?.usd ?? null,
    change24h: c.market_data?.price_change_percentage_24h ?? null,
    change7d: c.market_data?.price_change_percentage_7d ?? null,
    change30d: c.market_data?.price_change_percentage_30d ?? null,
    ath: c.market_data?.ath?.usd ?? null,
    athChangePct: c.market_data?.ath_change_percentage?.usd ?? null,
    atl: c.market_data?.atl?.usd ?? null,
    atlChangePct: c.market_data?.atl_change_percentage?.usd ?? null,
    genesisDate: c.genesis_date,
    categories: c.categories || [],
  };
}

// ─── Market chart (sparkline source) ─────────────────────────────
// Returns { prices: [[ts,price], ...] } sampled at CoinGecko's default
// granularity (hourly for days<=90). Used to draw the modal sparkline.
export async function fetchCoinMarketChart(id, days = 7) {
  if (!id) throw new Error('fetchCoinMarketChart: id required');
  const res = await fetch(`${CG}/market-chart?id=${encodeURIComponent(id)}&vs_currency=usd&days=${days}`);
  if (!res.ok) throw new Error(`CoinGecko market-chart error: ${res.status}`);
  const json = await res.json();
  return {
    prices: Array.isArray(json.prices) ? json.prices : [],
    marketCaps: Array.isArray(json.market_caps) ? json.market_caps : [],
    volumes: Array.isArray(json.total_volumes) ? json.total_volumes : [],
  };
}

// ─── OHLC candles (for ApexCharts candlestick series) ─────────────
// CoinGecko returns [[ts, o, h, l, c], ...]. ApexCharts candlestick
// wants { x: Date, y: [o, h, l, c] }. Normalize here so the chart
// component stays dumb.
export async function fetchCoinOhlc(id, days = 7) {
  if (!id) throw new Error('fetchCoinOhlc: id required');
  const res = await fetch(`${CG}/ohlc?id=${encodeURIComponent(id)}&vs_currency=usd&days=${days}`);
  if (!res.ok) throw new Error(`CoinGecko ohlc error: ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json)) return [];
  return json.map(([ts, o, h, l, c]) => ({
    x: new Date(ts),
    y: [o, h, l, c],
  }));
}

// ─── Category feed (shared shape across tokenized asset pulls) ────
// Wraps /coingecko/markets with a category slug. Returns [] and logs
// on 404 so a CoinGecko slug rename (e.g. real-world-assets →
// real-world-assets-rwa in 2024) doesn't break the page.
async function fetchCategoryMarket(category, label) {
  const res = await fetch(
    `${CG}/markets?vs_currency=usd&category=${category}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
  );
  if (res.status === 404) {
    console.warn(`CoinGecko category "${label}" (${category}) returned 404 — slug may have changed`);
    return [];
  }
  if (!res.ok) throw new Error(`CoinGecko ${label} error: ${res.status}`);
  return (await res.json()).map(c => ({
    id: c.id,
    name: c.name,
    symbol: (c.symbol || '').toUpperCase(),
    image: c.image,
    price: c.current_price,
    change24h: c.price_change_percentage_24h,
    marketCap: c.market_cap,
    volume: c.total_volume,
  }));
}

export async function fetchTokenizedStocks() {
  return fetchCategoryMarket('tokenized-stocks', 'Tokenized Stocks');
}

export async function fetchTokenizedGold() {
  return fetchCategoryMarket('tokenized-gold', 'Tokenized Gold');
}

export async function fetchTokenizedTreasury() {
  return fetchCategoryMarket('tokenized-treasury-bonds', 'Tokenized Treasury');
}
