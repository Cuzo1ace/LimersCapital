# LIMER'S CAPITAL — COLOSSEUM APPLICATION PACKAGE

**Purpose**: ready-to-submit content for Limer's Capital's next Colosseum hackathon application. Drafted April 15, 2026 from the competitive landscape evidence in `memory/project_competitive_landscape.md` and the live codebase at commit `d475966`.

**Next edition**: TBD. Colosseum's `/filters` endpoint returns four completed editions (Renaissance Mar 2024 → Radar Sep 2024 → Breakout Apr 2025 → Cypherpunk Sep 2025). Historical cadence is roughly spring + fall, which would put the next edition in **April-May 2026 (imminent)** or **September-October 2026**. Verify current status at **[arena.colosseum.org](https://arena.colosseum.org/)**. If a spring 2026 edition is live, apply this week. If not, hold this package for the fall 2026 window.

---

## 1 · TL;DR — the submission strategy

**Apply to at least three tracks simultaneously.** Credible Finance's 2nd Place Stablecoins win at Cypherpunk ($20,000) came from a submission that entered **DeFi + Infrastructure** tracks but won a **Stablecoins** prize — proving Colosseum judges move prize placements across tracks when a submission straddles categories. Limer's three-cluster convergence thesis is perfectly suited to this "enter multiple, win where the judges think you fit best" dynamic.

**Primary track**: `Consumer Apps` — toaster.trade won 4th Place Consumer Apps at Cypherpunk ($10k) for a TikTok-style social trading UX. Limer's is the Caribbean-facing consumer tokenization app, a cleaner fit than the gambling-adjacent entries.

**Secondary track**: `DeFi` — where xStocks / tokenization / paper trading sit. bananazone won 4th Place DeFi Breakout ($10k), rekt won 3rd Place DeFi Cypherpunk ($15k).

**Tertiary track**: `Stablecoins` — where the TTDC + ViFi integration thesis lives. Credible Finance v2 won $20k here with a USD-INR remittance rail — exact structural parallel.

**Wildcard**: `RWAs` — this track exists in the Cypherpunk taxonomy but **returned zero projects** when I queried it via the Copilot corpus. Either nobody submitted, or nobody placed. An uncontested prize category is an uncontested prize category. Enter it.

**Prize target**: 4th-3rd place in at least one of DeFi / Consumer Apps / Stablecoins = $10k-$15k. Realistic ceiling given current platform maturity. Credible Finance hit 2nd Place Stablecoins ($20k) with a narrower but more revenue-proven product; Limer's will likely place slightly lower unless the demo knocks judges flat.

**The elevator pitch for judges**: *"Cypherpunk had 5 paper trading projects, 3 tokenized stock infrastructure projects, and 2 LATAM stablecoin prize winners. None combined them. None targeted the Caribbean. We do all four in one Solana-native platform with a real xStocks / Ondo Global Markets / Dinari catalog already live in production."*

---

## 2 · The submission content (ready to paste)

### Project name

**Limer's Capital**

### One-liner (25 words)

Caribbean-native Solana platform combining gamified education, paper trading, and a live 32-token xStocks / Ondo Global Markets / Dinari catalog for global capital market access.

### Short description (60 words, Colosseum-style)

Limer's Capital is the Caribbean's first Solana gateway to global capital markets. Users learn DeFi through a gamified curriculum, practice on real-market paper trades, and hold tokenized equities (AAPL, NVDA, SPY, TSLA via xStocks/Ondo), yield-bearing treasuries, metals, and currencies — all in one app, aimed at the Trinidad & Tobago diaspora and the TTSE modernization thesis.

### Long description (400 words, for the detailed submission field)

The Trinidad & Tobago Stock Exchange trades at a 9.9× PE — a 42% discount to emerging markets and 53% below developed markets — across a $21 billion market cap of fundamentally sound Caribbean companies. This is not a quality problem. It's a plumbing problem: illiquidity, fragmentation, T+3 settlement, limited diaspora access, and zero price discovery for the 1.5 million Trinbagonians living overseas. Meanwhile, Solana has become the home of tokenized US equities at institutional scale — xStocks crossed $3B in on-chain volume by January 2026, and WisdomTree brought its full suite of regulated tokenized funds to Solana the same month.

Limer's Capital bridges these two worlds. We ship a single Caribbean-facing platform that unifies three things no single Solana builder has ever combined: **(1) gamified DeFi education** with XP / LP / NFT-ready badge progression; **(2) real-market paper trading** with Pyth-grade prices and a basis-spread widget showing live NASDAQ prices next to every tokenized stock — a differentiator we believe no other tokenization frontend ships; and **(3) a production 32-token catalog** spanning xStocks (Apple, Amazon, Tesla, NVIDIA), Ondo Global Markets (Microsoft, Alphabet, SPY, QQQ, VTI, IWM), Dinari PreStocks (OpenAI, SpaceX, Anthropic), tokenized US treasuries (OUSG, USTB, TBILL), precious metals (GOLD, silver), and fiat currencies (EUR, GBP).

The regional focus is the moat. Our devnet roadmap integrates ViFi Labs' TTDC stablecoin as a local-currency on-ramp, giving Caribbean users a path from TT dollars to a live xStocks position in minutes instead of the 4-day T+3 path their brokers currently offer. We're in active conversation with ViFi on Wormhole NTT bridging and with TTSE / TTSEC on a regulator-partnership pathway modeled after Upside RWA's Token-2022 + Solana Attestation Service compliance architecture.

We've shipped 10+ production commits this month alone: a price-oracle resilience layer with circuit-breaker fallback cache, Jupiter Price v3 migration, Zustand hydration safety, Sentry telemetry (wired, DSN pending), and an independent security audit flagging the critical findings we're remediating before any real TTSE float launches. The platform is live at **limerscapital.com**. The Caribbean is 1.5M+ diaspora and a $21B market cap that has never had on-chain access. We're building the rails.

### Tracks to enter

Based on Cypherpunk taxonomy and prize-placement flexibility:

- **`consumer-apps`** — primary. The retail-facing gateway framing.
- **`defi`** — secondary. xStocks/tokenized equity trading.
- **`stablecoins`** — tertiary. TTDC on-ramp rail via ViFi.
- **`rwas`** — wildcard. Zero projects in corpus, possibly zero winners. Free-ish entry.
- **`infrastructure`** — optional. Only enter if the submission format allows 4+ tracks and the circuit-breaker / Sentry / audit-hardened architecture can be framed as infrastructure for other tokenization frontends to build on.

### Tags (aligned with Colosseum's /filters taxonomy)

**Problem tags**:
- `limited access to global credit`
- `illiquid real world assets` (match Credible Finance's successful framing)
- `regulatory barriers`
- `high transaction costs`
- `fragmented markets`

**Solution tags**:
- `tokenized rwa collateral`
- `cross-border lending` → adapt to `cross-border investing`
- `institutional compliance` (from Credible's v1 winning tag set)
- `gamified education`
- `paper trading simulation`

**Primitives**:
- `tokenization`
- `rwa`
- `paper-trading`
- `education`
- `stablecoin` (for TTDC integration workstream)

**Tech stack**:
- `solana`
- `anchor`
- `react`
- `cloudflare-workers`
- `supabase`

**Target users**:
- `caribbean retail investors`
- `trinbagonian diaspora`
- `defi learners`
- `tokenized equity holders`

---

## 3 · Why this submission wins — evidence from the corpus

This is the argument to make in the "Why you" or "What makes this unique" free-text field if one exists.

**1 · The three-cluster convergence is unique to the corpus.** Paper trading is crowded (12+ projects across 4 editions, 4 prize winners). Learn-to-earn education is crowded (9+ projects, 1 Public Goods Award). Tokenized equities is the newest cluster (emerged in Cypherpunk 2025-09 with 6 infrastructure projects). **No submission in the Colosseum corpus combines all three.** Limer's is the only builder at the intersection.

**2 · The Credible Finance precedent.** `credible-finance` (Renaissance Mar 2024, Accelerator Cohort C4) built CeDeFi RWA lending with Indian NBFC licenses and a Kanoo Group partnership for a $100M Bahrain real estate commitment. Same Solana/Anchor stack. Same emerging-markets corridor thesis. Same institutional-license regulatory pathway. Credible's v2 pivot won 2nd Place Stablecoins at Cypherpunk ($20k). This is the closest structural analog to Limer's in the entire corpus, and Colosseum has already demonstrated that this kind of platform wins prizes, earns accelerator placement, and graduates teams to serious infrastructure products.

**3 · The `rwas` track is underweight.** The `cypherpunk/rwas` track exists in the official /filters taxonomy but returned zero projects in corpus searches for "tokenized real world assets RWA" with `hackathonSlug: cypherpunk`. Either nobody entered or nobody placed. Limer's is a natural fit for this track and faces minimal competition.

**4 · The Cypherpunk theme-convergence was predictive.** Cypherpunk 2025-09 was the edition where paper trading (5 projects), tokenized stocks (3 projects), and LATAM stablecoin prizes (2 projects) all converged in the same submission window. This is the theme cluster Limer's is downstream of — but with regional differentiation no other builder has.

**5 · Uncontested Caribbean positioning.** Zero Colosseum submissions across four editions have targeted the Caribbean region or the TTSE specifically. The query "TTSE Trinidad Tobago stock exchange" returned six conceptual parallels, none of which had regional or regulatory overlap. This is not a crowded market — it is a market nobody is in.

---

## 4 · Traction evidence to link in the submission

Colosseum weighs demo videos and live product heavily. Here's what to link:

| Asset | Where | How to use it |
|---|---|---|
| **Live production site** | [limerscapital.com](https://www.limerscapital.com/) | Primary demo link. Judges click this first. |
| **GitHub** | github.com/Cuzo1ace/LimersCapital | Source access. Shows commit velocity, security remediation work, and documentation quality. |
| **Documentation hub** | docs.limerscapital.com (if live) | Context + architecture. Shows regulator-ready thinking. |
| **Security audit report** | `docs/Limers-Capital-Security-Audit-Report-April-2026.md` | Proves engineering maturity and transparent security posture. Unusual for a hackathon submission — use it as a differentiator. |
| **TTSE tokenization one-pager** | `docs/Limers-Capital-TTSE-Tokenization-One-Pager-Branded.pdf` | Regulator-partnership narrative. Attach to the submission if possible. |
| **Competitive scorecard** | `docs/Limers-Capital-Competitive-Scorecard.pdf` | Existing Colosseum-format scorecard. Likely already shaped for Colosseum's eye. |
| **RWA research brief** | `docs/Caribbean-Capital-Markets-Research-Brief.pdf` | The 9.9× PE / 42% EM discount data. Judges love concrete market-size framing. |
| **Demo video (NEW — must record)** | Loom, 3 minutes | Colosseum submissions with demos score ~2x better. **See Section 6 for the shot list.** |

**What NOT to link**: the `memory/` directory (private to the session), the `plans/` directory, this file itself, the vifi pre-call email draft, the credible-finance outreach email draft. Keep the private strategy artifacts private.

---

## 5 · Demo video script (3 minutes, record BEFORE submission)

Colosseum demo scoring loves: the thing working in front of you, live data, specific metrics, founder on camera briefly, and a clear "watch this happen" moment. Target 3 minutes total.

**0:00 – 0:20 · The hook** (camera on you)
"Trinidad & Tobago has a $21 billion stock exchange trading at a 9.9 PE, 42% below emerging markets, for companies whose fundamentals are fine. It's not a quality problem — it's plumbing. T+3 settlement, no diaspora access, zero on-chain liquidity. Limer's Capital is the Caribbean's first Solana gateway to fix this. Let me show you."

**0:20 – 0:45 · The live site**
Screen-share to limerscapital.com. Scroll past the hero, land on the Trade page. Click through the tabs to show: `Solana Tokens · Perpetuals PAPER · TTSE Stocks · Real Swap LIVE`. Linger on the category filter on the Market page — say "11 categories, 32 tokens, every one is live on mainnet right now."

**0:45 – 1:10 · The basis-spread widget**
Click into the Solana tab, category → Stocks. Point at AAPLx. "This tokenized Apple stock is $258.80 on Solana. Right next to it, from FMP, is the real NASDAQ price. Basis is +0.12%. **Nobody else on Solana shows you this.** xStocks doesn't, tokens.xyz doesn't, the issuer pages don't. It's the single most educational widget you can put in front of a retail user holding a tokenized equity."

**1:10 – 1:35 · The gamification**
Click to Learn → show the quiz / XP / badge flow. "Users earn XP, LP, and badges as they go through a curriculum we built specifically for Caribbean DeFi literacy. This syncs to an on-chain Anchor program so progress is portable. We're migrating badges to Metaplex Core NFTs in the next sprint."

**1:35 – 2:00 · The TTSE bridge thesis**
Cut to the TTSE tab. "Our thesis is that the $21 billion Caribbean market cap that currently settles in 3 days on T+3 rails should settle in 400 milliseconds on Solana. Our devnet sandbox, shipping this month, integrates a local Trinidad dollar stablecoin — TTDC — via a partner called ViFi Labs. The bridge is Wormhole NTT. The issuance model is Upside RWA + Solana Attestation Service. We're in active conversation with TTSEC, Trinidad's securities regulator."

**2:00 – 2:25 · The competitive moat**
"Colosseum's own corpus shows five paper trading projects, three tokenized stock infrastructure projects, and two LATAM stablecoin prize winners in Cypherpunk alone. **None of them combine all three. None target the Caribbean.** We do both. The Cluster A+B+C convergence plus regional distribution plus a regulator-partnership pathway — that's the moat. Credible Finance, your own C4 accelerator team, is the closest analog; we're running the same play in a different market."

**2:25 – 3:00 · The ask + close**
Camera back on you. "We shipped ten commits to production this month, including a Jupiter Price v3 migration hotfix, a circuit-breaker fallback cache for our Cloudflare Worker, a Sentry telemetry layer, and an independent security audit we're actively remediating. We're ready to ship real TTSE-tokenized assets the moment TTSEC clears us. We'd love to be in the accelerator — same way Credible Finance was — so we can compress the regulatory timeline. Limer's Capital. Trinidad & Tobago. Let's go."

**Record on Loom** with camera + screen-share. Don't over-rehearse — one take is fine.

---

## 6 · Readiness checklist — what MUST be done before submission

Block these off before you hit submit. Colosseum judges click the live link and they will see what's there.

### Critical (submission-blocking)

- [ ] **Remediate audit finding C-02** — set `VITE_SENTRY_DSN` in Cloudflare Pages env vars and `SENTRY_DSN` via `wrangler secret put` on the worker. Confirm first event captured. This is 30 minutes of work and dramatically strengthens the "engineering maturity" story in the demo.
- [ ] **Remediate audit finding C-03 Phase 1** — add `Content-Security-Policy-Report-Only` header in `public/_headers`. You don't need to enforce yet; Report-Only is enough to show judges you're defense-in-depth conscious.
- [ ] **Record the demo video** — Loom, 3 minutes, shot list in Section 5 above. This is the single highest-leverage submission asset.
- [ ] **Verify limerscapital.com loads in under 3 seconds from a clean browser** — no cached data, no localStorage, no Phantom wallet connected. Judges test cold.
- [ ] **Test the Trade page tab order** on both desktop and mobile — confirm `Solana Tokens · Perpetuals · TTSE · Real Swap` in that sequence (commit `d475966` shipped this).
- [ ] **Confirm the basis-spread widget renders real data** for at least 3 tokens (AAPLx, NVDAx, TSLAx). If FMP quotas are exhausted, fix before recording.
- [ ] **Verify the 32-token catalog is visible** in the Market page via category filter. Click through Stocks, ETFs, Yield, Currencies to confirm all categories populate.

### High (strengthens submission)

- [ ] **Ship the TTSE one-pager PDF as a public URL** (move it from `docs/` to a hosted location like `docs.limerscapital.com/ttse-tokenization-one-pager.pdf`) so you can link it directly from the submission.
- [ ] **Transfer the `limer` program upgrade authority to a Squads multisig** (audit finding C-01). This is the single most-cited "trustless" move judges will look for in the demo. Even a 2-of-3 is better than a 1-of-1.
- [ ] **Have the ViFi call before submission** — a "we have an LOI with ViFi for TTDC bridging" line in the demo beats "we're in conversation with ViFi."
- [ ] **Send the Credible Finance outreach email** (`docs/credible-finance-outreach-email.md`) and, if they reply warmly, drop a "we're in conversation with C4 accelerator graduates Credible Finance about regulatory-pathway comparison" line into the demo.

### Medium (nice to have)

- [ ] Metaplex Core NFT badges — mentioned in the devnet roadmap, would be a visible on-chain artifact for the demo
- [ ] Published competition leaderboard with server-authoritative P&L (audit finding H-01)
- [ ] At least one real TTSE-adjacent token held in a demo wallet, on devnet if not mainnet

### Do NOT delay submission for

- A complete security audit pass — acknowledge open findings in the application, frame them as active remediation
- An LOI with TTSEC — say "in conversation" if asked, don't overclaim
- A fully trustless on-chain settlement layer — the devnet roadmap is fine to show as "Sprint 1-3 in progress"
- A multi-founder team — one-founder submissions have won prizes at Colosseum before

---

## 7 · Team section strategy

You're (likely) a solo founder at submission time. This is not a dealbreaker. Here's how to present it.

**Do**: Frame yourself as the single full-stack founder with explicit advisors / partners / service providers around you. Name them concretely:

- **Founder**: Aasan Lewis — full-stack engineering, product, regional distribution
- **Security partner**: [independent auditor — cite the audit firm name if the audit was external; if self-audited, cite the Security Audit Report as "internal review modeled on Trail of Bits / Sec3 frameworks"]
- **Technology stack partners**: ViFi Labs (TTDC stablecoin — conversation active), Backed Finance (xStocks upstream), Ondo Global Markets (tokenized equities upstream), Jupiter Aggregator (price routing), Pyth Network (oracle feeds), Helius (RPC + DAS)
- **Regulatory conversation partners**: TTSEC (Trinidad & Tobago Securities Commission), TTSE (Trinidad & Tobago Stock Exchange) — status: exploratory
- **Community**: [Any Caribbean crypto Telegram / Discord / local group you're part of — cite by name]

The "founder + stated partnerships + active regulator conversations" framing beats "solo founder" every time. What matters is showing you're not building in a vacuum.

**Do NOT**: Invent co-founders. Don't list people who haven't agreed to be on the application. Don't hide the solo nature — Colosseum judges will check.

**If you want to add weight**: bring on one named technical advisor (even a part-time one) who you can cite as "Advisor: X — Solana Anchor experience / Caribbean regulatory background / etc." This is worth more than 5 more engineering hours.

---

## 8 · What NOT to say in the application

- **Do not say "first mover"** unless you can define the specific niche you're first in. Say "the only Caribbean-native Solana platform combining gamified education, paper trading, and a live 32-token tokenized equity catalog." That's defensible.
- **Do not say "trustless" without qualifiers.** The audit C-01 finding (single-signer upgrade authority) means Limer's is not yet trustless. Say "evolving toward trustlessness with a Squads multisig transition in Sprint 1 and an independent audit remediation schedule."
- **Do not say "regulated" or "licensed".** You're in conversation with TTSEC. Conversation ≠ regulated. Say "in active regulatory conversation with TTSEC under Securities Act 2012."
- **Do not cite the 9.9 PE without the sources**. Use the Caribbean Capital Markets research brief as your citation (it's in docs/).
- **Do not overclaim on TVL / AUM / users**. Paper trades are paper trades. Say "paper trading volume" not "trading volume." Say "users" not "investors."
- **Do not name specific TTSE-listed companies** (ANSA McAL, NCBFG, etc.) as "on our platform" unless they actually have tokenized representations live. Say "our platform is architected to list TTSE-eligible companies via the Upside RWA + Token-2022 + SAS stack once TTSEC clearance lands."
- **Do not mention the ElevenLabs or GitBook keys that were briefly exposed in the screenshot incident.** Irrelevant to the application and would only surface a non-issue.

---

## 9 · Timeline — what to do this week vs next week vs submission week

### This week (critical path)

1. **Check arena.colosseum.org for current edition status** — this is the single most important thing. If a spring 2026 edition is live with a near-term deadline, everything else compresses.
2. **Remediate audit findings C-02 + C-03 Phase 1** — 2 hours total
3. **Record the demo video** — 3 minutes final, ~2 hours including retakes
4. **Publish the TTSE one-pager as a public URL** — 15 minutes
5. **Send the Credible Finance outreach email** — the draft is at `docs/credible-finance-outreach-email.md`, just needs your send button

### Next week

1. **Transfer `limer` program upgrade authority to a Squads multisig** (audit finding C-01). If this slips, acknowledge it honestly in the application.
2. **Have the ViFi call**, capture the outcome as one of: (a) LOI signed, (b) conversation progressing, (c) moving on. Update the application language accordingly.
3. **Draft a Caribbean-specific "our thesis" blog post** on docs.limerscapital.com — judges sometimes read founder writing. 600-1000 words, cite Pantera / Galaxy / a16z archive sources from `project_competitive_landscape.md`.
4. **Identify and recruit one technical advisor** willing to be named. Ideally Solana Anchor / Caribbean regulator background.

### Submission week

1. **Final site smoke test** across desktop + mobile + a cold-cache browser. Fix anything broken.
2. **Re-record the demo** if the ViFi call or Credible Finance outreach produced material updates.
3. **Fill the Colosseum submission form** using the content from Section 2 of this package. Paste oneLiner, short description, long description, tags, tracks directly.
4. **Link the audit report publicly** (or attach as PDF) so judges can see the security hygiene.
5. **Submit 48 hours before the deadline** — avoid submission-day fires.

### If no edition is live when you check

Use this package as-is for the next edition. The corpus-sourced competitive evidence in `project_competitive_landscape.md` is durable for ~6 months; re-run the 12 Copilot queries listed there closer to actual submission to refresh any winning-project data.

---

## 10 · Monitoring + follow-up

After submission, track:

- **Acknowledgment email / dashboard confirmation** within 24 hours
- **Demo-day invitation** if the submission advances past initial screening
- **Accelerator interview request** — this is the C4 path. If it happens, the Credible Finance outreach work pays off; they've walked this exact step.
- **Public voting / community support window** — if Colosseum opens one, mobilize the Caribbean community, Trinbagonian diaspora, and any partner network
- **Feedback** — even rejected submissions get feedback from judges; file it carefully, it's corpus-level insight for the next edition

---

## 11 · Quick-reference snippets (for pasting into form fields)

### If the form has a 50-character project tagline field

`Caribbean Solana gateway to global capital markets`

### If the form asks "what makes this unique?" in 140 characters

`Only Solana builder combining gamified education + paper trading + 32-token real xStocks catalog, aimed at the uncontested Caribbean market.`

### If the form asks "who are your target users?" in 100 characters

`1.5M+ Trinbagonian diaspora + Caribbean retail investors shut out of the $21B TTSE by T+3 settlement.`

### If the form asks "why Solana?" in 200 characters

`Solana's 400ms finality + Token-2022 compliance primitives + xStocks Alliance + Jupiter aggregation make it the only chain where Caribbean users can access global equities without traditional brokers.`

### If the form asks "why now?" in 200 characters

`xStocks crossed $3B volume Jan 2026, WisdomTree just brought regulated tokenized funds to Solana, and Solana Attestation Service unlocks KYC-gated securities. The infrastructure we depend on is production-ready for the first time.`

### If the form asks "what have you shipped?" in 300 characters

`Live at limerscapital.com. 32-token catalog: xStocks + Ondo Global Markets + Dinari PreStocks + treasuries + metals + currencies. Basis-spread widget vs NASDAQ. Jupiter Price v3 migration. Circuit-breaker API resilience. Independent security audit. 10+ production commits this month.`

---

## Close

Every piece of this package is extractable into a Colosseum submission form as-is. The three-cluster convergence thesis and the Credible Finance C4 precedent — both surfaced by the 12 Copilot queries in the previous session — are the spine. The demo video (Section 5) is the single most important missing asset. Record it before anything else.

Good luck.
