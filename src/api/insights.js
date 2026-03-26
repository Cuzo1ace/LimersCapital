// Insights APIs — all free tier, no keys needed
// CoinGecko Demo API: https://api.coingecko.com/api/v3 (rate limit: 30 calls/min)

const CG = 'https://api.coingecko.com/api/v3';

// ─── CoinGecko: Top crypto by market cap ─────────────────────────────────────
export async function fetchCryptoMarket() {
  const res = await fetch(
    `${CG}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=1h,24h,7d`
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
    `${CG}/coins/markets?vs_currency=usd&category=real-world-assets-rwa&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
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
    `${CG}/coins/markets?vs_currency=usd&category=layer-1&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h,7d`
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
    `${CG}/coins/markets?vs_currency=usd&category=decentralized-finance-defi&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
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
  const res = await fetch(`${CG}/search/trending`);
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
  return all
    .filter(p => p.chains?.includes('Solana'))
    .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
    .slice(0, 8)
    .map(p => ({ name: p.name, tvl: p.tvl, change_1d: p.change_1d, category: p.category }));
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

// ─── CoinGecko: Crypto news feed (free, no key) ──────────────────────────────
export async function fetchCryptoNews() {
  const res = await fetch(`${CG}/news?page=1`);
  if (!res.ok) throw new Error(`News error: ${res.status}`);
  const data = await res.json();
  return (data.data || []).slice(0, 9).map(n => ({
    id: n.id,
    title: n.title,
    url: n.url,
    source: n.news_site,
    publishedOn: typeof n.created_at === 'number' ? n.created_at : Math.floor(new Date(n.created_at).getTime() / 1000),
    imageUrl: n.thumb_2x,
  }));
}

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
