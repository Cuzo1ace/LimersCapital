# Limer's Capital — Fundraising Side-Quest Map

**Prepared:** April 18, 2026. All dates verified on/after 2026-04-18 unless flagged as expired.
**Frame:** Solana Frontier hackathon submission is May 11 — every action in this doc must serve that window or be a low-lift "after Frontier" application.

---

## Executive Summary (read this, then stop)

### The one thing that matters

**Solana Frontier Hackathon, submission May 11, 2026.** This is the single biggest expected-value bet available to Limer's in the next 60 days. No tracks, one pool: $30k Grand Champion, $10k × 20 runner-ups, $10k University, $10k Public Goods, and 10+ accelerator slots at **$250k pre-seed each**. Public-goods angle (education curriculum + open-source AMM + Caribbean financial inclusion) is a legitimate second shot on the same submission. Everything else in this doc is either (a) already-inside-Frontier-window side quests to mine while building or (b) the "next application after Frontier" queue.

### Top 5 tracks by expected value (pursue in order)

| # | Track | Prize ceiling | Deadline | Est. EV |
|---|-------|---------------|----------|---------|
| 1 | **Colosseum Solana Frontier Hackathon** — Grand + Public Goods dual-submit | $30k + $10k + $250k accel | **May 11, 2026** | ~$30k |
| 2 | **Colosseum accelerator (auto-flow from Frontier)** | $250k pre-seed | Same app | ~$40k |
| 3 | **Solana Foundation convertible grant** (file post-Frontier) | $50k–$250k typical | Rolling | ~$25k |
| 4 | **Compete Caribbean Blockchain Innovation Initiative** | $25k–$200k | Rolling calls, 60-day windows | ~$20k |
| 5 | **Superteam Instagrants + targeted bounties** | $1k–$10k each, stack | Rolling, 48–72hr decisions | ~$8k aggregate |

### Top 5 features by track-coverage + user value

| # | Feature | Tracks unlocked | Lift | Stars |
|---|---------|-----------------|------|-------|
| 1 | **SAS-based KYC attestation + allow-list transfer hook** | Frontier RWA angle, Solana Foundation RWA, Compete Caribbean, TTSEC sandbox | 10–14 days | ★★★★★ |
| 2 | **Solana Mobile (Seeker) wrapper of existing PWA** | Solana Mobile Builder Grants ($10k), dApp Store distribution, Frontier public-goods | 7–10 days | ★★★ |
| 3 | **Caribbean Index structured product (basket of 5 mStocks)** | Frontier DeFi/RWA, StableHacks-style future editions, IDB Lab financial inclusion | 5–7 days | ★★★★ |
| 4 | **Western Union/Crossmint off-ramp for mTTDC** | Crossmint Startup Program ($100k+), Frontier payments angle, Circle grants, IDB Lab | 8–12 days | ★★★★★ |
| 5 | **Open-source "Tokenize-Your-Exchange" SDK** | Solana Foundation public goods, Superteam Instagrants, Compete Caribbean, Metaplex DAO | 10–14 days | ★★★ |

**Double-dippers (≥3 tracks):** Features 1, 4, and 5. Sequence in that order if you only have 3 weeks.

### The honest take

- Colosseum Frontier is the only sub-$10k-effort, >$30k-EV bet on the board in April 2026. Everything else is a slower add-on.
- The Solana Foundation, Compete Caribbean, IDB Lab, and Superteam are all **rolling** — they can wait 30 days while the founder ships Frontier.
- Most "wallet infra" programs (Privy, Dynamic-now-Fireblocks, Crossmint) are commercial sales funnels with credits attached, not grants. Treat them as cost subsidies, not revenue. Crossmint's **$100k+ Startup Program** is the single exception worth filing this week — explicit Western Union integration gives Limer's a real remittance angle.
- Ignored entirely (or flagged as dead): a16z CSX (Spring 2025 cohort closed Feb 2025 — no 2026 round announced yet), Alliance DAO ALL18 (Sep 2026 start, too far out), Jito NCN grants (only relevant if Limer's runs a restaking-aligned validator — not the case), JIIF/Jito Angel Network (India-only), MoonPay/Ramp/Mercuryo "builder programs" (don't exist as grants — they're SDK signups), Chainlink BUILD (enterprise partnership only, not early-stage), StableHacks (March 2026 — expired).

---

## Deliverable 1: Ranked tracks / grants / bounties

### Tier 1 — Ship in the next 30 days

---

**1. Solana Frontier Hackathon (Colosseum)**
- **URL:** `colosseum.com/frontier`
- **Deadline:** May 11, 2026 (submissions)
- **Prize:** $30k Grand + $10k × 20 runner-ups + $10k University + $10k Public Goods + 10+ accelerator slots × $250k pre-seed
- **Fit:** 10/10
- **Why it fits:** No tracks = no gating. The convergence thesis (paper trading + education + tokenized equities + Caribbean) already fits the "most impactful product" rubric. `zircon` won Public Goods in Renaissance for pure education — Limer's can dual-qualify.
- **What to add/emphasize to win:**
  1. Public Goods framing — highlight open-source AMM, open quiz curriculum, Caribbean financial inclusion
  2. A 90-second demo video showing the full user journey (onboard → buy mTTDC → swap for mWCO → read AI brief)
  3. TTSEC sandbox application receipt or CBTT Innovation Hub correspondence as proof of regulatory path
- **Application lift:** Medium — 2–3 days of polish on pitch, demo, writeup
- **Probability:** 30% for ≥ $10k tier, 10% for Grand or accelerator
- **EV:** ~$25–35k

**2. Colosseum Accelerator (auto-flow from Frontier)**
- **URL:** Same submission
- **Deadline:** Same (interviews roll to June)
- **Prize:** $250k pre-seed per team, 10+ slots
- **Fit:** 9/10
- **Why it fits:** `credible-finance` (C4 cohort) is the direct structural analog. Colosseum has repeatedly backed regulator-partnership plays in emerging-market corridors.
- **What to add/emphasize:**
  1. Credible Finance reference — "we are Credible for Caribbean equities" is a one-line framing the accelerator already understands
  2. ViFi partnership commitment letter or equivalent
  3. Post-mainnet traction numbers, even if small (first 10 real users > 1000 devnet users)
- **Lift:** Low (bundled with Frontier)
- **Probability:** 10%
- **EV:** ~$25k

**3. Solana Mobile Builder Grants**
- **URL:** `solanamobile.com/grants` / `docs.solanamobile.com/grants`
- **Deadline:** Rolling, auto-considered via Frontier submission (check the mobile box)
- **Prize:** Up to $10k per team × 10 teams
- **Fit:** 7/10 — requires shipping an Android build with Mobile Wallet Adapter + Seed Vault
- **Why it fits:** First-time Caribbean crypto users are overwhelmingly mobile. A Seeker dApp Store placement creates a distribution moat no web-first competitor has.
- **What to add:**
  1. MWA + Seed Vault integration (the docs spec)
  2. One Seeker-only feature (e.g., hardware-attested quiz completion)
  3. dApp Store submission package (screenshots, store copy)
- **Lift:** Medium — 7–10 days for a Capacitor/Tauri wrapper + MWA
- **Probability:** 50% if you actually ship it
- **EV:** ~$5k

**4. Crossmint Startup Program**
- **URL:** `crossmint.com/startup-program`
- **Deadline:** Rolling
- **Prize:** "$100k+ in rewards, fundraising, marketing" (mostly credits + intros; check-size ambiguous)
- **Fit:** 8/10
- **Why it fits:** Crossmint announced USDPT with Western Union on Solana in March 2026 — this is the actual fiat off-ramp rail for Caribbean remittance. Signing up embeds Limer's in their showcase queue.
- **What to add:** Concrete integration plan (USDPT + Western Union cash pickup in T&T) and one user-story video
- **Lift:** Low — 1 day application, 8–12 days integration
- **Probability:** 50%
- **EV:** ~$30k in credits/marketing + intro value

---

### Tier 2 — Queue for immediately after Frontier (May 12 onward)

**5. Solana Foundation Grant (standard or convertible)**
- **URL:** `solana.org/grants`
- **Deadline:** Rolling
- **Prize:** Standard grants for public-goods projects; convertible grants for commercial projects ($50k–$250k typical)
- **Fit:** 9/10 — Limer's has both a public-goods layer (curriculum, open AMM) and a commercial layer (retail gateway)
- **Why it fits:** Emerging-market + tokenized equities + education = three Solana Foundation theses at once. The convertible grant is the right instrument (converts if Limer's raises).
- **What to emphasize:**
  1. Caribbean financial-inclusion impact metrics (22 countries, underserved retail)
  2. Open-sourcing the quiz content + AMM (turns commercial project into public goods hybrid)
  3. Frontier hackathon result as validation
- **Lift:** Medium — 2–3 days after Frontier results
- **Probability:** 50%
- **EV:** ~$50k (weighted)

**6. Compete Caribbean Blockchain Innovation Initiative (BII)**
- **URL:** `competecaribbean.org/blockchain-innovation-initiative`
- **Deadline:** Rolling calls with 60-day application windows
- **Prize:** $25k–$200k technical assistance grant
- **Fit:** 10/10 — Caribbean-chartered, blockchain-specific, grant (not loan), targets regional private sector
- **Why it fits:** This is the single most aligned non-crypto grant program on earth for Limer's. It exists exactly for companies like this.
- **What to add:**
  1. T&T incorporation or regional co-founder status
  2. Letters of support from TTSE / TTSEC / CBTT Innovation Hub
  3. Budget for TTD-denominated off-ramp buildout
- **Lift:** High — 5–7 days of proposal writing, needs Caribbean legal entity
- **Probability:** 50%
- **EV:** ~$50k

**7. IDB Lab (Caribbean Loans / Grants)**
- **URL:** `bidlab.org/en/home/caribbean-loans-call-proposals`
- **Deadline:** Rolling; T&T is explicit IDB-6 Caribbean country
- **Prize:** Mix of grants + debt; size varies
- **Fit:** 7/10 — financial-inclusion angle only, not tokenization per se
- **Why it fits:** Limer's can frame itself as MSME financial-inclusion infra (local equity access for unbanked retail).
- **What to add:** Measurable financial-inclusion KPIs, partnership with a T&T bank or credit union
- **Lift:** High — IDB processes are slow (2–3 days of writing + 3–6 months of review)
- **Probability:** 30%
- **EV:** ~$30k

**8. Superteam Instagrants (multiple)**
- **URLs:** `in.superteam.fun/instagrants`, `earn.superteam.fun/grants/`
- **Deadline:** Rolling, 48–72 hr decisions
- **Prize:** $1k–$15k each (Blinks $1k, CoinDCX $15k, Dialect $1k, Texas Blockchain $10k, generic $1k–$10k)
- **Fit:** 8/10 — file 2–3 tightly scoped ones (one per quiz module = one Instagrant)
- **Why it fits:** Fastest capital on the Solana ecosystem. Each is a micro-grant attached to a specific action (ship a Blink, ship a Dialect integration, ship a Pyth oracle feed).
- **What to add:** Already-built integration proof; Instagrants are explicitly retroactive-friendly
- **Lift:** Low — 1 hour per application
- **Probability:** 60%
- **EV:** ~$5k × 3 = ~$15k stacked

**9. Metaplex Creator / DAO Grants**
- **URL:** `metaplex.com/grants`
- **Deadline:** Rolling, DAO-governed
- **Prize:** Varies; Creator pool has 2k SOL (~$300k at time of allocation), community grants reviewed on merit
- **Fit:** 6/10 — only if Limer's adds a dynamic NFT layer (UBO badges per `project_rwa_research.md`)
- **Why it fits:** Limer's already uses Metaplex metadata on all 5 mStocks. Upgrading UBO badges from bitmap to Core NFTs unlocks this path.
- **What to add:**
  1. Metaplex Core NFT implementation for UBO badges
  2. Proof of Metaplex usage volume
- **Lift:** Medium — 5–7 days (per the devnet-roadmap memory, this is already on the plan)
- **Probability:** 30%
- **EV:** ~$10k

**10. Helius Startup Launchpad**
- **URL:** `helius.dev/startup-launchpad`
- **Deadline:** Rolling
- **Prize:** 8 months of free Business-tier RPC (~$2–5k value) + investor intros + mentorship
- **Fit:** 7/10 — not cash but materially reduces infra cost
- **Why it fits:** Limer's already uses RPC heavily for the news map + live stock data + AMM reads. Locked-in for 8 months.
- **Lift:** Low — 30 minutes
- **Probability:** 70%
- **EV:** ~$3k

**11. Jupiter DAO Grants**
- **URL:** `discuss.jup.ag/t/jupiter-dao-grants/22681`
- **Deadline:** Rolling governance-based
- **Prize:** Up to $10k (or unbounded for workgroup formation)
- **Fit:** 5/10 — only applies if Limer's routes swaps through Jupiter or contributes to Jupiter's LATAM/Caribbean expansion
- **What to add:** Integrate Jupiter aggregation as fallback route; pitch "Jupiter x Caribbean" as an unfilled gap
- **Lift:** Medium — 3–4 days (integration + governance forum post)
- **Probability:** 30%
- **EV:** ~$3k

---

### Tier 3 — Low-priority / informational

**12. T&T Joint Regulatory Innovation Hub (TTSEC + CBTT + FIUTT)**
- Not a grant — a regulatory sandbox. VASP sandbox entry deadline (Jan 22, 2026) is **expired**, but the hub is ongoing. File a letter of engagement post-Frontier to strengthen every other grant application. Zero cash EV, but it unlocks Compete Caribbean + IDB Lab credibility.

**13. CDB Cultural and Creative Industries Innovation Fund (CIIF)**
- Not a fit. Cultural/creative focus; Limer's is fintech. Skip.

**14. Caribbean FinTech Sprint (EU-UNCDF-OACPS)**
- Up to $100k per winner, max 5 winners. No active 2026 call in search results. Monitor quarterly.

**15. TokenTon26 (DeAura Capital Group)**
- $8,500 × 3 tracks (AI / Consumer / DeFi). Confirm on Superteam Earn. DeFi track is 8/10 fit; 2-day writeup. **Lift:** low. **EV:** ~$1.5k per track × 3 = ~$4.5k.

**16. Dead / expired / wrong-fit**
- a16z CSX Spring 2025 (closed Feb 2025 — no 2026 cohort announced)
- Alliance DAO ALL18 (Sep 2026 start; apply May–June — investment not grant, belongs in VC pipeline)
- StableHacks (Mar 22 deadline — expired)
- Solana AI Agent Hackathon (Feb 2–12 — expired)
- Solana Privacy Hack (Jan 12–Feb 1 — expired)
- Solana x402 Hackathon (Oct–Nov 2025 — expired)
- MONOLITH Solana Mobile hackathon (Mar 9 — expired)
- Circle Developer Grants (application window "currently closed, check back early 2026" — watch for reopening; $5k–$100k USDC, very strong fit if reopens)
- MoonPay / Ramp / Mercuryo "builder programs" — do not exist as grants
- Dynamic — acquired by Fireblocks Oct 2025. Now enterprise custody.
- Wormhole / LayerZero grants — none active in 2026; both are partnership discussions

---

## Deliverable 2: Features that unlock more tracks

### Ranked by track-count × user-value ÷ lift

---

**Feature 1: SAS-based KYC attestation + allow-list transfer hook**
- **Description:** Use Solana Attestation Service to bind Sumsub/Persona KYC results to wallet addresses, then gate mStock transfers via Token-2022 transfer hooks that check attestations.
- **Tracks unlocked:** Frontier (RWA/compliance angle), Solana Foundation convertible grant (institutional-grade RWA), Compete Caribbean BII, TTSEC sandbox credibility, future RWA-specific Colosseum editions
- **Engineering lift:** 10–14 days (SAS integration 3d, transfer hook 4d, Sumsub sandbox 3d, test/audit 4d)
- **User value:** ★★★★★ — directly unblocks mainnet launch under TTSEC guidance
- **Strategic risk:** New compliance obligation — once you attest, you're accountable for attestation quality. Sumsub dep could be expensive ($1.35/verification). Mitigation: tier users — anonymous browsing free, attested trading paid.
- **Sequence note:** **Prerequisite for everything TTSEC-adjacent.** Build this first.

**Feature 2: Caribbean Index structured product (5-mStock basket)**
- **Description:** On-chain rebalancing vault that holds mWCO/mNEL/mRFHL/mGKC/mNGL in TTSE-weighted proportions. Single "mCARIX" token exposes retail to the full index.
- **Tracks unlocked:** Frontier DeFi/RWA, Solana Foundation public goods, IDB Lab financial-inclusion, future StableHacks editions
- **Engineering lift:** 5–7 days (vault contract 3d, rebalance oracle 2d, frontend 2d)
- **User value:** ★★★★ — solves the "I don't know which stock to pick" onboarding problem
- **Strategic risk:** Rebalance failure modes (pool depth, oracle stale). Mitigation: weekly rebalance, not daily; gated by AMM reserve floor.
- **Sequence note:** Unlocks clean demo narrative for Frontier ("one-click exposure to Caribbean equities").

**Feature 3: Solana Mobile (Seeker) wrapper**
- **Description:** Wrap the existing PWA as a Capacitor/Tauri Android build with MWA + Seed Vault. Ship to dApp Store.
- **Tracks unlocked:** Solana Mobile Builder Grants ($10k), dApp Store distribution, Frontier mobile-friendly-UX narrative
- **Engineering lift:** 7–10 days
- **User value:** ★★★ — Caribbean users are mobile-first, but PWA already works
- **Strategic risk:** dApp Store review cycle; MWA API surface changes. Low strategic risk overall.
- **Sequence note:** Can run in parallel with Features 1+2.

**Feature 4: Western Union / Crossmint mTTDC off-ramp**
- **Description:** Integrate Crossmint + Western Union USDPT rail so users can swap mTTDC → USDPT → cash pickup at any WU location in T&T/Jamaica/Barbados.
- **Tracks unlocked:** Crossmint Startup Program ($100k+ credits), Circle grants (if they reopen), Frontier payments angle, IDB Lab financial-inclusion, Compete Caribbean, Caribbean FinTech Sprint (next cycle)
- **Engineering lift:** 8–12 days (Crossmint SDK integration 3d, USDPT swap path 3d, WU payout UX 2d, compliance flow 2d, test 2d)
- **User value:** ★★★★★ — solves the "how do I actually get my money out" question
- **Strategic risk:** Becomes a money-transmitter in T&T by behavior if not careful — **requires TTSEC/CBTT guidance first.** Mitigation: structure Crossmint as the MSB-of-record, Limer's as pure front-end.
- **Sequence note:** Prerequisite = Feature 1 (KYC attestations). Do not ship without it.

**Feature 5: Open-source "Tokenize-Your-Exchange" SDK**
- **Description:** Extract the TTSE minting + metadata + AMM pool setup into a reusable TypeScript package so Jamaica (JSE), Barbados (BSE), and ECCU issuers can fork it.
- **Tracks unlocked:** Solana Foundation standard grant (public goods), Superteam Instagrants, Compete Caribbean, Metaplex DAO grants
- **Engineering lift:** 10–14 days (extract 4d, docs 4d, example integration 3d, npm publish + CI 3d)
- **User value:** ★★★ — doesn't help existing Limer's users directly, but 10x's credibility
- **Strategic risk:** Contributors filing issues you have to service. Mitigation: MIT license, "best effort maintained."
- **Sequence note:** **This is the Frontier Public-Goods submission.**

**Feature 6: AI Caribbean-dialect stock explainer**
- **Description:** Extend the existing Claude Haiku worker with a "explain this stock in T&T English / Jamaican Patois / Bajan" mode.
- **Tracks unlocked:** Frontier consumer/UX, future Solana AI hackathons, Superteam content bounties
- **Engineering lift:** 3–5 days (prompt engineering + UI toggle)
- **User value:** ★★★★ — huge emotional stickiness for the target user
- **Strategic risk:** Low. Dialect outputs may occasionally miss; ship with "beta" disclaimer.
- **Sequence note:** Quick win for Frontier demo video.

**Feature 7: Trading competition w/ leaderboard**
- **Description:** 30-day competition where users' mTTDC P&L is tracked on-chain; winners get faucet-funded mTTDC rewards.
- **Tracks unlocked:** Frontier consumer, Superteam growth bounties, aligns with `the-arena` / `rekt` prize-proven pattern
- **Engineering lift:** 5–7 days
- **User value:** ★★★★ — brings the education → trading loop full-circle
- **Strategic risk:** May attract sybils; mitigate with SAS attestation gate (Feature 1 dep).
- **Sequence note:** Great launch-week narrative post-Frontier.

**Feature 8: LP vaults with auto-rebalancing (Kamino-style)**
- **Description:** Wrap existing AMM pools in a vault strategy that auto-compounds LP fees and rebalances between the 6 pools.
- **Tracks unlocked:** Frontier DeFi, Solana Foundation DeFi grant, Jito TipRouter / restaking grants (tangential)
- **Engineering lift:** 10–14 days
- **User value:** ★★★ — sophisticated users only
- **Strategic risk:** Vault admin key is a new attack surface. Mitigate by routing it through the Squads v4 multisig already in place.
- **Sequence note:** Post-Frontier. Not a hackathon feature — it's a moat feature.

**Feature 9: Cross-chain bridge (Wormhole NTT) for mTTDC**
- **Description:** Deploy Wormhole Native Token Transfers so Ethereum/Base/Polygon users can bridge into mTTDC.
- **Tracks unlocked:** Wormhole ecosystem showcase (not a cash grant), Frontier interop angle, expanded TAM
- **Engineering lift:** 7–10 days
- **User value:** ★★ — most Caribbean users won't have EVM assets; it's a diaspora play (Caribbean nationals in US/UK)
- **Strategic risk:** Bridge is historically the highest-exploit surface in crypto. Use NTT (locked-and-mint with Wormhole guardians), not a custom bridge.
- **Sequence note:** Post-Frontier. Good for Breakout 2026 (Sep 28–Nov 2) narrative.

**Features to deprioritize:**
- **DePIN sensor network for crop insurance:** 4–6 weeks minimum, requires hardware supply chain Limer's does not have.
- **SOL staking / restaking for TTDC collateral:** Changes the trust model of TTDC fundamentally. Do this after a real audit.
- **Referral program with on-chain attribution:** Good, but not grant-unlocking. Build post-Frontier as growth.

---

## Recommended 24-hour action plan

1. **Hour 0–1:** File Crossmint Startup Program application (low-friction, highest non-hackathon EV).
2. **Hour 1–2:** File Helius Startup Launchpad.
3. **Hour 2–4:** File 2 Superteam Instagrants (scope to specific shipped features: e.g., Dialect Blinks integration on mStock swap; Pyth oracle feed for mStock prices).
4. **Hour 4–24:** Focus 100% on Frontier submission polish — the demo video, public-goods framing, and the Caribbean Index (Feature 2) if you can ship it before May 11.

**Do not pursue pre-Frontier:** Solana Foundation grant, Compete Caribbean, IDB Lab, Metaplex DAO. These are 3–7 day writeups each and should queue for May 12–June 15.

---

## Sources

- [Colosseum Solana Frontier Hackathon](https://colosseum.com/frontier)
- [Announcing the Solana Frontier Hackathon](https://blog.colosseum.com/announcing-the-solana-frontier-hackathon/)
- [Solana Foundation Grants & Funding](https://solana.org/grants-funding)
- [Solana Foundation convertible grants](https://solana.com/news/solana-foundation-convertible-grants-investments)
- [Solana Mobile Builder Grants](https://solanamobile.com/grants)
- [Solana Mobile Builder Grants docs](https://docs.solanamobile.com/grants)
- [Crossmint Startup Program](https://www.crossmint.com/startup-program)
- [Crossmint × Western Union USDPT on Solana (March 2026)](https://crypto.news/western-union-usdpt-stablecoin-solana-crossmint-2026/)
- [Helius Startup Launchpad](https://www.helius.dev/startup-launchpad)
- [Superteam Earn (grants + bounties index)](https://earn.superteam.fun/)
- [Superteam Instagrants application](https://in.superteam.fun/instagrants)
- [Jupiter DAO Grants](https://discuss.jup.ag/t/jupiter-dao-grants/22681)
- [Metaplex Grants](https://www.metaplex.com/grants)
- [Compete Caribbean Blockchain Innovation Initiative](https://www.competecaribbean.org/blockchain-innovation-initiative/)
- [IDB Lab Caribbean Loans call](https://bidlab.org/en/home/caribbean-loans-call-proposals)
- [TTSEC Joint Fintech Media Release](https://www.ttsec.org.tt/joint-fintech-media-release/)
- [CBTT Joint Regulatory Innovation Hub](https://www.central-bank.org.tt/fintech-and-payments/joint-regulatory-innovation-hub/)
- [Solana Attestation Service](https://attest.solana.com/)
- [Introducing Solana Attestation Service](https://solana.com/news/solana-attestation-service)
- [a16z Crypto Startup Accelerator](https://a16zcrypto.com/accelerator/)
- [Circle Developer Grants](https://www.circle.com/grant)
- [Solana Ecosystem Roundup: March 2026](https://solana.com/news/solana-ecosystem-roundup-march-2026)
