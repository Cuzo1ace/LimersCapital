/**
 * Lightweight runtime validators for external API responses.
 * No Zod — pure guard functions. All return typed values or null/throw.
 * Used in src/api/prices.js and src/api/insights.js to catch schema drift.
 */

/** Safe parse to finite number — returns null (not NaN) on bad input */
export function safeFloat(val) {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

/** Safe parse to integer — returns null on bad input */
export function safeInt(val) {
  if (val == null) return null;
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Validate a Pyth Hermes feed entry.
 * Throws TypeError with field path if required fields are missing or invalid.
 * Returns { price: number, expo: number, conf: number }
 */
export function validatePythFeed(feed, feedId = '?') {
  if (!feed || typeof feed !== 'object') {
    throw new TypeError(`Pyth feed[${feedId}]: expected object, got ${typeof feed}`);
  }
  if (!feed.price || typeof feed.price !== 'object') {
    throw new TypeError(`Pyth feed[${feedId}]: missing price object`);
  }
  const price = safeInt(feed.price.price);
  const expo  = safeInt(feed.price.expo);
  const conf  = safeInt(feed.price.conf);
  if (price == null) throw new TypeError(`Pyth feed[${feedId}]: price.price "${feed.price.price}" is not a valid integer`);
  if (expo  == null) throw new TypeError(`Pyth feed[${feedId}]: price.expo "${feed.price.expo}" is not a valid integer`);
  return { price, expo, conf: conf ?? 0 };
}

/**
 * Validate a DexScreener pair object.
 * Returns normalized { price, change24h, volume24h, address } or null if unusable.
 */
export function validateDexPair(pair) {
  if (!pair || typeof pair !== 'object') return null;
  const price = safeFloat(pair.priceUsd);
  if (price == null || price <= 0) return null; // skip pairs with no/zero price
  return {
    price,
    change24h: safeFloat(pair.priceChange?.h24),
    volume24h: safeFloat(pair.volume?.h24),
    address:   pair.baseToken?.address ?? null,
  };
}

/**
 * Validate CoinGecko simple/price response.
 * Returns { price, change24h } or throws on missing data.
 */
export function validateCGSimplePrice(json, coinId) {
  if (!json || typeof json !== 'object') throw new TypeError(`CoinGecko simple/price: expected object`);
  const coin = json[coinId];
  if (!coin) throw new TypeError(`CoinGecko simple/price: missing data for "${coinId}"`);
  const price = safeFloat(coin.usd);
  if (price == null) throw new TypeError(`CoinGecko simple/price: invalid usd price for "${coinId}" — got ${JSON.stringify(coin.usd)}`);
  return {
    price,
    change24h: safeFloat(coin.usd_24h_change),
  };
}

/**
 * Validate a single CoinGecko markets array item.
 * Returns item with numeric fields safely parsed, or null to skip.
 */
export function validateCGMarketItem(item) {
  if (!item || typeof item !== 'object') return null;
  const price = safeFloat(item.current_price);
  if (price == null) return null; // skip tokens with no price data
  return {
    ...item,
    current_price: price,
    price_change_percentage_24h: safeFloat(item.price_change_percentage_24h),
    market_cap: safeFloat(item.market_cap),
    total_volume: safeFloat(item.total_volume),
  };
}

/**
 * Validate Jupiter v2 price entry for a mint.
 * Returns { price } or null.
 */
export function validateJupiterPrice(data) {
  if (!data) return null;
  const price = safeFloat(data.price);
  return (price != null && price > 0) ? { price } : null;
}

/**
 * Validate DeFiLlama chains array — find Solana TVL.
 * Returns tvl as number or null.
 */
export function validateDeFiLlamaTVL(chains, chainName = 'Solana') {
  if (!Array.isArray(chains)) throw new TypeError(`DeFiLlama: expected array of chains`);
  const chain = chains.find(c => c?.name === chainName);
  return chain ? (safeFloat(chain.tvl) ?? null) : null;
}
