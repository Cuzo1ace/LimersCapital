/**
 * Agent Layer Revenue — Unit Tests
 *
 * Covers B1.4 (agentRevenue), B1.5 (a2aRevenue), B1.6 (limerDemand), plus the
 * fee-constants module (B1.1). Pure-computation tests — no network, no I/O.
 *
 * Every numeric assertion traces back to either a formula in
 * limers-capital-agent-build-spec.md.txt or a stress-test figure in
 * docs/Limers-Capital-Agent-Layer-Impact-Analysis.md §5.
 */

import { describe, it, expect } from 'vitest';

import {
  SPOT_FEE_BPS,
  PERP_OPEN_BPS,
  PERP_CLOSE_BPS,
  JUPITER_PLATFORM_FEE_BPS,
  A2A_FEE_USD,
  A2A_PLATFORM_TAKE,
  A2A_FEE_TABLE,
  A2A_MAX_CALL_DEPTH,
  A2A_MAX_DAILY_SPEND_USD,
  AGENT_RENT_BY_TIER,
  AGENT_STAKE_BY_TIER,
  AGENT_PERFORMANCE_FEE_PCT,
  CHAMPION_MGMT_FEE_PCT,
  CHAMPION_PERFORMANCE_FEE_PCT,
  CHAMPION_STAKER_SHARE_PCT,
  CHAMPION_PHASE2_AUM_CAP_USD,
  REVENUE_SPLIT,
  STAKER_YIELD_SHARE,
  SIGNAL_AGENT_MODEL_ID,
  AGENT_CONFIDENCE_FLOOR,
  SCOUT_TIER_DAILY_SIGNAL_LIMIT,
  ALPHA_TIER_DAILY_SIGNAL_LIMIT,
  bpsToRate,
  applyBps,
} from '../constants/fees.js';

import {
  YIELD_DEX_SHARE,
  YIELD_JUPITER_SHARE,
  YIELD_EXTERNAL_SHARE,
  calcAgentMonthlyRevenue,
  projectAgentARR,
  computeStressDrag,
} from '../lib/agentRevenue.js';

import {
  computeA2ACallFee,
  splitA2AFee,
  projectA2AARR,
  projectA2AQuadraticARR,
  a2aGrowthCurve,
  validateA2ARequest,
} from '../lib/a2aRevenue.js';

import {
  DEFAULT_TIER_DISTRIBUTION,
  STAKING_ADOPTION_MULTIPLIER,
  LOCKED_VALUE_FDV_MULTIPLIER,
  isValidDistribution,
  projectLimerDemand,
  compareAccessModels,
  tierEconomicsAt,
} from '../lib/limerDemand.js';

// ─────────────────────────────────────────────────────────────────────────
// Constants module
// ─────────────────────────────────────────────────────────────────────────

describe('constants/fees — spot fee reconciliation', () => {
  it('canonical spot fee is 25 bps (0.25%), matching tokenomics.js:62', () => {
    expect(SPOT_FEE_BPS).toBe(25);
  });

  it('bpsToRate converts basis points to decimals', () => {
    expect(bpsToRate(25)).toBe(0.0025);
    expect(bpsToRate(100)).toBe(0.01);
    expect(bpsToRate(0)).toBe(0);
  });

  it('applyBps returns absolute-value fee on $10,000 at 25 bps', () => {
    expect(applyBps(10_000, 25)).toBeCloseTo(25, 10);
    expect(applyBps(-10_000, 25)).toBeCloseTo(25, 10);
  });
});

describe('constants/fees — perp + Jupiter constants', () => {
  it('perp open + close are 10 bps each', () => {
    expect(PERP_OPEN_BPS).toBe(10);
    expect(PERP_CLOSE_BPS).toBe(10);
  });

  it('Jupiter platform fee is 15 bps', () => {
    expect(JUPITER_PLATFORM_FEE_BPS).toBe(15);
  });
});

describe('constants/fees — A2A constants', () => {
  it('default A2A fee is $0.01, platform takes 30%', () => {
    expect(A2A_FEE_USD).toBe(0.01);
    expect(A2A_PLATFORM_TAKE).toBe(0.3);
  });

  it('fee table has all 5 call types', () => {
    expect(Object.keys(A2A_FEE_TABLE).sort()).toEqual(
      [
        'cross_user_coordination',
        'data_fetch',
        'rebalance_trigger',
        'risk_validation',
        'signal_dispatch',
      ].sort()
    );
  });

  it('guardrails: max depth 5, max daily spend $50', () => {
    expect(A2A_MAX_CALL_DEPTH).toBe(5);
    expect(A2A_MAX_DAILY_SPEND_USD).toBe(50);
  });
});

describe('constants/fees — agent tiers', () => {
  it('tier fiat rent matches spec §3.6', () => {
    expect(AGENT_RENT_BY_TIER.scout).toBe(9.99);
    expect(AGENT_RENT_BY_TIER.trader).toBe(24.99);
    expect(AGENT_RENT_BY_TIER.alpha).toBe(74.99);
    expect(AGENT_RENT_BY_TIER.institutional).toBe(299);
  });

  it('tier $LIMER stake requirements match spec §6.2', () => {
    expect(AGENT_STAKE_BY_TIER.scout).toBe(5_000);
    expect(AGENT_STAKE_BY_TIER.trader).toBe(25_000);
    expect(AGENT_STAKE_BY_TIER.alpha).toBe(100_000);
    expect(AGENT_STAKE_BY_TIER.institutional).toBe(500_000);
  });

  it('default performance fee is 15%', () => {
    expect(AGENT_PERFORMANCE_FEE_PCT).toBe(15);
  });
});

describe('constants/fees — champion agent', () => {
  it('1.5% management fee, 20% performance fee, 70% staker share', () => {
    expect(CHAMPION_MGMT_FEE_PCT).toBe(1.5);
    expect(CHAMPION_PERFORMANCE_FEE_PCT).toBe(20);
    expect(CHAMPION_STAKER_SHARE_PCT).toBe(70);
  });

  it('Phase 2 AUM cap is $250K (analysis §6 Sprint 2)', () => {
    expect(CHAMPION_PHASE2_AUM_CAP_USD).toBe(250_000);
  });
});

describe('constants/fees — revenue split + signal agent', () => {
  it('50/50 platform/community split, 70% staker share', () => {
    expect(REVENUE_SPLIT).toBe(0.5);
    expect(STAKER_YIELD_SHARE).toBe(0.7);
  });

  it('signal agent model ID is pinned (analysis §3 Layer 3)', () => {
    expect(SIGNAL_AGENT_MODEL_ID).toBe('claude-sonnet-4-20250514');
  });

  it('confidence floor is 0.6', () => {
    expect(AGENT_CONFIDENCE_FLOOR).toBe(0.6);
  });

  it('tier signal rate limits escalate correctly', () => {
    expect(SCOUT_TIER_DAILY_SIGNAL_LIMIT).toBe(20);
    expect(ALPHA_TIER_DAILY_SIGNAL_LIMIT).toBe(100);
    expect(SCOUT_TIER_DAILY_SIGNAL_LIMIT).toBeLessThan(ALPHA_TIER_DAILY_SIGNAL_LIMIT);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// agentRevenue.js — monthly
// ─────────────────────────────────────────────────────────────────────────

describe('agentRevenue — calcAgentMonthlyRevenue', () => {
  const baseConfig = {
    id: 'a1',
    userId: 'u1',
    tier: 'trader',
    accessMode: 'fiat_rent',
    maxPositionSizePct: 25,
    stopLossPct: 10,
    takeProfitPct: 30,
    allowedAssets: ['SOL', 'USDC'],
    maxLeverage: 1,
    strategy: 'trend_follow',
    yieldPriority: 'hybrid',
    allocatedAUM: 5_000,
    benchmarkYieldPct: 8,
    performanceFeePct: 15,
    monthlyRentUSD: 24.99,
    limerStaked: 0,
    status: 'active',
  };

  const baseSummary = {
    agentId: 'a1',
    totalNotionalUSD: 10_000,
    totalFeesPaidUSD: 0,
    totalPnlUSD: 100,
    benchmarkPnlUSD: 50,
    alphaPnlUSD: 50,
  };

  it('rent line is the monthlyRentUSD from config', () => {
    const r = calcAgentMonthlyRevenue(baseConfig, baseSummary);
    expect(r.rentRevenue).toBe(24.99);
  });

  it('trading fee uses 40% DEX × 25bps + 35% Jupiter × 15bps on notional', () => {
    const r = calcAgentMonthlyRevenue(baseConfig, baseSummary);
    // 10,000 × 0.40 × 0.0025 = 10
    // 10,000 × 0.35 × 0.0015 = 5.25
    // total                  = 15.25
    expect(r.tradingFeeRevenue).toBeCloseTo(15.25, 6);
  });

  it('performance fee is 15% of positive alpha', () => {
    const r = calcAgentMonthlyRevenue(baseConfig, baseSummary);
    expect(r.performanceFeeRevenue).toBeCloseTo(7.5, 6); // 50 × 0.15
  });

  it('performance fee is zero when alpha is negative (no clawback)', () => {
    const r = calcAgentMonthlyRevenue(baseConfig, {
      ...baseSummary,
      alphaPnlUSD: -200,
    });
    expect(r.performanceFeeRevenue).toBe(0);
  });

  it('total = rent + trading + perf', () => {
    const r = calcAgentMonthlyRevenue(baseConfig, baseSummary);
    expect(r.total).toBeCloseTo(
      r.rentRevenue + r.tradingFeeRevenue + r.performanceFeeRevenue,
      10
    );
  });

  it('zero notional → trading fee line is zero', () => {
    const r = calcAgentMonthlyRevenue(baseConfig, {
      ...baseSummary,
      totalNotionalUSD: 0,
    });
    expect(r.tradingFeeRevenue).toBe(0);
  });

  it('staking-only agent (rent=0) still earns trading + perf lines', () => {
    const r = calcAgentMonthlyRevenue(
      { ...baseConfig, monthlyRentUSD: 0, accessMode: 'limer_stake', limerStaked: 25_000 },
      baseSummary
    );
    expect(r.rentRevenue).toBe(0);
    expect(r.tradingFeeRevenue).toBeGreaterThan(0);
    expect(r.performanceFeeRevenue).toBeGreaterThan(0);
  });

  it('throws if config or summary missing', () => {
    expect(() => calcAgentMonthlyRevenue(null, baseSummary)).toThrow();
    expect(() => calcAgentMonthlyRevenue(baseConfig, null)).toThrow();
  });
});

describe('agentRevenue — yield split shares sum to 1', () => {
  it('DEX + Jupiter + External shares = 1.0', () => {
    expect(YIELD_DEX_SHARE + YIELD_JUPITER_SHARE + YIELD_EXTERNAL_SHARE).toBeCloseTo(1, 10);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// agentRevenue.js — projection
// ─────────────────────────────────────────────────────────────────────────

describe('agentRevenue — projectAgentARR (base scenario)', () => {
  // Inputs chosen so the arithmetic is easy to verify by hand.
  const inputs = {
    mau: 10_000,
    adoptionPct: 10, // 1,000 agents
    monthlyRentUSD: 20,
    avgAUMPerAgent: 5_000, // $5M total AUM
    velocityMultiplier: 4, // $20M/month notional
    performanceFeePct: 15,
    avgAnnualYieldPct: 10,
  };

  it('agentCount = mau × adoptionPct / 100', () => {
    const p = projectAgentARR(inputs);
    expect(p.agentCount).toBe(1_000);
  });

  it('totalAUM = agentCount × avgAUMPerAgent', () => {
    const p = projectAgentARR(inputs);
    expect(p.totalAUM).toBe(5_000_000);
  });

  it('rentARR = agents × rent × 12', () => {
    const p = projectAgentARR(inputs);
    expect(p.rentARR).toBe(1_000 * 20 * 12); // 240,000
  });

  it('tradingFeeARR applies hybrid yield split to monthly volume × 12', () => {
    const p = projectAgentARR(inputs);
    // $20M/mo notional × 0.40 × 0.0025 = $20,000/mo
    // $20M/mo notional × 0.35 × 0.0015 = $10,500/mo
    // Monthly fee total ≈ $30,500
    // Annual                                ≈ $366,000
    expect(p.tradingFeeARR).toBeCloseTo(366_000, 0);
  });

  it('perfFeeARR = totalAUM × yield × feePct', () => {
    const p = projectAgentARR(inputs);
    // $5M × 10% × 15% = $75,000
    expect(p.perfFeeARR).toBeCloseTo(75_000, 0);
  });

  it('totalARR = rent + trading + perf', () => {
    const p = projectAgentARR(inputs);
    expect(p.totalARR).toBeCloseTo(p.rentARR + p.tradingFeeARR + p.perfFeeARR, 6);
  });

  it('zero adoption → all revenue lines zero', () => {
    const p = projectAgentARR({ ...inputs, adoptionPct: 0 });
    expect(p.agentCount).toBe(0);
    expect(p.totalAUM).toBe(0);
    expect(p.rentARR).toBe(0);
    expect(p.tradingFeeARR).toBe(0);
    expect(p.perfFeeARR).toBe(0);
    expect(p.totalARR).toBe(0);
  });

  it('throws if inputs missing', () => {
    expect(() => projectAgentARR(null)).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// computeStressDrag — analysis §5.2 stress test
// ─────────────────────────────────────────────────────────────────────────

describe('agentRevenue — computeStressDrag', () => {
  it('matches analysis §5.2 expected-value drag of ~$12.1M', () => {
    const scenarios = [
      { probability: 0.2, impactUSD: 15_000_000 }, // exploit
      { probability: 0.25, impactUSD: 8_000_000 }, // drawdown
      { probability: 0.15, impactUSD: 20_000_000 }, // regulator halt
      { probability: 0.1, impactUSD: 5_000_000 }, // API cost shock
      { probability: 0.3, impactUSD: 12_000_000 }, // $LIMER -70%
    ];
    const drag = computeStressDrag(scenarios);
    expect(drag.scenarioCount).toBe(5);
    // 0.20*15 + 0.25*8 + 0.15*20 + 0.10*5 + 0.30*12 = 12.1  ($M)
    expect(drag.totalEVImpact).toBeCloseTo(12_100_000, 0);
  });

  it('handles empty and invalid input gracefully', () => {
    expect(computeStressDrag([]).totalEVImpact).toBe(0);
    expect(computeStressDrag(null).totalEVImpact).toBe(0);
    expect(computeStressDrag(undefined).totalEVImpact).toBe(0);
  });

  it('skips malformed scenarios', () => {
    const drag = computeStressDrag([
      { probability: 0.5, impactUSD: 1_000 },
      { bad: true },
      null,
      { probability: 0.5, impactUSD: 'oops' },
    ]);
    expect(drag.totalEVImpact).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// a2aRevenue.js
// ─────────────────────────────────────────────────────────────────────────

describe('a2aRevenue — computeA2ACallFee', () => {
  it('normal-priority signal dispatch is $0.01', () => {
    expect(computeA2ACallFee('signal_dispatch', 'normal')).toBe(0.01);
  });

  it('high-priority doubles the fee', () => {
    expect(computeA2ACallFee('signal_dispatch', 'high')).toBeCloseTo(0.02, 10);
    expect(computeA2ACallFee('cross_user_coordination', 'high')).toBeCloseTo(0.05, 10);
  });

  it('defaults to normal priority', () => {
    expect(computeA2ACallFee('risk_validation')).toBe(0.005);
  });

  it('throws on unknown call type', () => {
    expect(() => computeA2ACallFee('bogus')).toThrow();
  });
});

describe('a2aRevenue — splitA2AFee', () => {
  it('30% platform / 70% callee on $0.01', () => {
    const s = splitA2AFee(0.01);
    expect(s.platformCutUSD).toBeCloseTo(0.003, 10);
    expect(s.calleeShareUSD).toBeCloseTo(0.007, 10);
  });

  it('platformCut + calleeShare = gross', () => {
    const gross = 0.42;
    const s = splitA2AFee(gross);
    expect(s.platformCutUSD + s.calleeShareUSD).toBeCloseTo(gross, 10);
  });

  it('clamps negative gross to zero', () => {
    const s = splitA2AFee(-5);
    expect(s.platformCutUSD).toBe(0);
    expect(s.calleeShareUSD).toBe(0);
  });

  it('honors custom take rate', () => {
    const s = splitA2AFee(1, 0.5);
    expect(s.platformCutUSD).toBe(0.5);
    expect(s.calleeShareUSD).toBe(0.5);
  });
});

describe('a2aRevenue — projectA2AARR (linear)', () => {
  it('500 agents × 20 calls/day × $0.01 × 30% = ~$10.95K/year', () => {
    const p = projectA2AARR({
      activeAgents: 500,
      avgCallsPerAgentPerDay: 20,
    });
    // 500 × 20 × 365 = 3,650,000 calls
    // 3,650,000 × $0.01 = $36,500 gross
    // $36,500 × 0.30 = $10,950 platform
    expect(p.annualCalls).toBe(3_650_000);
    expect(p.grossRevenue).toBeCloseTo(36_500, 0);
    expect(p.platformARR).toBeCloseTo(10_950, 0);
  });

  it('cost per agent = platform ARR / agent count', () => {
    const p = projectA2AARR({ activeAgents: 500, avgCallsPerAgentPerDay: 20 });
    expect(p.costPerAgentPerYear).toBeCloseTo(p.platformARR / 500, 6);
  });

  it('zero agents → all zero', () => {
    const p = projectA2AARR({ activeAgents: 0, avgCallsPerAgentPerDay: 50 });
    expect(p.platformARR).toBe(0);
    expect(p.costPerAgentPerYear).toBe(0);
  });

  it('custom fee + take rate overrides defaults', () => {
    const p = projectA2AARR({
      activeAgents: 100,
      avgCallsPerAgentPerDay: 10,
      feePerCallUSD: 0.05,
      platformTakeRate: 0.5,
    });
    // 100 × 10 × 365 × 0.05 × 0.5 = 9,125
    expect(p.platformARR).toBeCloseTo(9_125, 0);
  });
});

describe('a2aRevenue — projectA2AQuadraticARR (analysis §5.4 upside)', () => {
  it('pairwise call pool scales as n(n-1)/2', () => {
    // 500 agents × 499 / 2 = 124,750 unique pairs
    // At 0.02% daily capture → 24.95 pair-calls/day → 9,106 calls/year
    // × $0.01 × 0.30 = $27/year … tiny but the shape is right
    const p = projectA2AQuadraticARR({
      activeAgents: 500,
      dailyPairwiseCaptureRate: 0.0002,
    });
    expect(p.annualCalls).toBeCloseTo(500 * 499 * 0.5 * 0.0002 * 365, 0);
  });

  it('grows super-linearly vs projectA2AARR at same fleet size', () => {
    // At a capture rate that makes small fleets match linear, big fleets blow past.
    const linearSmall = projectA2AARR({ activeAgents: 500, avgCallsPerAgentPerDay: 40 });
    const linearLarge = projectA2AARR({ activeAgents: 5_000, avgCallsPerAgentPerDay: 40 });
    // 10× fleet size → 10× linear revenue
    expect(linearLarge.platformARR / linearSmall.platformARR).toBeCloseTo(10, 1);

    // Quadratic at a fixed capture rate: 10× fleet size → ~100× pairs
    const quadSmall = projectA2AQuadraticARR({
      activeAgents: 500,
      dailyPairwiseCaptureRate: 0.01,
    });
    const quadLarge = projectA2AQuadraticARR({
      activeAgents: 5_000,
      dailyPairwiseCaptureRate: 0.01,
    });
    // pair ratio = (5000*4999)/(500*499) ≈ 100.18
    expect(quadLarge.platformARR / quadSmall.platformARR).toBeGreaterThan(95);
  });

  it('clamps capture rate to [0, 1]', () => {
    const p = projectA2AQuadraticARR({
      activeAgents: 100,
      dailyPairwiseCaptureRate: 5,
    });
    // Clamped to 1.0
    expect(p.annualCalls).toBe((100 * 99 * 0.5) * 1 * 365);
  });

  it('zero fleet → zero revenue', () => {
    const p = projectA2AQuadraticARR({ activeAgents: 0, dailyPairwiseCaptureRate: 0.5 });
    expect(p.platformARR).toBe(0);
  });
});

describe('a2aRevenue — a2aGrowthCurve', () => {
  it('returns one entry per agent count, sorted as input', () => {
    const curve = a2aGrowthCurve([100, 500, 2_000], 20);
    expect(curve).toHaveLength(3);
    expect(curve[0].agents).toBe(100);
    expect(curve[2].agents).toBe(2_000);
  });

  it('monotonically non-decreasing under linear model', () => {
    const curve = a2aGrowthCurve([100, 500, 1_000, 5_000], 20);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].arrK).toBeGreaterThanOrEqual(curve[i - 1].arrK);
    }
  });

  it('empty input returns empty array', () => {
    expect(a2aGrowthCurve([], 20)).toEqual([]);
    expect(a2aGrowthCurve(null, 20)).toEqual([]);
  });
});

describe('a2aRevenue — validateA2ARequest', () => {
  const baseReq = {
    callerId: 'agent_a',
    callType: 'signal_dispatch',
    payload: {},
    maxFeeUSD: 0.02,
    priorityLevel: 'normal',
  };
  const baseCtx = { callerDailySpendUSD: 0, callDepth: 0 };

  it('accepts a valid call', () => {
    expect(validateA2ARequest(baseReq, baseCtx)).toEqual({ ok: true });
  });

  it('rejects missing request or context', () => {
    expect(validateA2ARequest(null, baseCtx).ok).toBe(false);
    expect(validateA2ARequest(baseReq, null).ok).toBe(false);
  });

  it('rejects missing callerId', () => {
    expect(validateA2ARequest({ ...baseReq, callerId: '' }, baseCtx).ok).toBe(false);
  });

  it('rejects unknown call type', () => {
    expect(
      validateA2ARequest({ ...baseReq, callType: 'bogus' }, baseCtx).ok
    ).toBe(false);
  });

  it('rejects when fee exceeds caller max', () => {
    const r = validateA2ARequest(
      { ...baseReq, priorityLevel: 'high', maxFeeUSD: 0.015 },
      baseCtx
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/max/i);
  });

  it('rejects when call depth exceeds A2A_MAX_CALL_DEPTH', () => {
    const r = validateA2ARequest(baseReq, { ...baseCtx, callDepth: A2A_MAX_CALL_DEPTH });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/depth/i);
  });

  it('rejects when daily spend would exceed A2A_MAX_DAILY_SPEND_USD', () => {
    const r = validateA2ARequest(baseReq, {
      ...baseCtx,
      callerDailySpendUSD: A2A_MAX_DAILY_SPEND_USD,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/spend/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// limerDemand.js
// ─────────────────────────────────────────────────────────────────────────

describe('limerDemand — constants + distribution', () => {
  it('default tier distribution sums to 1', () => {
    expect(isValidDistribution(DEFAULT_TIER_DISTRIBUTION)).toBe(true);
  });

  it('isValidDistribution catches malformed input', () => {
    expect(isValidDistribution(null)).toBe(false);
    expect(isValidDistribution({ scout: 0.5, trader: 0.3 })).toBe(false); // missing tiers → sum 0.8
    expect(isValidDistribution({ scout: 0.6, trader: 0.3, alpha: 0.08, institutional: 0.02 })).toBe(true);
  });

  it('STAKING_ADOPTION_MULTIPLIER matches spec §6.4', () => {
    expect(STAKING_ADOPTION_MULTIPLIER).toBeCloseTo(1.4, 10);
  });

  it('LOCKED_VALUE_FDV_MULTIPLIER is conservative 3×', () => {
    expect(LOCKED_VALUE_FDV_MULTIPLIER).toBe(3);
  });
});

describe('limerDemand — projectLimerDemand', () => {
  it('computes locked $LIMER across default distribution', () => {
    const d = projectLimerDemand({
      mau: 10_000,
      adoptionPct: 10, // 1,000 agents
      tierDistribution: DEFAULT_TIER_DISTRIBUTION,
      avgLimerPriceUSD: 0.1,
    });
    // 600 scout × 5K + 300 trader × 25K + 80 alpha × 100K + 20 inst × 500K
    // = 3,000,000 + 7,500,000 + 8,000,000 + 10,000,000 = 28,500,000
    expect(d.totalAgentsActivated).toBe(1_000);
    expect(d.totalLimerLocked).toBe(28_500_000);
    expect(d.lockedValueUSD).toBeCloseTo(28_500_000 * 0.1, 6);
  });

  it('per-tier count rounds to integers', () => {
    const d = projectLimerDemand({
      mau: 10_000,
      adoptionPct: 10,
      avgLimerPriceUSD: 0.1,
    });
    expect(d.perTierCount.scout).toBe(600);
    expect(d.perTierCount.trader).toBe(300);
    expect(d.perTierCount.alpha).toBe(80);
    expect(d.perTierCount.institutional).toBe(20);
  });

  it('throws on invalid distribution', () => {
    expect(() =>
      projectLimerDemand({
        mau: 1000,
        adoptionPct: 10,
        tierDistribution: { scout: 0.5, trader: 0.5, alpha: 0.5, institutional: 0.5 },
        avgLimerPriceUSD: 0.1,
      })
    ).toThrow();
  });

  it('zero adoption → empty projection', () => {
    const d = projectLimerDemand({
      mau: 10_000,
      adoptionPct: 0,
      avgLimerPriceUSD: 0.1,
    });
    expect(d.totalAgentsActivated).toBe(0);
    expect(d.totalLimerLocked).toBe(0);
    expect(d.lockedValueUSD).toBe(0);
  });
});

describe('limerDemand — compareAccessModels', () => {
  const fiatParams = {
    mau: 10_000,
    adoptionPct: 10,
    monthlyRentUSD: 20,
    avgAUMPerAgent: 5_000,
    velocityMultiplier: 4,
    performanceFeePct: 15,
    avgAnnualYieldPct: 10,
  };

  const stakingParams = {
    ...fiatParams,
    tierDistribution: DEFAULT_TIER_DISTRIBUTION,
    avgLimerPriceUSD: 0.1,
  };

  it('staking model loses rent ARR but gains trading + perf from adoption uplift', () => {
    const c = compareAccessModels(fiatParams, stakingParams);
    expect(c.rentARRLost).toBeGreaterThan(0);
    expect(c.tradingFeeUplift).toBeGreaterThan(0);
    expect(c.perfFeeUplift).toBeGreaterThan(0);
  });

  it('netARRDelta = -rentLost + tradingUplift + perfUplift', () => {
    const c = compareAccessModels(fiatParams, stakingParams);
    expect(c.netARRDelta).toBeCloseTo(
      -c.rentARRLost + c.tradingFeeUplift + c.perfFeeUplift,
      6
    );
  });

  it('tokenDemandFDVUplift = lockedValueUSD × 3', () => {
    const c = compareAccessModels(fiatParams, stakingParams);
    expect(c.tokenDemandFDVUplift).toBeCloseTo(
      c.tokenDemand.lockedValueUSD * LOCKED_VALUE_FDV_MULTIPLIER,
      6
    );
  });

  it('returns a recommendation string', () => {
    const c = compareAccessModels(fiatParams, stakingParams);
    expect(['limer_staking', 'hybrid', 'fiat_rent']).toContain(c.recommendation);
  });

  it('throws if either input missing', () => {
    expect(() => compareAccessModels(null, stakingParams)).toThrow();
    expect(() => compareAccessModels(fiatParams, null)).toThrow();
  });
});

describe('limerDemand — tierEconomicsAt', () => {
  it('at $0.10 $LIMER, Scout stake value is $500 (vs $9.99/mo rent)', () => {
    const e = tierEconomicsAt(0.1);
    expect(e.scout.stakeValueUSD).toBeCloseTo(500, 6);
    expect(e.scout.fiatRentUSD).toBe(9.99);
    // 500 / 9.99 ≈ 50.05 months
    expect(e.scout.payback_months).toBeCloseTo(50.05, 1);
  });

  it('at $0 $LIMER, payback_months is 0', () => {
    const e = tierEconomicsAt(0);
    expect(e.scout.stakeValueUSD).toBe(0);
    expect(e.scout.payback_months).toBe(0);
  });

  it('returns an entry for every tier', () => {
    const e = tierEconomicsAt(0.1);
    expect(Object.keys(e).sort()).toEqual(
      ['alpha', 'institutional', 'scout', 'trader'].sort()
    );
  });
});
