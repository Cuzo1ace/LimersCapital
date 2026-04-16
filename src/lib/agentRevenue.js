/**
 * Limer's Capital — Agent Layer Revenue Library
 *
 * Pure-computation revenue formulas for Model A (user-rented agents).
 *
 * Tracks build-checklist items B1.2 (AgentConfig type shape) and B1.4
 * (revenue formulas). Zero side effects, zero I/O — safe to import anywhere.
 *
 * All monetary values are in USD unless explicitly noted. All percentages
 * are expressed as 0–100, NOT as decimals (e.g. 15 means 15%, not 0.15).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Formula source: limers-capital-agent-build-spec.md.txt §3.3
 * Reconciled against docs/Limers-Capital-Agent-Layer-Impact-Analysis.md §5
 * ─────────────────────────────────────────────────────────────────────────
 */

import {
  SPOT_FEE_BPS,
  JUPITER_PLATFORM_FEE_BPS,
  AGENT_PERFORMANCE_FEE_PCT,
  bpsToRate,
} from '../constants/fees.js';

// ─────────────────────────────────────────────────────────────────────────
// JSDoc typedefs — informal shape contracts the agent runtime will enforce
// ─────────────────────────────────────────────────────────────────────────

/**
 * @typedef {'scout' | 'trader' | 'alpha' | 'institutional'} AgentTier
 */

/**
 * @typedef {'fiat_rent' | 'limer_stake' | 'hybrid'} AgentAccessMode
 */

/**
 * @typedef {'trend_follow' | 'mean_revert' | 'momentum' | 'hybrid'} AgentStrategy
 */

/**
 * @typedef {'dex_onplatform' | 'jupiter_routing' | 'external_lp' | 'hybrid'} YieldPriority
 */

/**
 * @typedef {Object} AgentConfig
 * @property {string} id                     agent uuid
 * @property {string} userId
 * @property {AgentTier} tier
 * @property {AgentAccessMode} accessMode
 * @property {number} maxPositionSizePct     0–100, % of allocatedAUM per trade
 * @property {number} stopLossPct            hard stop-loss as % drawdown
 * @property {number} takeProfitPct
 * @property {string[]} allowedAssets        e.g. ['SOL', 'USDC', 'JUP']
 * @property {number} maxLeverage            1–5x for perps
 * @property {AgentStrategy} strategy
 * @property {YieldPriority} yieldPriority
 * @property {number} allocatedAUM           USD
 * @property {number} benchmarkYieldPct      user-set hurdle rate, percent
 * @property {number} performanceFeePct      platform cut above benchmark, percent
 * @property {number} monthlyRentUSD         0 if pure limer_stake
 * @property {number} limerStaked            0 if pure fiat_rent
 * @property {'active' | 'paused' | 'terminated'} status
 */

/**
 * @typedef {Object} AgentPerformanceSummary
 * @property {string} agentId
 * @property {number} totalNotionalUSD       monthly trading volume
 * @property {number} totalFeesPaidUSD
 * @property {number} totalPnlUSD
 * @property {number} benchmarkPnlUSD
 * @property {number} alphaPnlUSD            totalPnlUSD - benchmarkPnlUSD
 */

/**
 * @typedef {Object} AgentMonthlyRevenue
 * @property {number} rentRevenue            monthly SaaS line
 * @property {number} tradingFeeRevenue      Jupiter + on-platform routing take
 * @property {number} performanceFeeRevenue  cut of alpha above benchmark
 * @property {number} total
 */

/**
 * @typedef {Object} AgentProjectionInputs
 * @property {number} mau                    monthly active users
 * @property {number} adoptionPct            % of MAU activating an agent, 0–100
 * @property {number} monthlyRentUSD
 * @property {number} avgAUMPerAgent         USD
 * @property {number} velocityMultiplier     monthly volume as multiple of AUM
 * @property {number} performanceFeePct      0–100
 * @property {number} avgAnnualYieldPct      0–100
 */

/**
 * @typedef {Object} AgentProjection
 * @property {number} agentCount
 * @property {number} totalAUM
 * @property {number} rentARR
 * @property {number} tradingFeeARR
 * @property {number} perfFeeARR
 * @property {number} totalARR
 */

// ─────────────────────────────────────────────────────────────────────────
// Yield-routing constants (spec §3.3 hybrid split)
// ─────────────────────────────────────────────────────────────────────────

/** Share of agent volume that routes through the Limer DEX (captures full 25 bps). */
export const YIELD_DEX_SHARE = 0.4;

/** Share of agent volume that routes through Jupiter (captures 15 bps platform fee). */
export const YIELD_JUPITER_SHARE = 0.35;

/** Remainder routes through external LPs where we capture nothing directly. */
export const YIELD_EXTERNAL_SHARE = 0.25;

// ─────────────────────────────────────────────────────────────────────────
// Monthly revenue — per-agent
// ─────────────────────────────────────────────────────────────────────────

/**
 * Calculate platform revenue for one agent over one month.
 *
 * Combines three engines:
 *  1. Rent (SaaS line)
 *  2. Trading-fee amplification (Jupiter + DEX)
 *  3. Performance fee on alpha above benchmark
 *
 * @param {AgentConfig} config
 * @param {AgentPerformanceSummary} summary
 * @returns {AgentMonthlyRevenue}
 */
export function calcAgentMonthlyRevenue(config, summary) {
  if (!config || !summary) {
    throw new Error('calcAgentMonthlyRevenue: config and summary required');
  }

  const rentRevenue = Math.max(0, config.monthlyRentUSD || 0);

  // Trading fee capture uses the hybrid yield split.
  const notional = Math.max(0, summary.totalNotionalUSD || 0);
  const dexFee = notional * YIELD_DEX_SHARE * bpsToRate(SPOT_FEE_BPS);
  const jupFee = notional * YIELD_JUPITER_SHARE * bpsToRate(JUPITER_PLATFORM_FEE_BPS);
  const tradingFeeRevenue = dexFee + jupFee;

  // Performance fee applies only to positive alpha.
  const feePct = typeof config.performanceFeePct === 'number'
    ? config.performanceFeePct
    : AGENT_PERFORMANCE_FEE_PCT;
  const alpha = summary.alphaPnlUSD || 0;
  const performanceFeeRevenue = alpha > 0
    ? alpha * (feePct / 100)
    : 0;

  return {
    rentRevenue,
    tradingFeeRevenue,
    performanceFeeRevenue,
    total: rentRevenue + tradingFeeRevenue + performanceFeeRevenue,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// ARR projections — fleet level
// ─────────────────────────────────────────────────────────────────────────

/**
 * Project annual recurring revenue for an agent fleet given growth assumptions.
 *
 * @param {AgentProjectionInputs} inputs
 * @returns {AgentProjection}
 */
export function projectAgentARR(inputs) {
  if (!inputs) throw new Error('projectAgentARR: inputs required');

  const {
    mau,
    adoptionPct,
    monthlyRentUSD,
    avgAUMPerAgent,
    velocityMultiplier,
    performanceFeePct,
    avgAnnualYieldPct,
  } = inputs;

  const agentCount = Math.max(0, Math.round((mau * adoptionPct) / 100));
  const totalAUM = agentCount * avgAUMPerAgent;
  const monthlyVolume = totalAUM * velocityMultiplier;

  const rentARR = agentCount * monthlyRentUSD * 12;

  const tradingFeeARR =
    (monthlyVolume * YIELD_DEX_SHARE * bpsToRate(SPOT_FEE_BPS) +
      monthlyVolume * YIELD_JUPITER_SHARE * bpsToRate(JUPITER_PLATFORM_FEE_BPS)) *
    12;

  const perfFeeARR =
    totalAUM *
    (avgAnnualYieldPct / 100) *
    (performanceFeePct / 100);

  const totalARR = rentARR + tradingFeeARR + perfFeeARR;

  return {
    agentCount,
    totalAUM,
    rentARR,
    tradingFeeARR,
    perfFeeARR,
    totalARR,
  };
}

/**
 * Apply adversarial haircuts to a base agent projection using the analysis §5.2
 * stress-test scenarios. Each scenario has an annual probability and an FDV
 * (or ARR) impact; this returns the expected-value drag.
 *
 * Pure-computation helper for the sensitivity dashboard. Probabilities are
 * treated as independent (no overlap adjustment) — the caller may apply a
 * further cap if desired.
 *
 * @param {Array<{probability: number, impactUSD: number}>} scenarios
 * @returns {{totalEVImpact: number, scenarioCount: number}}
 */
export function computeStressDrag(scenarios) {
  if (!Array.isArray(scenarios)) return { totalEVImpact: 0, scenarioCount: 0 };
  const totalEVImpact = scenarios.reduce((acc, s) => {
    if (!s || typeof s.probability !== 'number' || typeof s.impactUSD !== 'number') {
      return acc;
    }
    return acc + s.probability * s.impactUSD;
  }, 0);
  return { totalEVImpact, scenarioCount: scenarios.length };
}
