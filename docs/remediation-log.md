# Security Audit Remediation Log

**Authoritative record of every finding from `Limers-Capital-Security-Audit-Report-April-2026.md` and the commits / transactions that closed it.**

Format: newest entries at the top. Every entry must include the audit finding ID, date, files/commits/tx signatures that implemented the fix, and verification evidence (a test run, a Sentry event, an on-chain tx, or similar).

---

## 2026-04-17 — C-03 — CSP hardening (Phase 1 shipped)

**Audit finding:** No Content-Security-Policy / Subresource-Integrity at the HTML layer.

**Shipped:**
- Two CSP headers in `public/_headers` — the existing permissive policy remains enforced so nothing breaks; a hardened `Content-Security-Policy-Report-Only` policy is emitted alongside. Report-Only drops `'unsafe-inline'` and `'unsafe-eval'` from `script-src`, keeps `'wasm-unsafe-eval'` for Solana cryptography libs, and points `report-uri` + `report-to` at the Worker's new `/csp-report` endpoint.
- Inline boot-recovery script extracted from `index.html` to `public/boot-recover.js` and pinned by SRI (`integrity="sha384-6qe0DfIT+/66438fJVamlrV1M5DnPKbTK9lRwH7vMAfoRPooKO6iaK63VuQDSecf"`). This was the sole inline script in production HTML; moving it out means Phase 2 enforcement no longer needs an inline-script escape hatch.
- `workers/api-proxy.js` — new `handleCspReport()` forwards violations to Sentry tagged `source: 'csp-report'`, bypasses the ALLOWED_ORIGINS check (browsers don't send Origin on report POSTs), retains per-IP rate limiting, 16 KB payload cap.
- `docs/SECURITY.md §9` — Phase 2/3/4 runbook (enforce, Google Fonts self-host, CI bundle-hash lock).

**Verification:**
- `node --check workers/api-proxy.js` → clean.
- `openssl dgst -sha384 -binary public/boot-recover.js | openssl base64 -A` reproduces the pinned hash.
- Post-deploy smoke test (pending first production deploy): browser DevTools → Network tab → confirm `Content-Security-Policy-Report-Only` header present on `/`; deliberately inject an inline script via DevTools and confirm a POST hits `/csp-report`.

**Status:** Phase 1 shipped. Phase 2 enforcement target: 2026-04-24 (7 days of zero-violation Report-Only).

---

## 2026-04-17 — C-02 — Sentry activation (code complete; manual DSN provisioning remaining)

**Audit finding:** Sentry telemetry wired but inactive in production.

**Shipped (code + docs):**
- `.env.example` — documents `VITE_SENTRY_DSN`, `VITE_GIT_SHA`, `VITE_SENTRY_ENVIRONMENT` with inline provisioning instructions.
- `workers/wrangler-api.toml` — `SENTRY_DSN` comment updated to reference audit C-02.
- `docs/SECURITY.md §10` — full 6-step activation runbook: create Sentry project, set `VITE_SENTRY_DSN` in Cloudflare Pages env vars, `wrangler secret put SENTRY_DSN`, provision uptime monitors, defer source-map upload, log closure here.
- `ops/uptime-monitors.md` — canonical monitor config (Better Stack, 3-min interval, two monitors: frontend `limerscapital.com`, API proxy Jupiter probe).

**Remaining (founder must complete — ~20 min):**
- Create Sentry React project.
- Paste DSN into Cloudflare Pages *Production* env vars → retry deploy.
- `cd workers && npx wrangler secret put SENTRY_DSN -c wrangler-api.toml`.
- Confirm smoke-test events in Sentry dashboard.
- Create Better Stack monitors per `ops/uptime-monitors.md`.
- Append a closing entry to this log with the first Sentry event ID as evidence.

**Status:** Code shipped; DSN provisioning pending.

---

## 2026-04-17 — C-01 — Upgrade authority migration plan + SECURITY.md drift correction

**Audit finding:** Single-signer mint authority on the on-chain limer program.

**Critical documentation drift discovered:** `docs/SECURITY.md §8` previously claimed the program had *"no upgrade authority"*. On-chain verification (`solana program show HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk --url devnet`) returned `Authority: 3wvJe17zVfFm48DHVYGfShNg2p9r8C2ijgyZiXQcPkgd` — a single EOA. The SECURITY.md claim was false. This is itself a security issue because anyone reading the doc would form an incorrect mental model of the trust guarantees.

**Shipped (code + docs):**
- `docs/SECURITY.md §8` — rewritten. Removes the false immutability claim. Quotes the on-chain authority verbatim. Points to `SECURITY_MODEL.md` for the migration plan.
- `docs/SECURITY_MODEL.md` — new authoritative document. Authority inventory (devnet only, not yet mainnet), 3-of-5 Squads v4 signer set, timelock rationale, routine upgrade procedure, emergency procedure, key rotation schedule, compliance hooks.
- `scripts/transfer-authority-to-squads.sh` — executable migration script. Dry-run by default. Verifies the keypair matches current on-chain authority before attempting transfer. Hard guardrail on mainnet (confirms program ID via typed input). Appends a row to `docs/program-upgrade-log.md` on success.
- `anchor/programs/limer/PHASE2_DISPUTE_DESIGN.md` — design for the `TradeDispute` instruction the audit recommends for Phase 2. Not yet implemented because deploying the new code requires the multisig authority to already be in place.

**Remaining (founder + signer coordination — multi-day):**
- Recruit 2 independent advisors and 1 escrow signer per `SECURITY_MODEL.md §2`.
- Deploy Squads v4 multisig with 3-of-5 threshold.
- Run `./scripts/transfer-authority-to-squads.sh --network devnet --dry-run`, then `--execute`.
- Commit the resulting transaction signature to `docs/program-upgrade-log.md` and update Authority Inventory in `SECURITY_MODEL.md §1`.
- Append a closing entry to this log.
- No mainnet deploy of the program is authorized until the above is complete.

**Status:** Plan + scripts + documentation shipped. Multisig deployment and transfer pending.

---

## 2026-04-17 — C-01 — Deferral decision (Option B)

**Updated:** Same day as the initial C-01 remediation work.
**Decision:** Defer on-chain authority transfer until the `limer` program is deployed to mainnet-beta. Accept the devnet single-signer authority as residual risk during the interim.

**Rationale:**
- A Squads v4 multisig named "Limer's Capital" (2-of-3 threshold, vault `DsMBfumZyokGhHrqpsDBnQztj1LBCpmTmaoGjmxzyxXg`) has been created on **mainnet-beta** (creation tx `5j1hkYyqzwNJ83eX7MYjxHcxPmN3uErNS816ynjaoLGeTFiYvBcLDs4xpaGQz58SyNtCgAkVnNBqbLXrtgJ1ViEQ`, program `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`).
- The `limer` Anchor program is deployed on **devnet only** — cross-network authority transfer is not possible.
- Creating a mirror multisig on devnet (Option A) adds coordination overhead for signers without reducing real risk. Devnet has no real assets, no real users, no real funds at stake.
- Option C (deploying the `limer` program to mainnet now) was rejected because audit findings H-01 (client-editable competition state) and H-03 (Real Swap without KYC/jurisdiction gate) remain open. Deploying live increases exposure to real exploits for minimal short-term benefit.

**Residual risk accepted:**
- Devnet program upgrade authority `3wvJe17zVfFm48DHVYGfShNg2p9r8C2ijgyZiXQcPkgd` (single EOA) remains in place.
- A compromise of that key allows fabrication of devnet XP/badges/trades. No mainnet assets at risk.
- Risk holder: founder.
- Mitigations in force: keypair held offline on a cold machine; no CI/CD has access.

**Path to closure:**
- When `limer` deploys to mainnet (target: post-Colosseum, after H-01 and H-03 are remediated), the mainnet deploy tx will immediately set `--upgrade-authority DsMBfumZyokGhHrqpsDBnQztj1LBCpmTmaoGjmxzyxXg` so the program is multisig-governed from block one. No authority transfer required.
- Alternatively, if we mainnet-deploy with the founder's EOA first, the existing `scripts/transfer-authority-to-squads.sh` handles the transfer in a follow-up tx.

**Target Squads multisig (mainnet, already live):**

| Field | Value |
|---|---|
| Multisig name | Limer's Capital |
| Network | mainnet-beta |
| Threshold | 2-of-3 |
| Vault PDA | `DsMBfumZyokGhHrqpsDBnQztj1LBCpmTmaoGjmxzyxXg` |
| Squads v4 program | `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` |
| Creation tx | `5j1hkYyqzwNJ83eX7MYjxHcxPmN3uErNS816ynjaoLGeTFiYvBcLDs4xpaGQz58SyNtCgAkVnNBqbLXrtgJ1ViEQ` |
| Fee-payer signer (likely founder personal wallet) | `Dw5yq2Mcqa3TyqKoi3RqBgdhRGvRbaZMVw2RoKeM8fWh` |
| Co-signer on creation | `3Fbcr5u2Sh4yPPB5murpXSx8VeTQkRVvxtorYj7B17jP` |

**Status:** Open with deferral. Will close on mainnet deploy.

---

---

## Closing-entry template

When you close a remaining-work item above, append an entry here using this template:

```
## YYYY-MM-DD — <FINDING-ID> — Closed
**Completed by:** <name>
**Evidence:**
- <tx signature / Sentry event ID / link to deployed commit>
**Verification:**
- <what you checked and how>
**Status:** Closed.
```

Never edit a prior entry — add a new one. This log is append-only so the sequence of events remains auditable.
