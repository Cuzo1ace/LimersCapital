/**
 * Limer's Capital — Agent-to-Agent (A2A) Revenue Library
 *
 * Pure-computation revenue formulas for the A2A orchestration toll engine
 * (Model A2A — the fifth revenue stream). Separated from `agentRevenue.js`
 * because A2A is a distinct infrastructure line with different unit economics
 * (infrastructure rent, 20–30× VC multiple) that analysis §2.4 identifies as
 * the most durable moat in the proposal.
 *
 * Tracks build-checklist items B1.3 (A2A type shapes) and B1.5 (A2A formulas).
 *
 * Source: limers-capital-agent-build-spec.md.txt §5.3
 * Analysis: docs/Limers-Capital-Agent-Layer-Impact-Analysis.md §5.4 (quadratic
 *           growth sensitivity — the quadratic-aware model is the upside case).
 */

import {
  A2A_FEE_USD,
  A2A_PLATFORM_TAKE,
  A2A_FEE_TABLE,
  A2A_MAX_CALL_DEPTH,
  A2A_MAX_DAILY_SPEND_USD,
} from '../constants/fees.js';

// ─────────────────────────────────────────────────────────────────────────
// JSDoc typedefs
// ─────────────────────────────────────────────────────────────────────────

/**
 * @typedef {'signal_dispatch' | 'risk_validation' | 'data_fetch' | 'rebalance_trigger' | 'cross_user_coordination'} A2ACallType
 */

/**
 * @typedef {Object} A2ACallRequest
 * @property {string} callerId            agent uuid of the caller
 * @property {A2ACallType} callType
 * @property {string} [calleeId]          specific callee, or omit for platform routing
 * @property {Object} payload             arbitrary typed payload for the call type
 * @property {number} maxFeeUSD           caller's max willingness to pay
 * @property {'normal' | 'high'} priorityLevel
 */

/**
 * @typedef {Object} A2ACallResponse
 * @property {string} callId
 * @property {Object} result
 * @property {number} feeChargedUSD
 * @property {number} platformCutUSD
 * @property {number} callerNetUSD        the callee's share (paid out)
 * @property {number} latencyMs
 * @property {string} timestamp           ISO timestamp
 */

/**
 * @typedef {Object} A2AFeeRecord
 * @property {string} callId
 * @property {string} callerId
 * @property {string} calleeId
 * @property {A2ACallType} callType
 * @property {number} grossFeeUSD
 * @property {number} platformCutUSD
 * @property {number} calleeShareUSD
 * @property {string} txSignature         Solana tx hash for the on-chain fee collection
 * @property {string} timestamp
 */

/**
 * @typedef {Object} A2AProjectionInputs
 * @property {number} activeAgents
 * @property {number} avgCallsPerAgentPerDay
 * @property {number} [feePerCallUSD]     defaults to A2A_FEE_USD
 * @property {number} [platformTakeRate]  defaults to A2A_PLATFORM_TAKE
 */

/**
 * @typedef {Object} A2AProjection
 * @property {number} annualCalls
 * @property {number} grossRevenue
 * @property {number} platformARR
 * @property {number} costPerAgentPerYear
 */

// ─────────────────────────────────────────────────────────────────────────
// Fee computation
// ─────────────────────────────────────────────────────────────────────────

/**
 * Compute the fee for a single A2A call, including the high-priority 2× surcharge.
 *
 * @param {A2ACallType} callType
 * @param {'normal' | 'high'} [priorityLevel]
 * @returns {number} fee in USD
 */
export function computeA2ACallFee(callType, priorityLevel = 'normal') {
  const base = A2A_FEE_TABLE[callType];
  if (typeof base !== 'number') {
    throw new Error(`computeA2ACallFee: unknown call type "${callType}"`);
  }
  return priorityLevel === 'high' ? base * 2 : base;
}

/**
 * Split a gross fee into platform take and callee share.
 *
 * @param {number} grossFeeUSD
 * @param {number} [platformTakeRate]   defaults to A2A_PLATFORM_TAKE
 * @returns {{platformCutUSD: number, calleeShareUSD: number}}
 */
export function splitA2AFee(grossFeeUSD, platformTakeRate = A2A_PLATFORM_TAKE) {
  const safeGross = Math.max(0, grossFeeUSD || 0);
  const platformCutUSD = safeGross * platformTakeRate;
  const calleeShareUSD = safeGross - platformCutUSD;
  return { platformCutUSD, calleeShareUSD };
}

// ─────────────────────────────────────────────────────────────────────────
// ARR projection — linear model (spec §5.3)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Linear A2A revenue projection — assumes each agent makes a fixed number of
 * calls per day regardless of fleet size. Matches the spec's formula.
 *
 * For the quadratic upside case (pairwise call pool), use
 * `projectA2AQuadraticARR()` instead — that model is the one to quote in
 * bull/moonshot scenarios (analysis §5.4).
 *
 * @param {A2AProjectionInputs} inputs
 * @returns {A2AProjection}
 */
export function projectA2AARR(inputs) {
  if (!inputs) throw new Error('projectA2AARR: inputs required');

  const {
    activeAgents,
    avgCallsPerAgentPerDay,
    feePerCallUSD = A2A_FEE_USD,
    platformTakeRate = A2A_PLATFORM_TAKE,
  } = inputs;

  const agents = Math.max(0, activeAgents || 0);
  const callsPerDay = Math.max(0, avgCallsPerAgentPerDay || 0);

  const annualCalls = agents * callsPerDay * 365;
  const grossRevenue = annualCalls * feePerCallUSD;
  const platformARR = grossRevenue * platformTakeRate;
  const costPerAgentPerYear =
    agents > 0 ? platformARR / agents : 0;

  return {
    annualCalls,
    grossRevenue,
    platformARR,
    costPerAgentPerYear,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Quadratic upside model (analysis §5.4)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Quadratic-aware A2A projection — models the fact that each new agent can
 * potentially call every other agent, so the addressable call pool scales as
 * n*(n-1)/2. Caller applies a `captureRate` (0–1) representing what fraction
 * of the pairwise pool actually converts to paid calls per day.
 *
 * This is the upside sensitivity model that drives analysis §5.4's >10×
 * scenarios. Do not use this as the base case — it is intended for bull/
 * moonshot sizing.
 *
 * @param {Object} inputs
 * @param {number} inputs.activeAgents
 * @param {number} inputs.dailyPairwiseCaptureRate  0–1, fraction of pairs that transact per day
 * @param {number} [inputs.feePerCallUSD]
 * @param {number} [inputs.platformTakeRate]
 * @returns {A2AProjection}
 */
export function projectA2AQuadraticARR({
  activeAgents,
  dailyPairwiseCaptureRate,
  feePerCallUSD = A2A_FEE_USD,
  platformTakeRate = A2A_PLATFORM_TAKE,
}) {
  const agents = Math.max(0, activeAgents || 0);
  const rate = Math.max(0, Math.min(1, dailyPairwiseCaptureRate || 0));

  // Pairwise pool — each agent can call every other agent exactly once per pair.
  // Max guards against the -0 artifact when agents === 0.
  const pairs = Math.max(0, (agents * (agents - 1)) / 2);
  const dailyCalls = pairs * rate;
  const annualCalls = dailyCalls * 365;
  const grossRevenue = annualCalls * feePerCallUSD;
  const platformARR = grossRevenue * platformTakeRate;
  const costPerAgentPerYear =
    agents > 0 ? platformARR / agents : 0;

  return {
    annualCalls,
    grossRevenue,
    platformARR,
    costPerAgentPerYear,
  };
}

/**
 * Produce a growth curve of A2A ARR across a sweep of agent counts.
 * Useful for dashboards showing the shape of the curve — pure helper.
 *
 * @param {number[]} agentCounts
 * @param {number} callsPerDay
 * @param {number} [feeUSD]
 * @param {number} [takeRate]
 * @returns {Array<{agents: number, arrK: number}>}  arrK = ARR in $K
 */
export function a2aGrowthCurve(
  agentCounts,
  callsPerDay,
  feeUSD = A2A_FEE_USD,
  takeRate = A2A_PLATFORM_TAKE
) {
  if (!Array.isArray(agentCounts)) return [];
  return agentCounts.map((n) => {
    const { platformARR } = projectA2AARR({
      activeAgents: n,
      avgCallsPerAgentPerDay: callsPerDay,
      feePerCallUSD: feeUSD,
      platformTakeRate: takeRate,
    });
    return {
      agents: n,
      arrK: Math.round(platformARR / 1000),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Guardrail checks (defense-in-depth, analysis §4 C11)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Validate an incoming A2A call request against platform guardrails.
 * Pure function — the router should call this before any dispatch.
 *
 * @param {A2ACallRequest} req
 * @param {Object} context
 * @param {number} context.callerDailySpendUSD    running spend today, pre-this-call
 * @param {number} context.callDepth              current recursion depth
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
export function validateA2ARequest(req, context) {
  if (!req || !context) {
    return { ok: false, reason: 'missing request or context' };
  }
  if (!req.callerId) {
    return { ok: false, reason: 'callerId required' };
  }
  if (!A2A_FEE_TABLE[req.callType]) {
    return { ok: false, reason: `unknown call type: ${req.callType}` };
  }

  const fee = computeA2ACallFee(req.callType, req.priorityLevel);

  if (typeof req.maxFeeUSD === 'number' && fee > req.maxFeeUSD) {
    return { ok: false, reason: 'fee exceeds caller max' };
  }

  if (context.callDepth >= A2A_MAX_CALL_DEPTH) {
    return { ok: false, reason: 'max call depth exceeded' };
  }

  if (context.callerDailySpendUSD + fee > A2A_MAX_DAILY_SPEND_USD) {
    return { ok: false, reason: 'max daily spend exceeded' };
  }

  return { ok: true };
}
