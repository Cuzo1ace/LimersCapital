# The Limer's Protocol Charter

**Effective Date:** April 7, 2026
**Version:** 1.0
**On-Chain Attestation:** `<ARWEAVE_TX_ID>` *(to be populated after permanent storage)*

---

## Preamble

The Limer's Protocol Charter is the constitutional document governing the Limer's Capital protocol and ecosystem. Its principles are **irrevocable** and cannot be overridden by any governance vote, team decision, investor demand, or market condition.

This Charter exists to ensure that Limer's Capital serves its founding mission — financial literacy and ownership for the Caribbean — across generations, leadership transitions, and technology changes.

Any version of this Charter that differs from the Arweave-stored version is invalid.

---

## Article I: Immutable Revenue Principles

**1.1** The revenue split between the Community pool (SPL token stakers) and the Platform pool (dNFT holders), as defined in `REVENUE_DISTRIBUTION` in `src/data/tokenomics.js`, shall never deviate below **40/60 in either direction**. The current split is 50/50.

**1.2** Revenue shall always be distributed in **stablecoins (USDC or USDT) and/or SOL**. $LIMER tokens shall never be used for revenue distribution. This prevents circular inflation and ensures holders receive real purchasing power.

**1.3** Distribution frequency shall be no less than **monthly**. The current design is weekly epoch distribution.

**1.4** Revenue streams shall be transparently documented. All fee rates, collection mechanisms, and distribution calculations shall be publicly verifiable — either on-chain or in open-source code.

---

## Article II: Free Education Mandate

**2.1** The Learn module — all lessons, quizzes, glossary terms, modules, daily knowledge, and micro-lessons — shall always be **free for all users** with no account requirement beyond basic platform access.

**2.2** No paywall shall ever gate educational content defined in `src/data/lessons.js`, `src/data/quizzes.js`, `src/data/modules.js`, `src/data/glossary.js`, `src/data/dailyKnowledge.js`, or `src/data/microLessons.js`.

**2.3** Premium features may exist alongside free education but shall **never replace it**. Premium analytics, boosted rewards, and priority access are acceptable value-adds. Locking learning behind payment is not.

**2.4** The education curriculum shall be continuously maintained and updated to reflect current market conditions, regulatory changes, and technological developments. Stale education is a disservice to users.

---

## Article III: Caribbean-First Clause

**3.1** Caribbean users — defined as residents of CARICOM member states, CARICOM associate members, and Caribbean territories mapped in `src/data/regulations.js` — are the **primary beneficiaries** of all platform decisions.

**3.2** Expansion to non-Caribbean markets shall not reduce service quality, feature access, or governance power for Caribbean users. Global growth must complement, not cannibalize, Caribbean service.

**3.3** The TTSE integration and Caribbean regulatory mapping shall be maintained as **core features**. They may be expanded but never removed.

**3.4** The i18n system shall always support **English, Spanish, and French** — the three major Caribbean linguistic groups. Additional languages may be added but these three are mandatory.

**3.5** The platform shall actively support Caribbean-specific financial infrastructure: CBDC integrations (Sand Dollar, JAM-DEX, DCash), local fiat bridges (Wam), and regional stock exchanges.

---

## Article IV: Governance Power Distribution

**4.1** No single entity — including the founder, any investor, any corporation, or any partnership — shall hold more than **25% of total governance voting power**. If token concentration exceeds this threshold, excess voting power is automatically capped.

**4.2** Protocol parameter changes (fee rates, reward multipliers, treasury allocations) shall use **quadratic voting**: vote weight = sqrt(tokens staked). This prevents plutocratic capture while still respecting stake size.

**4.3** Each Caribbean jurisdiction with more than **10,000 active users** shall receive a **guaranteed governance seat** — a representative elected by users in that jurisdiction who participates in all protocol governance decisions.

**4.4** A **Challenger Board** composed of users aged 18-30 shall hold **veto power** on product decisions and cultural/brand changes. This ensures the platform evolves with each generation rather than ossifying around the preferences of its founders.

**4.5** Governance proposals must include a **Caribbean Impact Assessment** — a brief analysis of how the proposal affects Caribbean users specifically. Proposals without this assessment cannot proceed to vote.

---

## Article V: Amendment Process

**5.1** Amendments to this Charter require ALL of the following:
  - (a) A **67% supermajority** of governance voting power voting in favor
  - (b) A **6-month cooling period** after the vote passes before the amendment takes effect
  - (c) **Ratification** by representatives of at least 3 Caribbean jurisdictions (per Article IV, Section 4.3)

**5.2** **Articles I through IV are unamendable.** They represent the core identity of the protocol. Only Article V (this article) and any future articles added via the amendment process may be amended.

**5.3** The 6-month cooling period **cannot be waived** under any circumstances, including claimed emergencies. This prevents panic-driven governance changes.

**5.4** Failed amendment proposals may not be resubmitted for **12 months** after the vote concludes.

---

## Article VI: On-Chain Attestation

**6.1** This Charter shall be stored permanently on **Arweave** (permaweb) as an immutable document. The Arweave transaction ID is the canonical reference.

**6.2** A Solana transaction memo shall reference the Arweave transaction ID, linking the Charter to the Limer's on-chain program ecosystem.

**6.3** The Arweave transaction ID shall be published:
  - In this document (see header)
  - In the project `README.md`
  - In the `TREASURY.md` documentation
  - In the on-chain program's future governance metadata

**6.4** Any version of this Charter — in a repository, on a website, in a document — that differs from the Arweave-stored version is **invalid**. The Arweave copy is the single source of truth.

---

## Signatories

| Role | Name | Date |
|------|------|------|
| Founder | Cuzo1Ace | April 7, 2026 |
| Arweave TX ID | `<TO_BE_POPULATED>` | — |
| Solana Memo TX | `<TO_BE_POPULATED>` | — |

---

*This Charter is a living commitment to the Caribbean community. Its immutable articles ensure that no future team, investor, or governance majority can betray the founding mission. Its amendment process ensures the protocol can evolve within principled boundaries.*

*Reference implementation: `src/data/tokenomics.js` (revenue model), `src/data/regulations.js` (jurisdiction map), `src/i18n/index.js` (language support)*
