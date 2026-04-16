/**
 * Limer's Capital — $LIMER Token Demand Library
 *
 * Models the token-demand side of the agent access-key question: how much
 * $LIMER gets locked if users choose the staking track instead of (or in
 * addition to) fiat rent, and what that implies for circulating supply
 * compression and FDV support.
 *
 * Tracks build-checklist item B1.6. Pure-computation, zero side effects.
 *
 * Source:
 *  - limers-capital-agent-build-spec.md.txt §6.3, §6.4
 *  - docs/Limers-Capital-Agent-Layer-Impact-Analysis.md §5.3
 *
 * Design notes:
 *  - Staking does NOT spend $LIMER. It locks tokens in a PDA for the
 *    duration of agent activation. Tokens return to the user on deactivate.
 *  - Direct rent ARR goes to zero under pure staking; the trade-off is
 *    locked-supply compression (price support) and adoption uplift from
 *    reduced monthly cash friction.
 *  - The hybrid model is recommended by the analysis because it is the most
 *    resilient across stress-test scenarios.
 */

import {
  AGENT_STAKE_BY_TIER,
  AGENT_RENT_BY_TIER,
} from '../constants/fees.js';
import { projectAgentARR } from './agentRevenue.js';

// ─────────────────────────────────────────────────────────────────────────
// JSDoc typedefs
// ─────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} TierDistribution
 * @property {number} scout           fraction of total agents at scout tier, 0–1
 * @property {number} trader          fraction at trader tier, 0–1
 * @property {number} alpha           fraction at alpha tier, 0–1
 * @property {number} institutional   fraction at institutional tier, 0–1
 */

/**
 * @typedef {Object} LimerDemandInputs
 * @property {number} mau
 * @property {number} adoptionPct               0–100
 * @property {TierDistribution} tierDistribution
 * @property {number} avgLimerPriceUSD
 */

/**
 * @typedef {Object} LimerDemandProjection
 * @property {number} totalAgentsActivated
 * @property {number} avgLimerPerAgent
 * @property {number} totalLimerLocked
 * @property {number} lockedValueUSD
 * @property {Object<string, number>} perTierCount
 */

/** Default distribution used when the caller does not specify one. */
export const DEFAULT_TIER_DISTRIBUTION = Object.freeze({
  scout: 0.6,
  trader: 0.3,
  alpha: 0.08,
  institutional: 0.02,
});

// ─────────────────────────────────────────────────────────────────────────
// Token demand projection
// ─────────────────────────────────────────────────────────────────────────

/**
 * Validate that a tier distribution sums to ~1 (allowing small float error).
 * @param {TierDistribution} dist
 * @returns {boolean}
 */
export function isValidDistribution(dist) {
  if (!dist || typeof dist !== 'object') return false;
  const sum = (dist.scout || 0) + (dist.trader || 0) + (dist.alpha || 0) + (dist.institutional || 0);
  return Math.abs(sum - 1) < 1e-6;
}

/**
 * Project $LIMER locked across the agent fleet under a staking-track model.
 *
 * @param {LimerDemandInputs} inputs
 * @returns {LimerDemandProjection}
 */
export function projectLimerDemand(inputs) {
  if (!inputs) throw new Error('projectLimerDemand: inputs required');

  const {
    mau,
    adoptionPct,
    tierDistribution = DEFAULT_TIER_DISTRIBUTION,
    avgLimerPriceUSD,
  } = inputs;

  if (!isValidDistribution(tierDistribution)) {
    throw new Error(
      'projectLimerDemand: tierDistribution must sum to 1 ' +
        `(got ${JSON.stringify(tierDistribution)})`
    );
  }

  const totalAgents = Math.max(0, Math.round((mau * adoptionPct) / 100));

  const perTierCount = {
    scout: Math.round(totalAgents * tierDistribution.scout),
    trader: Math.round(totalAgents * tierDistribution.trader),
    alpha: Math.round(totalAgents * tierDistribution.alpha),
    institutional: Math.round(totalAgents * tierDistribution.institutional),
  };

  let totalLimerLocked = 0;
  let totalAgentsActivated = 0;
  for (const [tier, count] of Object.entries(perTierCount)) {
    totalLimerLocked += count * (AGENT_STAKE_BY_TIER[tier] || 0);
    totalAgentsActivated += count;
  }

  const avgLimerPerAgent =
    totalAgentsActivated > 0
      ? totalLimerLocked / totalAgentsActivated
      : 0;
  const lockedValueUSD = totalLimerLocked * (avgLimerPriceUSD || 0);

  return {
    totalAgentsActivated,
    avgLimerPerAgent,
    totalLimerLocked,
    lockedValueUSD,
    perTierCount,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Fiat vs staking vs hybrid access-mode comparison
// ─────────────────────────────────────────────────────────────────────────

/**
 * Empirical adoption multiplier when access mode is pure staking vs pure fiat.
 * Reflects the assumption that removing monthly cash friction drives higher
 * signup rates. Spec §6.4 uses 1.4; this module mirrors that.
 */
export const STAKING_ADOPTION_MULTIPLIER = 1.4;

/**
 * Conservative FDV multiplier applied to locked $LIMER value when estimating
 * the token-demand contribution to FDV. 3× means every $1 of locked value
 * implies ~$3 of FDV support from circulating-supply compression.
 * The analysis uses this as a conservative pass-through factor.
 */
export const LOCKED_VALUE_FDV_MULTIPLIER = 3;

/**
 * @typedef {Object} AccessModeComparison
 * @property {Object} fiatModel            result of projectAgentARR in fiat mode
 * @property {Object} stakingModel         result of projectAgentARR in staking mode (rent forced to 0)
 * @property {number} rentARRLost          the rent ARR given up in staking mode
 * @property {number} tradingFeeUplift     extra trading-fee ARR from adoption boost
 * @property {number} perfFeeUplift        extra performance-fee ARR from adoption boost
 * @property {number} netARRDelta          staking − fiat total ARR
 * @property {number} netARRDeltaPct       delta / fiat total ARR * 100
 * @property {LimerDemandProjection} tokenDemand
 * @property {number} tokenDemandFDVUplift lockedValueUSD * LOCKED_VALUE_FDV_MULTIPLIER
 * @property {'limer_staking' | 'hybrid' | 'fiat_rent'} recommendation
 */

/**
 * Compare fiat-rent vs $LIMER-staking access models side-by-side.
 *
 * The staking model loses rent ARR (by design) but gains adoption and
 * (indirectly) locked-value FDV support. The recommendation field suggests
 * which track is most favorable given the net delta.
 *
 * @param {import('./agentRevenue.js').AgentProjectionInputs} fiatParams
 * @param {LimerDemandInputs & import('./agentRevenue.js').AgentProjectionInputs} stakingParams
 * @returns {AccessModeComparison}
 */
export function compareAccessModels(fiatParams, stakingParams) {
  if (!fiatParams || !stakingParams) {
    throw new Error('compareAccessModels: both fiatParams and stakingParams required');
  }

  const fiat = projectAgentARR(fiatParams);

  // Staking: lose rent ARR, gain adoption uplift.
  const stakingAdoptedParams = {
    ...stakingParams,
    adoptionPct: stakingParams.adoptionPct * STAKING_ADOPTION_MULTIPLIER,
    monthlyRentUSD: 0,
  };
  const staking = projectAgentARR(stakingAdoptedParams);

  const rentARRLost = fiat.rentARR;
  const tradingFeeUplift = staking.tradingFeeARR - fiat.tradingFeeARR;
  const perfFeeUplift = staking.perfFeeARR - fiat.perfFeeARR;
  const netARRDelta = -rentARRLost + tradingFeeUplift + perfFeeUplift;
  const netARRDeltaPct =
    fiat.totalARR > 0 ? (netARRDelta / fiat.totalARR) * 100 : 0;

  const tokenDemand = projectLimerDemand(stakingParams);
  const tokenDemandFDVUplift = tokenDemand.lockedValueUSD * LOCKED_VALUE_FDV_MULTIPLIER;

  // Recommendation bands match spec §6.4.
  let recommendation;
  if (netARRDeltaPct > -10) recommendation = 'limer_staking';
  else if (netARRDeltaPct > -25) recommendation = 'hybrid';
  else recommendation = 'fiat_rent';

  return {
    fiatModel: fiat,
    stakingModel: staking,
    rentARRLost,
    tradingFeeUplift,
    perfFeeUplift,
    netARRDelta,
    netARRDeltaPct,
    tokenDemand,
    tokenDemandFDVUplift,
    recommendation,
  };
}

/**
 * Compute the dollar-equivalent rent value at a given $LIMER price for each
 * tier. Useful when the spec flags that tier thresholds should be re-anchored
 * in USD if the token price moves significantly (spec §11 open question 2).
 *
 * @param {number} limerPriceUSD
 * @returns {Object<string, {stakeLimer: number, stakeValueUSD: number, fiatRentUSD: number, payback_months: number}>}
 */
export function tierEconomicsAt(limerPriceUSD) {
  const out = {};
  for (const [tier, stake] of Object.entries(AGENT_STAKE_BY_TIER)) {
    const stakeValueUSD = stake * (limerPriceUSD || 0);
    const fiatRentUSD = AGENT_RENT_BY_TIER[tier] || 0;
    const payback_months =
      fiatRentUSD > 0 ? stakeValueUSD / fiatRentUSD : Infinity;
    out[tier] = {
      stakeLimer: stake,
      stakeValueUSD,
      fiatRentUSD,
      payback_months,
    };
  }
  return out;
}
