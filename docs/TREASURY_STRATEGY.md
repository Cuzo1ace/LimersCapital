# Treasury Management Playbook

**Last updated:** April 7, 2026

---

## 1. Overview

- **Total Treasury:** 150M $LIMER tokens (15% of total supply)
- **Management:** 2-of-3 Squads Protocol multi-sig (see [TREASURY.md](TREASURY.md))
- **Philosophy:** Antifragile — the treasury should get stronger from market stress, not weaker

---

## 2. Self-Insurance Fund (7.5M tokens)

**Purpose:** Survive black swan events without requiring external fundraising.

**Allocation:** 5% of total treasury (7.5M tokens)

### Trigger Events and Response Procedures

| Event | Severity | Response | Max Spend |
|-------|----------|----------|-----------|
| Exchange hack/exploit | Critical | Demonstrate no user fund loss, deploy incident response team | Up to 50% of fund |
| Solana network outage >24h | High | Communicate status, activate chain abstraction fallback | Up to 20% of fund |
| Regulatory enforcement action | High | Engage legal counsel, fund defense | Up to 30% of fund |
| Market crash >50% in 7 days | Medium | Increase LP rewards (counter-cyclical acquisition) | Up to 15% of fund |
| Infrastructure provider failure | Medium | Switch to backup, fund emergency migration | Up to 10% of fund |

### Fund Replenishment

After any drawdown, the self-insurance fund is replenished from treasury yield before any other allocation. Target: restore to 7.5M within 6 months of any drawdown.

---

## 3. Base Yield Strategy

**Target:** 5-7% APY on deployed treasury assets

### Instruments

| Protocol | Instrument | Max Allocation | Expected APY |
|----------|-----------|---------------|-------------|
| Marinade Finance | mSOL (liquid staking) | 50% of yield allocation | 5-7% |
| Jito | JitoSOL (MEV-boosted staking) | 50% of yield allocation | 6-8% |

### Risk Parameters

- **Max 50% in any single protocol** — if one protocol is compromised, max loss is half the yield allocation
- **No leveraged positions** — only simple staking and liquid staking
- **Weekly monitoring** — check APY, TVL, and audit status of each protocol
- **Quarterly rebalancing** — adjust allocation based on yield performance and risk assessment

---

## 4. Volatility Harvesting

**Thesis:** Users acquired during market fear are the most loyal. Counter-cyclical acquisition creates convex payoffs.

### Trigger Conditions

| Condition | Action | Duration | Max per Year |
|-----------|--------|----------|-------------|
| SOL price drops >30% in 7 days | Double LP referral rewards (200 → 500 LP) | 14 days | 4 activations |
| Platform DAU drops >40% in 7 days | Re-engagement campaign with bonus LP | 14 days | 4 activations |
| SOL price rises >50% in 30 days | Accumulate stablecoin reserves from yield | Until rally subsides | Unlimited |

### Budget

**Counter-Cyclical Fund:** 15M tokens (10% of treasury)

Each activation spends up to 3.75M tokens (15M / 4 max activations). Unused budget rolls over to next year.

---

## 5. Allocation Breakdown

| Bucket | Tokens | % of Treasury | Purpose |
|--------|--------|--------------|---------|
| Self-Insurance Fund | 7,500,000 | 5% | Black swan protection |
| DeFi Yield | 75,000,000 | 50% | Base yield generation |
| Strategic Reserves | 37,500,000 | 25% | Runway extension, opportunity fund |
| Counter-Cyclical Fund | 15,000,000 | 10% | Downturn user acquisition |
| Operational Buffer | 15,000,000 | 10% | Day-to-day infrastructure |
| **Total** | **150,000,000** | **100%** | |

---

## 6. Reporting

### Monthly Treasury Report (to Advisory Council)

1. Current balance across all buckets
2. Yield generated this month
3. Any trigger events and responses
4. Counter-cyclical activations (if any)
5. Risk assessment changes

### On-Chain Transparency

All treasury movements are visible on Solana block explorers (Solscan, Solana FM). The multi-sig vault address is published in [TREASURY.md](TREASURY.md).

---

*Reference data: `src/data/treasury.js` (configuration), `src/data/tokenomics.js` (INSURANCE_FUND, TREASURY_STRATEGY_SUMMARY)*
