# Tech Stack

A comprehensive breakdown of every technology, tool, and platform used to build Limer's Capital.

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3.1 | UI framework — component-based SPA |
| **Vite** | 8.0.0 | Build tool — sub-second HMR, 600ms production builds |
| **Tailwind CSS** | 4.2.2 | Utility-first CSS — Veridian Night design system |
| **Framer Motion** | 12.36.0 | Animation — spring physics, AnimatePresence, gesture handling |
| **Zustand** | 5.0.12 | State management — persistent store with localStorage |
| **TanStack Query** | 5.91.0 | Data fetching — caching, retry, background refresh |
| **i18next** | 25.10.10 | Internationalization — English, Spanish, French |
| **vite-plugin-pwa** | 1.2.0 | Progressive Web App — offline support, install prompt, Workbox service worker |

### Custom UI Components
- **BackgroundGradient** — Animated ocean gradient blobs with mouse tracking
- **GlassCard** — Glassmorphism system (4 variants: default, elevated, highlight, stat)
- **GradientText** — Animated gradient text (sea → coral → sun cycle)
- **LiquidMetalButton** — WebGL shader button (@paper-design/shaders)
- **GlowCard** — Cursor-tracking border glow (Framer Motion)
- **BottomTabBar** — Persistent 5-tab mobile navigation with spotlight animation
- **CountUp** — Number counter with IntersectionObserver + easeOutExpo
- **TokenPriceRow** — Glass card rows with sparklines + change badges
- **DisclaimerBar** — Legal disclaimer modal with glassmorphism

## Solana / Blockchain

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Anchor** | @anchor-lang/core 1.0.0 | Rust on-chain program framework (UserProfile + TradeLog PDAs) |
| **@solana/web3.js** | 1.98.4 | Solana JavaScript SDK |
| **@solana/kit** | 6.5.0 | Modern Solana toolkit |
| **@solana/react** | 6.5.0 | React hooks for Solana |
| **wallet-standard** | 1.1.0 | Universal wallet interface (Solflare + Phantom) |
| **Jupiter V6 API** | — | Real on-chain swap aggregator |
| **Pyth Hermes** | 3.1.0 | Oracle-grade price feeds (SOL, BTC, ETH, GOLD) |
| **Helius RPC + DAS** | — | Dedicated RPC + Digital Asset Standard for token metadata |
| **Meteora** | — | DLMM pool data for LP analysis (Agent Squeeze) |
| **Percolator SDK** | Local | On-chain perpetual futures integration |
| **DexScreener API** | — | Real-time Solana token prices + 24h changes |
| **CoinGecko API** | — | Market data, sparklines, metadata |

### On-Chain Program
- **Program ID**: `HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk`
- **PDAs**: UserProfile (78 bytes — XP, LP, badges bitmap, trade count, streaks)
- **PDAs**: TradeLog (53 bytes — token, amount, price, timestamp, PnL)
- **Instructions**: init_profile, award_xp, award_lp, log_trade, set_badge, daily_checkin

## Backend / Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Cloudflare Workers** | Edge-deployed serverless API proxy — routes Helius, Jupiter, TTSE, and quiz validation calls. API keys stored as Wrangler secrets (never exposed to browser). |
| **Cloudflare Pages** | Static site hosting — automatic deploys from GitHub pushes |
| **Cloudflare KV** | Key-value storage for game state (LP, XP, quiz attempts, leaderboard) |
| **Supabase** | PostgreSQL database for users, waitlist, announcements, activity feed |
| **GitHub Actions** | CI/CD pipeline — build + deploy to Cloudflare Pages on every push to main |
| **Wrangler** | 4.75.0 — Cloudflare Worker deployment CLI |

### Data Sources
- **Pyth Hermes** — Oracle prices for SOL, zBTC, WETH, GOLD (Layer 1)
- **DexScreener** — All Solana tokens by mint address (Layer 2)
- **Jupiter V6** — Last-resort price fallback + real swap execution (Layer 3)
- **CoinGecko** — Market data, supply info, sparklines
- **TTSE (stockex.co.tt)** — Live Caribbean stock data via scraper proxy
- **World Bank** — Macroeconomic data for Caribbean nations
- **DeFiLlama** — TVL, yields, stablecoin data
- **ExchangeRate API** — TTD/USD/JMD/XCD real-time conversion

## AI & Design Tools

| Tool | Purpose |
|------|---------|
| **Claude (Anthropic)** | Primary development copilot — architecture design, code generation, market research, pitch synthesis, competitive analysis, document authoring |
| **ElevenLabs** | AI voiceover for demo videos (Matilda voice — "knowledgeable, professional") |
| **Remotion 4** | Programmatic React-to-MP4 video rendering — 12 scenes, 4 composition variants, voiceover sync via calculateMetadata |
| **Penpot** | Open-source design tool — 13 mobile screen SVGs + component library |
| **PptxGenJS** | Pitch deck builder — 18-slide dark-theme decks generated from code |
| **python-pptx** | Content QA — text extraction for verification |
| **PyMuPDF (fitz)** | PDF-to-image conversion for visual QA |
| **Playwright** | WebKit/Chromium browser automation for cross-browser testing |

## Testing

| Tool | Coverage |
|------|----------|
| **Vitest** | 4.1.2 — 361 passing tests across 14 files |
| **@testing-library/react** | 16.3.2 — Component testing |
| **@testing-library/jest-dom** | 6.9.1 — DOM assertions |
| **jsdom** | 29.0.1 — Browser environment simulation |
| **Playwright** | WebKit/Safari regression testing (verified Safari/iOS blank screen fix) |

### Test File Breakdown

| Test File | Tests | Coverage Area |
|-----------|-------|---------------|
| solana-integration | 39 | Wallet, transactions, RPC recovery |
| perp-engine | 34 | Liquidation, leverage, funding rates |
| pwa | 33 | Service worker, install, offline |
| competition | 30 | Scoring, prizes, leaderboards |
| gamification | 29 | XP, badges, LP, streaks |
| tokenomics | 28 | Supply, vesting, revenue split |
| education | 28 | Modules, lessons, quiz progression |
| percolator-mutations | 27 | On-chain perp operations |
| trading | 25 | Fees, position averaging, validation |
| percolator-hooks | 24 | React hooks for Percolator |
| on-chain-types | 20 | Anchor type encoding/decoding |
| treasury | 19 | Treasury allocations and flows |
| chain-abstraction | 16 | Multi-chain adapter layer |
| critical-radius | 9 | Risk math edge cases |

## Architecture Principles

1. **Near-zero marginal cost** — Cloudflare free tier + client-side Zustand means 50,000+ users before any infrastructure spend
2. **Offline-first** — PWA with Workbox caching strategies (StaleWhileRevalidate for prices, CacheFirst for images, NetworkFirst for APIs)
3. **Chain-agnostic interface** — `src/chain/` abstraction layer isolates Solana-specific code for future multi-chain expansion
4. **Optimistic updates** — LimerBridge syncs local state to on-chain with graceful fallback
5. **Security by design** — API keys on Cloudflare Workers (never in bundle), CSP headers, Supabase RLS, no FALLBACK_ANSWERS in client
