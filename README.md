# Limer's Capital

**Learn. Trade. Own.** — A financial literacy and trading platform for the Caribbean, built on Solana.

Born at the [Solana Colosseum Hackathon](https://www.colosseum.com), Limer's Capital sits at the intersection of global DeFi and local Caribbean capital markets. Users learn about blockchain and finance, practice trading with paper accounts, execute real on-chain swaps, and earn ownership of the platform through Universal Basic Ownership (UBO).

## Features

- **Learn-to-Earn** — 8 modules, 37 lessons, 8 quizzes covering blockchain fundamentals, Caribbean markets, Solana DeFi, LP strategies, and UBO
- **Paper Trading** — Simulated trading on 14+ Solana tokens and ~30 TTSE Caribbean stocks with $100K USD + 679K TTD starting balances
- **Real On-Chain Swaps** — Jupiter V6 aggregator integration via Solflare wallet
- **Perpetual Futures** — Up to 20x leverage with competition-grade liquidation math, stop loss, take profit, trailing stops
- **Gamification** — 10-tier XP system, 25 achievement badges, Limer Points, daily streaks, feature gating
- **TTSE Integration** — Trinidad & Tobago Stock Exchange with ~30 stocks, 4 indices, real-time data
- **Caribbean Regulation Map** — Jurisdiction-by-jurisdiction breakdown (DARE Act, ECCU, CBDCs, VASP)
- **On-Chain Profiles** — Solana program stores user progress, badges, and trade history as PDAs
- **Tokenomics** — $LIMER token with dNFT Yield Engine, real yield in USDC/SOL, Premium tier (Wam + ViFi)
- **i18n** — English, Spanish, French

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 8 + Tailwind CSS 4 |
| State | Zustand 5 (persisted to localStorage) |
| Server State | React Query 5 |
| Animations | Framer Motion 12 |
| Charts | ApexCharts 5 |
| Blockchain | Solana Kit 6, Wallet Standard, Anchor |
| Swaps | Jupiter V6 Aggregator |
| Wallet | Solflare (primary), Phantom, any wallet-standard compatible |
| API Proxy | Cloudflare Workers |
| Deployment | Vercel |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env.local` file:

```env
# Optional — falls back to public RPC
VITE_SOLANA_RPC_URL=https://your-rpc-endpoint.com

# Optional — API proxy for CORS/key hiding
VITE_API_PROXY_URL=https://your-worker.workers.dev

# Optional — PostHog analytics
VITE_POSTHOG_KEY=your-key
```

## Architecture

```
src/
  pages/           17 page components (Dashboard, Learn, Trade, Portfolio, etc.)
  components/      Reusable UI (GlowCard, AchievementBadge, JupiterSwap, etc.)
  store/           Zustand store (gamification, trading, portfolio, progression)
  solana/          Wallet adapter, Anchor hooks, mutations, bridge, IDL
  data/            Tokenomics, lessons, quizzes, modules, badges, LP data
  api/             Game server client, market data fetchers
  analytics/       PostHog integration
  i18n/            Translations (en, es, fr)
workers/
  api-proxy.js     Cloudflare Worker — quiz validation, API proxy, rate limiting
  ttse-proxy.js    TTSE stock data proxy
```

### On-Chain Program

- **Program ID**: `HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk`
- **Framework**: Anchor
- **Accounts**: UserProfile PDA (XP, LP, badges, streaks), TradeLog PDA (volume, fees)
- **Instructions**: initialize_user, award_xp, award_lp, record_badge, record_module, daily_check_in, record_trade, close_account

### Data Flow

1. **Local-first**: All state updates are instant via Zustand
2. **Bridge sync**: `useLimerBridge()` watches local state and fires Anchor mutations
3. **Auto-init**: Wallet connection triggers automatic on-chain profile creation
4. **Server validation**: Quiz answers validated by Cloudflare Worker (never exposed client-side)

## Roadmap

| Phase | Status | Focus |
|-------|--------|-------|
| Phase 1 — Colosseum MVP | Complete | Learn-to-earn, paper trading, wallet integration, gamification |
| Phase 2 — Platform Expansion | In Progress | Real swaps, perpetuals, UBO model, revenue architecture |
| Phase 3 — $LIMER Token Launch | Next | TGE, airdrop, dNFT minting, DEX liquidity |
| Phase 4 — Staking & Real Yield | Planned | USDC/SOL distributions, Premium tier, fee discounts |
| Phase 5 — Governance & Scale | Planned | Realms DAO, multi-country TTSE, institutional API |

## Wallet Partner

[Solflare](https://www.solflare.com) — Users connecting with Solflare receive a 2% token allocation boost. Solana Mobile (Seeker) users receive an additional 1% boost.

## License

Proprietary — Limer's Capital. All rights reserved.
