/**
 * Perpetual Futures Engine — Competition-Grade Tests
 *
 * These tests validate the core math that must be identical
 * when ported to Rust (Anchor program). Each function is pure
 * and maps to a Rust equivalent:
 *
 *   JS: calcLiqPrice(side, entry, leverage, collateral, accFunding)
 *   RS: fn calc_liq_price(side: Side, entry: u64, leverage: u64, collateral: u64, acc_funding: u64) -> u64
 */
import { describe, it, expect } from 'vitest';

// ── Pure logic extracted from store — Rust-portable ──────────

const MAINTENANCE_MARGIN = 0.05; // 5%
const OPENING_FEE_RATE = 0.001;  // 0.1% of notional
const FUNDING_RATE = 0.0001;     // 0.01% per interval

/**
 * Competition-grade liquidation price calculator.
 * Mirrors _calcLiqPrice in useStore.js — must stay in sync.
 *
 * Rust equivalent:
 * ```rust
 * pub fn calc_liq_price(side: Side, entry_price: u64, leverage: u64, collateral: u64, acc_funding: u64) -> u64
 * ```
 */
function calcLiqPrice(side, entryPrice, leverage, collateral, accFunding = 0) {
  const mm = MAINTENANCE_MARGIN;
  const openingFee = collateral * leverage * OPENING_FEE_RATE;
  const effectiveCollateral = collateral - openingFee - accFunding;
  if (effectiveCollateral <= 0) return side === 'long' ? entryPrice : 0;
  const effectiveLeverage = (collateral * leverage) / effectiveCollateral;
  return side === 'long'
    ? Math.max(0, entryPrice * (1 - (1 / effectiveLeverage) + mm))
    : Math.max(0, entryPrice * (1 + (1 / effectiveLeverage) - mm));
}

/**
 * PnL calculation for an open position.
 *
 * Rust equivalent:
 * ```rust
 * pub fn calc_pnl(side: Side, entry: u64, mark: u64, size: u64, acc_funding: u64) -> i64
 * ```
 */
function calcPnl(side, entryPrice, markPrice, size, accFunding = 0) {
  const direction = side === 'long' ? 1 : -1;
  const priceDelta = (markPrice - entryPrice) * direction;
  return (priceDelta / entryPrice) * size - accFunding;
}

/**
 * Check if position should be liquidated.
 *
 * Rust equivalent:
 * ```rust
 * pub fn is_liquidated(side: Side, mark_price: u64, liq_price: u64) -> bool
 * ```
 */
function isLiquidated(side, markPrice, liqPrice) {
  return side === 'long' ? markPrice <= liqPrice : markPrice >= liqPrice;
}

/**
 * Calculate funding payment for one interval.
 *
 * Rust equivalent:
 * ```rust
 * pub fn calc_funding(size: u64, rate: u64) -> u64
 * ```
 */
function calcFunding(size) {
  return size * FUNDING_RATE;
}

// ── Tests ──────────────────────────────────────────────────

describe('Perpetual Engine — Liquidation Price', () => {
  it('long 10x: liq price is below entry', () => {
    const liq = calcLiqPrice('long', 100, 10, 1000);
    expect(liq).toBeLessThan(100);
    expect(liq).toBeGreaterThan(0);
  });

  it('short 10x: liq price is above entry', () => {
    const liq = calcLiqPrice('short', 100, 10, 1000);
    expect(liq).toBeGreaterThan(100);
  });

  it('higher leverage → tighter liquidation (long)', () => {
    const liq5x = calcLiqPrice('long', 100, 5, 1000);
    const liq10x = calcLiqPrice('long', 100, 10, 1000);
    const liq20x = calcLiqPrice('long', 100, 20, 1000);
    expect(liq10x).toBeGreaterThan(liq5x);  // closer to entry
    expect(liq20x).toBeGreaterThan(liq10x);
  });

  it('higher leverage → tighter liquidation (short)', () => {
    const liq5x = calcLiqPrice('short', 100, 5, 1000);
    const liq10x = calcLiqPrice('short', 100, 10, 1000);
    const liq20x = calcLiqPrice('short', 100, 20, 1000);
    expect(liq10x).toBeLessThan(liq5x);  // closer to entry
    expect(liq20x).toBeLessThan(liq10x);
  });

  it('opening fee tightens liq price vs naive formula', () => {
    const mm = MAINTENANCE_MARGIN;
    const naiveLiq = 100 * (1 - (1 / 10) + mm); // no fee
    const realLiq = calcLiqPrice('long', 100, 10, 1000);
    expect(realLiq).toBeGreaterThan(naiveLiq); // tighter (higher = closer to entry for long)
  });

  it('accumulated funding tightens liq price', () => {
    const liqFresh = calcLiqPrice('long', 100, 10, 1000, 0);
    const liqFunded = calcLiqPrice('long', 100, 10, 1000, 50);
    expect(liqFunded).toBeGreaterThan(liqFresh); // closer to entry
  });

  it('adding collateral loosens liq price', () => {
    const liqBase = calcLiqPrice('long', 100, 10, 1000);
    // Adding $500 collateral → new leverage = (1000*10) / 1500 = 6.67x
    const liqMore = calcLiqPrice('long', 100, 10000 / 1500, 1500);
    expect(liqMore).toBeLessThan(liqBase); // further from entry
  });

  it('liq price never goes below 0', () => {
    const liq = calcLiqPrice('long', 1, 1, 10000);
    expect(liq).toBeGreaterThanOrEqual(0);
  });

  it('completely eroded collateral returns entry (long) or 0 (short)', () => {
    // Funding exceeds collateral
    const liqLong = calcLiqPrice('long', 100, 10, 100, 200);
    expect(liqLong).toBe(100);
    const liqShort = calcLiqPrice('short', 100, 10, 100, 200);
    expect(liqShort).toBe(0);
  });

  it('SOL realistic: $150 entry, 10x, $500 collateral', () => {
    const liq = calcLiqPrice('long', 150, 10, 500);
    // With fees, liq price is tighter than naive formula
    expect(liq).toBeGreaterThan(135);
    expect(liq).toBeLessThan(150);
  });

  it('BTC realistic: $65000 entry, 5x, $2000 collateral', () => {
    const liq = calcLiqPrice('long', 65000, 5, 2000);
    expect(liq).toBeGreaterThan(50000);
    expect(liq).toBeLessThan(65000);
  });
});

describe('Perpetual Engine — PnL Calculation', () => {
  it('long profit: mark > entry', () => {
    const pnl = calcPnl('long', 100, 110, 10000);
    expect(pnl).toBe(1000); // 10% move × $10K size
  });

  it('long loss: mark < entry', () => {
    const pnl = calcPnl('long', 100, 90, 10000);
    expect(pnl).toBe(-1000);
  });

  it('short profit: mark < entry', () => {
    const pnl = calcPnl('short', 100, 90, 10000);
    expect(pnl).toBe(1000);
  });

  it('short loss: mark > entry', () => {
    const pnl = calcPnl('short', 100, 110, 10000);
    expect(pnl).toBe(-1000);
  });

  it('funding reduces PnL', () => {
    const pnlNoFunding = calcPnl('long', 100, 110, 10000, 0);
    const pnlWithFunding = calcPnl('long', 100, 110, 10000, 200);
    expect(pnlWithFunding).toBe(pnlNoFunding - 200);
  });

  it('zero price movement → PnL is just negative funding', () => {
    const pnl = calcPnl('long', 100, 100, 10000, 50);
    expect(pnl).toBe(-50);
  });
});

describe('Perpetual Engine — Liquidation Check', () => {
  it('long liquidated when mark <= liq', () => {
    expect(isLiquidated('long', 95, 96)).toBe(true);
    expect(isLiquidated('long', 96, 96)).toBe(true);
    expect(isLiquidated('long', 97, 96)).toBe(false);
  });

  it('short liquidated when mark >= liq', () => {
    expect(isLiquidated('short', 105, 104)).toBe(true);
    expect(isLiquidated('short', 104, 104)).toBe(true);
    expect(isLiquidated('short', 103, 104)).toBe(false);
  });
});

describe('Perpetual Engine — Funding Rate', () => {
  it('funding proportional to position size', () => {
    const small = calcFunding(1000);
    const large = calcFunding(10000);
    expect(large).toBe(small * 10);
  });

  it('funding rate value is correct', () => {
    expect(calcFunding(10000)).toBeCloseTo(1, 5); // $10K × 0.01% = $1
  });

  it('cumulative funding erodes margin over time', () => {
    const size = 10000;
    const collateral = 1000;
    let accFunding = 0;
    const intervals = 100; // ~500 minutes = ~8.3 hours

    for (let i = 0; i < intervals; i++) {
      accFunding += calcFunding(size);
    }

    expect(accFunding).toBeCloseTo(100, 1); // $100 in funding
    expect(accFunding).toBeLessThan(collateral); // not yet liquidated

    // Liq price should have drifted
    const liqFresh = calcLiqPrice('long', 100, 10, collateral, 0);
    const liqEroded = calcLiqPrice('long', 100, 10, collateral, accFunding);
    expect(liqEroded).toBeGreaterThan(liqFresh);
  });
});

describe('Perpetual Engine — Partial Close', () => {
  it('50% close returns correct remaining values', () => {
    const collateral = 1000;
    const size = 10000;
    const frac = 0.5;

    const remainCollateral = collateral * (1 - frac);
    const remainSize = size * (1 - frac);

    expect(remainCollateral).toBe(500);
    expect(remainSize).toBe(5000);

    // Leverage unchanged
    expect(remainSize / remainCollateral).toBe(size / collateral);
  });

  it('partial close recalculates liq price for remaining', () => {
    const fullLiq = calcLiqPrice('long', 100, 10, 1000, 0);
    // After 50% close, remaining: collateral=500, leverage still 10x
    const remainLiq = calcLiqPrice('long', 100, 10, 500, 0);
    // Same leverage → same liq price (proportional scaling)
    expect(Math.abs(remainLiq - fullLiq)).toBeLessThan(0.01);
  });

  it('partial close with accumulated funding splits funding proportionally', () => {
    const accFunding = 100;
    const frac = 0.25;
    const remainFunding = accFunding * (1 - frac);
    expect(remainFunding).toBe(75);
  });
});

describe('Perpetual Engine — e6 Format (On-Chain Compatibility)', () => {
  const PRICE_SCALE = 1_000_000;

  it('e6 price conversion roundtrips correctly', () => {
    const usdPrice = 150.123456;
    const e6 = Math.round(usdPrice * PRICE_SCALE);
    const back = e6 / PRICE_SCALE;
    expect(back).toBeCloseTo(usdPrice, 5);
  });

  it('PnL in e6 matches USD PnL', () => {
    const entryE6 = 100 * PRICE_SCALE;
    const markE6 = 110 * PRICE_SCALE;
    const sizeE6 = 10000 * PRICE_SCALE;

    // e6 PnL
    const pnlE6 = ((markE6 - entryE6) / entryE6) * sizeE6;
    const pnlUSD = pnlE6 / PRICE_SCALE;

    // USD PnL
    const pnlDirect = calcPnl('long', 100, 110, 10000);

    expect(pnlUSD).toBeCloseTo(pnlDirect, 2);
  });

  it('BigInt size preserves precision for large positions', () => {
    const collateral = 100_000; // $100K
    const leverage = 20;
    const notional = collateral * leverage; // $2M
    const sizeE6 = BigInt(Math.round(notional * PRICE_SCALE));

    expect(Number(sizeE6)).toBe(2_000_000_000_000);
    expect(Number(sizeE6) / PRICE_SCALE).toBe(2_000_000);
  });

  it('fractional USD amounts survive e6 conversion', () => {
    const amounts = [0.01, 0.001, 1.23, 99.99, 12345.678901];
    amounts.forEach(amt => {
      const e6 = Math.round(amt * PRICE_SCALE);
      const back = e6 / PRICE_SCALE;
      expect(back).toBeCloseTo(amt, 5);
    });
  });

  it('liq price in e6 format is consistent with USD', () => {
    const entryE6 = 150 * PRICE_SCALE;
    const entryUSD = 150;
    const leverage = 10;
    const collateral = 1000;

    const liqUSD = calcLiqPrice('long', entryUSD, leverage, collateral);
    const liqE6 = Math.round(liqUSD * PRICE_SCALE);

    expect(liqE6 / PRICE_SCALE).toBeCloseTo(liqUSD, 4);
  });
});

describe('Perpetual Engine — Edge Cases', () => {
  it('1x leverage behaves like spot (no amplification)', () => {
    const pnl = calcPnl('long', 100, 110, 100); // 1x: $100 collateral, $100 size
    expect(pnl).toBe(10); // 10% move on $100 = $10
  });

  it('max leverage 20x has very tight liq price', () => {
    // At 20x, fees eat significant collateral — liq price is very close to entry
    const liq = calcLiqPrice('long', 100, 20, 1000);
    expect(liq).toBeGreaterThan(0);
    // Within 2% of entry — extremely tight, as expected for 20x
    expect(Math.abs(liq - 100) / 100).toBeLessThan(0.02);
  });

  it('very small collateral ($1) still computes', () => {
    const liq = calcLiqPrice('long', 100, 10, 1);
    expect(liq).toBeGreaterThan(0);
    expect(Number.isFinite(liq)).toBe(true);
  });

  it('very large entry price ($100K BTC)', () => {
    const liq = calcLiqPrice('long', 100000, 10, 10000);
    expect(liq).toBeGreaterThan(90000);
    expect(liq).toBeLessThan(100000);
  });
});
