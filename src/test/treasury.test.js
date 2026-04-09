import { describe, it, expect } from 'vitest';
import { INSURANCE_FUND, TREASURY_STRATEGY_SUMMARY, DISTRIBUTION } from '../data/tokenomics';
import { SELF_INSURANCE_FUND, TREASURY_ALLOCATION_DETAIL, TREASURY_STRATEGY, ANTIFRAGILITY_PRINCIPLES } from '../data/treasury';

describe('Insurance Fund (tokenomics.js)', () => {
  it('should allocate 7.5M tokens', () => {
    expect(INSURANCE_FUND.allocation).toBe(7_500_000);
  });

  it('should be 5% of treasury', () => {
    expect(INSURANCE_FUND.pctOfTreasury).toBe(5);
  });

  it('should not exceed treasury allocation', () => {
    const treasuryTokens = DISTRIBUTION.platform.breakdown.find(b => b.label === 'Treasury')?.tokens;
    expect(treasuryTokens).toBeDefined();
    expect(INSURANCE_FUND.allocation).toBeLessThan(treasuryTokens);
  });

  it('should source from treasury', () => {
    expect(INSURANCE_FUND.source).toBe('treasury');
  });
});

describe('Treasury Strategy Summary (tokenomics.js)', () => {
  it('should have yield target', () => {
    expect(TREASURY_STRATEGY_SUMMARY.yieldTarget).toBe('5-7% APY');
  });

  it('should have yield instruments', () => {
    expect(TREASURY_STRATEGY_SUMMARY.yieldInstruments).toContain('Marinade mSOL');
    expect(TREASURY_STRATEGY_SUMMARY.yieldInstruments).toContain('JitoSOL');
  });

  it('should have risk policy', () => {
    expect(TREASURY_STRATEGY_SUMMARY.riskPolicy).toContain('50%');
  });
});

describe('Treasury Allocation Detail (treasury.js)', () => {
  it('should total to 150M tokens', () => {
    const totalTokens = TREASURY_ALLOCATION_DETAIL.breakdown.reduce((sum, b) => sum + b.tokens, 0);
    expect(totalTokens).toBe(150_000_000);
  });

  it('should have percentages summing to 100', () => {
    const totalPct = TREASURY_ALLOCATION_DETAIL.breakdown.reduce((sum, b) => sum + b.pct, 0);
    expect(totalPct).toBe(100);
  });

  it('should match total treasury field', () => {
    expect(TREASURY_ALLOCATION_DETAIL.totalTreasury).toBe(150_000_000);
  });

  it('should have 5 buckets', () => {
    expect(TREASURY_ALLOCATION_DETAIL.breakdown).toHaveLength(5);
  });

  it('each bucket should have label, tokens, pct, and purpose', () => {
    TREASURY_ALLOCATION_DETAIL.breakdown.forEach(bucket => {
      expect(bucket).toHaveProperty('label');
      expect(bucket).toHaveProperty('tokens');
      expect(bucket).toHaveProperty('pct');
      expect(bucket).toHaveProperty('purpose');
      expect(typeof bucket.tokens).toBe('number');
      expect(typeof bucket.pct).toBe('number');
    });
  });
});

describe('Self-Insurance Fund (treasury.js)', () => {
  it('should have trigger events', () => {
    expect(SELF_INSURANCE_FUND.triggerEvents.length).toBeGreaterThan(0);
  });

  it('each trigger should have event, action, and severity', () => {
    SELF_INSURANCE_FUND.triggerEvents.forEach(trigger => {
      expect(trigger).toHaveProperty('event');
      expect(trigger).toHaveProperty('action');
      expect(trigger).toHaveProperty('severity');
      expect(['critical', 'high', 'medium', 'low']).toContain(trigger.severity);
    });
  });
});

describe('Treasury Strategy (treasury.js)', () => {
  it('should have volatility harvesting triggers', () => {
    expect(TREASURY_STRATEGY.volatilityHarvesting.triggers.length).toBeGreaterThan(0);
  });

  it('should limit activations to 4 per year', () => {
    expect(TREASURY_STRATEGY.volatilityHarvesting.maxActivationsPerYear).toBe(4);
  });

  it('should have base yield instruments', () => {
    expect(TREASURY_STRATEGY.baseYield.instruments.length).toBeGreaterThan(0);
  });
});

describe('Antifragility Principles (treasury.js)', () => {
  it('should define 5 principles', () => {
    expect(ANTIFRAGILITY_PRINCIPLES).toHaveLength(5);
  });

  it('each principle should have current and target state', () => {
    ANTIFRAGILITY_PRINCIPLES.forEach(p => {
      expect(p).toHaveProperty('principle');
      expect(p).toHaveProperty('current');
      expect(p).toHaveProperty('target');
    });
  });
});
