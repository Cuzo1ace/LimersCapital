# Architecture Decision Records

**Project:** Limer's Capital
**Last updated:** April 7, 2026

---

## ADR-001: Zustand over Redux

**Status:** Accepted
**Date:** 2025

### Context

The app requires complex nested state spanning trading, gamification, wallet integration, education progress, and portfolio management. A single-page app with 17 pages and 150+ state fields needs a reliable, performant state solution.

### Decision

Zustand 5 with `persist` middleware and `partialize` for selective localStorage persistence.

### Rationale

- **Zero boilerplate** — no action creators, reducers, or Provider wrappers
- **Tiny bundle** — ~1.2KB vs Redux Toolkit at ~11KB
- **Built-in persistence** — `persist` middleware with `partialize` (line 1253 of `useStore.js`) selectively stores only safe fields
- **Cross-slice access** — `get()` allows any action to read/modify any state (e.g., `executeTrade()` calls `get().awardXP()` and `get()._checkBadges()`)
- **React-external access** — store is importable outside React components (used in bridge, analytics)

### Consequences

- Single 1,320-line store file — acceptable for solo developer, needs splitting into domain stores at ~10K MAU
- No Redux DevTools (Zustand has its own devtools middleware, not yet enabled)
- All state logic in one place makes it easy to trace but hard to parallelize development

---

## ADR-002: Cloudflare Workers over Vercel Functions

**Status:** Accepted
**Date:** 2025

### Context

Need API proxy to hide sensitive keys (HELIUS, FMP, FINNHUB, ANTHROPIC) from client bundles. Also need CORS handling for TTSE data fetching and server-side quiz answer validation.

### Decision

Two Cloudflare Workers: `api-proxy.js` (multi-route API proxy) and `ttse-proxy.js` (TTSE stock data proxy).

### Rationale

- **Generous free tier** — 100K requests/day (sufficient for years of growth)
- **Edge deployment** — low latency for Caribbean users
- **Built-in KV** — used for rate limiting (per-IP counters, quiz attempt tracking)
- **Wrangler CLI** — scriptable deployment via `workers/deploy.sh`
- **Secrets management** — `wrangler secret put` stores keys server-side, never in client

### Consequences

- Separate deploy pipeline from the SPA (two wrangler config files: `wrangler.toml`, `wrangler-api.toml`)
- Worker code is vanilla JS (no framework), simple but requires manual route handling
- Origin allowlist must be maintained manually in worker code

---

## ADR-003: Anchor over Seahorse

**Status:** Accepted
**Date:** 2025

### Context

Need a Solana program to store user profiles, badges, trade aggregates, and streaks on-chain. Must generate a TypeScript-compatible IDL for the frontend client.

### Decision

Anchor framework (v0.31.1) with Rust.

### Rationale

- **Industry standard** — largest Solana developer ecosystem, most documentation
- **IDL generation** — automatic TypeScript client from Rust program
- **PDA pattern** — well-documented seed-based account derivation
- **Account validation** — `has_one`, `seeds`, `bump` constraints prevent unauthorized access
- **Community support** — extensive examples, audit tooling, and deployment patterns

### Consequences

- Requires Rust toolchain for program development (not needed for frontend-only work)
- Anchor version lock (0.31.1) — must be compatible with Solana runtime version
- Program is immutable after deployment (no upgrade authority set) — see TREASURY.md for succession plan

---

## ADR-004: localStorage Persistence (Client-Side-First)

**Status:** Accepted
**Date:** 2025

### Context

User progress (XP, lessons, trades, badges, LP, streaks) must survive page reloads. The platform targets Caribbean markets where connectivity can be variable.

### Decision

Zustand `persist` middleware with `partialize` function (lines 1253-1315 of `useStore.js`). All user state lives in localStorage under the key `caribcrypto-storage`.

### Rationale

- **Zero infrastructure cost** — no database, no auth server, no backend
- **Instant reads** — no network round-trip for state access
- **Offline-capable** — paper trading works without internet
- **Privacy-preserving** — data stays on user's device, no server-side collection

### Security Measures

- `walletAddress` and `walletConnected` are **explicitly excluded** from persistence (line 1254 comment)
- `partialize` whitelist approach — only listed fields are stored, everything else is ephemeral
- Store version tracking (`_storeVersion`) enables safe migrations when data shape changes

### Consequences

- Data loss on cache clear (acceptable for beta — on-chain sync via bridge is the permanent backup)
- No cross-device sync (users must reconnect wallet on each device)
- localStorage has a ~5MB limit — trade history capped at 100 entries, LP history at 500

---

## ADR-005: Bridge Pattern (Local-First, On-Chain Backup)

**Status:** Accepted
**Date:** 2025

### Context

The app needs to work instantly (no loading spinners for state) while also persisting important data on-chain for permanence and verifiability.

### Decision

`useLimerBridge()` hook in `src/solana/bridge.js` watches Zustand state and fires Anchor mutations as a side effect. Local state is the source of truth; on-chain is the backup.

### Data Flow

```
User Action → Zustand Update (instant) → UI Re-renders
                    ↓
            Bridge Detects Change
                    ↓
          Anchor Mutation (async, fire-and-forget)
                    ↓
          On-chain PDA Updated (may fail — non-fatal)
```

### Rationale

- **Optimistic updates** — UI is never blocked by network
- **Failure-tolerant** — if the Solana transaction fails, local state is still correct. Bridge retries on next render cycle.
- **Session deduplication** — bridge tracks queued items per session (badges, modules, trades) to prevent double-recording
- **Minimal on-chain footprint** — only aggregates are stored (total XP, total volume, badge bitmap), not individual events

### Consequences

- On-chain state can lag behind local state if transactions fail
- If user clears localStorage AND has no wallet connected, progress is lost (on-chain backup requires wallet reconnection to restore)
- Bridge code is complex (217 lines) — must be carefully maintained during store changes

---

*These records document the reasoning behind key architectural choices. If you're considering changing any of these decisions, weigh the original rationale against the new requirements and document the new ADR.*
