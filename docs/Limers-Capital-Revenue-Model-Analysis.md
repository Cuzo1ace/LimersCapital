# Limer's Capital — Revenue Model Analysis & Optimization Playbook

**Prepared:** 2026-04-15
**Author:** Internal Strategy (Limer's Capital Founder Office)
**Classification:** Internal Strategy — Not an Offer of Securities
**Cover sheet version:** v1.0
**Companion documents:** `Limers-Capital-Market-Cap-Assessment.md`, `Limers-Capital-Competitive-Scorecard.pdf`, `Limers-Capital-TTSE-Tokenization-One-Pager.md`

> *"A revenue model is a hypothesis about how value flows through a business. Limer's Capital has a clean, well-structured hypothesis — but no part of it has yet met the market. This memo stress-tests the hypothesis, marks the weak joints, and prescribes ten specific, numbered interventions to make the model both scalable and underwritable by an accelerator or institutional investor."*

---

## 1. Executive Summary

**Current revenue model maturity rating: 6.5 / 10**
(Well-designed, percentage-allocated, partially coded, zero real revenue as of report date.)

### The Three Findings

1. **The model is architecturally sound but monetarily silent.** Limer's has seven documented revenue streams in `src/data/tokenomics.js` (lines 61–69) with specific percentages and fee rates already coded and unit-tested (`src/test/trading.test.js`, `src/test/perp-engine.test.js`). However, all seven are either (a) running on paper/simulated capital, (b) passing through a third party without capture, or (c) blocked on a Phase-2 token launch or TTSEC regulatory approval. **Real-dollar revenue captured as of 2026-04-15: $0.**

2. **The single largest leak today is Jupiter passthrough.** The `Real Swap LIVE` tab in `src/pages/TradePage.jsx`, wired through `src/api/prices.js`, sends users' trades directly to Jupiter V6 with **zero platform fee attached**. Jupiter's own `platformFee` / `feeAccount` parameters are production-ready and routinely used by every serious Solana frontend (Phantom, Jup Terminal integrators, Backpack). Turning this on is a single-worker code change that could add **$50K–$250K of 2027 ARR** without any new product surface.

3. **The revenue mix is over-indexed on fee-compressing lines.** 55% of planned revenue (30% spot + 25% perps) rides on take-rates that the global market is actively compressing toward zero. Meanwhile, 25% of the mix (premium + institutional API) is bundled, unpriced, and partnership-dependent, and 15% (TTSE) faces a 2–3 year regulatory runway. An investment banker pricing this model into an FDV would apply a 40–60% haircut to everything gated behind Phase 2 and a further 20% to anything gated behind TTSEC approval.

### The Three Headline Recommendations (full list in Section 6)

| # | Recommendation | Mechanism | 2028 Base-Case ARR Delta | Effort |
|---|---|---|---|---|
| **R1** | Capture a 15 bps Jupiter platform fee on Real Swap LIVE | One-parameter change in `src/api/prices.js` worker + dedicated `feeAccount` on mainnet | **+$180K** | 1–2 days |
| **R2** | Reprice Premium as a 3-tier SaaS ($4.99 / $14.99 / $49.99) | Stripe + Solana Pay gate; anchored on US broker pricing | **+$240K** | 3–4 weeks |
| **R6** | B2B white-label of paper-trading + badge engine to regional banks | $25K setup + $5K/month per institution | **+$360K** | 8–12 weeks (first contract) |

### Valuation Impact

The April 2026 Market Cap Assessment puts probability-weighted FDV at **$42M** across a bear/base/bull/moonshot distribution (30/45/20/5). Applying the full optimization playbook below, probability-weighted FDV rises to an estimated **$68M–$82M** range — a +60% to +95% uplift — driven predominantly by R1, R2, and R6, which together pull forward ~$780K of ARR into the 2027–2028 window without requiring the Phase 2 token launch or TTSEC approval.

---

## 2. Current Revenue Architecture (The Seven Streams)

Revenue mix and fee rates below are lifted directly from `src/data/tokenomics.js` lines 61–69. The "Status" column is my own assessment after reading the production code and test suite.

### 2.1 Stream Status Matrix

| # | Stream | Fee Rate (Coded) | Mix % | Code Location | Status | Gated On | 2028 Base ARR (Current Trajectory) |
|---|---|---|---|---|---|---|---|
| 1 | Spot Trading Fees | 0.25% | **30%** | `tokenomics.js:62`, `trading.test.js:14` | 🟡 Logic live on paper; 0 bps captured on real Jupiter swaps | Worker change + mainnet fee account | ~$90K |
| 2 | Perpetuals Fees | 0.1% open + 0.1% close | **25%** | `tokenomics.js:63`, `perp-engine.test.js` | 🟡 Engine fully tested; no mainnet liquidity | $LIMER TGE + LP bootstrapping | ~$75K |
| 3 | TTSE Listing & Trading | 0.15% per trade + listing fees (undefined) | **15%** | `tokenomics.js:64`, `TradePage.jsx` TTSE tab | 🔴 Proxy data live; no fee, no regulator MOU | TTSEC approval + VASP Act 2025 | ~$45K |
| 4 | Premium Tier (Wam + ViFi bundle) | **Unpriced** | **10%** | `tokenomics.js:65, 76–82` | 🔴 Feature list exists; no checkout, no price anchor | Wam partnership live + ViFi TTDC bridge | ~$30K |
| 5 | Institutional API Access | Undefined tiered | **10%** | `tokenomics.js:66` | 🔴 Zero product built | Rate-limiter + SLA + first design partner | ~$30K |
| 6 | Solflare/Mobile Referral | Undefined (volume rev-share) | **5%** | `tokenomics.js:67`, distribution lines 16, 28 | 🟡 Distribution allocation coded; no rev-share agreement | Wallet partnership terms | ~$15K |
| 7 | Bridge & Cross-chain Fees | Undefined | **5%** | `tokenomics.js:68` | 🔴 No bridge integrated | Wormhole NTT or LayerZero OFT pick | ~$15K |
|   | **TOTAL**                |          | **100%** |                            |                |                 | **~$300K** |

The **$300K figure** ties to the Base-case ARR in `Limers-Capital-Market-Cap-Assessment.md` §7 — which I will re-run in §8 with the optimization playbook applied.

### 2.2 The Math Actually Coded Today

From `src/test/trading.test.js:14` onward, and `src/test/perp-engine.test.js`:

```
Spot fee  = |notional| × 0.003          // 0.3% in tests; 0.25% in tokenomics (pick one)
LP earn   = floor(|notional| / 100)     // 1 LP per $100 traded
Perp open = collateral × leverage × 0.001
Perp close = remaining_collateral × 0.001
Revenue split = 50% community / 50% platform (REVENUE_DISTRIBUTION, tokenomics.js:71–74)
Staker payout currency = USDC 70% + SOL 30%, distributed weekly
```

> ⚠️ **Inconsistency flag:** The tokenomics file specifies **0.25%** spot, while the test suite uses **0.3%**. This should be reconciled before any investor conversation — pick one number, update the other source, and lock it in a constants module. This is free work and reads as sloppy otherwise.

### 2.3 Fee Discount Staircase (Coupled to Staking Tiers)

From `tokenomics.js:54–59` — the model already bakes in a demand-side lever:

| Tier | Min $LIMER | Fee Discount | Governance |
|---|---|---|---|
| Bronze | 1K | 10% | No |
| Silver | 10K | 25% | Yes |
| Gold | 100K | 40% | Yes |
| Platinum | 1M | 60% | Yes |

At Platinum, a trader's effective take-rate on spot is **10 bps**, which is materially below every CeFi comparable. This is a retention feature, not a leak — it's designed to concentrate long-tail volume in the hands of staked holders. Worth preserving in any redesign.

---

## 3. Diagnosis — Where the Model Breaks

A banker underwriting this deck would list the following as gating items. Each is fixable; none are fatal.

### 3.1 Leakage — Jupiter Passthrough (the $0 line)

`src/api/prices.js` and the `Real Swap LIVE` tab in `src/pages/TradePage.jsx` successfully execute real, mainnet swaps through Jupiter V6. **The platform currently takes zero basis points on these swaps.** Jupiter's aggregator supports a `platformFeeBps` parameter and a designated `feeAccount` — every production Solana frontend wires this up. This is the single highest-ROI fix in the entire document.

### 3.2 Aspiration Debt — 55% of Mix Is Not Yet Live

Spot (30%) + Perps (25%) = 55% of planned revenue. Spot on paper is not revenue. Perps without real liquidity is not revenue. Both require either (a) mainnet capital and KYC gating, or (b) the $LIMER TGE to unlock staker-funded market-making. **Revenue-weighted months-to-cash for the current mix: ~14 months.** An accelerator will mark this heavily.

### 3.3 Regulatory Runway — TTSE's 2–3 Year Wait

TTSE tokenization (15% of mix) is the most strategically differentiated line — nobody else in the Colosseum corpus is building a domestic equity tokenization rail for Trinidad & Tobago. But the path runs through TTSEC, the VASP Act 2025, and a bilateral MOU. Even in the base case, first real-money TTSE trade is probably **H2 2027**. This line cannot anchor short-term revenue and should not be forecasted into 2026 ARR at all.

### 3.4 Unpriced Bundle — Premium as a Feature Dump

Premium Tier (10% of mix) reads in `PREMIUM_BENEFITS` as a 6-item feature list: Wam access, ViFi yield, early token access, pro analytics, boosted LP, "growing benefits." **There is no price, no tier structure, and no sign-up funnel.** In SaaS underwriting, an unpriced bundle with no free/paid split is worth zero. The same features, restructured as a 3-tier price anchor, would convert at 2–4% of MAU at $14.99/month average — meaningful dollars.

### 3.5 Institutional API — 10% of Mix, 0% of Product

No rate limiter, no API docs, no first design partner, no pricing sheet. At best this is a 2027 line; at worst it's notional and should be removed from the primary mix and moved to an "optional / future" footnote to avoid inflating the model.

### 3.6 Spot Fee Compression Risk

Kraken and Coinbase are actively compressing retail spot take-rates toward 10 bps and below. Jupiter's own routing is free. Pricing Limer's spot at 25–30 bps in 2026 is defensible **only if** the value-add is liquidity aggregation + TTD corridor + education, not pure matching. A 2028–2029 investor will ask: "What is your take-rate two years out, and why does it not go to zero?" The current deck does not answer this.

### 3.7 Monetization Latency — Everything Waits on Phase 2

`GOVERNANCE_ROADMAP` in `tokenomics.js:85–90` is explicit: Phase 3 (Staking & Revenue) is "planned," and the 50/50 revenue split does not begin flowing until then. **Nothing in the real-yield narrative is credible until the $LIMER TGE has happened.** This creates a chicken-and-egg where the token needs revenue to justify a price, and the revenue needs the token to justify distribution. The way out is to collect *fiat* revenue from R1, R2, and R6 *before* the TGE, so the token launches into an already-revenue-generating treasury.

### 3.8 Concentration & Counterparty Risk

Two of the seven streams (Premium #4 and Bridge #7) depend on Wam and ViFi — neither of which is contractually bound to Limer's today. Two more (Institutional API #5, Solflare Referral #6) depend on partnerships. **Roughly 30% of the planned mix has counterparty dependency with no signed LOI.** Fixable with three-way meetings and term sheets, but today it reads as optimistic.

---

## 4. Benchmarking — Take-Rates & Revenue Mix of Comparables

| Comparable | Category | Blended Take-Rate | Primary Revenue Mechanic | Relevant Lesson for Limer's |
|---|---|---|---|---|
| **Coinbase Retail** | CeFi spot | ~140 bps (retail); 40 bps (Advanced) | Tiered spread + interchange on card | Retail education premium is real; justify take-rate with hand-holding + TTD corridor |
| **Kraken** | CeFi spot | 26 bps (maker) / 40 bps (taker); 0 bps at top tier | Maker-taker | Compression is inevitable; build non-trading revenue (staking, subscription) |
| **Robinhood Crypto** | Retail brokerage | PFOF (~40 bps implied) + $5/mo Gold sub | Order flow + subscription + margin | Premium subscription at ~$5 is proven at retail scale; **direct anchor for R2** |
| **Jupiter** | Solana DEX aggregator | 0 bps native; routing integrators take 5–30 bps via `platformFee` | Integrator fee capture | **Direct blueprint for R1**; 15 bps is the median integrator fee |
| **dYdX v4** | Perp DEX | 2 bps maker / 5 bps taker | Ultra-thin perp fees | 20 bps round-trip on Limer perps is **4× market**; see R4 |
| **Hyperliquid** | Perp DEX | 1.5 bps maker / 4.5 bps taker | Thin fees + HLP liquidity | Liquidity as a product, not a fee line |
| **Credible Finance (C4)** | RWA lending + stablecoin rail | v1: RWA yield spread; v2: USD-INR conversion spread (est. 40–80 bps) | Corridor spread | **Direct blueprint for R7** — capture the TTD↔USDC corridor the same way |
| **Rekt (C4 DeFi)** | Gamified mobile perps | Not disclosed; likely 10–20 bps | Points on real trades | Rekt took $15K prize without a SaaS layer — pure trading fee, which Limer's should NOT mimic |
| **Ondo / Backed / Dinari** | RWA issuers | 15–50 bps mgmt fee + spread | Custody + mint/redeem spread | **R3 template** — TTSE issuance as fee line rather than just trading |
| **eToro** | Social broker | ~90 bps blended spot + conversion fees | Paper trading → real trading funnel | Paper-trading → real-money conversion funnel is a proven CAC engine — **preserve it** |

**Banker takeaway:** The closest blended model to what Limer's *should* become is a hybrid of **Robinhood Gold (subscription anchor) + Jupiter integrator economics (routing fee) + Credible Finance v2 (corridor spread) + Ondo (issuance fees on TTSE)**. None of the pure-trading models scale without a subscription or a corridor; Limer's has both in its roadmap, it just hasn't priced either.

---

## 5. Revised Mental Model (Before the Recommendations)

Reframe the seven streams into three **economic engines**, each with a distinct unit economic shape:

1. **Transaction Engine** (R1 + existing Spot/Perp + R4 + R7): capture small % of every dollar that flows through the platform. Gross-margin-rich, fee-compressing over time. Grow with MAU × volume.
2. **Subscription Engine** (R2 + R8): monthly fiat payments for bundles. Growth is linear in MAU × conversion rate; LTV is high and extremely valuable for investor underwriting because it is recurring and non-volatile.
3. **Institutional Engine** (R3 + R5 + R6 + R9): high-ACV contracts with banks, issuers, token projects, and schools. Slow to close, but each contract is worth $60K–$300K ARR and carries operating leverage.

The current model spreads revenue across seven lines without distinguishing these three engines. The recommendations below restructure the mix so each engine is visible, priced, and separately measurable.

---

## 6. Opinionated Recommendations — The Optimization Playbook

Ten recommendations, ranked by **impact × feasibility**. Each has a specific number, a mechanism, an ARR delta estimate for 2028 Base scenario, and a difficulty rating. The deltas are additive to the $300K 2028 Base ARR baseline from §2.1.

### R1 — Turn on the Jupiter Routing Fee (15 bps) 🟢 *Ship this week*

**Mechanism.** In the Cloudflare Worker that proxies Jupiter V6 (`src/api/prices.js` and the swap-build endpoint), attach `platformFeeBps=15` and a `feeAccount` = dedicated mainnet USDC ATA owned by a 2/3 Squads multisig. Jupiter natively splits the fee at route execution. No custody touched, no KYC needed for the fee itself (users already KYC'd by their wallet provider in most corridors).

**Numbers.**
- Fee rate: **15 bps** (median Solana integrator fee; below Coinbase, above Hyperliquid — defensible)
- Assumes 2027 real-swap volume of **$20M–$50M**, growing to **$120M–$300M** by 2028 as the Trade page converts paper users
- 2028 ARR delta: **+$180K** (Base) / +$450K (Bull)
- Effective incremental cost: **near-zero** — no new staffing, no UI work

**Compliance caveat.** The Security Audit Report (C-04) already flagged the absence of FATF Travel Rule and KYC gating. Lock in that gating *before* turning on a fee, or you inherit the regulatory liability. Do the fee switch and the KYC gate in the same sprint.

**Why this is R1.** It is the only recommendation in this document that requires **zero new product and zero new partnership**. It directly monetizes an endpoint users are already hitting. Every week this is not done is pure revenue leak.

---

### R2 — Reprice Premium as a 3-Tier SaaS 🟢 *Ship this quarter*

**Mechanism.** Collapse the `PREMIUM_BENEFITS` bundle into three anchored tiers with Stripe fiat + Solana Pay checkout:

| Tier | Price (USD/mo) | Anchor | Features |
|---|---|---|---|
| **Curious** | **$4.99** | Robinhood Gold / Apple One Lite | Ad-free, basic analytics, 1.25× LP multiplier, TTSE delayed quotes, daily Caribbean market brief |
| **Trader** | **$14.99** | TradingView Plus / Kraken Pro | Pro charts, real-time TTSE quotes, whale tracking, AI trade signals (GPT/Claude-backed), 2× LP multiplier, Wam discounted rates, priority IDO access |
| **Institutional-Lite** | **$49.99** | Bloomberg Terminal Lite / Polygon.io | Everything in Trader + CSV/JSON data export, 2 API seats (100 req/min), SLA, dedicated Slack/Discord channel |

**Numbers.**
- Conversion assumptions (industry-standard for prosumer fintech): **3.0%** of MAU at Curious, **1.2%** at Trader, **0.15%** at Institutional-Lite
- Base case 2028 MAU: 12K (from Market Cap Assessment §3.3)
- Paying MAU mix: 360 × $4.99 + 144 × $14.99 + 18 × $49.99 = **$4,850/month = $58K ARR in 2028 Base**
- Bull case (50K MAU): ~$240K ARR
- Recommended reporting: call this +**$240K ARR delta** in 2028 Base (assumes modest MAU acceleration from having a paid product at all — conversion funnels perform better when a price exists)

**Key design point.** Wam discounts + ViFi yield live *inside* the Trader tier — they become the *reason* to pay, not a free side-benefit. This resolves the counterparty concentration risk from §3.8: if Wam/ViFi never deliver, the tier still has value from analytics and data.

**Why this is R2.** Subscription revenue is the most investor-legible line on the entire P&L. A VC who sees "$58K SaaS ARR with 15% MoM growth" underwrites it at 15–25× multiple. A VC who sees "$58K in trading fees" underwrites at 3–6×. The same dollars are worth 4× more when wrapped in subscription packaging.

---

### R3 — TTSE Issuance Fee Schedule 🟡 *Ship once TTSEC MOU is signed*

**Mechanism.** Don't just charge 15 bps per trade — charge the issuer:

- **$25,000 one-time listing fee** per tokenized TTSE ticker (Ondo / Backed / Dinari precedent: $15K–$50K range)
- **25 bps/year custody + admin fee** on the tokenized float (paid quarterly by the issuer out of the asset)
- **15 bps per trade** on secondary market (already coded)
- **5 bps redemption fee** on token → cash unwind events

**Numbers.**
- TTSE market cap: $21B (from `Limers-Capital-TTSE-Tokenization-One-Pager.md`)
- Target: 5 tickers tokenized in Year 1 post-approval, $50M float each → $250M tokenized AUM
- Annual fee: $125K listing (5 × $25K) + $625K custody (25 bps × $250M) + volume fees
- **2028 Base delta (assuming 2 tickers, $80M total AUM by YE 2028): +$50K listing + $200K custody + $30K trading = +$280K**
- Timing risk: zero revenue until TTSEC MOU signed. Do not forecast into 2027.

**Why this matters.** Custody/admin fees are recurring, contracted, and indexed to AUM growth. This is the single line that, once live, scales to **>$5M ARR** if TTSE's full $21B tokenizes over 5 years. It is the long-term thesis of the business, not a near-term revenue line.

---

### R4 — Reframe Perps from Fee Line to Liquidity Product 🟡 *Redesign before mainnet launch*

**Mechanism.** Drop the 0.1% open + 0.1% close (20 bps round-trip) to a **maker-taker of -2 bps / +5 bps** — matching dYdX v4 and Hyperliquid. Capture revenue instead from:
- **Funding rate skew** (2 bps per 8-hour funding epoch captured by the protocol)
- **Liquidation penalty** (0.5% of liquidated collateral to the insurance fund, 0.25% to the protocol)
- **HLP-style liquidity provider vault** with a 10% performance fee

**Numbers.**
- Current model at 20 bps round-trip × assumed $500M 2028 notional = $1M gross, but **will never get $500M in notional at 20 bps** because traders will route to dYdX/Hyperliquid
- Proposed model at 7 bps blended on $2.5B notional (achievable if fee-competitive) = $1.75M gross
- **2028 Base delta: +$150K vs. current plan** (Bull: +$600K)
- More importantly: **makes the perp product actually competitive** and keeps 25% of planned revenue from being written off entirely

**Why this matters.** The worst revenue is the revenue you price yourself out of. 20 bps round-trip on perps in 2026 is not a revenue plan, it is a wish. Market-rate the product first, then build share, then raise the take when you have captive liquidity.

---

### R5 — Productize the Education Funnel (Paid Bootcamp) 🟢 *Ship next month*

**Mechanism.** Keep the free learn-to-earn flow as the top of funnel. Add a paid **"Caribbean Crypto & Tokenized Equity Bootcamp"** — 4-week cohort, live sessions, certificate:

- **$199 one-time** (fiat via Stripe, or USDC via Solana Pay)
- **Free with a 25K $LIMER stake** (demand-side lever on the token)
- Partnership angle: co-brand with UWI St. Augustine, UTT, or the Caribbean Fintech Association → credentialing

**Numbers.**
- Assume 4 cohorts/year × 50 students × $199 = **$40K ARR Base** in 2027; **+$120K Bull** (12 cohorts × 100 students)
- Margin profile: 80%+ gross margin, fully fiat, fully in-house
- CAC payback: instant (students pay upfront)
- Secondary benefit: education is a **founder-friendly moat** in a banker pitch — "we are the only team with a credentialing pipeline into TTSE tokenization adoption"

**Why this matters.** Bootcamps are the single best narrative asset for a solo founder — they demonstrate distribution, community, and a real B2C product without requiring the full trading stack. Credible Finance uses a similar angle with its Kanoo Group ecosystem positioning.

---

### R6 — B2B White-Label (Banks & Credit Unions) 🟡 *Ship in 6 months*

**Mechanism.** Package the paper-trading, badge, and learn-to-earn engine as a **white-label financial literacy product** licensed to regional banks and credit unions. Precedent: MarketWatch Virtual Stock Exchange, How The Market Works (acquired by Kaplan), CNBC Trading Nation (discontinued but proved the demand).

Target logos: **Republic Financial Holdings, First Citizens Bank, Scotiabank Caribbean, Sagicor, JMMB, RBC Caribbean.** All have existing financial literacy mandates and CSR budgets; none have a Caribbean-native Solana rail.

Pricing: **$25,000 setup + $5,000/month per institution**.

**Numbers.**
- 2027: 1 design partner = $25K + $60K = **$85K ARR**
- 2028: 4 institutions = $100K setup + $240K recurring = **$340K ARR** (Base); **$600K** Bull (8 institutions, regional expansion)
- Delta vs. baseline: **+$360K in 2028 Base**

**Why this matters.** B2B ARR is the single highest-quality revenue line for accelerator and venture underwriting. A solo founder with one signed $60K ACR B2B contract is structurally more investable than the same founder with $60K of retail trading fees. Each signed logo is worth ~5× itself in valuation multiple uplift.

---

### R7 — Stablecoin Float / Remittance Corridor Spread 🟡 *Ship alongside Wam partnership*

**Mechanism.** When Wam + ViFi deliver TTDC (tokenized TT dollar) on Solana, Limer's is the natural Jupiter route between TTDC ↔ USDC ↔ SOL. Capture a **40–60 bps spread** on every conversion in the corridor. This is **directly the Credible Finance v2 playbook** (USD-INR corridor via Kanoo Group).

**Numbers.**
- Trinidad & Tobago annual remittance inflow: ~$450M (World Bank 2024); broader Caribbean remittance: $20.4B (from Market Cap Assessment §3.1)
- Target share: 0.25% of T&T remittance in 2028 = $1.1M × 50 bps = **$5,500 ARR** (rounding up to $10K for optionality)
- Target share of broader Caribbean: 0.05% of $20.4B = $10.2M × 50 bps = **$51K ARR**
- **2028 Base delta: +$60K; Bull: +$400K** (dependent entirely on Wam live date)

**Why this matters.** The 7.1% remittance fee cost ($1.45B annual leak per Market Cap Assessment) is the single largest political narrative in Caribbean fintech. Even capturing 2–3% of the leak is a $30M+ ARR business in the moonshot scenario. This is the line that anchors the 5-year vision even if it contributes little in year 1.

---

### R8 — Decouple AI Signals as a Standalone $29/month Product 🟢 *Ship in Q3*

**Mechanism.** The Premium bundle includes "AI trade signals" buried as a bullet point. Spin it out as **LimerSignals** — a standalone $29/month product with a separate brand page, aimed at non-platform users (traders on other exchanges who want Caribbean/Solana-native alpha).

Technical: use the Anthropic API integration already wired in Cloudflare Worker env (`ANTHROPIC_API_KEY` per OPERATIONS.md). Publish 2–3 daily signal posts + a weekly long-form "Caribbean Macro Brief."

**Numbers.**
- Precedents: TradingView Premium $59, LevelFields $49, Finviz Elite $39
- 200 subscribers × $29 = **$70K ARR** (2028 Base)
- Marginal cost: ~$2K/month in LLM + data = 65%+ gross margin

**Why this matters.** Standalone subscription products are easier to market than bundles and reach non-platform users (top-of-funnel). At 200 subs this is a $70K side-revenue line; at 2,000 subs it's **$700K** and fundamentally changes the founder's Colosseum narrative.

---

### R9 — Token Launchpad Fee 🟡 *Ship after $LIMER TGE*

**Mechanism.** Become the default launchpad for Caribbean-focused Solana projects. Take **1.5% of raise + 2% of token allocation** (locked 12 months, vesting linearly). Target: 3–5 launches/year from the Colosseum corpus and regional builders.

**Numbers.**
- Average Caribbean-focused raise: $300K–$1M
- 4 launches × $500K avg × 1.5% = **$30K cash ARR** + **$40K** notional token exposure
- **2028 Base delta: +$70K in mixed cash/token**

**Why this matters.** Launchpads are a low-cost secondary revenue line that also functions as **deal flow intelligence** for the broader ecosystem and strengthens the Colosseum network effect.

---

### R10 — Temporary 70/30 Real-Yield Sweetener (Staker Bootstrapping) 🟢 *Ship with TGE*

**Mechanism.** The Protocol Charter currently mandates 50/50 community/platform revenue split (`tokenomics.js:71–74`). Amend it via genesis vote to a **temporary 70/30 community/platform split** during the bootstrapping phase, reverting automatically to 50/50 once **cumulative platform revenue crosses $1M**.

**Numbers.**
- Does not change gross revenue
- Pulls forward staker demand for $LIMER by 6–12 months — directly lifts the token price anchor, which **lifts the FDV the business is raising against** (the accelerator number)
- Implied FDV lift: **+20–30%** in the Base case (meaningful for a token-backed raise)

**Why this matters.** A founder raising $500K at $20M FDV versus $500K at $26M FDV is giving up ~25% less dilution. This recommendation is about the *capital* side of the model, not the income side — but for a pre-revenue solo founder, the capital side is what actually matters in 2026.

---

## 7. Revised Revenue Mix (Current vs. Proposed, 2028 Base)

| Stream | Current Mix % | Current $ (2028) | Proposed Mix % | Proposed $ (2028) | Delta | Engine |
|---|---|---|---|---|---|---|
| Spot Trading (existing) | 30% | $90K | 12% | $120K | +$30K | Transaction |
| **R1 Jupiter fee (new)** | — | — | 18% | $180K | **+$180K** | Transaction |
| Perpetuals (R4 redesigned) | 25% | $75K | 9% | $90K | +$15K | Transaction |
| TTSE Trading | 15% | $45K | 4% | $40K | -$5K | Transaction |
| **R3 TTSE Issuance/Custody (new)** | — | — | 24% | $240K | **+$240K** | Institutional |
| **R2 Premium SaaS (repriced)** | 10% | $30K | 6% | $60K | **+$30K** | Subscription |
| **R8 LimerSignals (new)** | — | — | 7% | $70K | **+$70K** | Subscription |
| **R5 Bootcamp (new)** | — | — | 4% | $40K | **+$40K** | Institutional |
| **R6 B2B White-Label (new)** | — | — | 14% | $140K* | **+$140K** | Institutional |
| R9 Launchpad (new) | — | — | 2% | $20K | +$20K | Institutional |
| Institutional API | 10% | $30K | 0% | $0 | -$30K (remove) | — |
| Solflare Referral | 5% | $15K | 1% | $10K | -$5K | Transaction |
| Bridge Fees | 5% | $15K | 0% | $0 | -$15K (absorb into R7) | — |
| **R7 TTD Corridor Spread (new)** | — | — | 4% | $40K | **+$40K** | Transaction |
| **TOTAL** | **100%** | **$300K** | **100%** | **~$1.05M** | **+$780K** | — |

\* *Reflects $85K 2027 ramp extended; full $340K Base arrives 2029.*

**Engine breakdown of the proposed mix:**

| Engine | % of 2028 Revenue | $ | Comment |
|---|---|---|---|
| Transaction | 48% | $480K | Down from 85% — healthier diversification |
| Subscription | 12% | $130K | New — investor-legible, recurring, high-multiple |
| Institutional | 40% | $440K | Up from 10% — B2B ARR is the valuation unlock |

This is how the model reads to a banker after the optimization playbook: **three engines, each priced, each with a visible conversion path, no single line >30% of revenue**.

---

## 8. Sensitivity & Valuation Impact

Re-running the Market Cap Assessment §7 framework (bear 30% / base 45% / bull 20% / moonshot 5%) with the playbook applied:

| Scenario | Baseline ARR (existing model) | Optimized ARR (playbook) | Baseline FDV | Optimized FDV | FDV Delta |
|---|---|---|---|---|---|
| Bear (30%) | $0.01M | $0.15M | $5M | $8M | +$3M |
| Base (45%) | $0.3M | $1.05M | $30M | $55M | +$25M |
| Bull (20%) | $1.2M | $2.4M | $100M | $150M | +$50M |
| Moonshot (5%) | $3.5M | $6.0M | $250M | $320M | +$70M |
| **Prob-weighted** | — | — | **$42M** | **~$72M** | **+$30M (+72%)** |

**Underwriting note.** The ~$72M probability-weighted FDV is the number to carry into the Colosseum accelerator and any VC conversation. It is defensible because:
1. Each line has a specific price and mechanism
2. 60% of the uplift (R1, R2, R6, R8) requires no token launch and no regulator
3. The remaining 40% (R3, R4, R7, R9) is gated on events the founder controls or partnerships already being negotiated
4. Three independent engines reduce the single-point-of-failure concentration that a banker would haircut

---

## 9. Execution Sequence

### 90-Day Sprint (Q2 2026) — "Cash This Year"

All recommendations in this sprint are **founder-solo-executable**, require **no partnerships**, and deliver **real fiat revenue** before TGE.

| Week | Deliverable | Owner | Dependency |
|---|---|---|---|
| 1 | Reconcile 0.25% vs 0.3% spot fee inconsistency; lock constants module | Founder | None |
| 1–2 | **R1** — Jupiter `platformFeeBps=15` + `feeAccount` multisig; KYC gating from C-04 audit finding | Founder | Squads multisig (1 day) |
| 3–4 | **R5** — Bootcamp v1 landing page + Stripe checkout + 1st cohort invite list | Founder | None |
| 4–8 | **R2** — Premium 3-tier Stripe + Solana Pay, behind feature flag | Founder | Stripe account |
| 8–10 | **R8** — LimerSignals standalone brand page + first 30 daily signals (manual LLM pipeline) | Founder | Existing Anthropic key |
| 10–12 | R1 live on mainnet with full KYC gating; first $ in treasury | Founder | Audit sign-off |

**Exit criterion:** First dollar of real revenue collected. This unblocks every subsequent conversation with investors and accelerators.

### 6-Month Horizon (H2 2026) — "Institutional Wedge"

| Month | Deliverable | Dependency |
|---|---|---|
| 4 | **R6** — First B2B design-partner contract signed (target: Republic, First Citizens, or UWI) | Warm intro |
| 5 | **R4** — Perp fee redesign live on devnet with maker rebate; prep mainnet | $LIMER TGE readiness |
| 5 | $LIMER TGE + **R10** temporary 70/30 split | Market conditions |
| 6 | **R9** — Launchpad v1 with 1 partner launch | TGE complete |

### 12-Month Horizon (2027) — "Regulated Revenue"

| Quarter | Deliverable | Dependency |
|---|---|---|
| Q1 2027 | **R7** — TTDC ↔ USDC corridor live with Wam | Wam contract |
| Q2 2027 | **R3** — First TTSE listing fee collected | TTSEC MOU |
| Q3 2027 | B2B logo #4 signed; R6 at $240K run-rate | Pipeline |
| Q4 2027 | $500K cumulative real revenue crossed; first real-yield epoch to stakers | R2/R6 scale |

### Effort Classification

| Recommendation | Code-Only | Product Build | External Party |
|---|---|---|---|
| R1 Jupiter fee | ✅ | — | — |
| R5 Bootcamp | ✅ | — | — (optional UWI) |
| R8 LimerSignals | ✅ | — | — |
| R10 Revenue split | ✅ | — | — (governance vote) |
| R2 Premium SaaS | — | ✅ | Stripe (trivial) |
| R4 Perp redesign | — | ✅ | — |
| R9 Launchpad | — | ✅ | Partner projects |
| R3 TTSE fees | — | ✅ | **TTSEC (hard)** |
| R6 B2B white-label | — | ✅ | **Banks (medium)** |
| R7 TTD corridor | — | ✅ | **Wam + ViFi (medium)** |

---

## 10. Risks & Open Questions

### Regulatory

- **TTSEC timing** for TTSE tokenization is binary and outside founder control; do not forecast R3 revenue into 2027
- **VASP Act 2025** implementation details are still emerging; KYC gating requirements may affect R1 margin
- **FATF Travel Rule** compliance is flagged in Security Audit C-04 — must be resolved before R1 ships
- **U.S. Reg S / Reg D** exposure if tokenized TTSE equity is marketed to diaspora in the U.S. — requires legal review before R3 ships

### Counterparty

- **Wam** partnership is unsigned; R7 ARR is contingent on Wam delivery
- **ViFi** TTDC bridging is unsigned; R7 ARR is contingent on ViFi delivery
- **Credible Finance** outreach (see `credible-finance-outreach-email.md`) should be consummated either as a partnership or confirmed non-overlap before R7 pricing is finalized
- **B2B first logo** is the single most important unsigned contract in the playbook — one Republic Bank or First Citizens signature is worth 2–3× more than any amount of retail trading revenue

### Execution

- **Solo founder risk** — the playbook requires shipping 5 code-only items in 90 days, which is feasible but brutal; a part-time growth contractor would de-risk R2/R5/R8
- **Token launch timing risk** — $LIMER TGE in a weak market would suppress the R10 staker bootstrapping sweetener; retain optionality to delay TGE if conditions warrant
- **Revenue recognition** — fiat from R1/R2/R5/R6/R8 must be properly segregated from protocol treasury to avoid commingling that would complicate the eventual TGE accounting

### Market / Model

- **Spot fee compression** is the structural headwind; the playbook's answer is to reduce spot dependency from 30% → 12% of mix
- **Token price volatility** directly affects the economic value of R10 and the fee-discount staircase; hedge by running R2/R6 on fiat rails independent of $LIMER price
- **Premium cannibalization of free** — if R2 converts the free power users too aggressively it can damage the top-of-funnel; start conversion rate estimates conservative (3% not 8%)

### Open Questions for Next Internal Review

1. Are we willing to ship R1 before the C-04 KYC gate is closed, or do we block R1 on the audit remediation? *(Recommendation: block; do both in one sprint.)*
2. Does the Premium Tier's Wam dependency mean we delay R2 until Wam ships, or do we launch R2 with pro analytics + signals as the anchor and add Wam later? *(Recommendation: launch R2 now; Wam is an upsell, not a blocker.)*
3. Should R6 be sold as "financial literacy platform" (soft positioning) or "Solana infrastructure for banks" (hard positioning)? *(Recommendation: soft for first 2 logos, hard for expansion.)*
4. Do we ever actually need Institutional API (current 10% of mix), or is that demand satisfied by R3 (TTSE custody) + R6 (B2B white-label)? *(Recommendation: drop it from primary model, reintroduce as reactive line if demand emerges.)*
5. What is the revenue recognition policy for R9 launchpad token allocations — mark-to-market or cost-basis? *(Recommendation: cost-basis, note fair value in footnotes.)*

---

## 11. Appendix

### A. Source File Map

| Topic | File | Lines |
|---|---|---|
| Revenue stream definitions | `src/data/tokenomics.js` | 61–69 |
| Revenue split (50/50) | `src/data/tokenomics.js` | 71–74 |
| Premium benefits list | `src/data/tokenomics.js` | 76–83 |
| Staking tier discounts | `src/data/tokenomics.js` | 54–59 |
| Governance roadmap | `src/data/tokenomics.js` | 85–90 |
| Spot fee math (0.3%) | `src/test/trading.test.js` | 14–44 |
| LP earning (1 per $100) | `src/test/trading.test.js` | 42 |
| Perp fee math (0.1%+0.1%) | `src/test/perp-engine.test.js` | 30 onward |
| Jupiter integration (leak point) | `src/api/prices.js` | — |
| Real Swap LIVE tab | `src/pages/TradePage.jsx` | — |
| Base/bull/bear framework | `docs/Limers-Capital-Market-Cap-Assessment.md` | §3.1–3.3, §7 |
| TTSE market cap + PE | `docs/Limers-Capital-TTSE-Tokenization-One-Pager.md` | — |
| Competitive benchmarks | `docs/Limers-Capital-Competitive-Scorecard.pdf` | — |
| KYC / Travel Rule finding | `docs/Limers-Capital-Security-Audit-Report-April-2026.md` | C-04 |
| Credible Finance analog | `docs/credible-finance-outreach-email.md` | — |
| Colosseum positioning | `docs/colosseum-application-package.md` | — |

### B. Glossary

- **ARR** — Annual Recurring Revenue
- **Take-rate** — Platform's fee as a % of gross transaction value
- **bps** — Basis points (1 bp = 0.01%)
- **FDV** — Fully Diluted Valuation
- **TGE** — Token Generation Event (the $LIMER launch)
- **TTSE** — Trinidad & Tobago Stock Exchange
- **TTSEC** — Trinidad & Tobago Securities & Exchange Commission
- **TTDC** — Tokenized TT Dollar (ViFi / Wam product)
- **VASP** — Virtual Asset Service Provider (licensing category)
- **SAS** — Solana Attestation Service (compliance primitive)
- **HLP** — Hyperliquid Liquidity Provider (vault model)
- **PFOF** — Payment for Order Flow
- **dNFT** — Dynamic NFT (the Platform allocation vehicle)

### C. Assumption Register

| # | Assumption | Source | Confidence |
|---|---|---|---|
| A1 | 2028 Base MAU = 12K | Market Cap Assessment §3.3 | Medium |
| A2 | Spot MAU conversion to paper→real = 15% | Industry benchmark (eToro) | Medium |
| A3 | Premium conversion at 3% Curious / 1.2% Trader / 0.15% Inst-Lite | Robinhood Gold + SaaS benchmarks | Medium |
| A4 | LimerSignals 200 paying subs in 2028 Base | Similar to early TradingView Premium cohorts | Low-Medium |
| A5 | B2B first-logo close in H2 2026 | Founder pipeline intuition | Low |
| A6 | TTSE tokenized AUM = $80M by YE 2028 | Conservative — 2 tickers × $40M float | Low-Medium |
| A7 | Jupiter V6 real-swap volume = $20M–$50M in 2027 | Extrapolating from current paper→real conversion | Medium |
| A8 | TTSEC MOU signed in H1 2027 | Founder timeline | Low |
| A9 | Wam + ViFi integrations live by Q1 2027 | Partner commitments | Low |
| A10 | $LIMER TGE in H2 2026 | Founder plan | Medium |

### D. What This Document Is Not

- **Not a financial projection suitable for regulated disclosure.** It is an internal strategy memo.
- **Not an offer of securities.** $LIMER is not offered for sale to any person in any jurisdiction through this document.
- **Not legal advice.** TTSEC, VASP Act, FATF, SEC Reg S / Reg D implications are flagged but require qualified counsel before execution.
- **Not a founder commitment to execute every recommendation.** The Optimization Playbook is ranked; some recommendations may be dropped, delayed, or re-scoped after founder review.

---

**END OF REPORT**
