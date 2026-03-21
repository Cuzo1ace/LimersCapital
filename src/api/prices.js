// CoinGecko free API — no key needed
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

import {
  safeFloat, validatePythFeed, validateDexPair,
  validateCGSimplePrice, validateCGMarketItem, validateJupiterPrice, validateDeFiLlamaTVL,
} from '../utils/validate';

// Jupiter Price API v2 — no key needed (last-resort fallback)
const JUPITER_BASE = 'https://api.jup.ag/price/v2';

// Pyth Hermes — oracle-grade prices, free, no key, CORS-enabled
const HERMES_BASE = 'https://hermes.pyth.network/v2/updates/price/latest';

// DexScreener — all Solana tokens by mint, price + 24h change + volume
const DEXSCREENER_BASE = 'https://api.dexscreener.com/tokens/v1/solana';

// Helius — dedicated RPC + DAS API for on-chain token metadata / logos
// API key is stored server-side in the Cloudflare Worker (limer-api-proxy).
// The frontend NEVER sees the Helius key — all requests route through the proxy.
const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL || '';
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

// Solana token mint addresses — core + new CAs
export const SOL_TOKENS = {
  SOL:    'So11111111111111111111111111111111111111112',
  USDC:   'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  ONDO:   'FoNprxYzYmwnYzhM964CxEHchhj17YWvSvwUafXvQFKo',
  JUP:    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY:    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  BONK:   'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  RENDER: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  HNT:    'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
  // New CAs
  GOLD:   'GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A',
  zBTC:   'zBTCug3er3tLyffELcvDNrKkCymbPWysGcWihESYfLg',
  WETH:   '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  BILL:   '98sMhvDwXj1RQi5c5Mndm3vPe9cBqPrbLaufMXFNMh5g',
  PERP:   '7C56WnJ94iEP7YeH2iKiYpvsS5zkcpP9rJBBEBoUGdzj',
  PREN:   'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw',
  NVDAX:  'Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh',
};

// 7 tokens not on CoinGecko — use DexScreener / Pyth for prices
const JUPITER_ONLY_MINTS = [
  SOL_TOKENS.GOLD, SOL_TOKENS.zBTC, SOL_TOKENS.WETH,
  SOL_TOKENS.BILL, SOL_TOKENS.PERP, SOL_TOKENS.PREN, SOL_TOKENS.NVDAX,
];

// Token logo CDNs (verified CORS-safe):
// - CoinGecko CDN: used for the 8 major tokens it lists
// - Solana token list (raw GitHub): used for everything else by mint
const CG = (id, file) => `https://assets.coingecko.com/coins/images/${id}/small/${file}`;
const SL = (mint)    => `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`;

// Token metadata for the order book / market page
export const TOKEN_INFO = {
  SOL:    { name: 'Solana',            cat: 'L1',     col: '#9945FF', img: CG('4128',  'solana.png') },
  USDC:   { name: 'USD Coin',          cat: 'Stable', col: '#2D9B56', img: CG('6319',  'usdc.png') },
  ONDO:   { name: 'Ondo Finance',      cat: 'RWA',    col: '#FFCA3A', img: CG('26580', 'ONDO.png') },
  JUP:    { name: 'Jupiter',           cat: 'DeFi',   col: '#00C8B4', img: CG('34188', 'jup.png') },
  RAY:    { name: 'Raydium',           cat: 'DeFi',   col: '#FF5C4D', img: CG('13928', 'PSigc4ie_400x400.jpg') },
  BONK:   { name: 'Bonk',             cat: 'Meme',   col: '#FFCA3A', img: CG('28600', 'bonk.jpg') },
  RENDER: { name: 'Render',           cat: 'Infra',  col: '#FF5C4D', img: CG('11636', 'rndr.png') },
  HNT:    { name: 'Helium',           cat: 'Infra',  col: '#00C8B4', img: CG('4284',  'Helium_HNT.png') },
  // Representative logos for custom Solana tokens — verified via Helius DAS getAssetBatch
  GOLD:   { name: 'Gold (Tokenized)',     cat: 'RWA',    col: '#FFD700', img: CG('9519',  'paxgold.png') },       // PAX Gold icon
  zBTC:   { name: 'Zeus Bitcoin',         cat: 'RWA',    col: '#F7931A', img: CG('1',     'bitcoin.png') },       // BTC icon
  WETH:   { name: 'Ether (Portal)',       cat: 'L1',     col: '#627EEA', img: SL('7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs') },
  BILL:   { name: 'HYPE',                cat: 'DeFi',   col: '#00C8B4', img: 'https://arweave.net/QBRdRop8wI4PpScSRTKyibv-fQuYBua-WOvC7tuJyJo' },
  PERP:   { name: 'Silver rStock',        cat: 'RWA',    col: '#C0C0C0', img: null },                             // S3 SVG has CORS — colored circle fallback
  PREN:   { name: 'Anthropic PreStocks', cat: 'Stock',  col: '#D97706', img: 'https://prestocks.com/logos/anthropic.png' },
  NVDAX:  { name: 'NVIDIA xStock',       cat: 'Stock',  col: '#76B900', img: 'https://xstocks-metadata.backed.fi/logos/tokens/NVDAx.png' },
};

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

// Mints that don't have a hardcoded CDN logo — fetched via Helius DAS on load
export const HELIUS_LOGO_MINTS = Object.entries(TOKEN_INFO)
  .filter(([, info]) => !info.img)
  .map(([sym]) => SOL_TOKENS[sym])
  .filter(Boolean);

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

// ─── Layer 3: Jupiter v2 (fallback only) ─────────────────────────────────────
export async function fetchJupiterPrices() {
  const ids = Object.values(SOL_TOKENS).join(',');
  const res = await fetch(`${JUPITER_BASE}?ids=${ids}`);
  if (!res.ok) throw new Error(`Jupiter API error: ${res.status}`);
  const json = await res.json();

  const prices = {};
  for (const [symbol, mint] of Object.entries(SOL_TOKENS)) {
    const validated = validateJupiterPrice(json.data?.[mint]);
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

  // Layer 3: Jupiter v2 — last resort for any symbol still missing
  const missingSymbols = Object.keys(TOKEN_INFO)
    .filter(sym => !pythPrices[sym] && !dexPrices[sym]);
  let jupPrices = {};
  if (missingSymbols.length > 0) {
    try {
      const mints = missingSymbols.map(s => SOL_TOKENS[s]).filter(Boolean).join(',');
      const res = await fetch(`${JUPITER_BASE}?ids=${mints}`);
      if (res.ok) {
        const json = await res.json();
        for (const sym of missingSymbols) {
          const mint = SOL_TOKENS[sym];
          const validated = validateJupiterPrice(json.data?.[mint]);
          if (validated) jupPrices[sym] = validated;
        }
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

// DeFiLlama — TVL for Solana chain
export async function fetchSolanaTVL() {
  const res = await fetch('https://api.llama.fi/v2/chains');
  if (!res.ok) throw new Error(`DeFiLlama error: ${res.status}`);
  const chains = await res.json();
  const tvl = validateDeFiLlamaTVL(chains, 'Solana');
  return tvl;
}
