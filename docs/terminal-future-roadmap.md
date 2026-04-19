# Terminal · Future Solana-Primitive Roadmap

_Captured April 18, 2026. Synthesis of 12 Colosseum Copilot queries (April 15 memory snapshot) + web research (Colosseum Frontier sponsor list, Arcium RFP, CoinDesk April 2026 coverage). Load this doc to pick up strategic work without re-researching._

## Strategic premise

Privacy is uniquely under-sponsored at Frontier (only Arcium + Vanish, both with explicit RFPs) and uniquely fits Caribbean small-market culture (TTSE/JSE are socially visible markets where retail investors genuinely want hidden books). The three-primitive stack below compounds: each layer enables the next.

## Three-primitive stack (build in order)

### Sprint 1 · Arcium Confidential Portfolio (5–8 days)
- Private Mode toggle on the Portfolio panel header
- Arcis framework + one encrypted instruction computing aggregate P/L from encrypted positions
- C-SPL-wrapped mTTDC for hidden balances
- Simulation panel gets a "computed confidentially" badge
- Directly hits Arcium RFP: "confidential portfolios/treasuries"
- **Caribbean fit**: TTSE and JSE are tiny, socially visible markets — local investors genuinely don't want neighbors/brokers seeing their book. Privacy is cultural, not technical.
- **Judge fit**: Arcium is one of only two Frontier privacy sponsors; their RFP literally lists "confidential portfolios/treasuries" as a priority.

### Sprint 2 · Terminal Access Pass → compressed NFT evolution (3–5 days)
- April 18 sprint shipped an mpl-core Asset pass. Sprint 2 upgrades it to a **Light Protocol compressed NFT** so minting 10,000 passes costs ~$5 total
- Tie mint eligibility to learn-to-earn graduation — completing the 8 modules unlocks claim
- Elite-club cohort NFTs (cohort number as metadata attribute)
- Keep the "Immutable / soulbound" semantics
- **Why**: converts the bespoke credential into a scalable cohort distribution mechanism without changing the gating contract.

### Sprint 3 · Blinks for regional-exposure sharing (2–3 days)
- Share your `"Caribbean share: 45.9% · regionally anchored"` lens as a Solana Action
- Receivers land on an aggregate-only view (Arcium privacy from Sprint 1 preserved) with a "run your own Monte Carlo" CTA deep-linking into the Terminal
- Meets users on WhatsApp, the #1 Caribbean comms channel
- First-party Solana primitive Phantom supports natively
- **Judge fit**: novel use of Blinks — most submissions use them for token swaps; regional-exposure sharing is uncharted.

## Why this sequence
- Sprint 1 gives judges the novel primitive integration they're paying for
- Sprint 2 converts the quick-and-dirty Access Pass into a scalable cohort distribution mechanism
- Sprint 3 adds viral social distribution on top of the private substrate
- Stacked, the three primitives tell a single story: **"graduate → get credentialed → invest privately → share selectively"**

## Skip list — do NOT build despite hype
- **Jito restaking / Sanctum LSTs** — no Frontier sponsor presence; saturated retail feature; not Caribbean-specific
- **Parcl tokenized real estate** — no sponsor; we already own the RWA/TTSE angle more defensibly
- **Pyth Entropy "mystery boxes"** — no sponsor; judges read as generic/gimmicky
- **Another embedded wallet** (Swig / Privy / MoonPay) — wallet-standard already wired; this is the most over-sponsored category at Frontier (4 sponsors)

## Alternative "cool toy" candidates (ranked, considered April 18)
| # | Toy | Build cost | On-chain native | Fun/judge | Status |
|---|-----|-----------|-----------------|-----------|--------|
| 1 | **mpl-core Access Pass NFT** (replaces Supabase gate) | 3hr | ✓✓✓ | ✓✓ | **Shipped April 18** |
| 2 | On-chain portfolio attestation (Memo program) | 2hr | ✓✓ | ✓ | future |
| 3 | Solana Blinks for regional-exposure sharing | 3–4hr | ✓ | ✓✓✓ | **Sprint 3 above** |
| 4 | Pyth Hermes live prices in Research panel | 2hr | ✓ | ✓ | cheap follow-up |
| 5 | Devnet SOL + mTTDC auto-airdrop "welcome pack" | 1hr | ✓ | ✓ | folded into Access Pass wizard |
| 6 | "Save book as cNFT snapshot" via Bubblegum | 4hr+ | ✓✓✓ | ✓✓ | consider in Sprint 2 |
| 7 | Wallet-signed portfolio imprint (off-chain sig) | 2hr | ✓ | ✓ | skip — weak primitive |
| 8 | Solana Pay QR to fund paper-trading from mobile | 2hr | ✓✓ | ✓✓ | future |
| 9 | Live devnet tx feed on Dashboard | 2hr | ✓ | ✓✓ | future |
| 10 | Watchlist persisted to a user PDA | 3hr | ✓✓ | ✓ | future |

## Sponsor/research context to preserve
- **Colosseum Frontier sponsor tag counts** (April 2026): agents (6), payments (4), wallet (3), defi (3), privacy (2), identity (2), treasury (1), nfts/tokens (1). Privacy is the scarcest serious category.
- **Arcium RFP** explicitly names: confidential portfolios/treasuries, C-SPL wrapped stablecoins, confidential lending/perps, private payroll, MPC-vaults with recovery policies, encrypted AI-agent delegation.
- **Vanish** has a published **$10,000** bounty for best Core API integration.
- **CoinDesk Solana coverage** themes (April 2026): Drift $270M exploit, Tether/USDT replacing USDC on Drift, DoubleZero rolling out Wall-Street-grade data infra, Solana Foundation security overhaul, quantum-threat readiness. Theme: institutional tradfi + security are the macro narrative.

## References
- Memory: `project_competitive_landscape.md` — 48 Colosseum projects, 3-cluster convergence thesis, Credible Finance deep-dive + Kanoo Group relational leverage
- Memory: `colosseum_review_benchmark.md` — March 2026 review (8.2/10), category scores, priority gaps
- Memory: `project_rwa_research.md` — TTSE tokenization 5-layer architecture
