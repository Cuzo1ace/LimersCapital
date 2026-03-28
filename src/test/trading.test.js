/**
 * Trading Engine — Paper Trade, Fee, and Revenue Tests
 *
 * Pure math functions that must match Rust on-chain validation:
 *
 *   pub fn calc_fee(total: u64, fee_rate: u64) -> u64
 *   pub fn split_revenue(fee: u64) -> (u64, u64)  // (community, platform)
 *   pub fn calc_volume_lp(total: u64) -> u64
 */
import { describe, it, expect } from 'vitest';

// ── Pure logic extracted from store — Rust-portable ──────────

const FEE_RATE = 0.003;          // 0.3% per trade
const REVENUE_SPLIT = 0.5;       // 50/50 community/platform
const INITIAL_BALANCE_USD = 100_000;
const INITIAL_BALANCE_TTD = 679_000;

/**
 * Calculate trading fee.
 * Rust: pub fn calc_fee(total: u64) -> u64
 */
function calcFee(total) {
  return Math.abs(total) * FEE_RATE;
}

/**
 * Split fee revenue 50/50.
 * Rust: pub fn split_revenue(fee: u64) -> (u64, u64)
 */
function splitRevenue(fee) {
  return {
    community: fee * REVENUE_SPLIT,
    platform: fee * (1 - REVENUE_SPLIT),
  };
}

/**
 * Calculate LP earned from trade volume.
 * Rust: pub fn calc_volume_lp(total: u64) -> u64
 */
function calcVolumeLp(total) {
  return Math.floor(Math.abs(total) / 100);
}

/**
 * Validate a paper trade can execute.
 * Rust: pub fn validate_trade(balance: u64, total: u64, side: Side) -> Result<()>
 */
function validateTrade(balance, total, side) {
  if (total <= 0) return { error: 'Invalid trade amount' };
  if (side === 'buy' && total > balance) return { error: 'Insufficient balance' };
  return { valid: true };
}

/**
 * Calculate position average price after adding.
 * Rust: pub fn avg_price(existing_qty: u64, existing_avg: u64, new_qty: u64, new_price: u64) -> u64
 */
function avgPrice(existingQty, existingAvg, newQty, newPrice) {
  if (existingQty + newQty === 0) return 0;
  return (existingQty * existingAvg + newQty * newPrice) / (existingQty + newQty);
}

// ── Tests ──────────────────────────────────────────────────

describe('Trading — Fee Calculation', () => {
  it('0.3% fee on $10,000 trade', () => {
    expect(calcFee(10000)).toBe(30);
  });

  it('fee on $1 trade', () => {
    expect(calcFee(1)).toBeCloseTo(0.003, 5);
  });

  it('fee is always positive regardless of sign', () => {
    expect(calcFee(-5000)).toBe(calcFee(5000));
  });

  it('fee on zero is zero', () => {
    expect(calcFee(0)).toBe(0);
  });
});

describe('Trading — Revenue Split', () => {
  it('50/50 split on $30 fee', () => {
    const split = splitRevenue(30);
    expect(split.community).toBe(15);
    expect(split.platform).toBe(15);
  });

  it('community + platform = total fee', () => {
    const fee = 42.5;
    const split = splitRevenue(fee);
    expect(split.community + split.platform).toBeCloseTo(fee, 10);
  });

  it('split handles tiny fees', () => {
    const split = splitRevenue(0.001);
    expect(split.community + split.platform).toBeCloseTo(0.001, 10);
  });
});

describe('Trading — Volume LP', () => {
  it('$100 trade = 1 LP', () => {
    expect(calcVolumeLp(100)).toBe(1);
  });

  it('$10,000 trade = 100 LP', () => {
    expect(calcVolumeLp(10000)).toBe(100);
  });

  it('$50 trade = 0 LP (below threshold)', () => {
    expect(calcVolumeLp(50)).toBe(0);
  });

  it('negative volume treated as absolute', () => {
    expect(calcVolumeLp(-5000)).toBe(50);
  });
});

describe('Trading — Trade Validation', () => {
  it('buy within balance succeeds', () => {
    expect(validateTrade(100000, 50000, 'buy')).toEqual({ valid: true });
  });

  it('buy exceeding balance fails', () => {
    expect(validateTrade(100, 500, 'buy')).toEqual({ error: 'Insufficient balance' });
  });

  it('zero amount fails', () => {
    expect(validateTrade(100000, 0, 'buy')).toEqual({ error: 'Invalid trade amount' });
  });

  it('negative amount fails', () => {
    expect(validateTrade(100000, -100, 'buy')).toEqual({ error: 'Invalid trade amount' });
  });

  it('sell does not check balance (selling holdings)', () => {
    expect(validateTrade(0, 5000, 'sell')).toEqual({ valid: true });
  });
});

describe('Trading — Position Averaging', () => {
  it('initial position: avg = entry price', () => {
    expect(avgPrice(0, 0, 10, 100)).toBe(100);
  });

  it('adding at same price: avg unchanged', () => {
    expect(avgPrice(10, 100, 10, 100)).toBe(100);
  });

  it('adding at higher price: avg increases', () => {
    const avg = avgPrice(10, 100, 10, 200);
    expect(avg).toBe(150);
  });

  it('adding at lower price: avg decreases', () => {
    const avg = avgPrice(10, 100, 10, 50);
    expect(avg).toBe(75);
  });

  it('unequal quantities weighted correctly', () => {
    // 100 shares at $10, add 50 shares at $20
    const avg = avgPrice(100, 10, 50, 20);
    expect(avg).toBeCloseTo(13.33, 1);
  });
});

describe('Trading — Initial Balances', () => {
  it('USD starting balance is $100,000', () => {
    expect(INITIAL_BALANCE_USD).toBe(100_000);
  });

  it('TTD starting balance is TT$679,000 (~$100K USD)', () => {
    expect(INITIAL_BALANCE_TTD).toBe(679_000);
    // At TT$6.79 per USD
    expect(INITIAL_BALANCE_TTD / 6.79).toBeCloseTo(100_000, -2);
  });
});

describe('Trading — Revenue Accumulation', () => {
  it('100 trades at $1000 each generates $300 in fees', () => {
    let totalFees = 0;
    for (let i = 0; i < 100; i++) {
      totalFees += calcFee(1000);
    }
    expect(totalFees).toBeCloseTo(300, 5);
  });

  it('fees split correctly over many trades', () => {
    let communityTotal = 0;
    let platformTotal = 0;
    for (let i = 0; i < 50; i++) {
      const fee = calcFee(2000);
      const split = splitRevenue(fee);
      communityTotal += split.community;
      platformTotal += split.platform;
    }
    expect(communityTotal).toBeCloseTo(platformTotal, 10);
    expect(communityTotal + platformTotal).toBeCloseTo(50 * calcFee(2000), 5);
  });
});
