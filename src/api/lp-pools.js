/**
 * Meteora & DeFi API layer for Agent Squeeze
 * Fetches real pool data and provides analysis utilities
 */

const API_PROXY = import.meta.env.VITE_API_PROXY_URL || '';

// ── Pool Data Fetchers ──────────────────────────────────────────────────────

let poolCache = { data: null, ts: 0 };
const POOL_CACHE_TTL = 60_000; // 60s

export async function fetchMeteoraPools() {
  if (poolCache.data && Date.now() - poolCache.ts < POOL_CACHE_TTL) return poolCache.data;

  try {
    const res = await fetch(`${API_PROXY}/meteora/dlmm-pools`);
    if (!res.ok) throw new Error(`Meteora API ${res.status}`);
    const data = await res.json();
    // Normalize pool data from Meteora datapi (https://dlmm.datapi.meteora.ag/pools)
    const rawPools = data.data || data.pairs || data || [];
    const pools = (Array.isArray(rawPools) ? rawPools : []).map(p => ({
      address: p.address,
      name: p.name || `${p.token_x?.symbol || '?'}/${p.token_y?.symbol || '?'}`,
      mintX: p.token_x?.address,
      mintY: p.token_y?.address,
      symbolX: p.token_x?.symbol || '?',
      symbolY: p.token_y?.symbol || '?',
      binStep: p.pool_config?.bin_step || p.bin_step,
      baseFee: p.pool_config?.base_fee_pct || (p.bin_step ? p.bin_step / 100 : 0.3),
      tvl: parseFloat(p.tvl || 0),
      volume24h: parseFloat(p.volume?.['24h'] || 0),
      fees24h: parseFloat(p.fees?.['24h'] || 0),
      apr: parseFloat(p.apr || 0),
      apy: parseFloat(p.apy || 0),
      currentPrice: parseFloat(p.current_price || 0),
      hasFarm: p.has_farm || false,
      farmApr: parseFloat(p.farm_apr || 0),
    })).filter(p => p.tvl > 1000 && p.volume24h > 0); // Filter dead pools

    poolCache = { data: pools, ts: Date.now() };
    return pools;
  } catch (err) {
    console.warn('Failed to fetch Meteora pools:', err);
    return poolCache.data || SAMPLE_POOLS;
  }
}

// ── Sample pool data (used when Meteora API is unavailable) ──────────────────
const SAMPLE_POOLS = [
  { address: '3amBfhRpnMDiFCgG8MJ2B6aky1EJxNpykJmG7HjBsYRS', name: 'SOL/USDC', symbolX: 'SOL', symbolY: 'USDC', binStep: 1, baseFee: 0.01, tvl: 12_500_000, volume24h: 45_000_000, fees24h: 4500, apr: 131, currentPrice: 135.20 },
  { address: '5rCf1DKvnXWYvRK6RGJx1KNGknfNkN4YpmUaWmU5GbFn', name: 'SOL/USDT', symbolX: 'SOL', symbolY: 'USDT', binStep: 2, baseFee: 0.02, tvl: 8_200_000, volume24h: 28_000_000, fees24h: 2800, apr: 124, currentPrice: 135.15 },
  { address: '7GhFHr7mTmH3u2FUyeXVCbJc7TWnEAE5aKRMtp1e5msN', name: 'JUP/SOL', symbolX: 'JUP', symbolY: 'SOL', binStep: 5, baseFee: 0.05, tvl: 4_800_000, volume24h: 18_000_000, fees24h: 9000, apr: 68, currentPrice: 0.0065 },
  { address: '2QdhepnKRTLjjSqBGSThdE7F4UV5KrSyEJHX4fVjmhWU', name: 'JUP/USDC', symbolX: 'JUP', symbolY: 'USDC', binStep: 5, baseFee: 0.05, tvl: 3_200_000, volume24h: 12_000_000, fees24h: 6000, apr: 68, currentPrice: 0.88 },
  { address: '9hVaPXjFZLnvhg8fxNSq6UiK3pAwMFPr7GqL3ck2hZgT', name: 'BONK/SOL', symbolX: 'BONK', symbolY: 'SOL', binStep: 20, baseFee: 0.20, tvl: 2_100_000, volume24h: 15_000_000, fees24h: 30000, apr: 521, currentPrice: 0.0000000185 },
  { address: '6YfvNSm6MRqZzjqYdi6Y1e7RFJ2qzEj5DQGN3jUvWa6s', name: 'RAY/SOL', symbolX: 'RAY', symbolY: 'SOL', binStep: 10, baseFee: 0.10, tvl: 1_800_000, volume24h: 6_500_000, fees24h: 6500, apr: 132, currentPrice: 0.022 },
  { address: '3KEwxe3BzqyLwG5GfYtAc6VTUPp3RXDS8yMt4K3cbWk1', name: 'RAY/USDC', symbolX: 'RAY', symbolY: 'USDC', binStep: 10, baseFee: 0.10, tvl: 1_500_000, volume24h: 5_200_000, fees24h: 5200, apr: 126, currentPrice: 2.95 },
  { address: '4n1t4ZpSxEjk1qP2xJUhyeGS7KzzwRd8gq7oMkKr6QXi', name: 'HNT/SOL', symbolX: 'HNT', symbolY: 'SOL', binStep: 10, baseFee: 0.10, tvl: 950_000, volume24h: 2_800_000, fees24h: 2800, apr: 107, currentPrice: 0.0295 },
  { address: '8cUvGTFvSWx9WPe3tJBqFkRPHhM6ZZPN9BXuiUHjP1Kx', name: 'ONDO/USDC', symbolX: 'ONDO', symbolY: 'USDC', binStep: 5, baseFee: 0.05, tvl: 2_800_000, volume24h: 8_500_000, fees24h: 4250, apr: 55, currentPrice: 1.32 },
  { address: '5gTPJx5LYK9NZb5RfPBkLZhxLyxzLkU6QViQAfvbK6Sd', name: 'RENDER/USDC', symbolX: 'RENDER', symbolY: 'USDC', binStep: 10, baseFee: 0.10, tvl: 1_200_000, volume24h: 4_000_000, fees24h: 4000, apr: 121, currentPrice: 4.85 },
];

let yieldsCache = { data: null, ts: 0 };
const YIELDS_CACHE_TTL = 300_000; // 5min

export async function fetchDeFiLlamaYields() {
  if (yieldsCache.data && Date.now() - yieldsCache.ts < YIELDS_CACHE_TTL) return yieldsCache.data;

  try {
    const res = await fetch(`${API_PROXY}/defillama/yields`);
    if (!res.ok) throw new Error(`DeFiLlama ${res.status}`);
    const json = await res.json();
    const pools = (json.data || [])
      .filter(p => p.chain === 'Solana' && (p.project === 'meteora' || p.project === 'meteora-dlmm'))
      .map(p => ({
        pool: p.pool,
        symbol: p.symbol,
        tvl: p.tvlUsd,
        apy: p.apy,
        apyBase: p.apyBase,
        apyReward: p.apyReward,
        volumeUsd7d: p.volumeUsd7d,
        project: p.project,
      }));
    yieldsCache = { data: pools, ts: Date.now() };
    return pools;
  } catch (err) {
    console.warn('Failed to fetch DeFiLlama yields:', err);
    return yieldsCache.data || [];
  }
}

// ── Analysis Utilities ──────────────────────────────────────────────────────

/**
 * Estimate impermanent loss for a given price change
 * @param {number} priceChangeRatio — e.g. 1.5 for 50% increase, 0.7 for 30% decrease
 * @param {number} concentrationFactor — 1 for full range, higher for concentrated
 * @returns {number} IL as a decimal (e.g. 0.05 = 5% loss)
 */
export function estimateImpermanentLoss(priceChangeRatio, concentrationFactor = 1) {
  if (priceChangeRatio <= 0) return 1;
  const sqrtR = Math.sqrt(priceChangeRatio);
  const ilFullRange = 2 * sqrtR / (1 + priceChangeRatio) - 1;
  // Concentrated positions amplify IL roughly proportional to concentration
  return Math.abs(ilFullRange) * Math.min(concentrationFactor, 10);
}

/**
 * Calculate fee APR from pool metrics
 * @returns {number} APR as decimal (e.g. 0.5 = 50%)
 */
export function calculateFeeAPR(volume24h, tvl, feeRate = 0.003) {
  if (!tvl || tvl <= 0) return 0;
  const dailyFees = volume24h * feeRate;
  return (dailyFees / tvl) * 365;
}

/**
 * Score a pool for Agent Squeeze (0-100)
 * Weights: Fee APR (40%), TVL stability (20%), Volume consistency (25%), IL risk (15%)
 */
export function squeezeScore(pool, strategy = 'wide') {
  let score = 0;

  // 1. Fee APR component (40 points max)
  const apr = pool.apr || calculateFeeAPR(pool.volume24h, pool.tvl, pool.baseFee / 100);
  const aprScore = Math.min(apr * 100, 200) / 200 * 40; // Cap at 200% APR
  score += aprScore;

  // 2. TVL stability (20 points) — higher TVL = more stable
  const tvlScore = Math.min(Math.log10(Math.max(pool.tvl, 1)) / 7, 1) * 20; // Log scale, cap at $10M
  score += tvlScore;

  // 3. Volume consistency (25 points) — volume/TVL ratio
  const volTvlRatio = pool.tvl > 0 ? pool.volume24h / pool.tvl : 0;
  const volScore = Math.min(volTvlRatio / 5, 1) * 25; // 5:1 ratio = max score
  score += volScore;

  // 4. IL risk (15 points) — lower bin step = lower IL for concentrated
  const binFactor = pool.binStep || 20;
  let ilScore;
  if (strategy === 'spot') {
    ilScore = (1 - Math.min(binFactor / 100, 1)) * 15; // Tight bins = less IL per bin
  } else if (strategy === 'wide') {
    ilScore = 12; // Wide range = generally low IL
  } else {
    ilScore = 10; // One-sided = moderate
  }
  score += ilScore;

  return Math.round(Math.min(score, 100));
}

/**
 * Get strategy recommendation based on pool characteristics
 */
export function getStrategyRecommendation(pool) {
  const volTvlRatio = pool.tvl > 0 ? pool.volume24h / pool.tvl : 0;

  if (volTvlRatio > 3 && pool.binStep <= 5) {
    return {
      strategy: 'spot',
      label: 'Spot Concentration',
      reasoning: 'High volume/TVL ratio with tight bins — ideal for active management and maximum fee capture.',
      riskLevel: 'High',
      expectedAPR: `${Math.round(calculateFeeAPR(pool.volume24h, pool.tvl, pool.baseFee / 100) * 100)}%+`,
    };
  }

  if (volTvlRatio < 1 || pool.binStep > 20) {
    return {
      strategy: 'wide',
      label: 'Wide Range (Lazy LP)',
      reasoning: 'Moderate volume or wide bin steps — better to set-and-forget with a wide range to minimize rebalancing.',
      riskLevel: 'Low',
      expectedAPR: `${Math.round(calculateFeeAPR(pool.volume24h, pool.tvl, pool.baseFee / 100) * 30)}–${Math.round(calculateFeeAPR(pool.volume24h, pool.tvl, pool.baseFee / 100) * 60)}%`,
    };
  }

  return {
    strategy: 'one-sided',
    label: 'One-Sided LP',
    reasoning: 'Balanced volume with medium bin steps — one-sided entries let you set target prices while earning fees.',
    riskLevel: 'Medium',
    expectedAPR: `${Math.round(calculateFeeAPR(pool.volume24h, pool.tvl, pool.baseFee / 100) * 50)}–${Math.round(calculateFeeAPR(pool.volume24h, pool.tvl, pool.baseFee / 100) * 80)}%`,
  };
}

/**
 * Analyze pools and return top recommendations
 */
export async function analyzePoolsForSqueeze({ pair, strategy, riskTolerance, amount }) {
  const pools = await fetchMeteoraPools();

  // Filter by pair if specified
  let filtered = pools;
  if (pair) {
    const [tokenA, tokenB] = pair.split('/');
    filtered = pools.filter(p => {
      const name = p.name.toUpperCase();
      return name.includes(tokenA.toUpperCase()) && name.includes(tokenB.toUpperCase());
    });
  }

  // Score and sort
  const scored = filtered.map(pool => ({
    ...pool,
    squeezeScore: squeezeScore(pool, strategy),
    recommendation: getStrategyRecommendation(pool),
    estimatedDailyFees: amount ? (pool.tvl > 0 ? (amount / pool.tvl) * pool.fees24h : 0) : null,
    estimatedIL30d: estimateImpermanentLoss(strategy === 'spot' ? 1.1 : 1.2, strategy === 'spot' ? 3 : 1),
  })).sort((a, b) => b.squeezeScore - a.squeezeScore);

  return scored.slice(0, 10); // Top 10
}
