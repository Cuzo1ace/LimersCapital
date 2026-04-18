# Backend + Supabase Security Audit

**Audit date**: 2026-04-18
**Scope**: `workers/*.js` + `workers/*.toml` + `supabase/**/*.sql` + `supabase/functions/ingest-news/index.ts` + `.github/workflows/deploy.yml`
**Commit audited**: `86b7d4c135eef03a5c74d86fadbd3d18bd1db8a5`

## Executive Summary

- **2 Critical / 5 High / 6 Medium / 4 Low**
- **Verdict**: **Yellow → leaning Red**. The Worker perimeter is well-designed — origin allowlist is fully anchored, RPC allowlist is present, FMP whitelist is pre-fetch, secrets are Wrangler-managed, no secrets in git history. But the Supabase RLS layer is effectively **public read/write across every user-facing table** (`USING (true)` / `WITH CHECK (true)` on `users`, `waitlist`, `activity_feed`, `listing_applications`, `feedback`, `announcements`, `competition_entries`). Combined with per-isolate in-memory rate limiting for award endpoints that currently don't persist anyway, the integrity of LP/XP/leaderboard/competition state is **trust-based, not enforced**. Acceptable for a devnet prototype; must be remediated before any mainnet launch that touches real assets.

---

## Findings

### [C-01] Supabase RLS is effectively open read/write on every table with anon-reachable policies
**Severity**: Critical
**Location**: `supabase/migrations/001_initial_schema.sql:89-111`, `002_quick_wins.sql:104-128`
**Description**: Every table that carries user state has RLS enabled with predicates `using (true)` and `with check (true)`:
- `public.users` — public SELECT/INSERT/UPDATE (policy "Anyone can update user profiles" at `001_initial_schema.sql:100-102`).
- `public.waitlist` — public SELECT/INSERT (`001:105-111`).
- `public.activity_feed`, `public.listing_applications`, `public.announcements`, `public.feedback`, `public.competition_entries` — all anon SELECT + INSERT + (competition) UPDATE with `using (true)` (`002:104-128`).
There is **no `auth.uid() = wallet_address` check** because Supabase Auth is bypassed (wallet-as-identity model per `src/lib/supabase.js:19`). The comment at `001:86-87` says "restrict writes via the API layer + wallet signature" — but there is no such API layer; the frontend writes directly with the anon key (`src/api/supabase.js` calls 16 direct `.from()` writes).
**Exploit**:
- Attacker hits Supabase REST directly with the public anon key (extracted from the JS bundle at `src/lib/supabase.js:13`) and runs `PATCH /rest/v1/users?wallet_address=eq.<victim>` setting `xp=999999999, limer_points=999999999, tier='Whale'`. Every leaderboard shows them #1.
- Mass-insert fake rows to poison `activity_feed` (visible on the frontend as real community activity), `announcements` (platform-wide banner takeover), or `feedback` (spam the admin inbox).
- Harvest every email from `public.waitlist` (public SELECT). This is a **PII leak** — emails collected for waitlist were not disclosed as public.
- Rewrite any competitor's `competition_entries.score` to -1 and promote own entry.
**Recommendation**:
1. Introduce an edge function (`/api/user/update`) that validates a signed message from the wallet (ed25519 verify) before applying writes. Drop all `for update` and `for insert` policies on `users`, `waitlist`, `activity_feed`, `competition_entries`, and `listing_applications`. Leave SELECT policies restrictive (`users`: keep public SELECT only for leaderboard columns via a security-definer function; `waitlist`: remove public SELECT, it's PII).
2. Short-term mitigation until the edge function ships: at minimum remove the UPDATE policy on `users` and `competition_entries`, and remove public SELECT on `waitlist`.

### [C-02] News sources table leaks RSS/bridge endpoints via `SELECT` if anon read policy is ever added; no service-role scoping on ingest-news writes
**Severity**: Critical (downgraded to High because current policy correctly blocks anon SELECT, but the posture is fragile)
**Location**: `supabase/migrations/004_news_sources.sql:46-50`
**Description**: `news_sources` has RLS enabled but **zero policies defined** — so anon is fully blocked, which is correct. The `ingest-news` edge function uses the service-role key (`supabase/functions/ingest-news/index.ts:31`) which bypasses RLS entirely — also correct. This is fine today. The risk is that the pattern of "RLS enabled, no policies" is a foot-gun: a future dev adding a single "read for admin UI" policy with `using (true)` would expose the `consecutive_errors` / `last_error` columns plus any private bridge URLs. Flag for documentation.
**Recommendation**: Add a comment to the migration explicitly stating "no anon policies by design — use service role only." Add an RLS test to CI that confirms anon `select * from news_sources` returns zero rows.

### [H-01] `/game/award-lp` and `/game/award-xp` are no-ops; frontend gating on them is trivially spoofed
**Severity**: High
**Location**: `workers/api-proxy.js:471-524`, `src/api/game.js:94-119`
**Description**: The award endpoints validate action type and amount cap (max 500 LP / 1000 XP per call), but the worker has `// TODO: Store validated amount in KV when available` at line 519 — nothing is persisted. The frontend calls them fire-and-forget at `src/api/game.js:96-99, 111-114`. Combined with **C-01** (anon can UPDATE `public.users` directly), any LP/XP shown in the UI is fully attacker-controllable. The rate-limit check at `api-proxy.js:478-489` uses in-memory `rateLimitMap`, which is per-isolate. Cloudflare has hundreds of isolates globally — an attacker hitting the worker from 300 IPs in parallel gets 300×30 = 9000 award calls/minute before any isolate trips. Since the endpoint is a no-op, the rate limit has no practical value.
**Exploit**: Call `PATCH /rest/v1/users` via Supabase anon key directly, skipping the worker entirely. Cosmetic LP display on the site updates immediately.
**Recommendation**: Either remove the endpoints entirely (they're advertising a guarantee the backend can't enforce) or finish the KV persistence and gate `public.users.xp/limer_points` updates behind a worker-signed nonce that Supabase validates via an RLS policy reading a JWT custom claim. Track this as continuation of C-01.

### [H-02] Faucet drain via throwaway wallets — no per-IP or global rate limit
**Severity**: High
**Location**: `workers/faucet.js:121-143`
**Description**: The KV key is `faucet:mttdc:<walletAddress>` (line 125), so rate limiting is strictly per-wallet-pubkey. Generating a new Solana keypair is free (~1ms of CPU) and the worker does not require the caller to prove wallet ownership. The per-IP `checkRateLimit` in the parent proxy (`api-proxy.js:1108`) gives **60 requests per minute per IP per isolate** — so one IP can claim from ~50 different wallets/minute before tripping the worker's in-memory limit (which is also per-isolate). With the faucet holding 500K mTTDC (`src/solana/generated/faucet.json:11`), full drain = 50 wallets × 10K each, achievable in under 1 minute from a single IP, under 10 seconds with 10 IPs.
The devnet SOL balance is 0.1 SOL (~2500 txs at 5000 lamports each), so the fee budget caps the drain before mTTDC does. But the operational cost of re-seeding + re-funding + monitoring is a real burn on founder attention.
**Exploit**: `for (let i=0; i<50; i++) { const kp = Keypair.generate(); fetch('/faucet/mttdc', {method:'POST', body: JSON.stringify({walletAddress: kp.publicKey.toBase58()})}); }`
**Recommendation**:
1. Add a **per-IP daily cap** in KV: `faucet:ip:<CF-Connecting-IP>` → counter, expire 24h, max 3/day. This is the mitigation that matters — the per-wallet limit is just bookkeeping.
2. For devnet this is "annoying to re-fund" risk; for any future mainnet faucet, require a signed message from the wallet proving ownership, and require Cloudflare Turnstile (cheap, free tier covers this use case).

### [H-03] DEV_ORIGINS allowed unconditionally in production CORS
**Severity**: High
**Location**: `workers/api-proxy.js:53-73`
**Description**: `DEV_ORIGINS` (http://localhost:3000/5173/5199 + 127.0.0.1 equivalents) is concatenated into `allOrigins` regardless of `env.ENVIRONMENT`. Code comment at 48-52 argues this is safe because "write paths are devnet-only and IP-rate-limited." But:
- An attacker running a phishing page on `http://localhost:5173` (very common — most devs have that port open) can trivially fetch-proxy the victim's session: victim runs `npm run dev` → attacker's malicious `localhost:5173` page (delivered via DNS rebinding or local network) issues requests with `Origin: http://localhost:5173`, worker accepts.
- If any future route gets added that's not devnet-only, this opens a hole silently.
**Exploit**: DNS rebinding attack — attacker's domain resolves to 127.0.0.1, browser loads page with `Origin: http://127.0.0.1:5173`, worker accepts CORS, attacker reads authenticated responses. The AI market-brief endpoint (`/ai/market-brief`) doesn't leak PII but does burn Anthropic budget at 600 tokens/call.
**Recommendation**: Gate DEV_ORIGINS behind `env.ENVIRONMENT !== 'production'`. The `[vars] ENVIRONMENT = "production"` binding is already set in `wrangler-api.toml:36` so this is a 1-line change.

### [H-04] `sendTransaction` on the RPC allowlist — attacker submits arbitrary transactions through your paid Helius quota
**Severity**: High
**Location**: `workers/api-proxy.js:1046`
**Description**: `ALLOWED_RPC_METHODS` includes `sendTransaction` and `simulateTransaction`. Any caller passing the origin check can submit an arbitrary (already-signed) transaction for broadcast on mainnet Helius. The transaction must be signed by someone with funds, so this is not a direct theft vector — but:
- It lets anyone burn your Helius send-tx quota by pre-signing junk transactions (dust sends to self) and replaying them through your worker. Helius free/paid tiers meter `sendTransaction` separately.
- `simulateTransaction` is unmetered in terms of body size (5K max per `maxBodySize` at line 824) but heavy on compute. Attacker sends 100 concurrent complex simulations → eats the CPU budget of your Helius plan.
- Combined with per-isolate rate limiting (H-03 globally), an attacker using 100 IPs × 60 req/min × 60 min = 360K requests/hour is feasible.
**Exploit**: Spam `sendTransaction` with a minimal valid self-transfer from a pre-funded attacker wallet. At $0.001 per send on a Helius paid plan this burns $360/hour from 360K req/hr.
**Recommendation**:
1. If the frontend doesn't currently call `sendTransaction` through the proxy (grep confirms: primary send path is the wallet adapter going direct to the RPC), **remove it from the allowlist**.
2. If it's needed, add a separate, stricter rate limit for `sendTransaction` — e.g. 5/min/IP, persisted in KV not in-memory.
3. Cap `simulateTransaction` at 2/min/IP similarly.

### [H-05] Waitlist emails are publicly SELECT-able → PII exposure
**Severity**: High
**Location**: `supabase/migrations/001_initial_schema.sql:109-111`
**Description**: `create policy "Waitlist is publicly readable" on public.waitlist for select using (true);` — combined with the public anon key embedded in the JS bundle (`src/lib/supabase.js:13`), anyone can run `curl 'https://uszaeqtrifenpibptvus.supabase.co/rest/v1/waitlist?select=email' -H 'apikey: <anon>'` and download every signed-up email. If Caribbean waitlist signups include any children (platform is "learn-to-earn") or GDPR-jurisdiction residents, this is a reportable breach.
**Exploit**: One-liner curl as above. Returns all emails + countries.
**Recommendation**: Drop the public SELECT policy. The "waitlist count" badge on the marketing page should be served by a Postgres function `count_waitlist()` with `SECURITY DEFINER` that returns only the scalar count.

### [M-01] `reportToSentry` redaction regex misses Bearer tokens and base58 Solana privkeys in some contexts
**Severity**: Medium
**Location**: `workers/api-proxy.js:176-183`
**Description**: `sanitizeForSentry` regex matches `(api[_-]?key|token|secret|password|authorization)[=:\s]+\S+`. This catches `api_key=abc123` and `Authorization: Bearer xyz` because of the trailing `\S+`. But:
- The base58 scrubber `\b[1-9A-HJ-NP-Za-km-z]{32,44}\b` does catch the FAUCET keypair's **public** key format (32-44 char base58). The **secret** key, if ever converted to base58, would match too. However, `FAUCET_KEYPAIR_JSON` is a 64-element JSON **number array** (per faucet.js:158), not base58 — so a stringified secret key like `[123,45,67,...]` would **not** be redacted by either regex. If an error path ever string-interpolates the raw secret JSON into a Sentry message, it leaks in full.
- `HELIUS_API_KEY` appears inline in the upstream URL built at `api-proxy.js:822, 829, 919, 929, 962` etc. If any fetch throws and the full URL gets into an exception message, the key could reach Sentry uncleansed.
**Recommendation**:
1. Add `/\[\s*\d{1,3}(\s*,\s*\d{1,3}){63}\s*\]/g → '[keypair-redacted]'` to `sanitizeForSentry`.
2. Add unit tests covering: `Bearer eyJ...`, `?api-key=<40-char-hex>`, raw `[1,2,3,...]` 64-element array, and `sk_live_*`.

### [M-02] `console.log` in faucet leaks HELIUS key length — not the key, but useful recon
**Severity**: Medium (Low if you consider key-length a non-secret)
**Location**: `workers/faucet.js:189`
**Description**: `console.log('[faucet] HELIUS key len:', (env.HELIUS_API_KEY || '').length, 'rpc host:', new URL(rpcUrl).host);` runs on every faucet request and lands in `wrangler tail` + potentially in Cloudflare's log-push pipeline if configured. Key length alone isn't a crypto break, but it tells an attacker "the key is bound" (vs "empty") which was the whole point of the earlier diagnostic log at commit a1e8467.
The diagnostic commit that returned key lengths in the **response body** was correctly reverted in commit 7c90ee9, but this `console.log` was left behind.
**Recommendation**: Delete the line.

### [M-03] Fallback cache can be poisoned by unbounded query-string variants
**Severity**: Medium
**Location**: `workers/api-proxy.js:136-164, 1211-1213`
**Description**: `fallbackCacheKey` incorporates `url.search` verbatim into the cache key. An attacker hitting `/defillama/protocols?zzz=1`, `?zzz=2`, `?zzz=3`, …, 10K times, each getting a 200 from DeFiLlama (which ignores unknown params), writes 10K distinct fallback entries into Cloudflare Cache API. Eventually Cache API evicts, but during the filling window the attacker has displaced the legitimate `?` (no-arg) cache entry — so when DeFiLlama goes down, the circuit breaker at line 1214 reads whatever garbage variant is cached for the victim's exact search string.
**Recommendation**: Hash only the whitelisted subset of query params that the route actually uses into the cache key. Or, simpler: don't `passQuery` into the cache key at all for routes whose upstream URL doesn't depend on query.

### [M-04] `/csp-report` endpoint can be used to amplify traffic to Sentry
**Severity**: Medium
**Location**: `workers/api-proxy.js:245-298, 1077-1086`
**Description**: CSP report endpoint is unauthenticated by design (correct — browsers often omit Origin). IP rate limit applies (in-memory, per-isolate). 16KB body cap is good. But **each report triggers a `reportToSentry` call** with `fetch` to Sentry ingest — and Cloudflare has no global budget gate between the worker and Sentry. A malicious actor hitting `/csp-report` from 500 IPs at 60/min = 30K Sentry events/minute = likely to blow a Sentry free-tier quota (5K events/month) in seconds.
**Recommendation**:
1. Sample reports: only forward 1-in-N to Sentry; count the rest with a KV counter.
2. Deduplicate in-worker: hash `(blockedUri, violatedDirective, documentUri)` and only forward on first-seen-this-hour.
3. Verify the request has `Content-Type: application/csp-report` or `application/reports+json` — currently the code tolerates any content-type.

### [M-05] In-memory rate limiting is per-isolate → effectively unbounded in aggregate
**Severity**: Medium
**Location**: `workers/api-proxy.js:86-125, 385-410`
**Description**: Per-isolate 60 req/min means globally, an adversary hitting the worker from diverse IPs sees effectively no rate limit because each new IP lands on a warm or cold isolate independently. For the specific upstream budgets:
- **FMP (250/day)**: Partially protected by the `FMP_SYMBOL_WHITELIST` (14 tickers). Attacker sending repeated `?symbol=AAPL` gets served from the 60s Cloudflare edge cache, so the true upstream-fetch rate is ~1/minute/PoP regardless. Safe.
- **Finnhub**: No symbol whitelist. An adversary hitting `/finnhub/quote?symbol=RANDOM1`, `RANDOM2`, … bypasses edge cache (distinct URLs) → each hits Finnhub upstream. Finnhub free tier is 60 req/min.
- **Anthropic**: `/ai/market-brief` has a 4-hour in-memory cache. Per-isolate. 1000 isolates × 6 hits/isolate/day = 6000 Claude calls = $18/day silent burn.
**Recommendation**:
1. Move rate limiting to **Cloudflare Rate Limiting rules** (edge-layer, IP-level, global) for `/rpc`, `/ai/*`, `/finnhub/*`.
2. Add symbol whitelist to `/finnhub/quote`.

### [M-06] SSRF via `passQuery` — bounded by upstream but unaudited
**Severity**: Medium (Low in practice)
**Location**: `workers/api-proxy.js:1178-1180`
**Description**: `passQuery: true` routes concatenate `url.search` (which starts with `?`) to the upstream URL. Since the upstream host is hardcoded in `buildUrl`, the attacker cannot redirect to an internal host — but they can probe the upstream API's full surface. No incremental risk beyond calling the public APIs directly.
**Recommendation**: Document this assumption in a code comment so future maintainers don't "helpfully" start passing path segments through.

### [M-07] `announcements` table has public INSERT — frontend banner takeover
**Severity**: Medium
**Location**: `supabase/migrations/002_quick_wins.sql:117`
**Description**: `create policy "Anyone can create announcements" on public.announcements for insert with check (true);`. Combined with C-01, anyone can insert a high-priority announcement that renders on every user's page. Content is rendered via React so XSS is unlikely, but a social-engineering banner ("Click here to claim your airdrop → [phishing URL]") is trivial.
**Recommendation**: Remove the public INSERT policy. Only service role should write announcements.

### [L-01] Worker fallback for `HELIUS_API_KEY` absence = public devnet RPC that rate-limits worker egress
**Location**: `workers/faucet.js:44-49` — Cloudflare worker egress IPs are known to Solana Foundation and aggressively 403'd. Refuse the faucet request with a clear 503 instead of falling back to a known-broken endpoint.

### [L-02] `wrangler-api.toml` has no `[observability]` or tail consumers configured
**Location**: `workers/wrangler-api.toml` — Add `[observability] enabled = true` once on the paid tier, or configure a tail consumer.

### [L-03] `.github/workflows/deploy.yml` injects `VITE_HELIUS_API_KEY` into the client bundle
**Location**: `.github/workflows/deploy.yml:52` — Confirm `VITE_HELIUS_API_KEY` is **not set** in GitHub repo secrets. If set and non-empty, rotate the Helius key immediately.

### [L-04] `ALLOWED_RPC_METHODS` includes `getSignaturesForAddress` — unbounded response size
**Location**: `workers/api-proxy.js:1044` — Enforce a server-side `limit: 100` default if the client doesn't set one.

---

## Supabase RLS table-by-table status

| Table | RLS enabled | Policies present (S/I/U/D) | Status |
|-------|-------------|----------------------------|--------|
| `public.users` | Yes | S=public, I=public, U=public, D=none | Red — anon can mutate any row's XP/LP/tier (C-01) |
| `public.waitlist` | Yes | S=public, I=public | Red — email PII exposed (H-05) |
| `public.activity_feed` | Yes | S=public, I=public | Red — feed poisonable (C-01) |
| `public.listing_applications` | Yes | S=public, I=public | Yellow — sensitive business contact data readable anon |
| `public.announcements` | Yes | S=public, I=public | Red — banner takeover vector (M-07) |
| `public.feedback` | Yes | S=public, I=public | Yellow — user feedback inbox publicly readable |
| `public.competition_entries` | Yes | S=public, I=public, U=public | Red — any competitor's score rewritable (C-01) |
| `public.news_items` | Yes | S=public (active-only), no I/U/D for anon | Green — service role only for writes |
| `public.news_sources` | Yes | no policies at all — anon blocked | Green (but C-02 foot-gun documented) |

## Secret inventory

| Secret | Storage | Rotation story | Blast radius if compromised |
|--------|---------|----------------|-----------------------------|
| `HELIUS_API_KEY` | Wrangler secret | manual re-issue, ~2 min | mainnet RPC quota burn, simulateTransaction CPU burn |
| `ANTHROPIC_API_KEY` | Wrangler secret | manual re-issue via Anthropic console | $ budget burn (cap is per-org) |
| `FINNHUB_API_KEY` | Wrangler secret | manual re-issue | free tier = no $ loss; paid tier = $ burn |
| `FMP_API_KEY` | Wrangler secret | manual re-issue | 250 req/day quota (protected by whitelist) |
| `SENTRY_DSN` | Wrangler secret + Pages env | re-provision Sentry project | Sentry quota exhaust → noisy; no data exfil risk |
| `FAUCET_KEYPAIR_JSON` | Wrangler secret (also on-disk `0600`) | manual re-seed + re-fund | ≤ 0.1 SOL + 500K mTTDC on devnet. **Not documented for rotation.** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function env | re-generate in Supabase dashboard | full RLS bypass — **maximum blast radius** |
| `VITE_SUPABASE_ANON_KEY` | Hardcoded in `src/lib/supabase.js:13`, also in GH Actions env | Not rotatable without coordinated push; RLS is the boundary | Only as dangerous as RLS allows → today: Critical (C-01) |

**Git history check**: No real API keys found in history. Commits `aa39fd0`, `52ba41d`, `a1e8467` are clean. The faucet keypair file is on disk with `0600` permissions and not in any git-tracked path. `.env.local` and `workers/.dev.vars` do not appear in any commit.

## Things done well

- Origin allowlist regex is **fully anchored** with `^` and `$` — no subdomain-prefix bypass
- **FMP symbol whitelist** runs at `validate()` time **before** any upstream fetch
- **Per-route method enforcement** + **RPC method allowlist** correctly block arbitrary JSON-RPC calls
- **CSP report handler** well-structured: 16KB body cap, try/catch wrapping, explicit IP rate limit
- **Circuit breaker** correctly scoped to GET routes only, never replays stale state for POST/RPC
- **Faucet keypair file permissions** (`0600`, owner-only) and **not in git**
- **Clean git history** — no API keys, no committed `.env` files
- **CI `npm audit` gate** with documented justification for the high-severity bigint-buffer waiver

---

## Top 3 priorities

1. **C-01 + H-05 + M-07**: Lock down Supabase RLS. Remove all `using (true)` UPDATE/INSERT policies on `users`, `competition_entries`, `announcements`, and remove public SELECT on `waitlist`. Route mutations through a signed-message edge function. **This is the single highest-leverage change in the audit.**
2. **H-02**: Add per-IP KV rate limit to `/faucet/mttdc` (5 min of work, eliminates the throwaway-wallet drain).
3. **H-04**: Remove `sendTransaction` from `ALLOWED_RPC_METHODS` if unused, or add a dedicated KV-backed 5/min/IP limit for it.
