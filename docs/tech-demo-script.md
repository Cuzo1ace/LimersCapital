# Limer's Capital — Technical Demo Script (2-3 Minutes)

> **Target**: Colosseum judges evaluating Functionality, Technical Execution, UX
> **Duration**: 2:30 – 3:00
> **Format**: Screen recording with voiceover
> **Tip**: Record at 1080p, use a clean browser window, zoom to 90% for better framing

---

## [0:00 – 0:15] INTRO

**[Screen: Landing / Dashboard page]**

"This is Limer's Capital — a DeFi education and trading platform built on Solana. Let me walk you through the core user flow: Learn, Trade, and Earn."

---

## [0:15 – 0:45] LEARN — Education System

**[Navigate: Click 'Learn' tab]**

"The Learn section has 8 modules organized by difficulty — Basics, Intermediate, and Advanced. Each module has 4-5 lessons and a quiz.

**[Click into Module 1, open a lesson]**

Let me open a lesson. You can see the structured content with reading time estimates. Completing lessons awards XP and unlocks the module quiz.

**[Navigate to a quiz, answer one question]**

Quizzes are validated server-side through our Cloudflare Worker — answers aren't exposed in the client bundle. Passing unlocks the next module and awards achievement badges."

---

## [0:45 – 1:20] TRADE — Paper Trading + Real Swaps

**[Navigate: Click 'Trade' tab, land on Solana paper trading]**

"The Trade page has four sections. First — Solana paper trading. Users get a simulated balance and can trade 14 tokens. Here's the order form — market or limit orders, with an order book showing live bid/ask depth.

**[Execute a paper trade — buy SOL]**

I'll buy some SOL. The order executes instantly, updates the portfolio, and tracks it for the trading competition leaderboard.

**[Switch to TTSE tab]**

We also have Trinidad & Tobago Stock Exchange paper trading — about 30 Caribbean stocks. Same interface, same engine.

**[Switch to Perpetuals tab]**

Perpetuals simulation — adjustable leverage up to 20x, stop loss, take profit, trailing stops. The liquidation engine runs proper margin math with funding rates.

**[Switch to Jupiter Swap tab]**

And when users are ready for real trading — Jupiter V6 integration. Connect a Solflare or Phantom wallet, get a live quote, and execute an on-chain swap. This is real Solana mainnet."

---

## [1:20 – 1:50] EARN — Gamification & Competition

**[Navigate: Click 'Points' tab]**

"Every action on the platform earns Limer Points and XP. You can see the tier system here — 10 levels from Guppy to Leviathan. Points unlock features progressively.

**[Show badges grid]**

25 achievement badges — milestone badges for first trades, skill badges for quiz performance, streak badges for consistency.

**[Navigate: Click 'Competition' tab]**

Trading competitions run on a scoring engine — PnL weighted at 40%, win rate 20%, risk management 20%, consistency 10%, activity 10%. Live leaderboard with countdown timer.

**[Show the leaderboard]**

Each trader's score is computed from their actual paper trading performance."

---

## [1:50 – 2:15] DEFI TOOLS — Agent Squeeze + Portfolio

**[Navigate: Click '$LIMER' dropdown → 'Agent Squeeze']**

"Agent Squeeze is our LP analysis tool. It pulls real pool data from Meteora and scores each pool on fees, TVL, volume, and impermanence loss risk.

**[Show a pool card, click 'Advanced Analysis']**

The advanced panel shows IL scenarios, breakeven calculations, and detects if you have perpeptual positions that create correlated exposure. It gives actionable recommendations, not just data.

**[Navigate: Click 'Portfolio' tab]**

The portfolio page shows holdings, P&L, trade history, and integrates with the on-chain profile."

---

## [2:15 – 2:40] TECHNICAL HIGHLIGHTS

**[Navigate: Show wallet connection flow]**

"Quick technical highlights:

- **Solana integration**: wallet-standard for Solflare and Phantom, devnet/mainnet toggle, on-chain profile program that stores badges and trade history
- **Architecture**: React + Vite SPA, Zustand state management, React Query for async data, Cloudflare Worker for API proxy and quiz validation
- **Testing**: 189 tests across 7 files covering perp engine, gamification, tokenomics, education, trading, and competition scoring
- **i18n**: English, Spanish, and French
- **Responsive**: Full mobile support with bottom navigation

All code is open source on GitHub."

**[Final shot: Dashboard with everything loaded]**

"That's Limer's Capital — Learn, Trade, Earn. Caribbean DeFi education on Solana."

---

## Recording Checklist

- [ ] Clean browser (no bookmarks bar, no extensions visible)
- [ ] Dark mode system theme
- [ ] Wallet connected with some paper trading history showing
- [ ] Pre-execute a few paper trades so portfolio has data
- [ ] Pre-complete at least 2 modules so progress is visible
- [ ] Competition registered so leaderboard shows user
- [ ] Tab through smoothly — rehearse the click path 2-3 times
- [ ] Record audio separately for cleaner voiceover (optional)
- [ ] Keep mouse movements smooth and deliberate
- [ ] Pause briefly on each major feature (1-2 seconds) so judges can read
