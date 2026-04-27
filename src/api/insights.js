// Insights APIs. CoinGecko calls are routed through the Cloudflare Worker
// proxy so the Demo API key (server-side secret COINGECKO_API_KEY) is injected
// as x-cg-demo-api-key. Paths follow the proxy's /coingecko/* alias — upstream
// /coins/markets is exposed as /coingecko/markets, /search/trending as
// /coingecko/trending, etc. See workers/api-proxy.js ROUTES block.

const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'https://limer-api-proxy.solanacaribbean-team.workers.dev';
const CG = `${API_PROXY_URL}/coingecko`;

// ─── CoinGecko: Top crypto by market cap ─────────────────────────────────────
export async function fetchCryptoMarket() {
  const res = await fetch(
    `${CG}/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=1h,24h,7d`
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  return (await res.json()).map(c => ({
    id: c.id, name: c.name, symbol: c.symbol.toUpperCase(), image: c.image,
    price: c.current_price,
    change1h: c.price_change_percentage_1h_in_currency,
    change24h: c.price_change_percentage_24h_in_currency,
    change7d: c.price_change_percentage_7d_in_currency,
    marketCap: c.market_cap, volume: c.total_volume, rank: c.market_cap_rank,
  }));
}

// ─── CoinGecko: RWA tokens ───────────────────────────────────────────────────
export async function fetchRWATokens() {
  const res = await fetch(
    `${CG}/markets?vs_currency=usd&category=real-world-assets-rwa&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
  );
  if (!res.ok) throw new Error(`CoinGecko RWA error: ${res.status}`);
  return (await res.json()).map(c => ({
    id: c.id, name: c.name, symbol: c.symbol.toUpperCase(), image: c.image,
    price: c.current_price, change24h: c.price_change_percentage_24h,
    marketCap: c.market_cap, volume: c.total_volume,
  }));
}

// ─── CoinGecko: Layer 1 tokens ───────────────────────────────────────────────
export async function fetchL1Tokens() {
  const res = await fetch(
    `${CG}/markets?vs_currency=usd&category=layer-1&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h,7d`
  );
  if (!res.ok) throw new Error(`CoinGecko L1 error: ${res.status}`);
  return (await res.json()).map(c => ({
    id: c.id, name: c.name, symbol: c.symbol.toUpperCase(), image: c.image,
    price: c.current_price,
    change24h: c.price_change_percentage_24h,
    change7d: c.price_change_percentage_7d_in_currency,
    marketCap: c.market_cap, volume: c.total_volume,
  }));
}

// ─── CoinGecko: DeFi category data ──────────────────────────────────────────
export async function fetchDeFiMarket() {
  const res = await fetch(
    `${CG}/markets?vs_currency=usd&category=decentralized-finance-defi&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
  );
  if (!res.ok) throw new Error(`CoinGecko DeFi error: ${res.status}`);
  return (await res.json()).map(c => ({
    id: c.id, name: c.name, symbol: c.symbol.toUpperCase(), image: c.image,
    price: c.current_price, change24h: c.price_change_percentage_24h,
    marketCap: c.market_cap, volume: c.total_volume,
  }));
}

// ─── CoinGecko: Trending coins & categories ─────────────────────────────────
export async function fetchTrending() {
  const res = await fetch(`${CG}/trending`);
  if (!res.ok) throw new Error(`CoinGecko trending error: ${res.status}`);
  const json = await res.json();
  return {
    coins: (json.coins || []).slice(0, 7).map(c => ({
      id: c.item.id, name: c.item.name, symbol: c.item.symbol,
      thumb: c.item.thumb, rank: c.item.market_cap_rank,
      price: c.item.data?.price, change24h: c.item.data?.price_change_percentage_24h?.usd,
    })),
    categories: (json.categories || []).slice(0, 5).map(cat => ({
      id: cat.id, name: cat.name, coins: cat.coins_count,
      change24h: cat.data?.market_cap_change_percentage_24h?.usd,
    })),
  };
}

// ─── CoinGecko: Global crypto market data ────────────────────────────────────
export async function fetchGlobalMarket() {
  const res = await fetch(`${CG}/global`);
  if (!res.ok) throw new Error(`CoinGecko global error: ${res.status}`);
  const d = (await res.json()).data;
  return {
    totalMarketCap: d.total_market_cap?.usd,
    totalVolume: d.total_volume?.usd,
    btcDominance: d.market_cap_percentage?.btc,
    ethDominance: d.market_cap_percentage?.eth,
    activeCryptos: d.active_cryptocurrencies,
    markets: d.markets,
    marketCapChange24h: d.market_cap_change_percentage_24h_usd,
  };
}

// ─── DeFiLlama: top Solana protocols ─────────────────────────────────────────
export async function fetchSolanaProtocols() {
  const res = await fetch('https://api.llama.fi/protocols');
  if (!res.ok) throw new Error('DeFiLlama error');
  const all = await res.json();
  const excludeCats = ['CEX', 'Chain'];
  return all
    .filter(p => p.chains?.includes('Solana') && !excludeCats.includes(p.category))
    .sort((a, b) => (b.chainTvls?.Solana || 0) - (a.chainTvls?.Solana || 0))
    .slice(0, 10)
    .map(p => ({ name: p.name, tvl: p.chainTvls?.Solana || p.tvl, change_1d: p.change_1d, category: p.category, logo: p.logo }));
}

// ─── DeFiLlama: Solana DEX volumes ──────────────────────────────────────────
export async function fetchSolanaDexVolume() {
  const res = await fetch('https://api.llama.fi/overview/dexs/Solana?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true');
  if (!res.ok) throw new Error('DeFiLlama DEX error');
  const data = await res.json();
  const protocols = (data.protocols || [])
    .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
    .slice(0, 8)
    .map(p => ({ name: p.name, volume24h: p.total24h, change: p.change_1d }));
  return {
    total24h: data.total24h,
    change24h: data.change_1d,
    protocols,
  };
}

// ─── CoinGecko: Stablecoins on Solana (by market cap) ───────────────────────
export async function fetchSolanaStablecoins() {
  const res = await fetch(
    `${CG}/markets?vs_currency=usd&category=stablecoins&order=market_cap_desc&per_page=10&page=1&sparkline=false`
  );
  if (!res.ok) throw new Error(`CoinGecko stablecoin error: ${res.status}`);
  const data = await res.json();
  return data.map(c => ({
    name: c.name,
    symbol: c.symbol.toUpperCase(),
    circulating: c.market_cap || 0,
    image: c.image,
  }));
}

// ─── DeFiLlama: Solana protocol fees/revenue ────────────────────────────────
export async function fetchSolanaFees() {
  const res = await fetch('https://api.llama.fi/overview/fees/Solana?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true');
  if (!res.ok) throw new Error('DeFiLlama fees error');
  const data = await res.json();
  return (data.protocols || [])
    .filter(p => p.total24h > 0)
    .sort((a, b) => (b.total24h || 0) - (a.total24h || 0))
    .slice(0, 8)
    .map(p => ({ name: p.name, fees24h: p.total24h, revenue24h: p.total24h * (p.dailyRevenue ? p.dailyRevenue / p.total24h : 0.3) }));
}

// ─── DeFiLlama: Best Solana yield pools ─────────────────────────────────────
export async function fetchSolanaYields() {
  const res = await fetch('https://yields.llama.fi/pools');
  if (!res.ok) throw new Error('DeFiLlama yields error');
  const data = await res.json();
  return (data.data || [])
    .filter(p => p.chain === 'Solana' && p.tvlUsd > 500000 && p.apy > 0)
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, 10)
    .map(p => ({
      pool: p.pool, project: p.project, symbol: p.symbol,
      tvl: p.tvlUsd, apy: p.apy, apyBase: p.apyBase, apyReward: p.apyReward,
    }));
}

// ─── Jupiter Quote API v6 ────────────────────────────────────────────────────
export async function fetchJupiterQuote(inputMint, outputMint, amount, decimals = 9) {
  const lamports = Math.round(amount * 10 ** decimals);
  const res = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${lamports}&slippageBps=50`
  );
  if (!res.ok) throw new Error('Jupiter Quote error');
  const q = await res.json();
  if (q.error) throw new Error(q.error);
  return {
    inAmount: parseFloat(q.inAmount) / 10 ** decimals,
    outAmount: parseFloat(q.outAmount) / 10 ** (q.outputMint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 6 : 9),
    priceImpact: parseFloat(q.priceImpactPct),
    routePlan: q.routePlan?.map(r => r.swapInfo?.label).filter(Boolean) || [],
  };
}

// ─── ExchangeRate-API: Caribbean FX rates (free, no key) ─────────────────────
export async function fetchCaribFXRates() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error('FX API error');
  const json = await res.json();
  if (json.result !== 'success') throw new Error('FX data unavailable');
  const caribCodes = ['TTD', 'JMD', 'BBD', 'GYD', 'BSD', 'BZD', 'XCD', 'HTG', 'DOP'];
  const names = {
    TTD: 'Trinidad & Tobago', JMD: 'Jamaica', BBD: 'Barbados', GYD: 'Guyana',
    BSD: 'Bahamas', BZD: 'Belize', XCD: 'East Caribbean', HTG: 'Haiti', DOP: 'Dom. Republic',
  };
  return caribCodes
    .filter(c => json.rates[c] != null)
    .map(code => ({ code, rate: json.rates[code], name: names[code] || code }));
}

// Crypto news: previously CoinGecko /news, which moved to the Pro tier in 2023.
// InsightsPage now uses fetchMarketNews('crypto') from ./finnhub.js directly.

// ─── World Bank: Caribbean GDP growth ────────────────────────────────────────
export async function fetchCaribbeanGDP() {
  const countries = 'TTO;JAM;BRB;GUY;BHS;BLZ';
  const res = await fetch(
    `https://api.worldbank.org/v2/country/${countries}/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2020:2024&per_page=50`
  );
  if (!res.ok) throw new Error('World Bank error');
  const json = await res.json();
  const data = json[1] || [];
  const byCountry = {};
  data.forEach(d => {
    if (d.value == null) return;
    const key = d.country.id;
    if (!byCountry[key] || d.date > byCountry[key].year) {
      byCountry[key] = { country: d.country.value, year: d.date, growth: d.value };
    }
  });
  return Object.values(byCountry).sort((a, b) => b.growth - a.growth);
}

// ─── AI Market Brief (Claude API via Worker proxy) ──────────────────────────
const API_PROXY = import.meta.env.VITE_API_PROXY_URL || 'https://limer-api-proxy.solanacaribbean-team.workers.dev';

export async function fetchMarketBrief() {
  const res = await fetch(`${API_PROXY}/ai/market-brief`);
  if (!res.ok) throw new Error(`AI brief error: ${res.status}`);
  return res.json();
}
