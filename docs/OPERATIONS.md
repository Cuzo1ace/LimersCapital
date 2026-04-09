# Limer's Capital — Operations Runbook

**Last updated:** April 7, 2026

---

## 1. Development Setup

### Prerequisites

- **Node.js 24.x** (specified in `package.json` engines)
- **npm** (comes with Node)
- **Wrangler** (`npm i -g wrangler`) for Worker deployment
- **Anchor CLI** (optional, only for on-chain program development)

### Quick Start

```bash
git clone https://github.com/Cuzo1ace/LimersCapital.git
cd caribcryptomap
npm install
npm run dev
```

Dev server runs on `http://localhost:5173` (Vite default).

### Environment Variables

Create `.env.local` in project root:

```env
# Solana RPC — falls back to public RPC if not set
VITE_SOLANA_RPC_URL=https://your-helius-or-quiknode-url.com

# API proxy for CORS and key hiding (Cloudflare Worker)
VITE_API_PROXY_URL=https://limer-api-proxy.solanacaribbean-team.workers.dev

# TTSE proxy (Caribbean stock data)
VITE_TTSE_PROXY_URL=https://ttse-proxy.solanacaribbean-team.workers.dev

# PostHog analytics (optional)
VITE_POSTHOG_KEY=your-posthog-key

# Helius API key for client-side RPC (if not using proxy)
VITE_HELIUS_API_KEY=your-helius-key
```

### Percolator SDK Note

`@percolator/sdk` is a local file dependency (`file:../percolator-launch/packages/core`). For fresh clones without the Percolator repo nearby, the build externalizes it via `vite.config.js` `rollupOptions.external`. The app works without it — perpetual features gracefully degrade.

---

## 2. Testing

```bash
# Run all tests (currently 284)
npx vitest run

# Watch mode (re-runs on file changes)
npx vitest
```

### Test Structure

- Tests live in `src/test/` (not colocated with source files)
- Framework: **Vitest 4** with **jsdom** environment
- Setup: `src/test/setup.js` configures `@testing-library/jest-dom` matchers
- Pattern: Pure unit tests importing from `src/data/` — mostly data validation, no React component rendering

### Test Files

| File | Tests | What it covers |
|------|-------|---------------|
| `education.test.js` | Lessons, modules, quizzes structure | Data integrity |
| `gamification.test.js` | XP tiers, badges, LP actions | Progression logic |
| `tokenomics.test.js` | Distribution, staking, revenue | Economic model |
| `regulations.test.js` | Jurisdiction data completeness | Regulatory map |
| `trading.test.js` | Trade execution, P&L, fees | Trading engine |
| `lp.test.js` | LP earning, multipliers | Points system |
| `challenges.test.js` | Weekly challenges, practice | Challenge logic |
| `glossary.test.js` | Term definitions | Content completeness |

---

## 3. Production Build & Deploy

### Build

```bash
npx vite build
```

Outputs to `dist/`. The build is a static SPA (no SSR).

### Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy dist/ --project-name caribcryptomap
```

### GitHub Actions CI/CD

The `.github/workflows/deploy.yml` workflow triggers on push to `main`:

**Required CI secrets:**
- `VITE_HELIUS_API_KEY`
- `VITE_SOLANA_RPC_URL`
- `VITE_TTSE_PROXY_URL`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

---

## 4. Worker Deployment

Two Cloudflare Workers power the backend:

| Worker | Config File | Purpose |
|--------|-----------|---------|
| `ttse-proxy` | `workers/wrangler.toml` | TTSE stock data proxy with origin-locked CORS |
| `limer-api-proxy` | `workers/wrangler-api.toml` | API proxy (Helius, FMP, Finnhub), quiz validation, rate limiting |

### Deploy Both Workers

```bash
cd workers
chmod +x deploy.sh
./deploy.sh
```

### Deploy Individually

```bash
cd workers

# TTSE proxy
wrangler deploy ttse-proxy.js --name ttse-proxy

# API proxy
wrangler deploy api-proxy.js -c wrangler-api.toml
```

### Verify Deployment

```bash
curl https://ttse-proxy.solanacaribbean-team.workers.dev
curl https://limer-api-proxy.solanacaribbean-team.workers.dev/rpc
```

---

## 5. API Secret Rotation

All sensitive API keys are stored as **Cloudflare Worker secrets** (never in client bundles):

| Secret | Service | Worker |
|--------|---------|--------|
| `HELIUS_API_KEY` | Solana RPC + DAS | limer-api-proxy |
| `FMP_API_KEY` | Financial Modeling Prep (crypto prices) | limer-api-proxy |
| `FINNHUB_API_KEY` | Market data | limer-api-proxy |
| `ANTHROPIC_API_KEY` | Claude AI (market briefs) | limer-api-proxy |

### Rotation Procedure

```bash
cd workers

# Rotate a specific secret
wrangler secret put HELIUS_API_KEY -c wrangler-api.toml
# (Paste new key when prompted — it won't be echoed)

# Verify the worker still responds
curl https://limer-api-proxy.solanacaribbean-team.workers.dev/rpc
```

> Secrets are set on the Worker, NOT in `.env.local`. The proxy pattern keeps them server-side. Client-side code never sees these keys.

---

## 6. RPC Endpoint Configuration

The Solana RPC endpoint is configured via `VITE_SOLANA_RPC_URL` environment variable.

### Trusted RPC Domains

Only RPC URLs from trusted domains are accepted (see `src/solana/config.js`):

- `solana.com` (public RPC)
- `helius-rpc.com` / `helius.dev`
- `quiknode.pro`
- `triton.one`
- `ankr.com`
- `alchemy.com`
- `solanacaribbean-team.workers.dev` (our proxy)
- `localhost` (development)
- `limerscapital.com`

To add a new trusted domain, update the `TRUSTED_RPC_DOMAINS` array in `src/solana/config.js`.

### Cluster Selection

Default cluster: `devnet`. Users can toggle between devnet and mainnet-beta in the app UI. The selected cluster persists to localStorage.

---

## 7. Anchor Program

| Property | Value |
|----------|-------|
| Program ID | `HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk` |
| Framework | Anchor 0.31.1 |
| Source | `anchor/programs/limer/src/lib.rs` |
| IDL | `src/solana/idl/limer.json` |
| Status | Immutable (no upgrade authority) |

### Build & Deploy

```bash
cd anchor
anchor build
anchor deploy
```

### Instructions

| Instruction | Purpose |
|-------------|---------|
| `initialize_user()` | Create UserProfile + TradeLog PDAs |
| `award_xp(amount)` | Increment XP |
| `award_lp(base_amount, multiplier_pct)` | Award LP with multiplier |
| `record_badge(badge_index)` | Set bit in badges bitmap (max 32) |
| `record_module(module_index)` | Set bit in modules bitmap (max 8) |
| `check_in_daily()` | Update streak based on time elapsed |
| `record_trade(volume_usd, fee_amount)` | Append trade aggregates |
| `close_account()` | Close PDAs, reclaim rent |

### PDA Derivation

- UserProfile: seeds `["user", owner_pubkey]`
- TradeLog: seeds `["trades", owner_pubkey]`

---

## 8. Monitoring & Debugging

### Browser Console

All on-chain sync operations are logged with `[Bridge]` prefix. Look for:
- `[Bridge] Auto-initializing profile...`
- `[Bridge] Syncing badge: <badge_id>`
- `[Bridge] Recording trade: $<volume>`

### Worker Logs

```bash
# Tail live logs from API proxy
wrangler tail limer-api-proxy

# Tail TTSE proxy logs
wrangler tail ttse-proxy
```

### Analytics

PostHog integration (if `VITE_POSTHOG_KEY` is set) tracks:
- Page views, wallet connections, trade executions
- Feature usage (lessons read, quizzes taken, Jupiter swaps)
- Not tracked: wallet addresses, balances, personal data (excluded from persistence)

---

*See also: [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) for why we made these technical choices.*
