/**
 * Limer's Capital — Central Fee Constants
 *
 * Single source of truth for every basis-point and USD constant used by the
 * trading engine, agent layer, and revenue projection libraries. Reference
 * this file from code instead of hardcoding numbers inline.
 *
 * Tracks agent-layer build-checklist item B1.1 and revenue-model reconciliation
 * item B0.6 (0.25% vs 0.3% spot-fee reconciliation).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Reconciliation note — spot fee
 * ─────────────────────────────────────────────────────────────────────────
 * `src/data/tokenomics.js:62` ships the user-facing fee as 0.25% ("Spot
 * Trading Fees (0.25%)"). `docs/Limers-Capital-Revenue-Model-Analysis.md`
 * also models 0.25%. The legacy value in `src/test/trading.test.js:14`
 * (`FEE_RATE = 0.003` / 0.3%) predates both and should be migrated to
 * reference `SPOT_FEE_BPS` from this module in a follow-up PR.
 *
 * The canonical value is 0.25% (25 bps). New code must import from here.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Existing trading fees ───────────────────────────────────────────────────

/** Spot trading fee in basis points (25 = 0.25%). Canonical. */
export const SPOT_FEE_BPS = 25;

/** Perpetual open fee in basis points (10 = 0.1%). */
export const PERP_OPEN_BPS = 10;

/** Perpetual close fee in basis points (10 = 0.1%). */
export const PERP_CLOSE_BPS = 10;

// ── R1 — Jupiter platform fee (agent-layer prerequisite) ───────────────────

/**
 * Jupiter `platformFeeBps` parameter captured on Real Swap LIVE routes.
 * Median Solana integrator fee (below Coinbase, above Hyperliquid).
 * Gated on KYC integration (audit H-03) before going live on mainnet.
 */
export const JUPITER_PLATFORM_FEE_BPS = 15;

// ── A2A — Agent-to-agent orchestration ─────────────────────────────────────

/** Default per-call fee for agent-to-agent dispatches, in USD. */
export const A2A_FEE_USD = 0.01;

/** Platform's share of every A2A call fee (30%). */
export const A2A_PLATFORM_TAKE = 0.3;

/** Hard ceiling on recursive A2A call depth — defends against fee draining. */
export const A2A_MAX_CALL_DEPTH = 5;

/** Max daily spend per agent on A2A calls, in USD. */
export const A2A_MAX_DAILY_SPEND_USD = 50;

/**
 * Per-call-type fee table. Override `A2A_FEE_USD` for specific call types.
 * Values in USD per call. Platform keeps 30%; callee earns 70%.
 */
export const A2A_FEE_TABLE = {
  signal_dispatch: 0.01,
  risk_validation: 0.005,
  data_fetch: 0.003,
  rebalance_trigger: 0.015,
  cross_user_coordination: 0.025,
};

// ── Model A — Rented agent monthly rent (fiat tiers) ───────────────────────

/** Default monthly rent if a tier is not explicitly specified, in USD. */
export const AGENT_RENT_USD = 20;

/** Tier → monthly rent mapping, USD. */
export const AGENT_RENT_BY_TIER = {
  scout: 9.99,
  trader: 24.99,
  alpha: 74.99,
  institutional: 299,
};

/** Tier → $LIMER staking requirement (alternative to fiat rent). */
export const AGENT_STAKE_BY_TIER = {
  scout: 5_000,
  trader: 25_000,
  alpha: 100_000,
  institutional: 500_000,
};

/**
 * Default performance-fee percentage the platform takes on alpha generated
 * above a user-defined benchmark. Applied to positive alphaPnlUSD only.
 */
export const AGENT_PERFORMANCE_FEE_PCT = 15;

// ── Model B — Champion agent ───────────────────────────────────────────────

/** Annual management fee on champion-agent AUM, as a percentage. */
export const CHAMPION_MGMT_FEE_PCT = 1.5;

/** Platform's cut of champion-agent alpha above benchmark, as a percentage. */
export const CHAMPION_PERFORMANCE_FEE_PCT = 20;

/** Percentage of champion-agent net yield distributed to $LIMER stakers. */
export const CHAMPION_STAKER_SHARE_PCT = 70;

/** Phase 2 AUM cap in USD — do not exceed before Phase 3 legal clearance. */
export const CHAMPION_PHASE2_AUM_CAP_USD = 250_000;

// ── Revenue distribution (existing, mirrored from tokenomics.js) ───────────

/** Platform share of collected revenue (50/50 split with community). */
export const REVENUE_SPLIT = 0.5;

/** Portion of the community share paid to stakers (remainder goes to LP). */
export const STAKER_YIELD_SHARE = 0.7;

// ── Model pinning (analysis §3 Layer 3) ────────────────────────────────────

/**
 * Pinned Anthropic model ID for the signal agent. Do not silent-upgrade —
 * model behavior drifts across versions and the agent risk profile drifts
 * with it. Changing this value requires a release with before/after signal
 * distribution testing.
 */
export const SIGNAL_AGENT_MODEL_ID = 'claude-sonnet-4-20250514';

// ── Risk parameter defaults (Layer 1 / Layer 2 guardrails) ─────────────────

/** Default max drawdown before agent auto-pauses (percent of high-water). */
export const AGENT_MAX_DRAWDOWN_PCT = 20;

/** Minimum signal confidence below which the RiskAgent forces HOLD. */
export const AGENT_CONFIDENCE_FLOOR = 0.6;

/** Number of consecutive low-confidence signals before manual-review mode. */
export const AGENT_CONFIDENCE_STREAK_LIMIT = 5;

/** Default session key validity (hours) for non-custodial delegation. */
export const SESSION_KEY_VALIDITY_HOURS = 24;

/** Scout tier signal rate limit (calls/day/agent). */
export const SCOUT_TIER_DAILY_SIGNAL_LIMIT = 20;

/** Trader tier signal rate limit (calls/day/agent). */
export const TRADER_TIER_DAILY_SIGNAL_LIMIT = 50;

/** Alpha tier signal rate limit (calls/day/agent). */
export const ALPHA_TIER_DAILY_SIGNAL_LIMIT = 100;

// ── Convenience helpers ────────────────────────────────────────────────────

/**
 * Convert a basis-point value to a decimal rate.
 * Example: bpsToRate(25) === 0.0025
 * @param {number} bps
 * @returns {number}
 */
export function bpsToRate(bps) {
  return bps / 10_000;
}

/**
 * Apply a basis-point fee to a notional amount.
 * @param {number} notional
 * @param {number} bps
 * @returns {number}
 */
export function applyBps(notional, bps) {
  return Math.abs(notional) * bpsToRate(bps);
}
