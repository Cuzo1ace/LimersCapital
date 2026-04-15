import {
  safeFloat, validatePythFeed, validateDexPair,
  validateCGSimplePrice, validateCGMarketItem, validateJupiterPrice, validateDeFiLlamaTVL,
} from '../utils/validate';
import {
  SOL_TOKENS,
  TOKEN_INFO,
  HELIUS_LOGO_MINTS,
  JUPITER_ONLY_MINTS,
} from '../data/tokenCatalog';

// Re-export so existing consumers (TradePage, InsightsPage, MarketPage, etc.)
// keep working with `import { SOL_TOKENS, TOKEN_INFO, HELIUS_LOGO_MINTS } from '../api/prices'`.
export { SOL_TOKENS, TOKEN_INFO, HELIUS_LOGO_MINTS };

// API proxy URL — must be declared before any const that references it.
// Default to the production Worker so the site works without build-time env
// var wiring. The Worker URL is public (not a secret) — the Helius key it
// holds is stored server-side as a Wrangler secret.
const API_PROXY_URL =
  import.meta.env.VITE_API_PROXY_URL ||
  'https://limer-api-proxy.solanacaribbean-team.workers.dev';

// CoinGecko free API — no key needed
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Pyth Hermes — oracle-grade prices, free, no key, CORS-enabled
const HERMES_BASE = 'https://hermes.pyth.network/v2/updates/price/latest';

// DexScreener — all Solana tokens by mint, price + 24h change + volume
const DEXSCREENER_BASE = 'https://api.dexscreener.com/tokens/v1/solana';

// Financial Modeling Prep — cryptocurrency supply + ICO metadata
// API key is stored server-side in the Cloudflare Worker (limer-api-proxy).
// The frontend NEVER sees the FMP key — all requests route through the proxy.
const FMP_PROXY_URL = API_PROXY_URL ? `${API_PROXY_URL}/fmp` : null;

// Helius — dedicated RPC + DAS API for on-chain token metadata / logos
// API key is stored server-side in the Cloudflare Worker (limer-api-proxy).
// The frontend NEVER sees the Helius key — all requests route through the proxy.
// Jupiter Price API v3 — routed through API proxy to avoid CORS.
// v2 on api.jup.ag was deprecated and returns 404. The worker now proxies
// lite-api.jup.ag/price/v3; the local-dev fallback points at the same host.
const JUPITER_BASE = API_PROXY_URL ? `${API_PROXY_URL}/jupiter/price` : 'https://lite-api.jup.ag/price/v3';
const HELIUS_RPC_URL_DIRECT = import.meta.env.VITE_SOLANA_RPC_URL || '';
export const HELIUS_RPC_URL = API_PROXY_URL
  ? `${API_PROXY_URL}/rpc`           // Proxied — key stays server-side
  : HELIUS_RPC_URL_DIRECT             // Fallback for local dev only
  || 'https://api.mainnet-beta.solana.com';  // Public RPC last resort
const HELIUS_DAS_URL = API_PROXY_URL
  ? `${API_PROXY_URL}/das`
  : HELIUS_RPC_URL;

// Pyth Hermes feed IDs (verified live 2026-03-20)
// zBTC tracks BTC oracle; WETH tracks ETH oracle; GOLD tracks XAU/spot gold
const PYTH_FEEDS = {
  SOL:  '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  zBTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  WETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  GOLD: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
};

// Reverse map: Pyth feed ID (no 0x) → token symbol
const PYTH_ID_TO_SYMBOL = Object.fromEntries(
  Object.entries(PYTH_FEEDS).map(([sym, id]) => [id.replace('0x', ''), sym])
);

// `SOL_TOKENS`, `TOKEN_INFO`, `HELIUS_LOGO_MINTS`, and `JUPITER_ONLY_MINTS` are
// now generated from the canonical catalog at `src/data/tokenCatalog.js`.
// To add/remove/rename a token, edit that file — nothing here needs to change.

// Reverse lookup: mint address → symbol
const MINT_TO_SYMBOL = Object.fromEntries(
  Object.entries(SOL_TOKENS).map(([symbol, mint]) => [mint, symbol])
);

export function getSymbolForMint(mint) {
  return MINT_TO_SYMBOL[mint] || null;
}

export function getMintForSymbol(symbol) {
  return SOL_TOKENS[symbol?.toUpperCase()] || null;
}

export function getTokenInfoForMint(mint) {
  const symbol = getSymbolForMint(mint);
  if (!symbol) return null;
  return { symbol, ...TOKEN_INFO[symbol] };
}

// ─── Helius DAS API — on-chain token metadata / logos ────────────────────────
// Uses getAssetBatch to fetch token metadata for multiple mints in one request.
// Returns { mint: logoUrl } for tokens with an image in their on-chain metadata.
// staleTime should be long (24h) — token logos essentially never change.
export async function fetchHeliusTokenLogos(mints) {
  if (!mints.length) return {};
  const dasUrl = HELIUS_DAS_URL || HELIUS_RPC_URL;
  if (!dasUrl || dasUrl === 'https://api.mainnet-beta.solana.com') return {}; // public RPC has no DAS
  const res = await fetch(dasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 'logo-batch',
      method: 'getAssetBatch',
      params: { ids: mints },
    }),
  });
  if (!res.ok) throw new Error(`Helius DAS error: ${res.status}`);
  const json = await res.json();

  const result = {};
  for (const asset of json.result || []) {
    const mint = asset.id;
    // Prefer content.links.image, fall back to first file URI
    const image =
      asset.content?.links?.image ||
      asset.content?.files?.find(f => f.mime?.startsWith('image/'))?.uri ||
      null;
    if (mint && image) result[mint] = image;
  }
  return result; // { '98sMh...': 'https://...logo.png', ... }
}

// `HELIUS_LOGO_MINTS` is re-exported from the catalog module above — no local definition needed.

// ─── Underlying stock prices (FMP /stable/quote) ─────────────────────────────
// Fetches real NASDAQ/NYSE prices for xStock + ETF underlyings so the UI can
// show the basis-spread between the on-chain tokenized price (from Jupiter)
// and the real market price (from FMP). Educational differentiator — this is
// what tokens.xyz and the issuer pages don't show.
//
// FMP's /stable/quote takes one symbol per request, so we fan out in parallel.
// The worker caches each symbol for 60s, keeping us well inside the 250 req/day
// free-tier limit (10 underlyings × 24h × 1/60s refresh = ~240 req/day worst case).
//
// Returns: { [ticker]: { price, change24h, name, exchange, timestamp } }
// Gracefully returns {} on any failure so the UI can hide the widget.
export async function fetchUnderlyingStockPrices(tickers) {
  if (!Array.isArray(tickers) || tickers.length === 0) return {};
  const base = API_PROXY_URL ? `${API_PROXY_URL}/fmp/quote` : null;
  if (!base) return {};

  // Parallel fan-out, one request per ticker.
  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const clean = String(ticker || '').replace(/[^A-Z0-9.^-]/gi, '');
      if (!clean) return null;
      try {
        const res = await fetch(`${base}?symbol=${clean}`);
        if (!res.ok) return null;
        const json = await res.json();
        const row = Array.isArray(json) ? json[0] : json;
        if (!row || typeof row.price !== 'number' || row.price <= 0) return null;
        return [clean, {
          price: row.price,
          change24h: typeof row.changePercentage === 'number' ? row.changePercentage : null,
          name: row.name || null,
          exchange: row.exchange || null,
          timestamp: row.timestamp || null,
        }];
      } catch {
        return null;
      }
    })
  );

  const out = {};
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      const [ticker, data] = r.value;
      out[ticker] = data;
    }
  }
  return out;
}

// ─── Jupiter batch chunking ─────────────────────────────────────────────────
// Jupiter's v3 /price endpoint accepts up to ~100 mint ids per call. Chunk to
// be safe as the catalog grows. 80 leaves comfortable headroom.
const JUPITER_BATCH_SIZE = 80;

function chunkMints(mints, size = JUPITER_BATCH_SIZE) {
  const chunks = [];
  for (let i = 0; i < mints.length; i += size) {
    chunks.push(mints.slice(i, i + size));
  }
  return chunks;
}

async function fetchJupiterPriceChunk(mints) {
  const ids = mints.join(',');
  const res = await fetch(`${JUPITER_BASE}?ids=${ids}`);
  if (!res.ok) throw new Error(`Jupiter API error: ${res.status}`);
  const json = await res.json();
  return json?.data ?? json ?? {};
}

async function fetchJupiterPriceMap(mints) {
  if (!mints.length) return {};
  const chunks = chunkMints(mints);
  const results = await Promise.all(chunks.map(fetchJupiterPriceChunk));
  return Object.assign({}, ...results);
}

// ─── DexScreener OHLCV ───────────────────────────────────────────────────────
// Two-step: get best pair address for a mint, then fetch candle data.
// Returns ApexCharts candlestick format: [{ x: timestamp_ms, y: [o,h,l,c] }]
// Falls back to null on failure — StockChart generates seeded data as fallback.

const PERIOD_CONFIG = {
  '1M': { res: 'D',  days: 30 },
  '3M': { res: 'D',  days: 90 },
  '6M': { res: 'W',  days: 180 },
  '1Y': { res: 'W',  days: 365 },
  '5Y': { res: 'W',  days: 1825 },
};

async function fetchDexScreenerPairAddress(mint) {
  const res = await fetch(`${DEXSCREENER_BASE}/${mint}`);
  if (!res.ok) return null;
  const pairs = await res.json();
  if (!Array.isArray(pairs) || !pairs.length) return null;
  // Pick highest volume pair
  return pairs.reduce((best, p) =>
    (p.volume?.h24 || 0) > (best?.volume?.h24 || 0) ? p : best, null
  )?.pairAddress || null;
}

export async function fetchCandleData(symbol, period = '3M') {
  const mint = SOL_TOKENS[symbol?.toUpperCase()];
  if (!mint) return null;
  const cfg = PERIOD_CONFIG[period] || PERIOD_CONFIG['3M'];
  const to = Math.floor(Date.now() / 1000);
  const from = to - cfg.days * 86400;

  try {
    const pairAddress = await fetchDexScreenerPairAddress(mint);
    if (!pairAddress) return null;

    const url = `https://api.dexscreener.com/latest/dex/candles/solana/${pairAddress}?res=${cfg.res}&from=${from}&to=${to}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const ohlcv = json?.data?.ohlcv;
    if (!Array.isArray(ohlcv) || !ohlcv.length) return null;

    // DexScreener format: [timestamp_ms, open, high, low, close, volume]
    return ohlcv.map(([t, o, h, l, c]) => ({
      x: t,
      y: [+o.toFixed(6), +h.toFixed(6), +l.toFixed(6), +c.toFixed(6)],
    }));
  } catch {
    return null;
  }
}

// ─── Layer 1: Pyth Hermes ────────────────────────────────────────────────────
// Oracle-grade prices for SOL, zBTC (BTC), WETH (ETH), GOLD (XAU)
// Returns { SOL: { price, confidence }, zBTC: {...}, ... }
export async function fetchPythPrices() {
  const params = Object.values(PYTH_FEEDS).map(id => `ids[]=${id}`).join('&');
  const res = await fetch(`${HERMES_BASE}?${params}`);
  if (!res.ok) throw new Error(`Pyth Hermes error: ${res.status}`);
  const json = await res.json();

  const result = {};
  for (const feed of json.parsed || []) {
    const symbol = PYTH_ID_TO_SYMBOL[feed.id];
    if (!symbol) continue;
    try {
      const { price: rawPrice, expo, conf: rawConf } = validatePythFeed(feed, feed.id);
      const scale = Math.pow(10, expo);
      const price = rawPrice * scale;
      const confidence = rawConf * scale;
      if (price > 0) result[symbol] = { price, confidence };
    } catch (e) {
      console.warn('Pyth validation:', e.message);
    }
  }
  return result;
}

// ─── Layer 2: DexScreener ────────────────────────────────────────────────────
// Any Solana token by mint address → price + 24h change + volume
// Returns { SOL: { price, change24h, volume24h }, GOLD: {...}, ... }
export async function fetchDexScreenerPrices(mints) {
  const res = await fetch(`${DEXSCREENER_BASE}/${mints.join(',')}`);
  if (!res.ok) throw new Error(`DexScreener error: ${res.status}`);
  const pairs = await res.json(); // array of DEX pair objects

  // Per mint, pick the pair with highest 24h volume (most liquid / reliable price)
  const bestRaw = {};
  for (const pair of pairs) {
    const mint = pair.baseToken?.address;
    if (!mint) continue;
    const vol = pair.volume?.h24 ?? 0;
    if (!bestRaw[mint] || vol > (bestRaw[mint].volume?.h24 ?? 0)) bestRaw[mint] = pair;
  }

  // Validate and translate mint → symbol
  const result = {};
  for (const [symbol, mint] of Object.entries(SOL_TOKENS)) {
    const validated = validateDexPair(bestRaw[mint]);
    if (!validated) continue;
    result[symbol] = {
      price:     validated.price,
      change24h: validated.change24h,
      volume24h: validated.volume24h,
    };
  }
  return result;
}

// ─── Layer 3: Jupiter v3 (fallback only) ─────────────────────────────────────
// v3 returns a flat { [mint]: {...} } map; v2 returned { data: { [mint]: {...} } }.
// `fetchJupiterPriceMap` handles both shapes AND chunks large token lists so
// the catalog can grow past Jupiter's ~100 id-per-request limit.
export async function fetchJupiterPrices() {
  const mints = Object.values(SOL_TOKENS);
  const root = await fetchJupiterPriceMap(mints);

  const prices = {};
  for (const [symbol, mint] of Object.entries(SOL_TOKENS)) {
    const validated = validateJupiterPrice(root[mint]);
    if (validated) prices[symbol] = { ...validated, mint };
  }
  return prices;
}

// ─── TradePage: fast-polling price function ───────────────────────────────────
// Pyth Hermes → DexScreener → Jupiter v2 fallback
// Refreshed every 12s in TradePage (independent of MarketPage's 60s sol-market query)
export async function fetchTradePrices() {
  // Layer 1: Pyth — oracle prices for SOL, zBTC, WETH, GOLD
  let pythPrices = {};
  try {
    pythPrices = await fetchPythPrices();
  } catch (e) {
    console.warn('Pyth Hermes failed:', e.message);
  }

  // Layer 2: DexScreener — all 15 tokens (price + 24h change + volume)
  let dexPrices = {};
  try {
    dexPrices = await fetchDexScreenerPrices(Object.values(SOL_TOKENS));
  } catch (e) {
    console.warn('DexScreener failed:', e.message);
  }

  // Layer 3: Jupiter v3 — last resort for any symbol still missing.
  // Chunked to handle catalogs larger than Jupiter's ~100 id-per-request cap.
  const missingSymbols = Object.keys(TOKEN_INFO)
    .filter(sym => !pythPrices[sym] && !dexPrices[sym]);
  let jupPrices = {};
  if (missingSymbols.length > 0) {
    try {
      const mints = missingSymbols.map(s => SOL_TOKENS[s]).filter(Boolean);
      const root = await fetchJupiterPriceMap(mints);
      for (const sym of missingSymbols) {
        const mint = SOL_TOKENS[sym];
        const validated = validateJupiterPrice(root[mint]);
        if (validated) jupPrices[sym] = validated;
      }
    } catch (e) {
      console.warn('Jupiter fallback failed:', e.message);
    }
  }

  // Merge: Pyth wins for oracle assets, DexScreener for the rest, Jupiter last resort
  return Object.entries(TOKEN_INFO).map(([symbol, info]) => {
    const pyth = pythPrices[symbol];
    const dex  = dexPrices[symbol];
    const jup  = jupPrices[symbol];
    const price = pyth?.price ?? dex?.price ?? jup?.price ?? null;
    return {
      id: symbol.toLowerCase(),
      symbol: symbol.toLowerCase(),
      name: info.name,
      image: info.img || null,
      current_price: price,
      price_change_percentage_24h: dex?.change24h ?? null,
      total_volume: dex?.volume24h ?? null,
      market_cap: null,
      _pythConfidence: pyth?.confidence ?? null,
      _cat: info.cat,
      _col: info.col,
    };
  });
}

// ─── MarketPage: CoinGecko + DexScreener ─────────────────────────────────────
export async function fetchSolanaMarketData() {
  // CoinGecko IDs for the 8 tokens it covers (with market cap + 24h change)
  const ids = 'solana,usd-coin,ondo-finance,jupiter-exchange-solana,raydium,bonk,render-token,helium';
  const res = await fetch(
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
  );
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  const cgData = await res.json();

  // DexScreener for the 7 Jupiter-only tokens (primary); Jupiter v2 as fallback
  let dexPrices = {};
  let jupPrices = {};
  try {
    dexPrices = await fetchDexScreenerPrices(JUPITER_ONLY_MINTS);
  } catch (e) {
    console.warn('DexScreener failed, falling back to Jupiter:', e.message);
    try { jupPrices = await fetchJupiterPrices(); } catch {}
  }

  // Validate CoinGecko market items — filter out any with missing/corrupt prices
  const result = cgData.map(validateCGMarketItem).filter(Boolean);

  // Add Jupiter-only tokens from DexScreener / Jupiter
  const cgSymbols = new Set(cgData.map(t => (t.symbol || '').toUpperCase()));
  for (const [symbol, info] of Object.entries(TOKEN_INFO)) {
    if (cgSymbols.has(symbol.toUpperCase())) continue;
    const dex = dexPrices[symbol];
    const jup = jupPrices[symbol];
    const price = dex?.price ?? jup?.price ?? null;
    if (!price) continue; // skip if no data from any source
    result.push({
      id: symbol.toLowerCase(),
      symbol: symbol.toLowerCase(),
      name: info.name,
      image: null,
      current_price: price,
      price_change_percentage_24h: dex?.change24h ?? null,
      market_cap: null,
      total_volume: dex?.volume24h ?? null,
      _source: dex ? 'dexscreener' : 'jupiter',
      _cat: info.cat,
      _col: info.col,
    });
  }

  return result;
}

export async function fetchSolPrice() {
  const res = await fetch(`${COINGECKO_BASE}/simple/price?ids=solana&vs_currency=usd&include_24hr_change=true`);
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  const json = await res.json();
  return validateCGSimplePrice(json, 'solana');
}

// ─── Financial Modeling Prep — supply + ICO metadata ───────────────────
// Returns { SOL: { circulatingSupply, totalSupply, icoDate }, ... }
export async function fetchFMPCryptoList() {
  if (!FMP_PROXY_URL) {
    console.warn('FMP proxy not configured — supply data unavailable');
    return {};
  }
  const res = await fetch(`${FMP_PROXY_URL}/cryptocurrency-list`);
  if (!res.ok) throw new Error(`FMP error: ${res.status}`);
  const data = await res.json();
  const map = {};
  for (const coin of data) {
    const sym = coin.symbol?.replace(/USD$/, '');
    if (sym) {
      map[sym] = {
        circulatingSupply: coin.circulatingSupply ?? null,
        totalSupply:       coin.totalSupply ?? null,
        icoDate:           coin.icoDate ?? null,
      };
    }
  }
  return map;
}

// Format large numbers for display (e.g. 430232640 → "430.2M")
export function fmtSupply(n) {
  if (n == null) return '—';
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(1)  + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(1)  + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + 'K';
  return n.toLocaleString();
}

// DeFiLlama — TVL for Solana chain
export async function fetchSolanaTVL() {
  const res = await fetch('https://api.llama.fi/v2/chains');
  if (!res.ok) throw new Error(`DeFiLlama error: ${res.status}`);
  const chains = await res.json();
  const tvl = validateDeFiLlamaTVL(chains, 'Solana');
  return tvl;
}
