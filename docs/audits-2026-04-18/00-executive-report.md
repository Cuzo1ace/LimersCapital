# Limer's Capital — Security Audit (2026-04-18)

**Commit audited**: `86b7d4c135eef03a5c74d86fadbd3d18bd1db8a5`
**Method**: Three parallel specialist audits (smart-contract, backend+Supabase, frontend+deps) run against the full codebase with the rigor of a Sec3 / Trail of Bits / Cure53 engagement. Each audit's full report is preserved in this directory.

## TL;DR verdict

| Surface | Verdict | Worst finding |
|---|---|---|
| Smart contracts (`limer_amm` + `limer`) | **Block public CTA until one critical fixed** | C-01 first-deposit inflation attack |
| Backend (Workers + Supabase) | **Yellow leaning Red** | C-01 Supabase RLS is effectively open read/write |
| Frontend (React + Vite) | **Yellow** | H-01 `min_amount_out` computed client-side |

**Ship-readiness for stress-testing now**: **NO** in the strictest reading — if a stress-tester discovers the Supabase write path or the first-deposit inflation vector, they can respectively (a) overwrite the leaderboard with `xp=999999999` or (b) drain the devnet pools of any LP that deposits after them. Both are recoverable on devnet. Neither should ship to mainnet.

**Ship-readiness for Colosseum judges**: **YES with caveats** — judges reading the IDL or Supabase schema will notice these issues in minutes. Getting fixes landed before submission is a credibility multiplier.

## Aggregate findings

| | Critical | High | Medium | Low / Info |
|---|---|---|---|---|
| Smart contracts | 1 | 2 | 6 | 7 |
| Backend + Supabase | 2 | 5 | 6 | 4 |
| Frontend + deps | 0 | 3 | 6 | 8 |
| **Total** | **3** | **10** | **18** | **19** |

## The three Critical findings (must fix)

### C1 — Smart contract: first-deposit inflation attack (SC C-01)

**File**: `anchor/programs/limer_amm/src/math.rs:102-114` + `lib.rs:113-207`

The canonical Uniswap-V2 inflation-attack mitigation requires minting `MINIMUM_LIQUIDITY` LP tokens to a burn address so the first depositor never owns 100% of supply. The code subtracts `MINIMUM_LIQUIDITY` from the user's LP but never mints the dead shares. The comment at `lib.rs:128-140` *describes* the intended protection but the implementation doesn't match.

**Exploit**: Attacker deposits `(2001, 2001)` → owns 100% of 1001 LP. Donates 1M tokenA directly to vault. Victim deposits `(10000, 10)` → mints 0 LP (rounds down). Attacker burns their 1001 LP → walks away with vault including victim's deposit. **This is a guaranteed rug of every new LP on any pool that has drained to zero, and of every new pool if permissionless pool creation ever ships.**

**Fix**: Mint `MINIMUM_LIQUIDITY` (1000) LP to a program-owned dead ATA on the first deposit. ~15 lines in `lib.rs`. Requires `anchor build` + `anchor deploy` + re-init of the 6 pools (or drain + re-seed).

### C2 — Backend: Supabase RLS is effectively open read/write (Backend C-01)

**File**: `supabase/migrations/001_initial_schema.sql:89-111` + `002_quick_wins.sql:104-128`

Every user-facing table (`users`, `waitlist`, `activity_feed`, `announcements`, `listing_applications`, `feedback`, `competition_entries`) has RLS enabled with predicates `using (true) / with check (true)`. The public anon JWT is baked into the bundle (and signed for 65 years — matures in 2091). **Anyone can**:

- `PATCH /rest/v1/users` and set their `xp/limer_points/tier` to arbitrary values → leaderboard is cosmetic
- `SELECT /rest/v1/waitlist` and download every email collected → **PII breach** if any waitlist subject is GDPR-jurisdiction
- `INSERT /rest/v1/announcements` with a phishing banner → site-wide social engineering vector
- Rewrite competitors' `competition_entries.score`

**Fix**: Revoke the permissive policies, route mutations through a new edge function that verifies a wallet-signed message (ed25519_verify). For immediate lockdown, a migration that simply drops the permissive UPDATE/INSERT policies ships in 10 minutes and breaks specific features we can rebuild cleanly.

### C3 — Backend: news_sources RLS fragility (Backend C-02)

**File**: `supabase/migrations/004_news_sources.sql:46-50`

`news_sources` has RLS enabled but zero policies defined — so anon is blocked (correct today). The risk is that a future "admin UI" dev adds `using (true)` and exposes private bridge URLs + error strings. Downgraded to High in practice but flagged Critical because the whole remediation class (**"RLS enabled with no explicit deny-all"**) is a foot-gun.

**Fix**: Add a comment in the migration, a CI RLS regression test that asserts anon gets 0 rows, and make it cold-burn-painful to add a permissive policy.

## High-severity — prioritized fix list

**Fix before stress-testing opens to the public:**

| # | Severity | Where | Title | Effort |
|---|---|---|---|---|
| 1 | Backend H-05 | `001_initial_schema.sql:109` | Waitlist emails publicly SELECT-able | 5 min migration |
| 2 | Backend H-02 | `workers/faucet.js` | Faucet drain via throwaway wallets — add per-IP KV limit | 15 min |
| 3 | Backend H-04 | `workers/api-proxy.js:1046` | `sendTransaction` on RPC allowlist | 2 min — remove if unused |
| 4 | Backend H-03 | `workers/api-proxy.js:53-73` | DEV_ORIGINS allowed in prod | 1-line fix |
| 5 | Backend H-01 | `workers/api-proxy.js:471-524` | `/game/award-*` is no-op, frontend gating spoofed | tied to C2 fix |
| 6 | Frontend H-03 | `src/components/layout/Header.jsx:65` | Mainnet/devnet switch lacks signed-tx confirmation | 30 min |
| 7 | Frontend H-02 | `src/lib/supabase.js:13` | Anon JWT 65-year lifetime + hardcoded | 10 min rotation |

**Fix before Colosseum submission:**

| # | Severity | Where | Title | Effort |
|---|---|---|---|---|
| 8 | SC H-01 | `anchor/.../lib.rs:113-207` | `deposit_liquidity` no excess refund — LPs lose to MEV | 40 min + redeploy |
| 9 | SC H-02 | `anchor/programs/limer/src/lib.rs:35-132` | `award_xp/lp/badge` client-editable | 1 day (new attestation pattern) |
| 10 | Frontend H-01 | `src/solana/amm-swap.js:120-122` | `min_amount_out` client-computed → compromised bundle risk | tied to SC H-01 / new AMM config |

## Medium-severity — noteworthy

Full list lives in the individual audit reports. Highlights:

- **SC M-01**: no on-chain pause switch; no timelock for future `update_fee`
- **SC M-03**: Token-2022 not explicitly blocked on user ATAs
- **SC M-06**: `depositor_lp.owner` not verified — defense-in-depth against malicious frontends
- **Backend M-05**: in-memory rate limiting is per-isolate → globally useless. Move to Cloudflare Rate Limiting edge rules.
- **Backend M-07**: `announcements` public INSERT enables banner takeover (part of C2 cluster)
- **Frontend M-01**: CSP `script-src 'unsafe-inline' 'unsafe-eval'` — Phase 2 hardening deadline 2026-04-24
- **Frontend M-02**: `connect-src https://*.supabase.co` wildcard — narrow to single project host
- **Frontend M-04**: `api.allorigins.win` in CSP but unused — remove
- **Frontend M-06**: no CI secret-scan of build output before deploy

## Things the code does well (defense-in-depth)

Across all three audits the following patterns stood out. Keep these and apply them elsewhere:

**Smart contracts**
- Canonical mint ordering in `initialize_pool` (prevents same-pool-under-reversed-A/B foot-gun)
- Freeze-authority rejection on init (guards against freezable RWA mints)
- `checked_mul`/`checked_add`/`checked_div` throughout the math module
- Consistent rounding-down in favor of the pool (blocks the 1-unit repeated-swap attack)
- `u128` intermediates for every `u64 × u64`

**Backend**
- Fully-anchored origin regex with `^` and `$` — no subdomain-prefix bypass
- FMP symbol whitelist runs *before* upstream fetch (defends 250/day budget at near-zero cost)
- Circuit-breaker scoped to GET-only (POST/RPC never replay stale state)
- CSP report handler hardened: 16KB body cap, try/catch wrapping, IP rate limit
- **Git history is clean** — no committed API keys, no committed `.env` files, faucet keypair file is `0600`-permissioned and untracked

**Frontend**
- Destination ATAs are DERIVED from the signer's pubkey via SPL-token PDA derivation, not catalog-looked-up — a compromised catalog cannot silently redirect user tokens
- Every swap quote re-reads live vault balances; "minimum received" reflects on-chain state, not cached seed data
- Wallet-standard-only filter in provider — rejects wallets missing the required feature set
- Sentry `beforeSend` scrubs base58/hex/api-key/query-string before send
- No `dangerouslySetInnerHTML` anywhere in `src/`
- Service worker precaches only static shell; no credential-bearing endpoint is cached

## Recommended action sequence

**Tonight (while you have context)**:
1. Lock Supabase RLS — deploy a migration that drops the permissive UPDATE/INSERT/SELECT policies. Accept that `Feedback`/`Waitlist` features will 403 until a signed-message edge function ships. Breakage is preferable to silent data corruption.
2. Patch the 4 backend-config quick wins (per-IP faucet limit, gate DEV_ORIGINS behind env, remove `sendTransaction`, tighten CSP wildcards).
3. Rotate the Supabase anon JWT with a ≤1-year TTL and move the value out of source into the Pages env (and GitHub Actions secret).

**Before next demo or Colosseum submission**:
4. Fix SC C-01 (first-deposit inflation) — UniV2 dead-shares pattern. Redeploy limer_amm. Re-initialize the 6 pools.
5. Fix SC H-01 (deposit refund of excess).
6. Add `max_slippage_bps` to `AmmConfig`, enforce in swap IX → closes Frontend H-01.
7. CSP Phase 2 promotion (drop `unsafe-inline`/`unsafe-eval`); replace PostHog inline snippet with external-script load.

**Before mainnet**:
8. Build the signed-message attestation pattern for `limer` program's `award_*` IXs and for Supabase writes.
9. Add emergency pause on the AMM.
10. Move rate limiting from per-isolate memory to Cloudflare Rate Limiting rules / KV.

## Individual audit reports

Preserved in this directory for detail-level reference:

- [`01-smart-contract-audit.md`](./01-smart-contract-audit.md) — 1C / 2H / 6M / 7L — full code-level analysis of both Anchor programs
- [`02-backend-supabase-audit.md`](./02-backend-supabase-audit.md) — 2C / 5H / 6M / 4L — Workers + RLS + secret-inventory
- [`03-frontend-audit.md`](./03-frontend-audit.md) — 0C / 3H / 6M / 8L — React/Vite/CSP/deps/CI

## Questions outstanding

These came out of the smart-contract audit and need founder input before a fix lands:

1. **Upgrade authority on `limer_amm` program** — who holds it today? Transfer to the mainnet Squads vault before any outside LP participates.
2. **Is permissionless pool creation in the roadmap?** If yes, C-01 is a pre-flight blocker.
3. **Is `initialize_pool` seeding ever expected to run against previously-drained pools?** If yes, devnet demos hit C-01 even without mainnet launch.
4. **Design for server-signed attestations** (limer program H-02) — do you want Ed25519 program CPI, a PDA-held authorized-signer list, or a Squads-gated awarder?
