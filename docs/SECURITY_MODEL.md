# Limer's Capital — Security Model

**Scope:** On-chain authority, key management, and governance for the `limer` Anchor program and any future program Limer's Capital deploys.
**Audience:** Founder, technical lead, advisors, any auditor, any regulator asking "who holds the keys?"
**Status:** Living document. Every change to the authority state or signer set must be committed alongside an on-chain transaction hash proving the change.

**Related audit findings:**
- **C-01** — Single-signer mint authority (this document is the remediation plan)
- **H-04** — Audit trail gaps for privileged operations

---

## 1. Authority Inventory (current state — as of 2026-04-17)

| Authority | Holder | Network | On-chain evidence |
|---|---|---|---|
| `limer` program upgrade authority | `3wvJe17zVfFm48DHVYGfShNg2p9r8C2ijgyZiXQcPkgd` (founder EOA) | devnet | `solana program show HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk --url devnet` |
| `limer` program upgrade authority | (not deployed) | mainnet-beta | Program does not exist on mainnet. Will be set to Squads vault (see below) at first mainnet deploy. |
| Squads multisig "Limer's Capital" | Created 2026-04-17 | **mainnet-beta** | 2-of-3 threshold; vault PDA `DsMBfumZyokGhHrqpsDBnQztj1LBCpmTmaoGjmxzyxXg`; governed by Squads v4 program `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`; creation tx `5j1hkYyqzwNJ83eX7MYjxHcxPmN3uErNS816ynjaoLGeTFiYvBcLDs4xpaGQz58SyNtCgAkVnNBqbLXrtgJ1ViEQ` |
| Deploy keypair | `anchor/target/deploy/limer-keypair.json` | n/a | **Not committed** (gitignored). Backup held offline by founder. |
| Cloudflare Worker secrets | `HELIUS_API_KEY`, `FMP_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`, `SENTRY_DSN` (when set) | edge | Stored via `wrangler secret put` — never on disk. |
| Supabase service role | Not used in client code | n/a | Only anon key is embedded in the frontend (RLS enforces access). |

**Critical observation:** The devnet program is the *only* Anchor program Limer's Capital has deployed anywhere. No mainnet deploy has happened. A mainnet Squads multisig exists and is ready to receive upgrade authority, but the two are on different networks and cannot be linked. See `docs/remediation-log.md` entry 2026-04-17 for the Option-B deferral decision.

---

## 2. Actual State — Squads v4 Multisig (2-of-3, mainnet-beta)

A multisig named "Limer's Capital" was deployed to mainnet-beta on 2026-04-17. Details:

- **Threshold:** 2-of-3
- **Vault PDA:** `DsMBfumZyokGhHrqpsDBnQztj1LBCpmTmaoGjmxzyxXg`
- **Governance program:** Squads v4 (`SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`)
- **Role when linked:** Upgrade authority of the `limer` program once deployed to mainnet. Not applicable to devnet (see `remediation-log.md` deferral).

### Signer set (current, mainnet — 3 members, need pubkeys for full documentation)

| # | Role | Pubkey | Notes |
|---|---|---|---|
| 1 | Founder / fee-payer | `Dw5yq2Mcqa3TyqKoi3RqBgdhRGvRbaZMVw2RoKeM8fWh` *(inferred from creation tx — confirm before assuming)* | Primary operational signer. Can propose and co-sign. Signed the multisig creation transaction. |
| 2 | Co-signer (advisor A) | `3Fbcr5u2Sh4yPPB5murpXSx8VeTQkRVvxtorYj7B17jP` *(inferred from creation tx)* | Second signer required during creation. Role and commercial-independence status to be confirmed. |
| 3 | Third member | *(to be retrieved from Squads Members tab)* | The third 2-of-3 member. Pubkey not yet extracted. |

**To fill in the table:** In the Squads app, open *Members* in the left sidebar. Copy the three pubkeys. Replace the inferred entries above with the authoritative list. This is a blocking item for audit-trail completeness but not for any technical operation.

**Threshold trade-offs (2-of-3 vs. the audit's 3-of-5 recommendation):**
- **Pro:** Realistic for a solo-founder-plus-two-advisors stage. 3-of-5 would require recruiting 4 external signers before Colosseum — unrealistic timeline.
- **Pro:** Any two signers can act on routine upgrades without requiring all three to be reachable.
- **Con:** A single compromise of the founder's key + social engineering of one other signer is enough to upgrade the program. 3-of-5 would require compromising three.
- **Con:** If any one signer's key is lost, the remaining 2-of-3 is effectively 2-of-2 until rotation — fragile.
- **Decision:** Accept 2-of-3 through Colosseum. Expand to 3-of-5 in the first sprint post-Colosseum if funding and signer availability allow. Document the upgrade in a new row of the §6 change log.

### Timelock

All upgrade transactions must wait **48 hours** after multisig approval before execution. This is implemented via the Squads `timelock` extension (not as program logic — the program's upgrade mechanism is BPF Loader Upgradeable, which does not support native timelocks).

During the 48-hour window, users can:
- Audit the new program bytecode hash (published in `docs/program-upgrade-log.md`).
- Withdraw any assets the program controls (currently none — the program only stores XP/badge state — but this guarantee must hold as scope expands).
- File a dispute via the `TradeDispute` instruction (see Phase 2 — `anchor/programs/limer/PHASE2_DISPUTE_DESIGN.md`).

### Operational procedure for routine upgrades

1. Technical lead opens a PR with the program change. PR description includes:
   - Summary of the change and its motivation.
   - Diff of the program's IDL (auto-generated by Anchor).
   - New `ProgramData` account size and account data hash (computed via `solana program show --output json | jq .programdataAddress`).
2. PR is reviewed and approved by the founder.
3. `anchor build` on the technical lead's machine. The resulting `.so` hash is published in `docs/program-upgrade-log.md` with the PR link.
4. Technical lead creates a Squads proposal: "Upgrade program `HuCCEkDv...` to new data at PDA `<new-programdata-pda>`."
5. Founder signs the proposal from a Ledger.
6. Advisor A signs the proposal after independently verifying the `.so` hash matches the PR.
7. The Squads timelock begins. Announcement is made in `#limerscapital-security-notices` Slack channel and on the `@limerscapital` X account.
8. After 48 hours with no dispute raised, any signer executes the transaction. The transaction signature is committed to `docs/program-upgrade-log.md`.

### Emergency procedure (key compromise)

If the founder's key is compromised:

1. Founder immediately notifies advisor A, advisor B, and technical lead via pre-agreed out-of-band channels.
2. Technical lead, advisor A, advisor B sign a Squads proposal to remove the founder as a signer and add a new founder key.
3. The escrow signer is activated to provide the third signature in place of the (compromised) founder.
4. The timelock is **not bypassed** — the 48-hour window still applies. Attacker cannot race because they only hold one of three required signatures.
5. Post-incident, the escrow signer is removed and threshold is restored to 3-of-4 until a new fifth signer is onboarded.

If the escrow signer is compromised: no immediate action required (escrow doesn't participate in routine signing). Replace at the next multisig meeting.

If two routine signers are compromised simultaneously: file with the FBI IC3 and TTSEC Cyber Unit; treat as an active attack. Consider a timelock-triggered "program freeze" via a future instruction (out of scope for current program).

---

## 3. Migration Runbook — From Single-Signer to Squads v4

This is the exact sequence to move the devnet authority. The same sequence applies for mainnet on first deploy (skip Step 1 because the mainnet program won't exist yet).

**Prerequisites:**
- All five signers have generated hardware-wallet or HSM-backed keypairs and provided their public keys.
- Founder has access to the current authority keypair (`3wvJe17zVfFm48DHVYGfShNg2p9r8C2ijgyZiXQcPkgd`) on a cold machine.
- `solana` CLI ≥ 1.18 and `@sqds/multisig` ≥ 2.1 installed.

**Run:**

```bash
# Dry-run the transfer (no state change):
./scripts/transfer-authority-to-squads.sh --dry-run --network devnet

# Review the output. Confirm:
#   - Current authority matches what you expect
#   - Target vault PDA matches what Squads v4 deployed
#   - All five signer pubkeys are correct
#   - Threshold is 3

# If correct, execute:
./scripts/transfer-authority-to-squads.sh --network devnet

# Verify the transfer:
solana program show HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk --url devnet
#   → Authority: <squads-vault-pda>
```

After a successful transfer:

1. Commit the transaction signature to `docs/program-upgrade-log.md`.
2. Update the **Authority Inventory** table in this document.
3. Close audit finding C-01 in `docs/remediation-log.md`.
4. Rotate the old single-signer keypair (move to air-gapped archive; it is still valid for deploy-payer operations but no longer holds authority).

---

## 4. Key Rotation Schedule

| Key | Rotation cadence | Last rotated |
|---|---|---|
| Founder Squads signer | Every 24 months or on laptop upgrade | n/a (pre-migration) |
| Tech lead Squads signer | Every 24 months | n/a |
| Advisor signers | On advisor role change | n/a |
| Escrow signer | On HSM provider change | n/a |
| Worker API keys (`HELIUS_API_KEY` etc.) | Every 12 months or on suspected leak | 2026-01 (last PR referenced key) |
| Sentry DSN | On Sentry project migration | not yet set (see C-02) |
| Supabase anon key | On RLS policy overhaul | 2026-02 |

Rotation events are logged in `docs/remediation-log.md` with old-key-fingerprint → new-key-fingerprint.

---

## 5. Compliance Hooks

This security model is designed to satisfy the following regulatory postures:

- **TTSEC (Trinidad and Tobago Securities Exchange Commission):** A multisig with independent advisor signatories satisfies the "segregation of duties" expectation in the Securities Act 2012 technology-operations guidance.
- **CARICOM AML:** Key-compromise response procedures and incident logs feed into FATF Recommendation 15 compliance for virtual asset service providers.
- **SOC 2 Type II (aspirational):** All upgrade operations are logged with identifiable signers + timestamps, satisfying Common Criteria 6.1 (logical access) and 7.3 (change management).

We do not claim compliance with any framework until audited. This document is the substrate for an eventual audit — not a certification.

---

## 6. Change Log

| Date | Change | By |
|---|---|---|
| 2026-04-17 | Document created. Reconciles SECURITY.md §8 drift. Defines migration plan for C-01. | founder |
| 2026-04-17 | Updated Authority Inventory and §2 to reflect actual 2-of-3 multisig on mainnet-beta (vault `DsMBfumZyokGhHrqpsDBnQztj1LBCpmTmaoGjmxzyxXg`). Documented Option-B deferral decision. Threshold adjusted from aspirational 3-of-5 to actual 2-of-3 with trade-off analysis. | founder |

Every edit to this document must add a row here.
