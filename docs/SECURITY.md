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

> **Drift notice (April 17, 2026):** A previous version of this section claimed the program had **no upgrade authority**. That claim was aspirational and has been retracted. The current authority state is documented below and in `docs/SECURITY_MODEL.md`. Audit finding **C-01** tracks the migration plan to a Squads v4 multisig.

### Current Upgrade Authority (verified on-chain 2026-04-17)

```
solana program show HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk --url devnet
  → Authority: 3wvJe17zVfFm48DHVYGfShNg2p9r8C2ijgyZiXQcPkgd
```

- **Network:** devnet only (program is not deployed to mainnet-beta as of this writing).
- **Authority type:** Single EOA keypair held by the founder.
- **Risk:** A compromise of that key allows an attacker to deploy a malicious program upgrade that could backdate XP, fabricate badges, or drain any future on-chain balances.
- **Remediation plan:** See `docs/SECURITY_MODEL.md` §2 — migrate to a 3-of-5 Squads v4 multisig **before mainnet deploy.** No mainnet deploy of this program is authorized until the multisig migration is complete.

### User-Scoped Access Control (unchanged)

All Anchor instructions use `has_one = owner` constraint — only the wallet that created a PDA can modify it. There are no admin-only instructions or privileged signers **at the instruction level**. This is separate from the **program-level upgrade authority** covered above; compromising the upgrade authority defeats `has_one` because the attacker can redeploy the program without the constraint.

### State-Sync Integrity Gap

The `LimerBridge` (`src/solana/bridge.js`) is a fire-and-forget synchronization layer from Zustand → Anchor program PDAs. A user with DevTools access can edit `localStorage.caribcrypto-storage`, and the bridge will faithfully replay those edits to the chain. This poisons the on-chain record. Audit finding **H-01** tracks the server-authoritative remediation; audit finding **C-01** recommends a `TradeDispute` instruction (scaffolded in `anchor/programs/limer/PHASE2_DISPUTE_DESIGN.md`) so a user or the multisig can mark a poisoned PDA state and initiate a challenge window.

### Minimal On-Chain Footprint (unchanged)

- UserProfile: 86 bytes (including 8-byte discriminator)
- TradeLog: 61 bytes
- Only aggregates stored on-chain (total XP, total volume, badge bitmap)
- Individual trade data stays in localStorage — not exposed on-chain

---

## 9. Content Security Policy Hardening — Remediation Runbook (C-03)

**Audit reference:** `Limers-Capital-Security-Audit-Report-April-2026.md` finding C-03.
**Threat model:** Ledger Connect Kit-class supply-chain attack (December 2023) — compromised transitive npm dependency injects a wallet-drainer script into a financial dApp bundle.

### Current posture (Phase 1 — shipped April 2026)

Two CSP headers are emitted from `public/_headers`:

1. **`Content-Security-Policy`** — the enforced policy. Permissive (still allows `'unsafe-inline'` / `'unsafe-eval'` in `script-src`) so the production bundle is not broken during hardening.
2. **`Content-Security-Policy-Report-Only`** — the hardened target. Drops `'unsafe-inline'` and `'unsafe-eval'`, retains only `'wasm-unsafe-eval'` (required by `@solana/web3.js` and several wallet adapters). Violations are POSTed to the Worker endpoint `/csp-report`, which forwards them to Sentry tagged `source: 'csp-report'`.

The inline boot-recovery script that used to live in `index.html` was extracted to `public/boot-recover.js` and pinned by SRI (`integrity="sha384-..."`). This is the **only** script in the production HTML that was inline; moving it out means Phase 2 enforcement will not need an inline-script escape hatch.

Supporting wiring:

- `public/boot-recover.js` — self-hosted, SRI-pinned. Regenerate the hash after any edit:
  ```bash
  openssl dgst -sha384 -binary public/boot-recover.js | openssl base64 -A
  ```
  Then update the `integrity=` attribute in `index.html`.
- `workers/api-proxy.js::handleCspReport` — accepts `application/csp-report` (CSP v1) and `application/reports+json` (CSP v3 Reporting API). Size-capped at 16KB, rate-limited by IP.
- `Reporting-Endpoints: csp-endpoint="..."` header in `public/_headers` — the CSP v3 report group.

### Phase 2 — Promote Report-Only to enforced (target: 7 days after Phase 1 deploy)

1. Every morning during the 7-day window, check the Sentry "csp-report" filter. Legitimate violations fall into three buckets:
   - **A wallet or browser extension** injecting content — expected for wallet-standard apps, can be ignored or allowlisted via a hash.
   - **A new third-party domain** the app genuinely needs — add to the relevant directive in both policies.
   - **A real regression** (unknown inline script, unexpected eval) — investigate immediately; this could be the exact supply-chain attack the CSP is designed to catch.
2. After 7 days with zero Bucket C violations, edit `public/_headers`:
   - Replace the contents of the enforced `Content-Security-Policy` line with the Report-Only line's directives.
   - Delete the `Content-Security-Policy-Report-Only` line.
   - Keep the `Reporting-Endpoints` header — it still works with enforced mode, so blocked requests still generate reports.
3. Deploy. Monitor Sentry for 24 hours for any user-visible breakage.

### Phase 3 — Eliminate the Google Fonts external dependency (target: 2 weeks after Phase 2)

The `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">` at `index.html:22` cannot be safely SRI-pinned because Google rewrites the response per-browser-UA. A pinned hash would break fonts for users on any browser version Google hasn't generated a stylesheet for yet.

Resolution:

1. Add `@fontsource/inter` and `@fontsource/space-grotesk` as dependencies.
2. Replace the Google Fonts `<link>` in `index.html` with `import '@fontsource/inter/...'` statements in `src/main.jsx`.
3. Remove `https://fonts.googleapis.com` and `https://fonts.gstatic.com` from `font-src` / `style-src` / `connect-src` in both CSP headers.
4. Once the fonts are self-hosted, Vite emits them under `/assets/*` with content-hashed filenames — automatic SRI is unnecessary because the URL itself is immutable.

### Phase 4 — CI bundle-hash lock (target: same sprint as Phase 3)

The enforced CSP prevents runtime injection of unknown scripts, but does not prevent a malicious commit from *replacing* the expected `/assets/index-*.js`. Close the loop in CI:

1. After `vite build`, compute `sha384` of every file in `dist/assets/` matching `index-*.js`, `index-*.css`.
2. Compare against `scripts/ci-expected-bundle-hashes.json` (checked in).
3. If any hash changes, fail the deploy with a message identifying the source diff that caused the change. Deliberate updates require a human to regenerate the expected-hash file in the same PR.

This is analogous to `package-lock.json` integrity for the compiled output. Combined with CSP, it means **any deviation from the expected bundle either fails at build time or is blocked by the browser at runtime.**

### On-Call Cheatsheet

- **"The site looks broken"** — check Sentry for `csp-violation` reports. A legitimate violation never *breaks* the site during Phase 1 (Report-Only is observation-only). If the site is broken, the cause is elsewhere.
- **"Fonts aren't loading"** — likely a Google Fonts outage (not CSP). Temporary workaround: switch to system fonts in `index.html`.
- **"I deployed and now X doesn't work"** — did you edit `public/boot-recover.js` without updating the `integrity=` attribute? Browsers will refuse to execute the script and the boot-stuck fallback will not trigger. Regenerate the hash.

---

## 10. Error Telemetry Activation Runbook (C-02)

**Audit reference:** `Limers-Capital-Security-Audit-Report-April-2026.md` finding C-02.
**Status:** Code fully wired. DSN provisioning is the one remaining manual step.

The codebase ships with a complete Sentry integration (`src/sentry.js`, `src/main.jsx`, `src/components/ErrorBoundary.jsx`, and a zero-dependency worker-side reporter in `workers/api-proxy.js::reportToSentry`), but every code path is a no-op while the DSN env vars are unset. This section is the exact sequence to turn it on.

### Step 1 — Create the Sentry project (5 min)

1. Sign up at [sentry.io](https://sentry.io) (free tier: 5K errors/month, sufficient for our traffic).
2. Create a new project:
   - **Platform**: React
   - **Alert frequency**: "On every new issue"
   - **Team**: default
3. Copy the DSN (format: `https://<publicKey>@<host>/<projectId>`). You will paste this in three places.
4. Under *Settings → Security & Privacy*, enable **"Filter out errors from known web crawlers"** and **"Scrub data from User IPs"**.

### Step 2 — Activate frontend telemetry (Cloudflare Pages, 3 min)

1. In Cloudflare dashboard: *Workers & Pages → limerscapital (Pages project) → Settings → Environment variables*.
2. Add a **Production** variable:
   - Name: `VITE_SENTRY_DSN`
   - Value: the DSN from Step 1
3. *Deployments → Retry deployment* on the latest production deploy. Vite needs the env var at build time — the DSN is baked into the bundle.
4. Smoke-test: visit the production site, open DevTools, run `throw new Error('sentry-smoke-test-1')` in the console. The event should appear in the Sentry dashboard within 30 seconds, tagged `source: frontend`.

### Step 3 — Activate worker telemetry (5 min)

From the repo root:

```bash
cd workers
npx wrangler secret put SENTRY_DSN -c wrangler-api.toml
# Paste the SAME DSN when prompted. Do NOT use a separate project —
# we want frontend + worker events in one dashboard so timelines align
# during incident response.
```

Smoke-test: call a known-bad worker route (e.g., `curl https://limer-api-proxy.solanacaribbean-team.workers.dev/jupiter/price?ids=INVALID`). The upstream-failure event should appear in Sentry tagged `source: cloudflare-worker`.

### Step 4 — Uptime monitoring (10 min)

Sentry catches **errors**. It does not catch **the worker being down entirely** or **the frontend returning a 500 from Cloudflare**. Add an external uptime monitor:

**Recommended: [Better Stack](https://betterstack.com/better-uptime)** (free tier: 10 monitors, 3-minute checks).

Create two monitors:

| Monitor | URL | Expected | Alert |
|---|---|---|---|
| Frontend | `https://limerscapital.com` | 200, response body contains `Limer's Capital` | Email + Slack to founder |
| API proxy | `https://limer-api-proxy.solanacaribbean-team.workers.dev/jupiter/price?ids=So11111111111111111111111111111111111111112` | 200, JSON response | Email + Slack to founder |

The second URL is a cheap real-traffic probe — if Helius or Jupiter is down upstream, the probe will catch it before users do.

Configuration is tracked in `ops/uptime-monitors.md` (the canonical source of truth for monitor URLs, thresholds, and alert routing). If you swap providers, update that doc and this section.

### Step 5 — Source map upload (deferred — optional Phase 2)

Without source maps, Sentry stack traces point at minified bundle names like `index-abc123.js:1:45678`, which is unreadable. Options:

- **`@sentry/vite-plugin`** — adds ~2 seconds to build time, uploads source maps to Sentry, then deletes them from `dist/` so they are not served publicly. Configure with a Sentry auth token stored as a Cloudflare Pages secret (`SENTRY_AUTH_TOKEN`).
- **Skip for now** — for pre-submission work, readable stack traces are nice-to-have, not critical. File as a P3 follow-up.

### Step 6 — Confirm activation in the audit remediation log

After Steps 1-4 are verified by smoke test, append to `docs/remediation-log.md`:

```
## C-02 — Sentry telemetry activated
- Date: <YYYY-MM-DD>
- Frontend DSN: set in Cloudflare Pages env vars (Production)
- Worker DSN: set via `wrangler secret put SENTRY_DSN`
- Smoke test: <link to Sentry event IDs>
- Uptime monitors: <link to Better Stack dashboard>
- Status: Closed
```

### Why no DSN is committed to the repo

The DSN is a **public write-only key** — the audit explicitly marks it as safe to include in the client bundle. But we still store it in env vars rather than checking it into `.env.example`, because:

1. Rotating the DSN requires touching only the Cloudflare dashboard, not a code commit.
2. Preview deployments from PRs should **not** send events to the production Sentry project. A separate DSN for staging is trivial to provision later.
3. The audit log shows who turned Sentry on and when — checking a DSN into git loses that provenance.

---

*Report security issues to the founder directly via encrypted channel. See TREASURY.md for contact methods.*
