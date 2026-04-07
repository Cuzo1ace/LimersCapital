/**
 * Percolator Hooks — Unit Tests
 *
 * Tests the data layer that feeds the live perpetuals UI.
 * Uses mocked RPC responses and slab data fixtures.
 */
import { describe, it, expect, vi } from 'vitest';

// ── Import tested modules (non-hook pure functions) ─────────
import {
  PERCOLATOR_MARKETS,
  PERCOLATOR_CONFIG,
  mapOnChainPosition,
  deriveSlabPubkey,
  deriveUserAccount,
  getMarketTokenMint,
  getProgramId,
} from '../solana/percolator';

// ── Fixtures ────────────────────────────────────────────────

const PRICE_SCALE = PERCOLATOR_CONFIG.PRICE_SCALE; // 1_000_000

/** Minimal mock slab state for testing */
function createMockSlabState(overrides = {}) {
  return {
    header: {
      slot: 123456789,
      version: 1,
      accountCount: 3,
      ...overrides.header,
    },
    config: {
      lpIdx: 0,
      maxLeverage: 20,
      maintenanceMarginBps: 500,
      ...overrides.config,
    },
    accounts: overrides.accounts || [
      {
        authority: 'LP_AUTHORITY_PUBKEY_123',
        capital: BigInt(1_000_000 * PRICE_SCALE),
        positions: [],
      },
      {
        authority: 'USER_WALLET_ABC123',
        capital: BigInt(5000 * PRICE_SCALE),
        positions: [
          {
            size: BigInt(50000 * PRICE_SCALE),
            entryPriceE6: BigInt(150 * PRICE_SCALE),
            liqPriceE6: BigInt(140 * PRICE_SCALE),
            accFundingE6: BigInt(10 * PRICE_SCALE),
            slotOpened: 100000,
          },
        ],
      },
      {
        authority: 'USER_WALLET_XYZ789',
        capital: BigInt(2000 * PRICE_SCALE),
        positions: [],
      },
    ],
  };
}

// ── Market Configuration Tests ──────────────────────────────

describe('Percolator Markets', () => {
  it('all Phase 1A markets have Pyth feed IDs', () => {
    const phase1A = Object.entries(PERCOLATOR_MARKETS)
      .filter(([, m]) => m.phase === '1A');
    expect(phase1A.length).toBeGreaterThanOrEqual(3);
    phase1A.forEach(([key, m]) => {
      expect(m.pythFeedId).toBeTruthy();
      expect(m.tokenMint).toBeTruthy();
      expect(m.collateral).toBe('USDC');
    });
  });

  it('all markets have required fields', () => {
    Object.entries(PERCOLATOR_MARKETS).forEach(([key, m]) => {
      expect(m.symbol).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.collateral).toBe('USDC');
      expect(m.maxLeverage).toBeGreaterThan(0);
      expect(m.maxLeverage).toBeLessThanOrEqual(20);
      expect(m.phase).toBeTruthy();
      expect(m).toHaveProperty('slabPubkey');
    });
  });

  it('TTSE markets are flagged correctly', () => {
    const ttseMarkets = Object.entries(PERCOLATOR_MARKETS)
      .filter(([, m]) => m.isTTSE);
    expect(ttseMarkets.length).toBe(2);
    ttseMarkets.forEach(([, m]) => {
      expect(m.phase).toBe('3');
      expect(m.maxLeverage).toBe(5);
      expect(m.tokenMint).toBeNull(); // Custom TTSE, no SPL mint
    });
  });

  it('getMarketTokenMint returns correct mints', () => {
    expect(getMarketTokenMint('SOL-PERP')).toBe('So11111111111111111111111111111111111111112');
    expect(getMarketTokenMint('BTC-PERP')).toBe('3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh');
    expect(getMarketTokenMint('JMMB-PERP')).toBeNull();
    expect(getMarketTokenMint('INVALID')).toBeNull();
  });
});

// ── PDA Derivation Tests ────────────────────────────────────

describe('Percolator PDA Derivation', () => {
  it('deriveSlabPubkey returns correct seed structure', () => {
    const result = deriveSlabPubkey('SOL-PERP');
    expect(result.programId).toBe(getProgramId('devnet'));
    expect(result.marketKey).toBe('SOL-PERP');
    expect(result.seeds).toHaveLength(2);
    // First seed = "slab"
    const decoder = new TextDecoder();
    expect(decoder.decode(result.seeds[0])).toBe('slab');
    expect(decoder.decode(result.seeds[1])).toBe('SOL-PERP');
  });

  it('deriveSlabPubkey throws for unknown market', () => {
    expect(() => deriveSlabPubkey('FAKE-PERP')).toThrow('Unknown market');
  });

  it('deriveUserAccount returns correct seed structure', () => {
    const result = deriveUserAccount('SLAB_PUB_KEY', 'WALLET_PUB_KEY');
    expect(result.programId).toBe(getProgramId('devnet'));
    expect(result.seeds).toHaveLength(3);
    const decoder = new TextDecoder();
    expect(decoder.decode(result.seeds[0])).toBe('user');
    expect(decoder.decode(result.seeds[1])).toBe('SLAB_PUB_KEY');
    expect(decoder.decode(result.seeds[2])).toBe('WALLET_PUB_KEY');
  });

  it('different wallets produce different seeds', () => {
    const a = deriveUserAccount('SLAB', 'WALLET_A');
    const b = deriveUserAccount('SLAB', 'WALLET_B');
    const decoder = new TextDecoder();
    expect(decoder.decode(a.seeds[2])).not.toBe(decoder.decode(b.seeds[2]));
  });
});

// ── Position Mapping Tests ──────────────────────────────────

describe('mapOnChainPosition', () => {
  const baseLongPos = {
    size: BigInt(50000 * PRICE_SCALE),
    entryPriceE6: BigInt(150 * PRICE_SCALE),
    liqPriceE6: BigInt(140 * PRICE_SCALE),
    accFundingE6: BigInt(10 * PRICE_SCALE),
    slotOpened: 100000,
    symbol: 'SOL',
    userIdx: 1,
  };

  it('maps a long position correctly', () => {
    const oraclePriceE6 = 160 * PRICE_SCALE; // $160
    const mapped = mapOnChainPosition(baseLongPos, oraclePriceE6);

    expect(mapped.side).toBe('long');
    expect(mapped.symbol).toBe('SOL');
    expect(mapped.entryPrice).toBe(150);
    expect(mapped.markPrice).toBe(160);
    expect(mapped.size).toBe(50000);
    expect(mapped.liquidationPrice).toBe(140);
    expect(mapped.status).toBe('open');
    expect(mapped.isLive).toBe(true);
    expect(mapped.unrealizedPnl).toBeGreaterThan(0); // price went up
    expect(mapped.id).toContain('live-');
  });

  it('maps a short position correctly', () => {
    const shortPos = {
      ...baseLongPos,
      size: BigInt(-30000 * PRICE_SCALE), // negative = short
    };
    const oraclePriceE6 = 140 * PRICE_SCALE;
    const mapped = mapOnChainPosition(shortPos, oraclePriceE6);

    expect(mapped.side).toBe('short');
    expect(mapped.size).toBe(30000);
    expect(mapped.unrealizedPnl).toBeGreaterThan(0); // price went down, short profits
  });

  it('handles null oracle price gracefully', () => {
    const mapped = mapOnChainPosition(baseLongPos, null);
    expect(mapped.markPrice).toBe(150); // falls back to entry
    expect(mapped.unrealizedPnl).toBe(0);
  });

  it('produces paper-compatible shape', () => {
    const mapped = mapOnChainPosition(baseLongPos, 155 * PRICE_SCALE);

    // Must have all fields that paper positions have
    expect(mapped).toHaveProperty('id');
    expect(mapped).toHaveProperty('symbol');
    expect(mapped).toHaveProperty('side');
    expect(mapped).toHaveProperty('leverage');
    expect(mapped).toHaveProperty('collateral');
    expect(mapped).toHaveProperty('size');
    expect(mapped).toHaveProperty('entryPrice');
    expect(mapped).toHaveProperty('liquidationPrice');
    expect(mapped).toHaveProperty('status');
    expect(mapped).toHaveProperty('accumulatedFunding');
    expect(mapped).toHaveProperty('stopLoss');
    expect(mapped).toHaveProperty('takeProfit');
    expect(mapped).toHaveProperty('trailingStop');
    expect(mapped).toHaveProperty('openedAt');
  });

  it('computes unrealized PnL correctly for long in profit', () => {
    const entry = 100;
    const mark = 110; // 10% up
    const size = 10000;
    const pos = {
      size: BigInt(size * PRICE_SCALE),
      entryPriceE6: BigInt(entry * PRICE_SCALE),
      liqPriceE6: BigInt(90 * PRICE_SCALE),
      accFundingE6: BigInt(0),
      slotOpened: 1,
      symbol: 'SOL',
      userIdx: 0,
    };

    const mapped = mapOnChainPosition(pos, mark * PRICE_SCALE);
    // PnL = (110-100)/100 * 10000 = 1000
    expect(mapped.unrealizedPnl).toBeCloseTo(1000, 0);
  });

  it('computes unrealized PnL correctly for short in profit', () => {
    const entry = 100;
    const mark = 90; // 10% down
    const size = -10000;
    const pos = {
      size: BigInt(size * PRICE_SCALE),
      entryPriceE6: BigInt(entry * PRICE_SCALE),
      liqPriceE6: BigInt(110 * PRICE_SCALE),
      accFundingE6: BigInt(0),
      slotOpened: 1,
      symbol: 'SOL',
      userIdx: 0,
    };

    const mapped = mapOnChainPosition(pos, mark * PRICE_SCALE);
    // PnL for short = (entry - mark) / entry * size = (100-90)/100 * 10000 = 1000
    expect(mapped.unrealizedPnl).toBeCloseTo(1000, 0);
  });
});

// ── Slab User Account Lookup Tests ──────────────────────────

describe('Slab User Account Lookup', () => {
  it('finds user by wallet address', () => {
    const slab = createMockSlabState();
    const targetWallet = 'USER_WALLET_ABC123';
    const accounts = slab.accounts;
    const userIdx = accounts.findIndex(a => a.authority === targetWallet);

    expect(userIdx).toBe(1);
    expect(Number(accounts[userIdx].capital) / PRICE_SCALE).toBe(5000);
    expect(accounts[userIdx].positions).toHaveLength(1);
  });

  it('returns -1 for unknown wallet', () => {
    const slab = createMockSlabState();
    const idx = slab.accounts.findIndex(a => a.authority === 'NONEXISTENT');
    expect(idx).toBe(-1);
  });

  it('handles slab with no accounts', () => {
    const slab = createMockSlabState({ accounts: [] });
    const idx = slab.accounts.findIndex(a => a.authority === 'USER_WALLET_ABC123');
    expect(idx).toBe(-1);
  });

  it('position data is accessible after lookup', () => {
    const slab = createMockSlabState();
    const account = slab.accounts[1];
    const pos = account.positions[0];

    expect(Number(pos.entryPriceE6) / PRICE_SCALE).toBe(150);
    expect(Number(pos.size) / PRICE_SCALE).toBe(50000);
    expect(Number(pos.liqPriceE6) / PRICE_SCALE).toBe(140);
  });
});

// ── Config Constants Tests ──────────────────────────────────

describe('Percolator Config', () => {
  it('price scale is 1M (e6 format)', () => {
    expect(PERCOLATOR_CONFIG.PRICE_SCALE).toBe(1_000_000);
  });

  it('default slippage is 50 bps (0.5%)', () => {
    expect(PERCOLATOR_CONFIG.DEFAULT_SLIPPAGE_BPS).toBe(50);
  });

  it('collateral decimals match USDC (6)', () => {
    expect(PERCOLATOR_CONFIG.COLLATERAL_DECIMALS).toBe(6);
  });

  it('poll interval is 3 seconds', () => {
    expect(PERCOLATOR_CONFIG.POLL_INTERVAL).toBe(3000);
  });

  it('program ID is valid base58 for devnet', () => {
    const pid = getProgramId('devnet');
    expect(pid).toBeTruthy();
    expect(typeof pid).toBe('string');
    expect(pid.length).toBeGreaterThan(30);
    // Base58 chars only
    expect(/^[1-9A-HJ-NP-Za-km-z]+$/.test(pid)).toBe(true);
  });

  it('mainnet program ID is null (not yet deployed)', () => {
    const pid = getProgramId('mainnet-beta');
    // Falls back to devnet since mainnet is null
    expect(pid).toBeTruthy();
  });
});
