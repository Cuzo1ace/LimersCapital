# Architecture

Limer's Capital is a React single-page application with no server-side rendering, deployed on Cloudflare Pages with Cloudflare Workers handling API proxying.

## High-Level Architecture

```
Browser (React SPA)
    |
    +-- Zustand Store (single file, ~1300 lines)
    |       |-- activeTab (tab-based routing)
    |       |-- user state (XP, LP, badges, streaks)
    |       |-- trading state (portfolios, orders, positions)
    |       |-- education state (progress, quiz answers)
    |
    +-- Cloudflare Workers (API proxy layer)
    |       |-- limer-api-proxy (Helius, Jupiter, FMP)
    |       |-- ttse-proxy (stockex.co.tt scraper)
    |
    +-- Solana (on-chain state)
    |       |-- Anchor program (UserProfile, TradeLog PDAs)
    |       |-- Jupiter V6 (real swaps)
    |       |-- Pyth Hermes (price feeds)
    |
    +-- Supabase (off-chain persistence)
            |-- User progress (RLS-protected)
            |-- Leaderboards
            |-- Quiz validation
```

## Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | Zustand over Redux | Single-file simplicity, no boilerplate, sufficient for SPA |
| Hosting | Cloudflare over Vercel | Free tier with Workers, KV, edge caching; Caribbean edge nodes |
| On-chain framework | Anchor over Seahorse | Mature ecosystem, better tooling, IDL generation |
| Routing | Tab-based (store.activeTab) over React Router | Simpler mental model for SPA with no nested routes |

## LimerBridge

LimerBridge is the optimistic state sync layer between the Zustand store and on-chain Anchor program. Actions are applied optimistically in the store and confirmed asynchronously on-chain, providing instant UI feedback while maintaining blockchain finality.

[See the Solana program details -->](solana-program.md)
