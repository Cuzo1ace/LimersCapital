# Frontend Security Audit — Limer's Capital
**Audit date**: 2026-04-18
**Scope**: `src/**`, `public/**`, `vite.config.js`, `.github/workflows/*.yml`, `index.html`, `dist/**` (runtime verification)
**Commit audited**: `86b7d4c135eef03a5c74d86fadbd3d18bd1db8a5`

## Executive Summary
- **0 Critical / 3 High / 6 Medium / 5 Low / 3 Informational** findings
- **Verdict: Yellow.** No active code-execution path for funds loss found. Devnet-only exposure bounds real-world risk today. CSP Phase 1 is in place; CSP Phase 2 (enforced hardening) and secret-scanned build gate are the largest remaining gaps. Transaction-construction integrity is good: destination ATAs are derived from the signer's own pubkey via SPL-token PDA derivation, not a catalog, so a compromised frontend cannot silently redirect to an attacker's ATA without also forging a matching PDA. Live swap UI continues to pull reserves from the pool vault each quote (`amm-swap.js:65-75`), so the displayed "minimum out" reflects real on-chain state, not seed data.

## Findings (sorted by severity)

### [H-01] `min_amount_out` computed entirely client-side → bypassable by malicious bundle
`src/solana/amm-swap.js:120-122` computes slippage in the browser: `minAmountOut = (amountOut * slipFactor) / BPS_DENOMINATOR`. The Anchor program receives this value as an instruction arg (`amm-swap.js:191`). A supply-chain compromise of the frontend (npm, Pages CDN, a stolen CF API token) can set `minAmountOut = 0` and sandwich every user. Mitigation: the **program** must bound `min_amount_out` against a policy (e.g., require ≥ `quoted_amount * (1 - max_slippage_bps)` for a pool-level `max_slippage_bps` stored in `AmmConfig`). Tracked as an on-chain change, but it's in-scope for the frontend audit because today the frontend is the only authority on the number.

### [H-02] `VITE_SUPABASE_ANON_KEY` hardcoded fallback in source
`src/lib/supabase.js:13` ships the real anon JWT as a literal string fallback. This is a public-safe token by design, but baking it in source (not just env) undermines rotation — a JWT rotation now requires a code change + redeploy instead of a Pages env var flip. More importantly, `exp: 2091266105` (2091) and `iat: 1775690105` (2026) → the token has a **~65-year lifetime**. Combined with no key rotation story, RLS becomes the sole defense. Move the JWT to `VITE_SUPABASE_ANON_KEY` only (no fallback), shorten lifetime to ≤1 year, schedule rotation.

### [H-03] Cluster switch has no "signed-tx destination" guard
`src/components/layout/Header.jsx:65` exposes `setCluster`; `MobileNav.jsx:151` flips devnet↔mainnet on click. The SwapPanel hardcodes `DEFAULT_CLUSTER` (`SwapPanel.jsx:113`), but `JupiterSwap.jsx:129, 151, 177` and `percolator.js` switch based on the store. There is no UI banner that re-renders the unsigned-tx preview showing the target cluster before sign. Because the AMM program ID (`FVk7LzdZ…`) does not exist on mainnet, a mainnet swap attempt will fail safely, but the perception-layer risk remains: a user can flip to mainnet, sign a Jupiter route, think they're on devnet, and move real funds. Fix: on the confirmation button, display `{cluster.toUpperCase()}` inline; disable non-devnet swaps for AMM routes; require a one-time warning modal when switching to mainnet.

### [M-01] `script-src 'unsafe-inline' 'unsafe-eval'` still enforced
`public/_headers:28` — the enforced CSP allows both. `unsafe-inline` + `unsafe-eval` reduces script CSP to effectively off. The Report-Only variant (line 37) is already clean (`'wasm-unsafe-eval'` only). Verified in production headers. Eliminate PostHog inline snippet by loading `array.js` via a `<script src>` with CSP-allowed host, then promote Report-Only.

### [M-02] Supabase wildcard `*.supabase.co` in `connect-src` plus explicit project host
`public/_headers:28` allows both `https://*.supabase.co` and the specific project host. Because the app is tied to ONE Supabase project (`uszaeqtrifenpibptvus`), the wildcard is unnecessary attack surface — a malicious script could exfiltrate to any Supabase project. Drop the wildcard, keep only `https://uszaeqtrifenpibptvus.supabase.co wss://uszaeqtrifenpibptvus.supabase.co`.

### [M-03] `frame-ancestors 'self'` permits same-origin framing
`public/_headers:28` uses `'self'`. The app has no legitimate reason to iframe itself. Tighten to `'none'`. `X-Frame-Options: SAMEORIGIN` (line 6) is consistent but equally loose.

### [M-04] `https://api.allorigins.win` in `connect-src` — untrusted third-party proxy
`public/_headers:28` whitelists `api.allorigins.win`. Referenced only in a comment in `src/api/ttse.js:110`; no code path actively uses it. Remove from CSP to eliminate exfiltration surface.

### [M-05] Jupiter swap falls back to direct mainnet RPC with no proxy
`src/components/JupiterSwap.jsx:129, 151, 177` directly hit `https://api.mainnet-beta.solana.com` when `VITE_API_PROXY_URL` is unset or the proxy path is bypassed. Public Solana RPC is rate-limited and periodically returns stale state — a stale-state quote window can cost users slippage. More importantly, `connectWallet = wallets.find(w => w.accounts?.some(a => a.address === walletAddress))` at `JupiterSwap.jsx:145` inspects a global walking pattern that is brittle vs the wallet-standard path used in `SwapPanel.jsx:114`. Standardize on `useSignAndSendTransaction(account, chain)` everywhere. The fallback to `window.solflare` (line 149-156) is a synchronized-sign path outside wallet-standard that bypasses the filter in `provider.jsx:33-41` — remove it.

### [M-06] No CI secret scanning before deploy
`.github/workflows/deploy.yml:19-80` — the pipeline does `npm ci`, `npm audit` (non-blocking), `npm run build`, `wrangler pages deploy`. There is no step that greps `dist/**` for accidentally-bundled secrets. Add a build-output scanner (e.g., `trufflehog` or a simple regex gate) before `wrangler pages deploy`. Also pin actions to SHA: `actions/checkout@v4` and `actions/setup-node@v4` should be `actions/checkout@<sha>` — a v4 tag can be re-pointed.

### [L-01] `console.log/warn/error` still shipped to production
48 call sites across 10 files. Signatures, wallet addresses, and confirmation statuses leak to the DevTools console where any browser extension with `tabs` permission can read them. `vite.config.js` has no `terserOptions.compress.drop_console: true`. Strip in production build.

### [L-02] Known `bigint-buffer` high vulnerability — waiver documented, verified
`npm audit --omit=dev` shows 3 high vulns rolling up to `bigint-buffer` GHSA-3gc7-fjrx-p6mg. The waiver in `remediation-log.md` L-02 is correct — `@solana/spl-token >=0.2.0` has no upstream fix. Trigger path is attacker-controlled byte arrays fed into `toBigIntLE`; in this codebase the SPL-token paths do not feed untrusted bytes, so exploitability is low. Re-check at mainnet launch.

### [L-03] `VITE_SOLANA_RPC_URL` trusted-domain list includes `workers.dev`
`src/solana/config.js:30` trusts any `*.workers.dev` host. Any Cloudflare Worker deployed by anyone on the planet matches. If an attacker controls a .env file or hijacks the Pages env var, they can inject any Cloudflare Worker as the RPC endpoint and silently MITM RPC responses. Narrow to `limer-api-proxy.solanacaribbean-team.workers.dev` and `ttse-proxy.solanacaribbean-team.workers.dev` explicitly.

### [L-04] localStorage/sessionStorage cleared on `/?reset=1` and boot-recover wipes wallet selection
`public/boot-recover.js:63-64` and `src/main.jsx:29-30` call `localStorage.clear()`. This nukes non-wallet state too. Minor UX concern — but if future code stores a user-signed attestation token in localStorage, the recovery path silently destroys evidence. Document what keys are safe to clear.

### [L-05] Boot-fallback `<style>` inline block in `index.html:44`
The tiny inline `<style>` keyframe block in index.html will fire a CSP violation once Phase 2 hardening drops `'unsafe-inline'` from `style-src`. Either extract to `/boot-recover.css` or add a hash to `style-src`.

### [I-01] Sourcemaps not published
`vite.config.js` has no `build.sourcemap` setting → defaults to `false`. Verified — `GET /assets/index-BO9lfKtO.js.map` returns the SPA. Good.

### [I-02] Boot-recover SRI pinned correctly
`index.html:56-58` and `dist/index.html:59` both reference `sha384-6qe0DfIT...` with `crossorigin="anonymous"`. Good.

### [I-03] Wallet persistence stores only wallet name
`src/solana/provider.jsx:16-28` persists only `limer-selected-wallet` keyed string. No keys, no seed, no address. Good.

## CSP analysis (table)

| Directive | Current (enforced) | Recommended | Gap |
|---|---|---|---|
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval' <trusted hosts>` | `'self' 'wasm-unsafe-eval' <trusted hosts>` | **Must drop** both unsafe tokens (Phase 2) |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | Keep — cost/benefit OK for Tailwind-JIT | — |
| `connect-src` | Wildcards: `*.supabase.co`, `*.helius-rpc.com` | Remove Supabase wildcard (H-02/M-02); drop `api.allorigins.win` (M-04) | Wide |
| `frame-ancestors` | `'self'` | `'none'` | M-03 |
| `frame-src` | `defillama.com jup.ag tradingview.* birdeye.so` | Keep — each justified | — |
| `object-src` | `'none'` | `'none'` | Good |
| `base-uri` | `'self'` | `'self'` | Good |
| `upgrade-insecure-requests` | Missing on enforced, present on Report-Only | Add to enforced | Minor |
| `report-uri` | Only in Report-Only | Add to enforced once Phase 2 promotes | Minor |

## Dependency vulnerability roll-up

| Package | Severity | Status | Notes |
|---|---|---|---|
| `bigint-buffer` (GHSA-3gc7-fjrx-p6mg) | High | Waived (L-02, 2026-04-17) | No upstream fix; exploitability low in our call paths |
| `@solana/buffer-layout-utils` | High (rolled up) | Waived via parent | Same root cause |
| `@solana/spl-token` | High (rolled up) | Waived via parent | Downgrading would break mint workflow |

No new highs/criticals beyond the documented waiver. `npm audit --omit=dev` totals: **3 high, 0 critical.**

## Things done well

- **Destination ATAs are derived, not catalog-looked-up** — `amm-swap.js:170-171` uses `getAssociatedTokenAddress(mint, traderPubkey)` so a compromised pool record cannot reroute user tokens to an attacker without also breaking `TOKEN_PROGRAM_ID`'s address-derivation math.
- **Live pool reserves drive every quote** — `amm-swap.js:65-75` re-reads vault balances on each quote fetch; the "minimum received" in the UI (`SwapPanel.jsx:371`) reflects on-chain state, not a cached catalog.
- **Wallet-standard-only filter** — `provider.jsx:33-41` rejects any wallet lacking `solana:signTransaction` / `solana:signAndSendTransaction` / `solana:signMessage`, preventing rogue injected wallets from appearing in the picker.
- **Sentry `beforeSend` sanitizer** — `src/sentry.js:26-39` strips base58 addresses, hex strings, query strings, and api-key-like tokens. Also sets `sendDefaultPii: false`.
- **CSP Report-Only + SRI for boot-recover** — the Phase 1 work in `public/_headers:37`, `public/boot-recover.js`, and `index.html:54-58` is well-implemented and measurably progresses toward enforceable CSP.
- **No `dangerouslySetInnerHTML` anywhere** — grep-verified across `src/**`. TTSE proxy HTML is parsed through `DOMParser` (`api/ttse.js:67`), not injected.
- **PWA service worker scope-limited** — `dist/sw.js` precaches only static shell + emits named caches per runtime route (`vite.config.js:78-217`). No credential-bearing endpoint is cached beyond `networkTimeoutSeconds: 3` NetworkFirst.

## Priority actions (ranked)
1. **H-01 / audit H-03**: add `max_slippage_bps` to AMM config on-chain so `minAmountOut = 0` from a compromised client is rejected.
2. **H-03**: require a mainnet-switch warning modal; show `{cluster}` in the Swap confirm button label.
3. **M-01**: complete CSP Phase 2 enforcement on 2026-04-24; replace PostHog inline snippet with an external-script loader.
4. **M-02 / M-04**: narrow `connect-src` (drop `*.supabase.co` wildcard and `api.allorigins.win`).
5. **M-06**: add build-output secret scan + pin actions to SHA in `deploy.yml`.
6. **L-01**: `terserOptions.compress.drop_console` in `vite.config.js` for prod builds.
7. **L-03**: tighten `TRUSTED_RPC_DOMAINS` in `src/solana/config.js:19-34` to explicit subdomains.

File references are absolute throughout. No exploitable code-execution or fund-theft path was found in the present bundle.
