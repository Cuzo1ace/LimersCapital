/**
 * Treasury Strategy Configuration
 *
 * Defines allocation rules, yield targets, and counter-cyclical triggers
 * for the Limer's Capital treasury. These parameters are informational
 * for the dashboard display and governance proposals — actual fund
 * movements are governed by multi-sig (see docs/TREASURY.md).
 */

// ── Self-Insurance Fund ──────────────────────────────────────

export const SELF_INSURANCE_FUND = {
  allocation: 7_500_000,  // 7.5M tokens from treasury's 150M
  source: 'Treasury (15% of total supply)',
  pctOfTreasury: 5,
  purpose: 'Self-insurance against platform-threatening events',
  triggerEvents: [
    {
      event: 'Exchange hack or exploit',
      action: 'Publicly demonstrate no user fund loss, deploy incident response',
      severity: 'critical',
    },
    {
      event: 'Solana network outage >24h',
      action: 'Communicate status, activate chain abstraction fallback if available',
      severity: 'high',
    },
    {
      event: 'Regulatory enforcement action',
      action: 'Engage legal counsel, fund defense from insurance allocation',
      severity: 'high',
    },
    {
      event: 'Market crash >50% drawdown in 7 days',
      action: 'Increase LP rewards (counter-cyclical acquisition), reassure community',
      severity: 'medium',
    },
    {
      event: 'Key infrastructure provider failure (RPC, CORS proxy)',
      action: 'Switch to backup provider, fund emergency migration',
      severity: 'medium',
    },
  ],
};

// ── Treasury Strategy ────────────────────────────────────────

export const TREASURY_STRATEGY = {
  baseYield: {
    target: '5-7% APY',
    instruments: ['Marinade mSOL staking', 'JitoSOL liquid staking'],
    riskLevel: 'Low',
    maxSingleProtocol: '50%', // Never more than 50% in any one protocol
  },
  volatilityHarvesting: {
    description: 'Counter-cyclical user acquisition during market downturns',
    triggers: [
      {
        condition: 'SOL price drops >30% in 7 days',
        action: 'Double LP referral rewards (200 → 500 LP) for 14 days',
        duration: '14 days',
      },
      {
        condition: 'Platform DAU drops >40% in 7 days',
        action: 'Activate re-engagement campaign with bonus LP for returning users',
        duration: '14 days',
      },
      {
        condition: 'SOL price rises >50% in 30 days',
        action: 'Accumulate stablecoin reserves from yield (de-risk)',
        duration: 'Until rally subsides',
      },
    ],
    maxActivationsPerYear: 4,
  },
  counterCyclicalAcquisition: {
    description: 'Users acquired during fear are the most loyal — they chose the platform when alternatives were failing',
    mechanism: 'Temporarily increase referral bonus from 200 LP to 500 LP during market fear events',
    duration: '14 days per activation',
    maxActivationsPerYear: 4,
    fundSource: 'Counter-Cyclical Fund (10% of treasury)',
  },
};

// ── Treasury Allocation Detail ───────────────────────────────

export const TREASURY_ALLOCATION_DETAIL = {
  totalTreasury: 150_000_000,
  breakdown: [
    { label: 'Self-Insurance Fund', tokens: 7_500_000, pct: 5, purpose: 'Black swan event protection' },
    { label: 'DeFi Yield (mSOL/JitoSOL)', tokens: 75_000_000, pct: 50, purpose: 'Base yield generation at 5-7% APY' },
    { label: 'Strategic Reserves', tokens: 37_500_000, pct: 25, purpose: 'Runway extension and opportunity fund' },
    { label: 'Counter-Cyclical Fund', tokens: 15_000_000, pct: 10, purpose: 'User acquisition during downturns' },
    { label: 'Operational Buffer', tokens: 15_000_000, pct: 10, purpose: 'Day-to-day operations and infrastructure' },
  ],
};

// ── Antifragility Scoring ────────────────────────────────────

export const ANTIFRAGILITY_PRINCIPLES = [
  {
    principle: 'Redundancy',
    current: '7 revenue streams, 1 jurisdiction, 1 chain',
    target: '12+ revenue streams, 15+ jurisdictions, multi-chain',
  },
  {
    principle: 'Optionality',
    current: 'Modular SPA architecture (pages, components, data, solana)',
    target: 'Each product independently launchable, closeable, or open-sourceable',
  },
  {
    principle: 'Barbell Strategy',
    current: '100% experimental (pre-revenue hackathon project)',
    target: '90% conservative (regulated products) + 10% experimental (labs, grants)',
  },
  {
    principle: 'Skin in the Game',
    current: 'Staking tiers with lock-up (Bronze 1K → Platinum 1M)',
    target: 'All governors, board members, and employees hold $LIMER with lock-up',
  },
  {
    principle: 'Via Negativa',
    current: '19 pages, growing feature set',
    target: 'Pruning review every 5 years — actively remove underperforming products',
  },
];
