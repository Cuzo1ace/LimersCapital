# Limer's Capital — Fundraising Application Pipeline

**Last updated**: 2026-04-18
**Source research**: `docs/audits-2026-04-18/04-funding-track-map.md`
**Purpose**: Ranked, actionable checklist of every grant / accelerator / bounty / credit program Limer's should file. Living document — update the **Status** column as things move.

## How this document works

- **One row per program.** Sorted by tier (0 = file this week; 4 = dead).
- **Status column** uses one of: `☐` not started / `✎` drafting / `📨` submitted / `💬` replied / `✅` awarded / `❌` rejected / `🕐` watch-list.
- **When a new program surfaces** (new Superteam bounty, new Solana Foundation RFP, etc.) add a row in the appropriate tier and note the discovery date.
- **Every program has a "Next action"** — a single sentence describing what the founder does next. If the next action requires an artifact that doesn't exist yet (e.g., "Caribbean legal entity" for Compete Caribbean), that's flagged in the Notes column as a blocker.

## Priority summary — do these IN ORDER

**This week (Tier 0):**
1. Crossmint Startup Program — [draft exists](./crossmint-application-draft.md), fill 5 TODOs, email outreach
2. Helius Startup Launchpad — 30 min application
3. Superteam Instagrant #1 (Dialect Blinks) — ~1 hour
4. Superteam Instagrant #2 (Pyth feed) — ~1 hour

**Concurrent with Frontier build (Tier 1, by May 11):**
5. Colosseum Solana Frontier submission — dual-submit Grand + Public Goods
6. Solana Mobile Builder Grants — only if you actually ship the Android wrapper

**Queue for May 12+ (Tier 2, after Frontier):**
7–11. Solana Foundation / Compete Caribbean / IDB Lab / Metaplex / Jupiter DAO

**Monitor monthly (Tier 3):** Circle grants (reopen watch), Caribbean FinTech Sprint.

**Do not revisit (Tier 4):** a16z CSX, Alliance ALL18, StableHacks, MoonPay/Ramp/Mercuryo "builder programs", Dynamic.

---

## Tier 0 — File this week

### 1. 🔥 Crossmint Startup Program

| Field | Value |
|---|---|
| **Status** | ✎ Drafted |
| **URL** | https://www.crossmint.com/startup-program (apply URL 404s — use `sales@crossmint.com`) |
| **Deadline** | Rolling |
| **Prize** | $100k+ in credits + fundraising support + marketing + investor intros |
| **Fit** | 8 / 10 |
| **Probability** | ~50% |
| **Expected value** | ~$30k in credits + intro value |
| **Effort to submit** | ~1 day (draft already in repo) |
| **Next action** | Fill 5 `{{ TODO }}` placeholders in `docs/fundraising/crossmint-application-draft.md`, then email `sales@crossmint.com` with Sections 1 + 5 + 8 of the draft as body. Subject: `Limer's Capital × Crossmint Startup Program — Caribbean RWA + USDPT remittance rail`. |
| **Notes** | Western Union USDPT launch (March 2026) is the exact off-ramp we need. Biggest non-hackathon EV this quarter. |

### 2. 🔥 Helius Startup Launchpad

| Field | Value |
|---|---|
| **Status** | ☐ Not started |
| **URL** | https://www.helius.dev/startup-launchpad |
| **Deadline** | Rolling |
| **Prize** | 8 months free Business-tier RPC (~$2–5k value) + investor intros + mentorship |
| **Fit** | 7 / 10 |
| **Probability** | ~70% |
| **Expected value** | ~$3k |
| **Effort to submit** | ~30 minutes |
| **Next action** | Fill the form with: company = Limer's Capital, stage = pre-seed, chain = Solana, current usage = Helius devnet + mainnet proxied via `limer-api-proxy` worker. Use the one-line pitch from Crossmint § 1. |
| **Notes** | We already use Helius. Free Business RPC saves measurable monthly cost at scale. Highest acceptance probability of any Tier 0 program. |

### 3. 🔥 Superteam Instagrant #1 — Dialect Blinks integration

| Field | Value |
|---|---|
| **Status** | ☐ Not started |
| **URL** | https://in.superteam.fun/instagrants (or https://earn.superteam.fun/grants/) |
| **Deadline** | Rolling (48–72hr decisions) |
| **Prize** | ~$1k |
| **Fit** | 8 / 10 |
| **Probability** | ~60% |
| **Expected value** | ~$600 |
| **Effort to submit** | ~1 hour |
| **Next action** | Ship a Solana Blink that lets users swap mTTDC → any mStock with a single click from a Twitter/Farcaster post. Limer's has swap working already — this is a thin wrapper. Submit Blink URL + GitHub commit + 30-second demo video with the Instagrant application. |
| **Notes** | Instagrants are **retroactive-friendly** — file after shipping. |

### 4. 🔥 Superteam Instagrant #2 — Pyth oracle publisher for TTSE prices

| Field | Value |
|---|---|
| **Status** | ☐ Not started |
| **URL** | Same as #3 |
| **Deadline** | Rolling |
| **Prize** | ~$5k |
| **Fit** | 9 / 10 (Caribbean + RWA + oracle = triple-good narrative) |
| **Probability** | ~50% |
| **Expected value** | ~$2.5k |
| **Effort to submit** | 2–3 days of engineering + 1 hour application |
| **Next action** | Stand up a Pyth publisher node that reads the existing TTSE HTML proxy (`ttse-proxy` Cloudflare Worker) every 5 minutes and publishes 5 price feeds (WCO / NEL / RFHL / GKC / NGL) to Pyth Pull Oracle. Submit Pyth feed IDs + GitHub repo + cost-per-update writeup. |
| **Notes** | Unlocks multiple future grants (Jupiter DAO wants real oracle data for Caribbean assets; Solana Foundation public-goods if oracle is open-source). Double-dipper. |

---

## Tier 1 — Concurrent with Frontier build (by May 11)

### 5. 🏆 Colosseum Solana Frontier Hackathon

| Field | Value |
|---|---|
| **Status** | ☐ Not started — **highest priority of everything on this page** |
| **URL** | https://colosseum.com/frontier |
| **Deadline** | **2026-05-11** (23 days from today as of writing) |
| **Prize** | $30k Grand + $10k × 20 runner-ups + $10k University + $10k Public Goods + 10+ accelerator slots × **$250k pre-seed each** |
| **Fit** | 10 / 10 |
| **Probability** | 30% for ≥ $10k tier; 10% for Grand or accelerator |
| **Expected value** | ~$25–35k cash + optional $25k EV accelerator slot |
| **Effort to submit** | 2–3 days of polish on demo video + pitch + writeup |
| **Next action** | Dual-submit for Grand + Public Goods. Public Goods framing = open-source AMM Anchor program + open-source learn-to-earn curriculum + Caribbean financial-inclusion narrative. Demo video: 90-second user journey — onboard → claim mTTDC → swap for mWCO → read AI market brief. Credibility multiplier if TTSEC engagement receipt is attached. |
| **Notes** | This is the flagship. Every Tier 0 win is a supporting signal for this submission. `zircon` won Public Goods in Renaissance for pure education — dual-qualify path is real. |

### 6. Solana Mobile Builder Grants

| Field | Value |
|---|---|
| **Status** | ☐ Not started |
| **URL** | https://solanamobile.com/grants |
| **Deadline** | Rolling, auto-considered via Frontier submission if the mobile box is checked |
| **Prize** | Up to $10k per team × 10 teams |
| **Fit** | 7 / 10 — **only if you actually ship an Android build** |
| **Probability** | ~50% if you actually ship it |
| **Expected value** | ~$5k |
| **Effort to submit** | 7–10 days of Capacitor/Tauri wrapper + MWA + Seed Vault integration |
| **Next action** | Decide in the next 48 hours: do we wrap the PWA as an Android app for Frontier, or not? If yes, Capacitor is the fastest path. MWA integration is the minimum viable. If no, skip this row. |
| **Notes** | First-time Caribbean crypto users are overwhelmingly mobile. Seeker dApp Store placement is a distribution moat. But engineering lift competes directly with Frontier polish — honest tradeoff. |

---

## Tier 2 — Queue for immediately after Frontier (May 12+)

### 7. Solana Foundation convertible grant

| Field | Value |
|---|---|
| **Status** | ☐ Not started (blocked on Frontier result as validation signal) |
| **URL** | https://solana.org/grants-funding |
| **Deadline** | Rolling |
| **Prize** | $50k–$250k typical, paid as convertible grant (converts if Limer's raises) |
| **Fit** | 9 / 10 |
| **Probability** | ~50% |
| **Expected value** | ~$50k (weighted) |
| **Effort to submit** | 2–3 days after Frontier |
| **Next action** | Submit post-Frontier with: Frontier placement (if any), Caribbean financial-inclusion impact metrics, open-source AMM + curriculum (public-goods hybrid framing), regulatory positioning. Lean on three Foundation theses simultaneously: emerging markets + tokenized equities + education. |
| **Notes** | Convertible grant is the right instrument — founder-friendly, doesn't force a priced round. |

### 8. Compete Caribbean Blockchain Innovation Initiative

| Field | Value |
|---|---|
| **Status** | ☐ Blocked on legal entity |
| **URL** | https://www.competecaribbean.org/blockchain-innovation-initiative/ |
| **Deadline** | Rolling 60-day windows |
| **Prize** | $25k–$200k technical assistance grant |
| **Fit** | 10 / 10 — the single most aligned non-crypto program on earth for Limer's |
| **Probability** | ~50% once entity exists |
| **Expected value** | ~$50k |
| **Effort to submit** | 5–7 days proposal writing |
| **Next action** | **INCORPORATE IN T&T FIRST.** This program exists exactly for regional private-sector blockchain companies — it's the one grant that is literally the Limer's thesis. Founder should schedule T&T incorporation for Week 1 of the month after first-cash lands (Crossmint credits / Superteam Instagrants / Helius RPC savings). Then file. |
| **Notes** | Letters of support from TTSE / TTSEC / CBTT Innovation Hub materially increase probability — pursue those in parallel. |

### 9. IDB Lab — Caribbean Loans / Grants

| Field | Value |
|---|---|
| **Status** | ☐ Not started |
| **URL** | https://bidlab.org/en/home/caribbean-loans-call-proposals |
| **Deadline** | Rolling |
| **Prize** | Mix of grants + debt; size varies |
| **Fit** | 7 / 10 |
| **Probability** | ~30% |
| **Expected value** | ~$30k |
| **Effort to submit** | 2–3 days writing + 3–6 months IDB review |
| **Next action** | Frame Limer's as MSME financial-inclusion infra — local equity access for unbanked retail. Requires measurable financial-inclusion KPIs and a partnership letter from a T&T bank or credit union. |
| **Notes** | IDB processes are slow. File this in parallel with Compete Caribbean in Month 2 post-Frontier. |

### 10. Metaplex DAO Grants

| Field | Value |
|---|---|
| **Status** | ☐ Blocked on Core NFT implementation |
| **URL** | https://www.metaplex.com/grants |
| **Deadline** | Rolling, DAO-governed |
| **Prize** | Varies — Creator pool has 2k SOL (~$300k at allocation), community grants reviewed on merit |
| **Fit** | 6 / 10 (would be 9 with Core NFTs shipped) |
| **Probability** | ~30% |
| **Expected value** | ~$10k |
| **Effort to submit** | 5–7 days engineering (Core NFT UBO badges) + application |
| **Next action** | Ship Metaplex Core NFT implementation for UBO badges (currently bitmaps on the `limer` Anchor program — Phase A2 on the devnet roadmap). Once live, apply with Metaplex usage volume + user NFT-mint count. |
| **Notes** | Limer's already uses Metaplex metadata on all 5 mStocks — the foundation is there. |

### 11. Jupiter DAO Grants

| Field | Value |
|---|---|
| **Status** | ☐ Blocked on Jupiter integration |
| **URL** | https://discuss.jup.ag/t/jupiter-dao-grants/22681 |
| **Deadline** | Rolling (governance-based) |
| **Prize** | Up to $10k; unbounded for workgroup formation |
| **Fit** | 5 / 10 (would be 7 with Jupiter aggregation integrated) |
| **Probability** | ~30% |
| **Expected value** | ~$3k |
| **Effort to submit** | 3–4 days (integrate Jupiter aggregation as fallback) + governance forum post |
| **Next action** | Integrate Jupiter aggregation as the fallback swap route when the Limer's AMM doesn't have a pool for a requested pair. Then post to `discuss.jup.ag` pitching "Jupiter × Caribbean" as an unfilled regional expansion wedge. |
| **Notes** | Low priority — defer until Jupiter integration ships for other reasons. |

---

## Tier 3 — Watch list (monitor monthly)

### 12. 🕐 Circle Developer Grants

| Field | Value |
|---|---|
| **Status** | 🕐 Closed — "check back early 2026" |
| **URL** | https://www.circle.com/grant |
| **Prize** | $5k–$100k USDC |
| **Fit** | 9 / 10 if it reopens — Caribbean remittance + USDC thesis is a direct match |
| **Next action** | Set a monthly reminder for the 1st of each month to check the URL. When the 2026 cycle opens, file immediately — our Crossmint USDPT narrative extends cleanly to native USDC rails. |

### 13. 🕐 Caribbean FinTech Sprint (EU-UNCDF-OACPS)

| Field | Value |
|---|---|
| **Status** | 🕐 No active 2026 call |
| **URL** | (No single URL — search UNCDF + OACPS quarterly) |
| **Prize** | Up to $100k per winner, max 5 winners |
| **Fit** | 9 / 10 if a call opens |
| **Next action** | Monitor UNCDF and OACPS press releases quarterly. The 2025 cycle had T&T + Jamaica + Barbados as eligible jurisdictions — if the 2026 cycle repeats, Limer's is a natural applicant. |

---

## Tier 4 — Dead / skip (do not revisit)

Documented so we don't burn cycles re-researching.

| Program | Status | Why skipped |
|---|---|---|
| **a16z CSX (Spring 2025 cohort)** | ❌ Closed | Closed February 2025. No 2026 round announced as of 2026-04-18. |
| **Alliance DAO ALL18** | ❌ Too far out | Starts September 2026. It's investment (not grant) anyway — belongs in the VC-outreach pipeline, not the grant pipeline. |
| **StableHacks (March 2026)** | ❌ Expired | Deadline passed. Monitor for next edition. |
| **MoonPay / Ramp / Mercuryo "builder programs"** | ❌ Don't exist as grants | These are SDK signups with promotional credits, not fundable programs. Use them as vendors when they solve a problem, not as capital sources. |
| **Dynamic** | ❌ Acquired | Acquired by Fireblocks October 2025. Now enterprise custody sales, not a startup-friendly builder credits program. |
| **Chainlink BUILD** | ❌ Enterprise only | Not an early-stage program. Partnership-only. |
| **JIIF / Jito Angel Network** | ❌ India-only | Geographic restriction incompatible with Caribbean focus. |
| **Jito NCN grants** | ❌ Wrong fit | Only relevant if Limer's runs a restaking-aligned Solana validator. We do not. |
| **CDB Cultural and Creative Industries Innovation Fund** | ❌ Wrong fit | Cultural/creative focus. Limer's is fintech. |

---

## Open questions — to resolve before Month 2

These are tracked here so they don't get lost. Founder should answer at the end of the Frontier push (post-May 11):

1. **When does T&T incorporation happen?** Compete Caribbean and IDB Lab are both blocked on this. Recommended trigger: the first cash-equivalent landing event (Crossmint credits are counted as a landing event for morale purposes even if they're not cash).
2. **Who becomes the second signer on the Squads multisig?** Currently 2-of-3 is pre-provisioned but only the founder signs. Bringing in a second signer de-risks bus-factor and strengthens every application from Tier 2 onward (accelerators specifically care about this).
3. **Regulatory letters of support** — what's the path to a TTSEC / CBTT / TTSE letter, even a 1-paragraph one? These are force-multipliers on Compete Caribbean + IDB Lab + Solana Foundation.
4. **Who writes the grant proposals for Compete Caribbean / IDB Lab?** Those are 5–7 days each of proposal writing. Founder-time-bound. Consider a specialist grant writer for those two (the grant budgets can absorb a ~$2-3k writer fee).
5. **Is there a priced-round fundraise path we should parallel-track?** The Colosseum accelerator $250k slot is a convertible / SAFE path. The Solana Foundation grant is convertible. Compete Caribbean is pure grant. At some point the mix pushes toward a real round — the post-Frontier debrief is the natural time to decide.

---

## Template for adding new rows

When a new program surfaces, copy this:

```markdown
### N. [emoji] [Program name]

| Field | Value |
|---|---|
| **Status** | ☐ / ✎ / 📨 / 💬 / ✅ / ❌ / 🕐 |
| **URL** | [direct apply link or contact email] |
| **Deadline** | [absolute date or "rolling"] |
| **Prize** | [cash / credits / intros / mixed] |
| **Fit** | [1–10] |
| **Probability** | [%] |
| **Expected value** | [$k] |
| **Effort to submit** | [hours / days] |
| **Next action** | [one sentence: what the founder does next] |
| **Notes** | [context, dependencies, double-dipping notes] |
```
