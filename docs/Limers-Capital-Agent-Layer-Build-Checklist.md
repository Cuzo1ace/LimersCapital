# Limer's Capital — Agent Layer Build Checklist

**Prepared:** 2026-04-15
**Owner:** Founder Office
**Status source:** Reconciled against `docs/gitbook/vision/roadmap.md`, `docs/Limers-Capital-Revenue-Model-Analysis.md` §9, `docs/Limers-Capital-Security-Audit-Report-April-2026.md` §9, `memory/project_devnet_roadmap.md`, `docs/OPERATIONS.md`, `docs/colosseum-application-package.md`, and git log as of commit `d475966`.
**Companion documents:** `Limers-Capital-Agent-Layer-Impact-Analysis.md` (strategic rationale + stress-tested revenue model), `limers-capital-agent-build-spec.md.txt` (technical spec v1.0).

> This checklist has two parts. **Part A** is the reconciliation of everything already on our plate — what's done, in progress, blocked, and not started across every prior checklist we've written. **Part B** is the ordered build plan for the agent layer itself, with every item mapped back to either an existing audit finding or a spec section. Do not start any Part B item until the Part A pre-sprint gates are green.

---

## Part A — Reconciliation of Prior Checklists

Status legend:
- ✅ **DONE** — shipped, evidence in git or live environment
- 🟡 **IN PROGRESS** — partially built, needs finishing push
- 🔴 **NOT STARTED** — zero code, needs greenfield work
- ⛔ **BLOCKED** — external dependency not resolved
- ⚠️ **GATE** — blocks other work; must close first

### A.1 Platform foundation (from `docs/gitbook/vision/roadmap.md`)

| # | Item | Status | Evidence |
|---|---|---|---|
| A1.1 | 19 functional pages + 361 tests | ✅ DONE | Live at limerscapital.com |
| A1.2 | 8 education modules / 37 lessons / 8 quizzes | ✅ DONE | Commit `db86a03` |
| A1.3 | Paper trading — 14 Solana + 30 TTSE stocks | ✅ DONE | `src/data/tokenCatalog.js`, `src/pages/TradePage.jsx` |
| A1.4 | Real Jupiter V6 swaps (Real Swap LIVE tab) | ✅ DONE | Commit `52d69eb`, `src/components/JupiterSwap.jsx` |
| A1.5 | Anchor program deployed (8 instructions) | ✅ DONE | Program `HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk` per `OPERATIONS.md §7` |
| A1.6 | Devnet / mainnet-beta cluster toggle | ✅ DONE | `src/solana/config.js`, Header.jsx toggle |
| A1.7 | Two Cloudflare Workers (ttse-proxy, limer-api-proxy) | ✅ DONE | `workers/wrangler.toml`, `workers/wrangler-api.toml` |
| A1.8 | Circuit breaker + fallback cache | ✅ DONE | Commit `8868d18` |
| A1.9 | RPC allowlist + origin lock | ✅ DONE | `src/solana/config.js` |
| A1.10 | Error boundary + sanitization | ✅ DONE | `src/components/ErrorBoundary.jsx`, `src/sentry.js` |

### A.2 Security audit remediations (from `Limers-Capital-Security-Audit-Report-April-2026.md` §3–5)

| # | Finding | Title | Status | Notes |
|---|---|---|---|---|
| A2.1 | **C-01** ⚠️ GATE | Single-signer mint authority → Squads 3/5 multisig with 48h timelock | 🔴 NOT STARTED | Blocks all agent-layer work. 14-day sprint per audit §9.4. |
| A2.2 | **C-02** ✅ CLOSED | Sentry DSN live in production | ✅ DONE | Project `limerscapital` created, DSN `8697dbcc...` active, frontend bundle + worker secret both set, 2 verification events confirmed in Sentry Issues (LIMERSCAPITAL-1, LIMERSCAPITAL-2). Commits `2c17bad`, `01ad1dc`. |
| A2.3 | **C-03** | No CSP / SRI at HTML layer | ✅ DONE | `public/_headers` ships enforced CSP (commits `ca3b064`, `1d51d9e`). Audit Report-Only phase was skipped — acceptable. |
| A2.4 | **H-01** | Client-side trade simulation manipulable | 🔴 NOT STARTED | Server-authoritative P&L path not built. Critical for agent-path RiskAgent. |
| A2.5 | **H-02** | RPC URL runtime-override bypass | 🟡 IN PROGRESS | Build-time allowlist live; runtime re-validation not added. |
| A2.6 | **H-03** ⚠️ GATE | No KYC / Travel Rule on Real Swap LIVE | 🔴 NOT STARTED | Sumsub/Persona integration required before agent trades. Gates R1 + all agent tiers. |
| A2.7 | **H-04** | Audit trail gaps for privileged ops | 🔴 NOT STARTED | Needed for `agent_audit_log` in Part B. |
| A2.8 | **M-01** | Blockaid/GoPlus wallet drainer detection | 🔴 NOT STARTED | Sprint 2 of audit §9.4. Needed for agent swarm / manipulation defense. |
| A2.9 | **M-02** | Supabase RLS permissive on inserts | 🔴 NOT STARTED | Impacts `agent_audit_log` table design. |
| A2.10 | **M-03** | Service worker cache lifetime unbounded | 🔴 NOT STARTED | Lower priority. |
| A2.11 | **M-04** | Helius DAS logo fetch no timeout | 🔴 NOT STARTED | Lower priority. |
| A2.12 | **M-05** | Per-IP rate limit insufficient for wallet-scoped ops | 🔴 NOT STARTED | Must add per-wallet key to `workers/api-proxy.js:checkRateLimit` for agent routes. |
| A2.13 | **M-06** ✅ CLOSED | FMP free-tier budget defended by ticker whitelist | ✅ DONE | `FMP_SYMBOL_WHITELIST` (16 tickers) + `validate` hook in `workers/api-proxy.js`. Unknown symbols rejected HTTP 400 at worker before upstream fetch. Worker deployed via `deploy.sh`. |
| A2.14 | **L-01** | No bug bounty program | 🔴 NOT STARTED | Immunefi bronze tier before agent layer GA. |
| A2.15 | **L-02** ✅ CLOSED | `npm audit` CI-enforced | ✅ DONE | `npm audit --audit-level=high --omit=dev` step added to `.github/workflows/deploy.yml`. CI fails on high/critical runtime dependency vulnerabilities. |
| A2.16 | **L-07** | No formal threat model doc | 🟡 IN PROGRESS | `Limers-Capital-Agent-Layer-Impact-Analysis.md §4` is a partial threat model; extend as formal doc post-agent launch. |

### A.3 Revenue optimization playbook (from `Limers-Capital-Revenue-Model-Analysis.md §9`)

| # | Rec | Title | Status | Notes |
|---|---|---|---|---|
| A3.1 | **R1** | Jupiter `platformFeeBps=15` + fee account | 🔴 NOT STARTED | Single-parameter change in `src/api/prices.js`. Gated on A2.6 (H-03 KYC). Prerequisite for agent trading fee amplification line. |
| A3.2 | **R2** | Premium 3-tier SaaS ($4.99 / $14.99 / $49.99) | 🔴 NOT STARTED | Stripe + Solana Pay gate. Can ship parallel to agent layer. |
| A3.3 | **R3** | TTSE issuance fee schedule | ⛔ BLOCKED | Gated on TTSEC MOU — do not forecast. |
| A3.4 | **R4** | Perp fee redesign (-2/+5 maker-taker) | 🔴 NOT STARTED | Must land before Alpha-tier perp agents (Sprint 3). |
| A3.5 | **R5** | Paid bootcamp ($199 / 25K LIMER stake) | 🔴 NOT STARTED | Independent of agent layer. |
| A3.6 | **R6** | B2B white-label ($25K + $5K/mo) | 🔴 NOT STARTED | Independent of agent layer. |
| A3.7 | **R7** | TTD corridor spread | ⛔ BLOCKED | Gated on Wam + ViFi partnership. |
| A3.8 | **R8** | LimerSignals standalone ($29/mo) | 🔴 NOT STARTED | Uses same Anthropic API as agent signal layer — good adjacency. |
| A3.9 | **R9** | Token launchpad | ⛔ BLOCKED | Post-TGE. |
| A3.10 | **R10** | 70/30 real-yield split bootstrap | ⛔ BLOCKED | Post-TGE. |
| A3.11 | Reconcile 0.25% vs 0.3% spot fee | Lock a constants module | 🔴 NOT STARTED | Land same PR as R1. `src/constants/fees.js` creation. |

### A.4 Devnet + ViFi roadmap (from `memory/project_devnet_roadmap.md`)

| # | Sprint | Item | Status | Notes |
|---|---|---|---|---|
| A4.1 | S1 | `limer` program deployed on devnet | ✅ DONE | Program ID live |
| A4.2 | S1 | Mint mock TTDC as Token-2022 | 🔴 NOT STARTED | |
| A4.3 | S1 | Mint mock TTSE share tokens (mANSA, mNCBFG, mFCI) | 🔴 NOT STARTED | |
| A4.4 | S1 | Simple constant-product AMM (devnet) | 🔴 NOT STARTED | |
| A4.5 | S1 | Devnet-routed swap path in TradePage | 🔴 NOT STARTED | |
| A4.6 | S1 | Sponsored gas fee-payer wallet | 🔴 NOT STARTED | |
| A4.7 | S2 | Install `@metaplex-foundation/mpl-core` + umi | 🔴 NOT STARTED | |
| A4.8 | S2 | Create Season 1 Badges Core Collection | 🔴 NOT STARTED | |
| A4.9 | S2 | Badge metadata on Cloudflare R2 | 🔴 NOT STARTED | |
| A4.10 | S2 | `src/solana/badges-mint.js` module | 🔴 NOT STARTED | |
| A4.11 | S2 | Portfolio page NFT badge display via Helius DAS | 🔴 NOT STARTED | |
| A4.12 | S3 | ViFi call completed + bridge standard committed | ⛔ BLOCKED | 6 open decisions per memory note. |
| A4.13 | S3 | Path A/B/C prototypes | 🔴 NOT STARTED | |
| A4.14 | Jupiter dynamic catalog (Zustand slice) | 🟡 IN PROGRESS | Plumbing in commit `1af94a6`, slice still pending | |

### A.5 Colosseum submission package (from `docs/colosseum-application-package.md`)

| # | Item | Status | Notes |
|---|---|---|---|
| A5.1 | Written submission content (all tracks) | ✅ DONE | Ready to paste |
| A5.2 | Traction evidence links | ✅ DONE | |
| A5.3 | 3-min live demo video | 🔴 NOT STARTED | Script drafted, record before deadline. Agent layer should appear in v2 video, not v1. |
| A5.4 | Next edition deadline confirmed | 🟡 IN PROGRESS | Verify at arena.colosseum.org |

### A.6 Partnerships / external (⛔ BLOCKED items tracked for visibility)

| # | Item | Status | Gates |
|---|---|---|---|
| A6.1 | TTSEC MOU for TTSE tokenization | ⛔ BLOCKED | R3 revenue |
| A6.2 | Wam partnership signed | ⛔ BLOCKED | R7, Premium tier Wam benefits |
| A6.3 | ViFi partnership + bridge commitment | ⛔ BLOCKED | R7, devnet Sprint 3, TTDC on-ramp |
| A6.4 | $LIMER TGE (target H2 2026) | ⛔ BLOCKED | R9, R10, champion agent real mode, $LIMER-stake agent access tiers |
| A6.5 | UWI / UTT university pilot LOI | ⛔ BLOCKED | R5 bootcamp co-brand |
| A6.6 | First B2B design partner (Republic / First Citizens / Scotiabank / Sagicor / JMMB) | ⛔ BLOCKED | R6 |
| A6.7 | T&T counsel legal opinion on Model B | ⛔ BLOCKED | Champion agent real mode (Part B Sprint 3) |

### A.7 Reconciliation summary

| Bucket | Count |
|---|---|
| ✅ DONE | 19 (+3 this session: C-02, M-06, L-02) |
| 🟡 IN PROGRESS | 6 |
| 🔴 NOT STARTED | 37 |
| ⛔ BLOCKED | 7 |
| ⚠️ GATE (subset of NOT STARTED) | 2 (C-01, H-03) — C-02 CLOSED this session |

**Headline finding:** The platform foundation is solid (16 done), but **every Sprint 1 audit critical is still open** and every revenue playbook recommendation except CSP hardening is unshipped. The three GATE items (C-01, C-02, H-03) block the agent layer and the revenue optimization playbook simultaneously — closing them is leveraged work.

---

## Part B — Agent Layer Build Checklist

Every item below references either an audit finding (A2.x), a spec section (`spec §N`), or an analysis section (`analysis §N`). Items are ordered top-to-bottom — do not jump ahead.

### B.0 Pre-sprint gates (must all close before any B.1 item starts)

| # | Gate | Owner | Evidence of closure | Est. effort |
|---|---|---|---|---|
| **B0.1** | **C-01 closed** — Squads V4 3/5 multisig holds `limer` program upgrade authority with 48h timelock | Founder + 4 signers | On-chain program upgrade authority ≠ single pubkey; multisig proposal + execution tx | 14 days (per audit §9.4) |
| **B0.2** | **C-02 closed** — Sentry DSN live in Cloudflare Pages (`VITE_SENTRY_DSN`) and Worker secret (`SENTRY_DSN`). First event captured within 24h. | Founder | Sentry dashboard showing live event stream | 30 min |
| **B0.3** | **H-03 closed** — Sumsub or Persona KYC integration live for Real Swap LIVE; attestation gate rejects swaps above FATF threshold without KYC | Founder | New `src/components/KycGate.jsx` + worker middleware on `/jupiter/swap`; test that unKYCd wallet above $1K fails | 2–3 weeks |
| **B0.4** | **Agent insurance fund seeded** — $25K USDC in new 3/5 Squads multisig; address published on platform | Founder + signers | On-chain USDC balance ≥ $25K at known address | 1 day |
| **B0.5** | **T&T legal opinion on Model B** — written opinion from qualified T&T counsel on champion agent structure (collective investment scheme risk, IAA equivalent, Cayman/BVI path) | Founder + counsel | Signed memo filed in `docs/legal/` (gitignored) | 2–4 weeks |
| **B0.6** | **0.25% vs 0.3% spot fee reconciled** — create `src/constants/fees.js`, land in same PR as R1 | Founder | New file exists; `src/test/trading.test.js:14` updated to reference constant | 1 day |
| **B0.7** | **R1 Jupiter fee live** — `platformFeeBps=15` + `feeAccount` on Squads ATA wired in `src/api/prices.js`; first fee captured on mainnet | Founder | On-chain USDC balance on fee account > 0 | 1–2 days (once B0.3 + B0.6 are green) |

**Do not proceed to B.1 until B0.1–B0.7 are all checked.** This is a hard gate, not a best-effort.

### B.1 Sprint 1 (90 days) — A2A router + Scout tier + Shadow-mode champion

Ordered by dependency, not by spec §8 order. The spec's order is rearranged per `analysis §6` to minimize regulatory exposure.

#### Week 1–2 — Foundation

| # | Task | File(s) | Maps to | Blockers |
|---|---|---|---|---|
| B1.1 | Create `src/constants/fees.js` with all bps constants (SPOT_FEE_BPS, PERP_*, JUPITER_PLATFORM_FEE_BPS, AGENT_RENT_USD, A2A_FEE_USD, A2A_PLATFORM_TAKE, REVENUE_SPLIT, STAKER_YIELD_SHARE) | `src/constants/fees.js` (NEW) | spec §2.2 | B0.6 |
| B1.2 | Define agent types | `src/types/agent.ts` (NEW) | spec §3.2 | — |
| B1.3 | Define A2A types | `src/types/a2a.ts` (NEW) | spec §5.4 | — |
| B1.4 | Revenue formula lib | `src/lib/agentRevenue.ts` (NEW) | spec §3.3 | B1.2 |
| B1.5 | A2A revenue formula lib | `src/lib/a2aRevenue.ts` (NEW) | spec §5.3 | B1.3 |
| B1.6 | $LIMER demand lib | `src/lib/limerDemand.ts` (NEW) | spec §6.3 | B1.2 |
| B1.7 | Unit tests for all formula libs | `src/test/agent.test.js` (NEW) | spec §8 item 12 | B1.4, B1.5, B1.6 |

#### Week 2–4 — A2A router (ships first, lowest regulatory risk)

| # | Task | File(s) | Maps to | Blockers |
|---|---|---|---|---|
| B1.8 | A2A orchestration worker with Ed25519 request signing | `src/workers/a2aRouter.ts` (NEW) | spec §5.5, analysis §3 Layer 2, analysis §4 C12 | B1.3 |
| B1.9 | Per-wallet rate limiter extension to `workers/api-proxy.js:checkRateLimit` | `workers/api-proxy.js` | A2.12 (M-05), analysis §3 Layer 2 | — |
| B1.10 | Recursive-call circuit breaker (max_call_depth=5, max_daily_spend_usd, cooldown) | `src/workers/a2aRouter.ts` | analysis §4 C11 | B1.8 |
| B1.11 | Progressive-trust model (call_depth tier advancement after 30 days + 100 validated calls) | `src/workers/a2aRouter.ts` + Supabase `a2a_agent_reputation` table | analysis §4 A3 | B1.8 |
| B1.12 | A2A fee collection on-chain — USDC debit caller, credit platform + callee | `src/workers/a2aRouter.ts` + `src/solana/a2aFees.js` | spec §5.5 | B1.8, B0.4 |
| B1.13 | `A2AExplorer.jsx` page — live call feed, fee stats, leaderboard | `src/pages/A2AExplorer.jsx` (NEW) | spec §8 item 11 | B1.8 |

#### Week 3–6 — RiskAgent (server-authoritative, mandatory for agent trades)

| # | Task | File(s) | Maps to | Blockers |
|---|---|---|---|---|
| B1.14 | RiskAgent worker — revalidates every signal against `AgentConfig` limits before tx construction | `src/workers/riskAgent.ts` (NEW) | analysis §3 Layer 2, A2.4 (H-01) | B1.2 |
| B1.15 | Zod schema for signal output with strict parse (no fallback heuristics) | `src/agents/signalSchema.ts` (NEW) | analysis §3 Layer 3 | B1.2 |
| B1.16 | Allowlist enforcement post-LLM (asset, sizePct, route) | `src/workers/riskAgent.ts` | analysis §3 Layer 3 | B1.14, B1.15 |
| B1.17 | 2-oracle consensus (Pyth + Switchboard) + TWAP smoothing, reject if spread >3% | `src/solana/oracles.js` (NEW) | analysis §4 B10 | — |
| B1.18 | Confidence floor logic (reject <0.6, HOLD after 5 consecutive low-confidence) | `src/workers/riskAgent.ts` | analysis §3 Layer 3 | B1.14 |
| B1.19 | Model-version pinning (`claude-sonnet-4-20250514` hardcoded in fees.js) | `src/constants/fees.js` | analysis §3 Layer 3 | B1.1 |

#### Week 4–8 — Signal agent + Scout tier on-chain program

| # | Task | File(s) | Maps to | Blockers |
|---|---|---|---|---|
| B1.20 | Signal agent with Anthropic API integration (Sonnet 4) | `src/agents/signalAgent.ts` (NEW) | spec §3.5 | B1.1, B1.15 |
| B1.21 | Prompt injection hardening: `<untrusted_market_data>` XML fences, pre-filter for jailbreak prefixes | `src/agents/signalAgent.ts` | analysis §4 A1, analysis §3 Layer 3 | B1.20 |
| B1.22 | Anchor program `agent_stake` — CPI allowlist (Jupiter V6, Orca, Raydium, Limer DEX), position-size + drawdown + stop-loss enforcement, session-key delegation | `programs/agent_stake/src/lib.rs` (NEW) | spec §3.4, §8 item 17, analysis §3 Layer 1 | B0.1 (Squads signers deploy it) |
| B1.23 | Session-key module — `validUntil`, `whitelist`, `maxFeeUSD`, 24h rolling default | `src/solana/sessionKeys.js` (NEW) | analysis §3 Layer 1, analysis §4 D16 | B1.22 |
| B1.24 | Scout-tier agent activation flow (hybrid fiat/stake) | `src/pages/AgentDashboard.jsx` (NEW) | spec §8 item 10 | B1.22, B1.23 |
| B1.25 | Stripe + Solana Pay rent checkout | `src/workers/agentBilling.ts` (NEW) | spec §3.2 billing fields | B1.24 |
| B1.26 | MEV jitter + Jito bundle routing for Scout trades | `src/workers/tradeExecutor.ts` (NEW) | analysis §4 B6 | B1.16 |

#### Week 6–10 — Shadow-mode champion agent

| # | Task | File(s) | Maps to | Blockers |
|---|---|---|---|---|
| B1.27 | Champion agent controller with `CHAMPION_SHADOW_MODE=true` hardcoded | `src/agents/championAgent.ts` (NEW) | spec §4.5 Phase 1 | B1.20 |
| B1.28 | Champion revenue projection lib (no real capital) | `src/lib/championRevenue.ts` (NEW) | spec §4.2 | B1.1 |
| B1.29 | Daily hypothetical P&L posting to platform feed | `src/pages/ChampionDashboard.jsx` (NEW) | spec §4.4 | B1.27 |

#### Week 8–12 — Audit trail + dashboards + tests

| # | Task | File(s) | Maps to | Blockers |
|---|---|---|---|---|
| B1.30 | `agent_audit_log` Supabase table with immutable append semantics | `supabase/migrations/*_agent_audit_log.sql` (NEW) | A2.7 (H-04), A2.9 (M-02), analysis §3 Layer 2 | — |
| B1.31 | Daily Merkle root anchor of audit log via `limer` program `record_audit_root` instruction | `programs/limer/src/lib.rs` (EXTEND) | analysis §3 Layer 2 | B0.1, B1.30 |
| B1.32 | Wallet-signature verification on audit log writes | `src/workers/auditLog.ts` (NEW) | A2.7 (H-04) | B1.30 |
| B1.33 | User kill-switch button in `AgentDashboard.jsx` | `src/pages/AgentDashboard.jsx` | analysis §3 Layer 4 | B1.24 |
| B1.34 | Founder kill-switch via Squads multisig — `agents_paused` global flag in program | `programs/agent_stake/src/lib.rs` | analysis §3 Layer 4 | B1.22, B0.1 |
| B1.35 | Blockaid / GoPlus transaction pre-screening on Real Swap + agent trade path | `src/workers/tradeExecutor.ts` | A2.8 (M-01), analysis §4 B8 | — |
| B1.36 | Sentry instrumentation on every agent action (signal, risk-check, execute, fail) | all agent workers | A2.2 (C-02) | B0.2 |
| B1.37 | Unit + integration test suite for agent runtime (mock Anthropic, A2A edge cases, session-key scope) | `src/test/agent.test.js`, `src/test/a2a.test.js` (EXTEND) | spec §8 item 12 | B1.7 |
| B1.38 | Global stop-loss circuit breaker — if >20% of active agents trigger SL in 5min, HOLD all for 15min | `src/workers/riskAgent.ts` | analysis §4 B9 | B1.14 |

#### Week 10–12 — Launch preparation

| # | Task | File(s) | Maps to | Blockers |
|---|---|---|---|---|
| B1.39 | Immunefi bronze-tier bug bounty program scoped to agent runtime + A2A router + RiskAgent | external | A2.14 (L-01), analysis §3 Layer 4 | B1.38 |
| B1.40 | Public "Agent Layer Safety Commitment" doc (ToS, insurance fund address, kill-switch procedure, incident response SLA) | `docs/Limers-Capital-Agent-Layer-Safety-Commitment.md` (NEW) | analysis §2.3, §6 | all above |
| B1.41 | Environment variables set in Cloudflare Worker secrets (JUPITER_FEE_ACCOUNT, SQUADS_MULTISIG_ADDRESS, STRIPE_*, AGENT_RENT_STRIPE_PRICE_*, A2A_FEE_COLLECTION_WALLET, CHAMPION_SHADOW_MODE=true, LIMER_TOKEN_MINT) | `workers/wrangler-api.toml` + secrets | spec §10 | all above |
| B1.42 | Feature flag — Scout tier behind `FEATURE_AGENT_SCOUT=true`, off by default | `src/config/featureFlags.js` (NEW) | analysis §6 Sprint 1 | all above |
| B1.43 | Soft launch: 10 invited beta users on Scout tier; monitor for 14 days | operational | — | B1.42 |
| B1.44 | Public launch: Scout tier open to KYC'd users with feature flag on | operational | analysis §6 Sprint 1 | B1.43 |

### B.2 Sprint 2 (months 4–6) — Trader tier + champion Phase 2 + A2A reputation

| # | Task | Maps to |
|---|---|---|
| B2.1 | Trader tier unlock (spot + LP + Jupiter routing, 5 assets) | spec §3.6 |
| B2.2 | Champion agent Phase 2 — real capital with $250K AUM cap | spec §4.5, analysis §6 Sprint 2 |
| B2.3 | A2A reputation scoring — call outcomes validated, trust-tier advancement | analysis §4 A3 |
| B2.4 | R4 perp fee redesign live on devnet with maker rebate | A3.4 |
| B2.5 | `agent_audit_log` Merkle anchor production rollout | B1.31 |
| B2.6 | Trader tier marketing (LimerSignals R8 cross-promotion) | A3.8 |

### B.3 Sprint 3 (at TGE, or later) — Alpha tier + champion Phase 3 + Institutional

| # | Task | Maps to | Blockers |
|---|---|---|---|
| B3.1 | Alpha tier (perps + all routes + unlimited assets) | spec §3.6 | B2.4 perp engine stable for 90 days |
| B3.2 | Champion Phase 3 — uncapped AUM | spec §4.5 | B0.5 legal opinion, 60+ days of Phase 2 success |
| B3.3 | Institutional tier (500K $LIMER or $299/mo) with priority A2A routing | spec §6.2 | TGE |
| B3.4 | Third-party A2A provider registration (opens network) | analysis §7 q4 | B2.3 reputation scoring mature |
| B3.5 | On-chain `AGENT_STAKE_PROGRAM_ID` PDA lock/unlock for agent access | spec §8 item 17 | TGE |
| B3.6 | Real-time `compareAccessModels()` sensitivity on AgentDashboard | spec §6.4 | B3.5 |

### B.4 Continuous / ongoing

| # | Task |
|---|---|
| B4.1 | Weekly Sentry review — investigate every `agent-circuit-breaker` warning |
| B4.2 | Monthly insurance fund balance audit (on-chain verification) |
| B4.3 | Quarterly penetration test against agent runtime (Immunefi or contracted) |
| B4.4 | Monthly review of A2A reputation tier distribution — detect Sybil clustering |
| B4.5 | Weekly `agent_audit_log` Merkle-root anchor verification |
| B4.6 | Per-release: `npm audit --audit-level=high` must pass CI (A2.15 / L-02) |

---

## Part C — Decision points requiring founder input before B1 starts

These are the open questions from `analysis §7` that need answers before the sprint begins. Answering these in a single founder-office session unblocks the entire Part B plan.

1. **Sprint ordering confirmed?** Ship A2A router + Scout tier first, defer Alpha/Trader to Sprint 2–3? (Recommendation: yes.)
2. **C-01 migration parallel or gate?** Run Squads migration as a hard pre-sprint gate (recommended) or in parallel with B1 foundation work?
3. **Personal underwriting cap?** What is the max per-user loss the founder will underwrite personally before insurance fund covers? Determines Scout-tier AUM cap ($1K / $5K / uncapped).
4. **A2A openness at launch?** Closed (internal agents only) for first 6 months, or open to third-party registration from day 1?
5. **Champion shadow-mode duration?** Fixed 60 days, or milestone-gated ($1M hypothetical P&L + Sharpe >1.0)?
6. **Hybrid fiat/stake tilt?** 60/40 fiat/staking (recommended) or pure-fiat for maximum rent ARR?
7. **Insurance fund replenishment trigger?** 50% of next month's platform share if drawn down, or direct treasury reserves?
8. **Contractor for UI?** Budget for part-time frontend contractor on `AgentDashboard.jsx` / `A2AExplorer.jsx` / `ChampionDashboard.jsx` to keep solo-founder load manageable?

---

## Part D — Quick wins that don't block the agent layer

These should ship in parallel because they're cheap and each unlocks ARR or closes an audit finding:

| # | Item | Effort | Why now |
|---|---|---|---|
| D1 | Immunefi bronze-tier bug bounty (A2.14) | $5K pool | Ships independent of B.1, protects entire platform |
| D2 | `npm audit` CI enforcement (A2.15) | 1 line | One-commit fix |
| D3 | FMP ticker whitelist (A2.13 / M-06) | 10 lines | One-commit fix |
| D4 | Service worker cache bounds (A2.10 / M-03) | 20 lines | Defensive |
| D5 | Colosseum demo video (A5.3) | 1 day | Deadline-driven |
| D6 | R2 Premium SaaS 3-tier repricing | 3–4 weeks | Independent revenue line |
| D7 | R8 LimerSignals standalone product | 2–3 weeks | Uses same Anthropic API as agent signals — infrastructure reuse |

---

## Summary

- **Part A** surfaced 16 DONE items, 6 IN PROGRESS, 40 NOT STARTED, and 7 BLOCKED. The three GATE items (C-01 Squads, C-02 Sentry, H-03 KYC) block both the agent layer and the revenue optimization playbook simultaneously.
- **Part B** is a 44-task Sprint 1 build plan for the agent layer, ordered by dependency, starting with A2A router (lowest regulatory risk, highest moat) and ending with soft + public Scout-tier launch. Every task references an audit finding or spec section.
- **Part C** lists 8 founder decisions that must be made before B.1 begins.
- **Part D** lists 7 parallel quick wins that should ship alongside the agent work.

**The next concrete action is a founder-office session to answer Part C questions, followed by scheduling the 14-day C-01 Squads migration as the first block of work.** Every other item depends on C-01 closing.

---

**END OF CHECKLIST**
