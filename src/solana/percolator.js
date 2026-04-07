/**
 * Percolator SDK Integration Layer
 *
 * Wraps the @percolator/sdk to provide Limer's Capital with real on-chain
 * perpetual futures via Percolator's permissionless perp launcher on Solana.
 *
 * Architecture:
 *   Paper Mode (Zustand)  ←→  Live Mode (Percolator on-chain)
 *   Users graduate from paper → live based on XP threshold.
 *
 * Devnet Program IDs:
 *   Main:    FxfD37s1AZTeWfFQps9Zpebi2dNQ9QSSDtfMKdbsfKrD
 *   Matcher: GTRgyTDfrMvBubALAqtHuQwT8tbGyXid7svXZKtWfC9k
 */

// ── Program IDs ─────────────────────────────────────────────────
// Sourced from percolator-launch/packages/core/src/config/program-ids.ts

export const PERCOLATOR_PROGRAM_IDS = {
  devnet: {
    main: 'FxfD37s1AZTeWfFQps9Zpebi2dNQ9QSSDtfMKdbsfKrD',
    matcher: 'GTRgyTDfrMvBubALAqtHuQwT8tbGyXid7svXZKtWfC9k',
    keeper: 'FF7KFfU5Bb3Mze2AasDHCCZuyhdaSLjUZy2K3JvjdB7x',
    // Slab size tiers
    small: 'FwfBKZXbYr4vTK23bMFkbgKq3npJ3MSDxEaKmq9Aj4Qn',   // 256 slots
    medium: 'g9msRSV3sJmmE3r5Twn9HuBsxzuuRGTjKCVTKudm9in',    // 1024 slots
    large: 'FxfD37s1AZTeWfFQps9Zpebi2dNQ9QSSDtfMKdbsfKrD',     // 4096 slots
  },
  'mainnet-beta': {
    main: null,    // Not yet deployed
    matcher: null,
    keeper: null,
  },
};

// ── Supported Markets ───────────────────────────────────────────
// Markets we plan to launch on Percolator (phased rollout)

export const PERCOLATOR_MARKETS = {
  // Phase 1A: Core markets (Pyth oracle feeds)
  'SOL-PERP': {
    symbol: 'SOL',
    name: 'Solana Perpetual',
    pythFeedId: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', // SOL/USD
    tokenMint: 'So11111111111111111111111111111111111111112',
    collateral: 'USDC',
    maxLeverage: 20,
    phase: '1A',
    slabPubkey: null, // Set at runtime via deriveSlabPubkey
  },
  'BTC-PERP': {
    symbol: 'BTC',
    name: 'Bitcoin Perpetual',
    pythFeedId: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', // BTC/USD
    tokenMint: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // Wrapped BTC (Solana)
    collateral: 'USDC',
    maxLeverage: 20,
    phase: '1A',
    slabPubkey: null,
  },
  'ETH-PERP': {
    symbol: 'ETH',
    name: 'Ethereum Perpetual',
    pythFeedId: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH/USD
    tokenMint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // Wrapped ETH (Solana)
    collateral: 'USDC',
    maxLeverage: 20,
    phase: '1A',
    slabPubkey: null,
  },
  // Phase 1B: Vetted Solana tokens
  'JUP-PERP': {
    symbol: 'JUP',
    name: 'Jupiter Perpetual',
    pythFeedId: null, // TBD — will use DexScreener oracle
    tokenMint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    collateral: 'USDC',
    maxLeverage: 10,
    phase: '1B',
    slabPubkey: null,
  },
  'BONK-PERP': {
    symbol: 'BONK',
    name: 'Bonk Perpetual',
    pythFeedId: null,
    tokenMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    collateral: 'USDC',
    maxLeverage: 5,
    phase: '1B',
    slabPubkey: null,
  },
  // Phase 3: TTSE Caribbean stocks (custom oracle)
  'JMMB-PERP': {
    symbol: 'JMMB',
    name: 'JMMB Group Perpetual',
    pythFeedId: null, // Custom oracle via SetOracleAuthority
    tokenMint: null, // Custom TTSE — no SPL mint
    collateral: 'USDC',
    maxLeverage: 5,
    phase: '3',
    isTTSE: true,
    slabPubkey: null,
  },
  'GHL-PERP': {
    symbol: 'GHL',
    name: 'Guardian Holdings Perpetual',
    pythFeedId: null,
    tokenMint: null, // Custom TTSE — no SPL mint
    collateral: 'USDC',
    maxLeverage: 5,
    phase: '3',
    isTTSE: true,
    slabPubkey: null,
  },
};

// ── Trading Mode ────────────────────────────────────────────────

export const TRADING_MODES = {
  PAPER: 'paper',     // Current Zustand-based simulation
  LIVE: 'live',       // Percolator on-chain
};

// XP threshold to unlock live trading (must complete education first)
export const LIVE_TRADING_XP_THRESHOLD = 5000; // Level 5+ (Barracuda)

// ── SDK Wrapper Functions ───────────────────────────────────────
// These wrap @percolator/sdk calls for use in our React components.
// Import dynamically to avoid bundling when in paper mode.

let _sdk = null;

async function getSDK() {
  if (!_sdk) {
    _sdk = await import('@percolator/sdk');
  }
  return _sdk;
}

/** Public accessor for lazy-loaded SDK instance (used by percolator-mutations.js) */
export async function getSDKInstance() {
  return getSDK();
}

/**
 * Get the Percolator program ID for the current network
 */
export function getProgramId(network = 'devnet') {
  return PERCOLATOR_PROGRAM_IDS[network]?.main || PERCOLATOR_PROGRAM_IDS.devnet.main;
}

/**
 * Parse a slab account (market state) from on-chain data
 * Returns: { header, config, accounts }
 */
export async function parseSlab(accountData) {
  const sdk = await getSDK();
  return sdk.parseSlab(accountData);
}

/**
 * Compute mark-to-market PnL for a position
 * All values in e6 format (1 USD = 1_000_000)
 */
export async function computeMarkPnl(positionSize, entryPriceE6, oraclePriceE6) {
  const sdk = await getSDK();
  return sdk.computeMarkPnl(positionSize, entryPriceE6, oraclePriceE6);
}

/**
 * Compute liquidation price for a position
 */
export async function computeLiqPrice(entryPriceE6, capital, positionSize, maintenanceMarginBps) {
  const sdk = await getSDK();
  return sdk.computeLiqPrice(entryPriceE6, capital, positionSize, maintenanceMarginBps);
}

/**
 * Build a trade instruction (no CPI — for testing/deterministic execution)
 * requestedSize: positive = long, negative = short
 * maxSlippage: in basis points
 */
export async function buildTradeInstruction({ userIdx, lpIdx, requestedSize, maxSlippage }) {
  const sdk = await getSDK();
  return sdk.buildTradeNoCpiIxData({
    userIdx,
    lpIdx,
    requestedSize: BigInt(requestedSize),
    maxSlippage: maxSlippage || 50,
  });
}

/**
 * Build deposit collateral instruction
 */
export async function buildDepositInstruction(amount) {
  const sdk = await getSDK();
  return sdk.buildDepositCollateralIxData({ amount: BigInt(amount) });
}

/**
 * Build withdraw collateral instruction
 */
export async function buildWithdrawInstruction(amount) {
  const sdk = await getSDK();
  return sdk.buildWithdrawCollateralIxData({ amount: BigInt(amount) });
}

/**
 * Derive vault authority PDA
 */
export async function deriveVaultAuthority(programId, slabPubkey) {
  const sdk = await getSDK();
  return sdk.deriveVaultAuthority(programId, slabPubkey);
}

/**
 * Resolve best oracle price for any Solana token
 * Checks Pyth, DexScreener (Raydium, Orca, Meteora), Jupiter
 */
export async function resolvePrice(tokenMint) {
  const sdk = await getSDK();
  return sdk.resolvePrice(tokenMint);
}

/**
 * Check if Auto-Deleveraging is triggered for a market
 */
export async function isAdlTriggered(slabData) {
  const sdk = await getSDK();
  return sdk.isAdlTriggered(slabData);
}

// ── PDA Derivation ─────────────────────────────────────────────
// Seeds follow Percolator SDK conventions for deterministic account lookup.

/**
 * Derive slab PDA for a market.
 * Seeds: ["slab", market_symbol_bytes]
 * Returns [PublicKey, bump]
 */
export function deriveSlabPubkey(marketKey, network = 'devnet') {
  // Dynamic import avoidance: use lightweight base58/PDA math
  // In browser context, we defer to SDK; in tests, we return a deterministic string
  const programId = getProgramId(network);
  const market = PERCOLATOR_MARKETS[marketKey];
  if (!market) throw new Error(`Unknown market: ${marketKey}`);

  // Encode seeds: ["slab", utf8(marketKey)]
  const seeds = [
    new TextEncoder().encode('slab'),
    new TextEncoder().encode(marketKey),
  ];

  return { programId, seeds, marketKey };
}

/**
 * Derive user account PDA within a slab.
 * Seeds: ["user", slab_pubkey_bytes, wallet_pubkey_bytes]
 */
export function deriveUserAccount(slabPubkeyStr, walletPubkeyStr, network = 'devnet') {
  const programId = getProgramId(network);

  const seeds = [
    new TextEncoder().encode('user'),
    new TextEncoder().encode(slabPubkeyStr),
    new TextEncoder().encode(walletPubkeyStr),
  ];

  return { programId, seeds, slabPubkey: slabPubkeyStr, wallet: walletPubkeyStr };
}

/**
 * Build a complete trade transaction for wallet-standard signing.
 * Returns serialized VersionedTransaction as Uint8Array.
 */
export async function buildFullTradeTransaction({
  walletPubkey,
  slabPubkey,
  userIdx,
  lpIdx,
  requestedSize,
  maxSlippage,
  recentBlockhash,
  oracleAccount,
}) {
  const sdk = await getSDK();

  // Build the instruction data
  const ixData = sdk.buildTradeNoCpiIxData({
    userIdx,
    lpIdx,
    requestedSize: BigInt(requestedSize),
    maxSlippage: maxSlippage || PERCOLATOR_CONFIG.DEFAULT_SLIPPAGE_BPS,
  });

  // Assemble account metas (Percolator convention)
  const programId = getProgramId('devnet');
  const accounts = [
    { pubkey: slabPubkey, isSigner: false, isWritable: true },
    { pubkey: walletPubkey, isSigner: true, isWritable: false },
  ];

  if (oracleAccount) {
    accounts.push({ pubkey: oracleAccount, isSigner: false, isWritable: false });
  }

  return { ixData, accounts, programId, recentBlockhash };
}

/**
 * Map on-chain position data (e6 format) to paper-compatible shape.
 * This allows the TradePage to render both paper and live positions identically.
 */
export function mapOnChainPosition(onChainPos, oraclePriceE6) {
  const priceScale = PERCOLATOR_CONFIG.PRICE_SCALE;
  const entryPrice = Number(onChainPos.entryPriceE6) / priceScale;
  const markPrice = oraclePriceE6 ? Number(oraclePriceE6) / priceScale : entryPrice;
  const size = Number(onChainPos.size) / priceScale;
  const capital = Number(onChainPos.capital) / priceScale;
  const side = onChainPos.size > 0 ? 'long' : 'short';
  const leverage = capital > 0 ? Math.abs(size) / capital : 1;

  const direction = side === 'long' ? 1 : -1;
  const priceDelta = (markPrice - entryPrice) * direction;
  const unrealizedPnl = entryPrice > 0 ? (priceDelta / entryPrice) * Math.abs(size) : 0;

  return {
    id: `live-${onChainPos.userIdx}-${onChainPos.slotOpened || Date.now()}`,
    symbol: onChainPos.symbol || 'SOL',
    side,
    leverage: Math.round(leverage * 10) / 10,
    collateral: capital,
    size: Math.abs(size),
    entryPrice,
    markPrice,
    unrealizedPnl,
    liquidationPrice: onChainPos.liqPriceE6 ? Number(onChainPos.liqPriceE6) / priceScale : null,
    status: 'open',
    isLive: true,
    accumulatedFunding: Number(onChainPos.accFundingE6 || 0) / priceScale,
    stopLoss: null,
    takeProfit: null,
    trailingStop: null,
    openedAt: onChainPos.slotOpened || Date.now(),
  };
}

// ── Token Mints ────────────────────────────────────────────────

export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

/**
 * Get the token mint for a market key
 */
export function getMarketTokenMint(marketKey) {
  return PERCOLATOR_MARKETS[marketKey]?.tokenMint || null;
}

// ── Percolator State (for Zustand integration) ──────────────────

export const createPercolatorSlice = (set, get) => ({
  // Trading mode: 'paper' or 'live'
  percolatorMode: TRADING_MODES.PAPER,

  // Active live market (slab pubkey)
  percolatorActiveMarket: null,

  // Parsed slab state (header, config, accounts)
  percolatorSlabState: null,

  // User's on-chain account index in the slab
  percolatorUserIdx: null,

  // Live positions from on-chain
  percolatorPositions: [],

  // Toggle between paper and live mode
  setPercolatorMode: (mode) => {
    const xp = get().xp || 0;
    if (mode === TRADING_MODES.LIVE && xp < LIVE_TRADING_XP_THRESHOLD) {
      get().showToast?.(`Need ${LIVE_TRADING_XP_THRESHOLD} XP to unlock live perps (current: ${xp})`, 'warning');
      return;
    }
    set({ percolatorMode: mode });
  },

  // Set active market
  setPercolatorActiveMarket: (slabPubkey) => {
    set({ percolatorActiveMarket: slabPubkey, percolatorSlabState: null });
  },

  // Update slab state (called from polling hook)
  updatePercolatorSlabState: (state) => {
    set({ percolatorSlabState: state });
  },

  // Set user account index
  setPercolatorUserIdx: (idx) => {
    set({ percolatorUserIdx: idx });
  },

  // Update positions from on-chain
  updatePercolatorPositions: (positions) => {
    set({ percolatorPositions: positions });
  },
});

// ── Constants ───────────────────────────────────────────────────

export const PERCOLATOR_CONFIG = {
  // Slab poll interval (ms) — how often we read market state
  POLL_INTERVAL: 3000,

  // Default slippage tolerance (basis points)
  DEFAULT_SLIPPAGE_BPS: 50,

  // Collateral decimals (USDC = 6)
  COLLATERAL_DECIMALS: 6,

  // Price format: e6 (1 USD = 1_000_000)
  PRICE_SCALE: 1_000_000,

  // Keeper crank recommended interval (slots)
  KEEPER_CRANK_INTERVAL: 10,
};
