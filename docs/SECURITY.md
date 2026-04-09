# Security Architecture

**Project:** Limer's Capital
**Last updated:** April 7, 2026

---

## 1. API Key Proxy Pattern

All sensitive API keys are stored as **Cloudflare Worker secrets** and never appear in client bundles.

| Key | Service | Storage |
|-----|---------|---------|
| `HELIUS_API_KEY` | Solana RPC + DAS API | Worker secret (`wrangler-api.toml`) |
| `FMP_API_KEY` | Financial Modeling Prep | Worker secret (`wrangler-api.toml`) |
| `FINNHUB_API_KEY` | Market data | Worker secret (`wrangler-api.toml`) |
| `ANTHROPIC_API_KEY` | Claude AI market briefs | Worker secret (`wrangler-api.toml`) |

### How It Works

1. Client sends request to `VITE_API_PROXY_URL` (e.g., `/rpc`, `/fmp/cryptocurrency-list`)
2. Worker validates origin against allowlist
3. Worker appends the API key server-side
4. Worker forwards to the upstream API
5. Response returned to client — key never exposed

### Origin Allowlist

Defined in `workers/api-proxy.js`:

- `limerscapital.com` (production)
- `caribcryptomap.pages.dev` (Cloudflare Pages)
- `localhost:3000`, `localhost:5173` (development only, non-production)

Requests from non-allowed origins receive a 403 response.

---

## 2. Content Security Policy (CSP)

A CSP meta tag in `index.html` restricts which domains the app can connect to:

- **connect-src**: Solana RPC endpoints, Jupiter API, Helius, our Workers, PyTH
- **frame-src**: `'none'` (no iframes)
- **object-src**: `'none'` (no plugins)

### Trusted RPC Domain Validation

`src/solana/config.js` maintains a `TRUSTED_RPC_DOMAINS` allowlist. The `isRpcUrlTrusted()` function validates:

- Protocol must be HTTPS (except localhost for development)
- Domain must be in the trusted list
- Custom RPC URLs failing validation fall back to public Solana RPC with a console warning

---

## 3. Transaction Security

### Quote Freshness

Jupiter swap quotes include a `_fetchedAt` timestamp. Before executing a swap, the app checks:

```
if (Date.now() - quote._fetchedAt > 30_000) → reject as stale
```

This prevents stale-price swap execution.

### Transaction Simulation

Before signing any Jupiter swap, the transaction is simulated via `simulateTransaction()`:

```
simConnection.simulateTransaction(transaction) → check for errors before wallet prompt
```

Users never sign a transaction that would fail on-chain.

### Confirmation Polling

`confirmTransactionSafe()` in `src/solana/confirm.js` polls for transaction confirmation with a 30-second timeout. Returns `{ err, elapsed }` structure for error handling.

---

## 4. Rate Limiting

### API Proxy Rate Limiting

The `limer-api-proxy` Worker implements per-IP rate limiting:

- **General routes**: 30 requests/minute per IP
- **Quiz submission**: Additional attempt tracking per IP (prevents brute-force answer guessing)
- **Memory cleanup**: Rate limit maps purge every 5 minutes with 10K entry hard cap

### Quiz Answer Validation

Quiz answers are validated **server-side** in the Worker. The client never receives correct answers — it sends the user's selections and receives pass/fail with score. This prevents inspect-element cheating.

---

## 5. Wallet Security

### No Private Key Handling

The app uses the **Wallet Standard** (`@wallet-standard/app`, `@solana/wallet-standard-features`). Private keys never touch our code. All signing is delegated to the user's wallet (Solflare, Phantom, etc.).

### State Exclusion

`walletAddress` and `walletConnected` are **explicitly excluded** from localStorage persistence (line 1254 of `useStore.js`). This means:

- Closing the browser disconnects the wallet
- No wallet data persists in localStorage
- Prevents localStorage from becoming a behavioral dossier linking wallet addresses to browsing sessions

### Sybil Resistance

- Referral codes are derived from wallet addresses: `'LIMER-' + walletAddress.slice(0, 8).toUpperCase()`
- Referral redemption requires wallet connection (can't farm referrals without real wallets)
- Duplicate referral codes are rejected

---

## 6. Error Sanitization

`src/components/ErrorBoundary.jsx` includes `sanitizeErrorMessage()` which strips:

- API keys (patterns matching key formats)
- Wallet addresses (hex 40+ chars, base58 32-44 chars)
- File paths (Unix and Windows patterns)
- URLs with query parameters (may contain keys)
- Messages capped at 200 characters

Users never see raw error messages containing sensitive data.

---

## 7. State Integrity

### Store Versioning

`_storeVersion` in `useStore.js` tracks the data schema version. When the schema changes:

1. Bump `_storeVersion`
2. Zustand `persist` middleware detects the change
3. Missing fields initialize to their defaults (safe — no migration function needed for additive changes)

### Partialize Whitelist

The `partialize` function (lines 1253-1315) explicitly lists every field to persist. This is a **whitelist approach** — any field not listed is ephemeral and never touches localStorage. This prevents accidental persistence of sensitive runtime data.

---

## 8. On-Chain Program Security

### Immutability

The program at `HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk` has **no upgrade authority**. Once deployed, the code cannot be changed. This provides:

- User trust: the program they interact with today is the same program tomorrow
- No rug-pull risk: no admin can alter program logic
- Trade-off: bugs cannot be patched (must deploy successor program)

### Access Control

All Anchor instructions use `has_one = owner` constraint — only the wallet that created a PDA can modify it. There are no admin-only instructions or privileged signers.

### Minimal On-Chain Footprint

- UserProfile: 86 bytes (including 8-byte discriminator)
- TradeLog: 61 bytes
- Only aggregates stored on-chain (total XP, total volume, badge bitmap)
- Individual trade data stays in localStorage — not exposed on-chain

---

*Report security issues to the founder directly via encrypted channel. See TREASURY.md for contact methods.*
