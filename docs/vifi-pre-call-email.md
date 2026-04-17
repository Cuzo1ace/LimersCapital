# Pre-call email to ViFi Labs

**Purpose**: short note you can send the ViFi team the night before or the morning of tomorrow's call, so they arrive prepared with the specific answers Limer's Capital needs to start building.

**Delivery**: copy-paste into Gmail / your mail client. You already know the team, so this is intentionally short, friendly, and technical — not a cold intro.

---

**Subject**: Quick agenda for tomorrow — Limer's Capital × ViFi alignment

**To**: _<your contact at ViFi>_
**Cc**: _<any other ViFi technical / BD lead you want in the room>_

Hey [name],

Looking forward to tomorrow's call. Quick note so your team can come ready with the right person on the line — I want to make sure we cover both the strategic and technical sides in one sitting.

**Context on our side (60 seconds):**
Limer's Capital is live at [limerscapital.com](https://www.limerscapital.com/) and is already the most-used Solana platform targeting the Caribbean — gamified DeFi education, paper trading on TTSE stocks + Solana tokens, and the beginnings of an on-chain tokenization layer aimed at the TTSE. We just wrapped the Colosseum hackathon round and are moving from a mostly-off-chain app into real devnet activation over the next 4 weeks.

**Why I want to talk to you:**
We're about to start building the Trinidad & Tobago dollar experience on-chain. You're the only team I know of seriously working on TT-stablecoin infrastructure, and you're on Base. I'm on Solana. There's an obvious alignment here — TT is small enough that one aligned "rails" story is 10x better than two parallel ones — and I'd rather partner than go it alone with a mock token.

**What I'd like to get out of the 30 minutes:**

1. **Strategic alignment** — is there mutual interest in a joint go-to-market in Trinidad? I'm open to anything from a formal partnership to a loose "we recommend each other to users" arrangement, depending on what fits your stage.

2. **Five technical questions** — these are the blockers for me to start integrating:

    - Does **TTDC** exist on **Base Sepolia** today, and can you share the contract address?
    - Is TTDC a standard ERC-20, or does it use **Wormhole NTT / LayerZero OFT / Hyperlane warp routes** for cross-chain? This is the critical one — it determines whether I can mirror TTDC onto Solana cleanly, or whether I'll have to run my own wrapped version.
    - Do you have a **quote / swap REST API** I can integrate against, or is the VFE Protocol on-chain-only?
    - What's the **KYC / AML model** for TTDC holders? Permissioned, allowlisted, or open-access?
    - Do you have a **developer sandbox** on Base Sepolia that I can self-serve against tomorrow while we're talking?

3. **A concrete first integration step** — ideally we leave the call with one thing I can ship in 2 weeks. My preferred first step is embedding your swap UI behind a "Get TTDC" CTA on our Trade page for Caribbean users. Zero bridge work, zero smart contract risk, and it validates real demand for TTDC through a Caribbean-facing channel before we commit to anything bigger.

**The bigger picture (if we have time):**
The TTSE is trading at a 9.9x PE — a 42% discount to emerging markets — because of illiquidity and access barriers. We're building the rails to tokenize TTSE equities on Solana (I can share the architecture brief separately if interesting). TTDC is the natural settlement currency for that market. A Solana-native mirror of TTDC — whether via Wormhole NTT, LayerZero OFT, or your own preferred bridge — is what unlocks full DvP trading for Caribbean equities on-chain. This is the longer arc I'd love to get your read on.

Happy to send a 1-page "current state + proposed integration" one-pager if that's useful before the call. Otherwise, see you tomorrow.

Aasan
Founder, Limer's Capital
[limerscapital.com](https://www.limerscapital.com/) · [docs.limerscapital.com](https://docs.limerscapital.com/)

---

## Notes for you (not part of the email)

- **Length calibration**: intentionally ~350 words. Long enough to set a real agenda, short enough to read on a phone. Fits the "I know the team" framing — no throat-clearing.
- **Tone**: warm but technical. The fact that you're asking for specific contract addresses and bridge protocols by name signals that you already know what you want and aren't wasting their time.
- **The ask in #3 is deliberately modest** — "embed your swap UI" is the lowest-friction integration possible. It's what I called "Path A" in the roadmap. Leading with this anchors the call on the smallest achievable first step, which is much easier for them to say yes to than a cross-chain bridge request.
- **The bigger picture paragraph** is optional scope expansion. If the call is going well, you pull on this thread. If it's transactional and short, skip it and schedule a follow-up.
- **Signature**: add your phone number if you want them to text vs email back. Remove the Cc line if you don't have a second name to put there.
- **Attachment option**: if you want to attach the TTSE tokenization one-pager PDF we built earlier (`docs/Limers-Capital-TTSE-Tokenization-One-Pager-Branded.pdf`), mention it explicitly — "Attaching our TTSE tokenization proposal as context — feel free to share internally."

## Five questions, printed big so you can read them on the call

If you can only get answers to these five things tomorrow, that's enough to unblock all of Sprint 3:

1. TTDC Base Sepolia contract address?
2. Which cross-chain stack? (Wormhole NTT / LayerZero OFT / Hyperlane / none yet)
3. REST API or contracts only?
4. KYC model — permissioned or open?
5. Dev sandbox / testnet I can self-serve against?
