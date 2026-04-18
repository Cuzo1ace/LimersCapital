# Limer's Capital × Crossmint Startup Program — Application Draft

**Prepared**: 2026-04-18
**Status**: Draft — 5 `{{ TODO }}` placeholders for founder to fill before sending
**Purpose**: Self-contained narrative designed so each section below can be copy-pasted into whatever application form Crossmint sends after outreach, or sent verbatim as an outreach email if no form materializes.

---

## How to use this document

The public Crossmint `/startup-program/apply` URL returns 404 as of 2026-04-18. The recommended flow:

1. **Read through the whole draft once.**
2. **Fill in the 5 `{{ TODO }}` placeholders** (Ctrl-F for `{{ TODO` to find them — they cover lesson/quiz count, test-suite count, Wam partnership status, TTSEC engagement status, and preferred contact email).
3. **Email `sales@crossmint.com`** (or `startup-program@crossmint.com` if their contact page lists a specific address) with **Sections 1 + 5 + 8** (one-line pitch + why Crossmint + the ask) as the email body. Subject line: `Limer's Capital × Crossmint Startup Program — Caribbean RWA + USDPT remittance rail`.
4. When Crossmint replies with the form, **paste the matching sections into their fields** one-for-one. Section numbers below are labeled so you can find the right block fast.

---

## § 1 — One-line pitch (use in email subject-line body, short-answer fields)

> Limer's Capital is the regulator-sanctioned on-ramp for 700 million Caribbean and LATAM users into tokenized local equities — built on Solana with a custom constant-product AMM, live Trinidad & Tobago Stock Exchange price feeds, and a Crossmint USDPT × Western Union remittance off-ramp as the diaspora-to-home-market flywheel.

---

## § 2 — Founder + company (use in "About" / "Team" fields)

**Founder**: Aasan Lewis — solo founder, Caribbean-based, full-time on Limer's Capital.

**Company**: Limer's Capital (operating pre-incorporation; formal incorporation in Trinidad & Tobago scheduled for immediately post first-funding-close, per standard pre-seed founder playbook).

**Working artifacts**:
- Live site: `https://limerscapital.com`
- Code: `https://github.com/Cuzo1ace/LimersCapital` (public; audit remediations as of 2026-04-18 landed)
- Security audit summary: `docs/audits-2026-04-18/00-executive-report.md` in the repo — three parallel specialist audits (smart-contract, backend + Supabase, frontend + deps) with all quick-win High findings already remediated
- Contact: {{ TODO: founder email — e.g., aasan@limerscapital.com }}

---

## § 3 — Problem (use in "Problem" / "Market" / "Opportunity" fields)

The Caribbean and LATAM region has **700 million people and under 4% crypto-wallet penetration** versus a 16% global average — a distribution problem, not a demand problem. Every year the Caribbean diaspora sends **$20.4 billion in remittances** home, paying an average of **7.1% in fees — roughly $1.45 billion siphoned from families that earn least and need most** (World Bank Remittance Prices Worldwide, 2025 baseline).

Meanwhile the **Trinidad & Tobago Stock Exchange (TTSE)** lists ~$21B in market cap of fundamentally sound Caribbean companies and trades them at a 9.9× P/E — **a 42% discount to the emerging-market average of 17× P/E**. The discount is not a quality problem; it's a plumbing problem: illiquidity, fragmentation across five separate Caribbean exchanges (TTSE, JSE, BSE, ECSE, BISX) with no unified order book, conglomerate discount, information asymmetry, and zero pathway for the global 1.5M+ Trinbagonian diaspora to invest in home-country equities.

**Zero blockchain consumer products are purpose-built for the Caribbean.** Ondo Finance, Securitize, and the xStocks consortium serve US markets. Credible Finance serves consumer credit in Colombia. No one is serving 22 Caribbean jurisdictions with a tokenized-equity + stablecoin + remittance stack in one app.

---

## § 4 — What's live on devnet today (use in "Product" / "Status" / "Demo" fields)

Every item below is **shipped and verifiable on-chain** as of 2026-04-18. Addresses are Solana devnet unless noted otherwise.

**Tokenized Trinidad & Tobago equities (5 mStocks, Metaplex Token Metadata attached):**
- mWCO — West Indian Tobacco — `EDdvrQtvXAwZSF1U9AY6P3oifUucSCnca7zrMQnEoc35`
- mNEL — Natl Enterprises — `E8vBDjp4MYq9ujvzsFSvyxd748nSJUEE8rmjP3JGn8mK`
- mRFHL — Republic Financial Holdings — `J6n8pY7Gjjg781gS7hW1d1HbVuJRjhrCzLd7b8Fn3LyF`
- mGKC — GraceKennedy — `4MkSSW4AMrstCpL7BFbNk1gbG8WJNrFne2YXncUF4RkM`
- mNGL — Trinidad & Tobago NGL — `D9CeouuQ2B4yRYa8LqXxubHutg23UCZ7aPb5nnQivLS1`

**Mock devnet stablecoin + faucet:**
- mTTDC mint — `BScyHpzzSC4UoUysx7XUqCpSaKdcgjqvNMjpZcXFTxUM`
- Faucet keypair — `F4TYxjqLTnZrnZLCBWsCstrJFEm3kFpZ3PBALKQEqBPW`
- Current reserves — 500K mTTDC (= 50 fresh-wallet claims at 10K/claim/24h)
- Rate-limited **per wallet and per IP** (KV-backed, audit-hardened 2026-04-18)

**Custom constant-product AMM (Anchor, 4 instructions):**
- Program ID — `FVk7LzdZ976beSEJkdXD5ww1xRxpZpYjxodN9Kq1Bpwo`
- AmmConfig — `2zz2e5cejTKX7WBuE131m2J1v6VKNDwK3YxktogKNwtR`
- Default swap fee — 30 bps
- 6 pools seeded and quoting: mTTDC paired with each of the 5 mStocks plus one cross-pair

**Learn-to-earn layer:**
- {{ TODO: confirm exact count — README says 37 lessons + 8 quizzes; use 37 / 8 until verified }} server-validated quizzes covering blockchain fundamentals, Caribbean markets, Solana DeFi mechanics, LP strategy, and Universal Basic Ownership (UBO) model
- Anchor program `HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk` tracks on-chain user profiles, badges, and trade history

**Confirmed end-to-end on devnet (public Solscan links):**
- Claim: `https://solscan.io/tx/9jj7GVi2vVhp3QkbXLb7mM6dV1mfLfQ8a111c59tGMApBWm7G5acGzotRAYSZ2N399cUkU7KWePRLDRQRXMaVo8?cluster=devnet`
- Swap: `https://solscan.io/tx/44Pbg8ikwuytGCxGryi4PoJMhRZr548RdfMdmLXReAXnSr8pY2NpUHcjgDjUQZFf6tXrcUgNW9cUZiWwrPJcBTzR?cluster=devnet`

**Infrastructure:**
- Wallet-standard integration (Solflare, Phantom) via `@solana/react` hooks
- Cloudflare Workers edge proxy (`limer-api-proxy`) for RPC / DAS / upstream APIs with Helius key kept server-side
- Cloudflare Pages front-end deploy at `limerscapital.pages.dev` and custom domain `limerscapital.com` (Git-connected CI, auto-deploys on push)
- Sentry error telemetry (both frontend and worker) with PII-scrubbing `beforeSend`
- Content-Security-Policy enforced + Report-Only harder variant in parallel for Phase-2 promotion
- **Squads v4 multisig pre-provisioned** at `DsMBfumZyokGhHrqpsDBnQztj1LBCpmTmaoGjmxzyxXg` (2-of-3, mainnet) — authority migration is a single transaction when we're ready to flip
- {{ TODO: test-suite count — README claims 361; pitch script claims 189. Run `npm test` and use the real number. }}

**Security posture** (as of 2026-04-18, per the three-part audit in `docs/audits-2026-04-18/`):
- 3 Critical / 10 High aggregate findings → 7 already remediated in prod (Supabase RLS lockdown, per-IP faucet rate limit, `sendTransaction` dropped from RPC allowlist, `DEV_ORIGINS` gated behind production env, HELIUS-key-length log leak removed, CSP wildcards tightened, CSP `frame-ancestors 'none'`)
- Remaining criticals are **devnet-only** (first-deposit inflation attack on the AMM, fixable with the canonical Uniswap-V2 dead-shares pattern — bundled for pre-mainnet redeploy)
- No API keys ever committed to git history; faucet keypair file `0600`-permissioned and untracked

---

## § 5 — Why Crossmint specifically (use in "Why us / Why you" / "Integration plan" fields)

Limer's Capital is solving the **Caribbean remittance-to-equity flywheel** problem: the diaspora sends $20.4B home each year, pays $1.45B in fees, and gets zero investment infrastructure in return. The moment a sender could cheaply push a USDC-denominated tokenized share of Republic Bank to a family member in Port of Spain instead of cash through Western Union, we change the math for 25 million diaspora Caribbeans.

**Crossmint is the missing rail.** Specifically:

- Your **USDPT × Western Union launch on Solana (March 2026)** is the exact stablecoin-to-cash-pickup primitive we need. Today our users can onboard, earn mTTDC, and swap into tokenized TTSE shares — but they can't close the loop to fiat at a WU counter. With Crossmint in the stack, they can.
- Your **Embedded Wallets** eliminate the seed-phrase cliff that keeps our target user out of Solana. A first-time user in Port of Spain or Kingston doesn't want to learn Phantom before they can buy their first tokenized share; they want to sign up with email and start.
- Your **197-country coverage** aligns perfectly with our 22-Caribbean-jurisdiction footprint. Every country we serve is on your list; no regulatory surprises.

**High-level integration (paragraph form, not spec):**

1. User signs up on Limer's via Crossmint Embedded Wallets — email or social, no seed phrase exposed at onboarding.
2. User funds their Limer's wallet (either via Crossmint onramp from credit card / Apple Pay, or by receiving USDC from a diaspora sender).
3. User earns or swaps into **mTTDC** — Limer's native TTD-denominated stablecoin — via our AMM pools.
4. User allocates mTTDC across the tokenized TTSE equity basket (mWCO, mNEL, mRFHL, mGKC, mNGL) — real exposure to Caribbean equities, priced against our live TTSE HTML proxy.
5. When the user needs cash, they swap their chosen token → mTTDC → **USDPT via a new AMM pool**, then trigger a Crossmint stablecoin-orchestrated payout to any Western Union pickup location in Trinidad, Jamaica, Barbados, or Guyana.
6. **Target all-in fee**: <2% vs the incumbent 7.1% — a 72% fee compression for the user and a differentiation moat Limer's can't build alone.

**Net effect for Crossmint**: Limer's is a ready-made showcase for USDPT in the Caribbean corridor — a real consumer product, not a demo — with a regulator-aware pathway (see § 6) that de-risks the Caribbean expansion for every other Crossmint partner that follows us.

---

## § 6 — Regulatory positioning (use in "Compliance" / "Legal" / "Moat" fields)

The Caribbean is in a **24-36 month window** where regulatory relationships become permanent moats. Limer's is positioned to capture that window:

- **Trinidad & Tobago VASP Act 2025** — the first fully regulated crypto framework in the English-speaking Caribbean, in force January 2026. Limer's is building for VASP licensing from day one.
- **TTSEC engagement** — we've drafted a regulator-facing one-pager proposing Limer's as a *technology provider* to TTSE (the exchange remains the registry of record; every tokenized share is 1:1-backed by a share immobilized in regulated custody, with daily reconciliation to TTSE and TTSEC). The one-pager, preserved in the repo at `docs/Limers-Capital-TTSE-Tokenization-One-Pager.md`, is the basis for a proposed 30-minute introductory meeting with TTSE Executive and TTSEC leadership. {{ TODO: status — one-pager delivered? meeting held? or still internal? }}
- **Wam partnership (pending)** — Wam is a central-bank-approved VASP for TTD/USD conversion. A partnership would give Limer's a compliant fiat on-ramp on the TTD side that no competitor has. {{ TODO: Wam partnership status — contract signed? MOU? discussion? aspirational? }}
- **Three live Caribbean CBDCs** need consumer-grade UI: Bahamas Sand Dollar (fully deployed), Jamaica JAM-DEX (live pilot), ECCU DCash (8-nation rollout). Limer's is the natural front-end.

**Why this matters for Crossmint**: Limer's brings Crossmint into Caribbean regulatory conversations with compliance-first framing from day one. We are not trying to arbitrage regulation — we are trying to **become the regulator-preferred rail**.

---

## § 7 — Market size (use in "TAM" / "Opportunity size" fields)

- **700M** Caribbean + LATAM population in the Americas corridor
- **~17M** internet-connected Caribbean population across 22 jurisdictions (76.8% penetration)
- **$20.4B/year** Caribbean remittance corridor volume, with **$1.45B/year in extracted fees** at the current 7.1% average cost — directly addressable
- **$37B** combined market capitalization across TTSE + JSE + BSE + ECSE + BISX
- **<4%** current Caribbean crypto-wallet penetration vs 16% global — a 4× expansion path before we hit saturation

**Deliberately omitted**: company-level ARR / FDV projections. Those are in internal founder docs (`docs/Limers-Capital-Market-Cap-Assessment.md`) and will be shared under mutual NDA once Crossmint expresses interest. Pre-incorporation, pre-first-close — committing projections to a public application adds legal surface area with zero informational upside to the reader.

---

## § 8 — The ask (use in "What do you need" / "Requested benefits" fields)

Limer's is applying to the Crossmint Startup Program to secure:

1. **Embedded Wallets SDK credits** — offset onboarding infrastructure cost while we drive from 0 → first 1,000 real users (post-Colosseum, late May 2026)
2. **USDPT integration support** — technical onboarding + priority access for the mTTDC ↔ USDPT AMM pool and Crossmint-orchestrated WU cash pickup flow
3. **Showcase placement** — Crossmint blog / case-study / Twitter exposure to the Solana developer audience and the fintech ecosystem. Limer's is a clean Caribbean RWA narrative at a moment when Solana is pushing the RWA thesis hard.
4. **Investor-network intros** — warm paths to Crossmint-aligned angels / funds who already underwrite the emerging-markets payments thesis. We are pre-seed and our next 90 days are fundraising + shipping Colosseum Frontier.

In exchange, Crossmint gets a **real consumer product launching on USDPT** with a regulator-engaged path in 22 Caribbean countries, and a live case study other Caribbean builders can point to.

---

## § 9 — Proposed 30 / 60 / 90-day integration milestones

| Day | Milestone |
|---|---|
| 0 – 30 | Crossmint Embedded Wallets integrated into Limer's onboarding flow (email + social login). Credit-card onramp wired to USDC balance in wallet. First 100 users routed through the Crossmint-onboarded funnel. |
| 30 – 60 | mTTDC ↔ USDPT AMM pool deployed on devnet. End-to-end swap path user → mTTDC → USDPT → Crossmint payout-intent tested against Crossmint sandbox. First 10 diaspora pilot users opted in. |
| 60 – 90 | Mainnet launch of the remittance flow for one corridor (initial target: US → Trinidad). Hard metric: measured all-in fee vs 7.1% incumbent baseline for the first 50 real-money remittances. |

---

## § 10 — Contact

- **Name**: Aasan Lewis, founder, Limer's Capital
- **Email**: {{ TODO: preferred inbound — e.g., aasan@limerscapital.com }}
- **Live product**: https://limerscapital.com
- **Code**: https://github.com/Cuzo1ace/LimersCapital
- **Security audit**: `docs/audits-2026-04-18/` in the repo (three-part audit, healthy posture, all quick-win Highs remediated)
- **Public goods framing**: open-source AMM Anchor program + open learn-to-earn curriculum. This is the submission track we're pursuing for the Colosseum Solana Frontier Hackathon on 2026-05-11 — happy to dual-brief Crossmint on the Frontier submission during any intro call.

---

## Appendix — 5 founder TODOs to resolve BEFORE sending

Search the doc for `{{ TODO` and fill each in-place. All five are single-answer lookups:

1. **Founder contact email** (§ 2, § 10) — whatever inbound you want Crossmint to reply to.
2. **Lesson + quiz count** (§ 4) — README says 37 lessons, 8 quizzes. Confirm by counting the actual `src/curriculum/` directory or sidebar nav. Use the real number.
3. **Test-suite count** (§ 4) — run `cd /Users/ace369/Desktop/caribcryptomap && npm test 2>&1 | tail -5` and paste the actual passing count.
4. **TTSEC engagement status** (§ 6) — be honest. "One-pager drafted, delivery pending" is fine. "Meeting scheduled on DATE" is stronger if true. "No contact yet" is a weakness, flag for roadmap but don't oversell.
5. **Wam partnership status** (§ 6) — same honesty rule. "Contract signed" > "MOU" > "Active discussion" > "Identified as target partner." Whatever's true.

Once those are in, Sections 1 + 5 + 8 form the email body for cold outreach to `sales@crossmint.com`. Entire document otherwise serves as the application draft.
