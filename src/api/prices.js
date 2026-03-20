// CoinGecko free API — no key needed
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Jupiter Price API v2 — no key needed
const JUPITER_BASE = 'https://api.jup.ag/price/v2';

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

// Token metadata for the order book / market page
export const TOKEN_INFO = {
  SOL:    { name: 'Solana',                   cat: 'L1',    col: '#9945FF' },
  USDC:   { name: 'USD Coin',                 cat: 'Stable', col: '#2D9B56' },
  ONDO:   { name: 'Ondo Finance',             cat: 'RWA',   col: '#FFCA3A' },
  JUP:    { name: 'Jupiter',                  cat: 'DeFi',  col: '#00C8B4' },
  RAY:    { name: 'Raydium',                  cat: 'DeFi',  col: '#FF5C4D' },
  BONK:   { name: 'Bonk',                     cat: 'Meme',  col: '#FFCA3A' },
  RENDER: { name: 'Render',                   cat: 'Infra', col: '#FF5C4D' },
  HNT:    { name: 'Helium',                   cat: 'Infra', col: '#00C8B4' },
  GOLD:   { name: 'Gold (Tokenized)',          cat: 'RWA',   col: '#FFD700' },
  zBTC:   { name: 'Zeus Bitcoin',              cat: 'RWA',   col: '#F7931A' },
  WETH:   { name: 'Ether (Portal)',            cat: 'L1',    col: '#627EEA' },
  BILL:   { name: 'T-Bill Token',              cat: 'RWA',   col: '#00C8B4' },
  PERP:   { name: 'Perp Protocol',             cat: 'DeFi',  col: '#C87EFF' },
  PREN:   { name: 'Pren Finance',              cat: 'DeFi',  col: '#38BDF8' },
  NVDAX:  { name: 'NVIDIA xStock',             cat: 'Stock', col: '#76B900' },
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

export async function fetchJupiterPrices() {
  const ids = Object.values(SOL_TOKENS).join(',');
  const res = await fetch(`${JUPITER_BASE}?ids=${ids}`);
  if (!res.ok) throw new Error(`Jupiter API error: ${res.status}`);
  const json = await res.json();

  const prices = {};
  for (const [symbol, mint] of Object.entries(SOL_TOKENS)) {
    const data = json.data?.[mint];
    if (data) {
      prices[symbol] = {
        price: parseFloat(data.price),
        mint,
      };
    }
  }
  return prices;
}

export async function fetchSolanaMarketData() {
  // CoinGecko IDs for the tokens we can look up there
  const ids = 'solana,usd-coin,ondo-finance,jupiter-exchange-solana,raydium,bonk,render-token,helium';
  const res = await fetch(
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
  );
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  const cgData = await res.json();

  // Also fetch Jupiter prices for ALL tokens (including new CAs not on CoinGecko)
  let jupPrices = {};
  try {
    jupPrices = await fetchJupiterPrices();
  } catch (e) {
    console.warn('Jupiter price fetch failed:', e.message);
  }

  // Merge: CoinGecko data first, then fill in Jupiter-only tokens
  const result = [...cgData];

  // Add tokens that are on Jupiter but not CoinGecko
  const cgSymbols = new Set(cgData.map(t => (t.symbol || '').toUpperCase()));
  for (const [symbol, info] of Object.entries(TOKEN_INFO)) {
    if (cgSymbols.has(symbol.toUpperCase())) continue;
    const jup = jupPrices[symbol];
    if (jup && jup.price) {
      result.push({
        id: symbol.toLowerCase(),
        symbol: symbol.toLowerCase(),
        name: info.name,
        image: null,
        current_price: jup.price,
        price_change_percentage_24h: null, // Jupiter v2 doesn't provide this
        market_cap: null,
        total_volume: null,
        _source: 'jupiter',
        _cat: info.cat,
        _col: info.col,
      });
    }
  }

  return result;
}

export async function fetchSolPrice() {
  const res = await fetch(`${COINGECKO_BASE}/simple/price?ids=solana&vs_currency=usd&include_24hr_change=true`);
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  const json = await res.json();
  return {
    price: json.solana.usd,
    change24h: json.solana.usd_24h_change,
  };
}

// DeFiLlama — TVL for Solana RWA protocols (no key needed)
export async function fetchSolanaTVL() {
  const res = await fetch('https://api.llama.fi/v2/chains');
  if (!res.ok) throw new Error(`DeFiLlama error: ${res.status}`);
  const chains = await res.json();
  const solana = chains.find(c => c.name === 'Solana');
  return solana ? solana.tvl : null;
}
