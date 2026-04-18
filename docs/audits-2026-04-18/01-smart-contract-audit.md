# Smart Contract Audit — Limer AMM + Limer Programs

**Audit date**: 2026-04-18
**Scope**: `anchor/programs/limer_amm/src/**/*.rs` + `anchor/programs/limer/src/**/*.rs`
**Commit audited**: `86b7d4c135eef03a5c74d86fadbd3d18bd1db8a5`
**IDLs verified**: `src/solana/idl/limer_amm.json` + `limer.json` — instruction sets and program IDs match source.

## Executive Summary

- **1 Critical**
- **2 High**
- **6 Medium**
- **7 Low / Informational**
- **Verdict**: **Block any public call-to-action until C-01 is fixed.** Devnet demos are fine in the narrow sense that only founder-seeded pools exist, but the moment a stranger can deposit first into any pool, funds can be taken. Do not advertise "anyone can provide liquidity" messaging, and do not ship to mainnet, until C-01 + H-01 are closed.

---

## Findings

### [C-01] First-deposit inflation attack — MINIMUM_LIQUIDITY is subtracted but never locked

**Severity**: Critical
**Location**: `anchor/programs/limer_amm/src/math.rs:102-114` + `anchor/programs/limer_amm/src/lib.rs:113-207` (specifically the `MINIMUM_LIQUIDITY` handling and the comment at 128-140)

**Description**: The canonical Uniswap-V2 inflation-attack mitigation is to **mint** `MINIMUM_LIQUIDITY` LP tokens to a burn address so that `lp_mint.supply` is permanently ≥ `MINIMUM_LIQUIDITY` and the first depositor never owns 100% of outstanding supply. This program does **not** do that. It simply returns `sqrt(a*b) - MINIMUM_LIQUIDITY` as the LP amount to mint to the first depositor (`math.rs:108-110`). No LP tokens are minted to a burn address, and `pool.total_lp_supply` and `lp_mint.supply` both equal exactly `sqrt(a*b) - 1000`. The first depositor therefore owns **100% of outstanding LP** and the pool can be drained back to `total_lp_supply == 0`, which re-arms the first-deposit branch indefinitely.

The comment at `lib.rs:128-140` describes the intended protection ("minting to the user's LP ATA but accounting for it in math so the user's effective share is (sqrt - MINIMUM_LIQUIDITY)") but the code does not implement it — there is no second `mint_to` call for the locked portion, and the user receives the full amount the math returns.

**Exploit** (concrete): any new pool on mainnet, or any existing pool that the sole LP has fully drained:
1. Attacker calls `deposit_liquidity(2001, 2001, 0)` → mints `sqrt(2001²) - 1000 = 1001` LP. `lp_mint.supply = 1001`. Attacker holds 1001/1001.
2. Attacker sends a raw SPL `transfer` of, say, 1,000,000 tokenA directly to `pool.token_a_vault`. The AMM does not track reserves in state — it reads `token_a_vault.amount` live — so the donation is absorbed into pool reserves with no LP minted.
3. Victim naively deposits `10_000` tokenA + `10` tokenB, expecting close-to-1:1. The math computes `lp_from_a = 10_000 * 1001 / 1_002_001 = 0`, `lp_from_b = 10 * 1001 / 2001 = 5`, `min = 0`. Victim mints **0 LP** and their tokens are absorbed.
4. Attacker burns their 1001 LP → receives the entire vault `(1,012,001 A, 2011 B)`. Net attacker gain ≈ `10_000 A + 10 B` minus the 1000 LP-subtraction donation of ~1000 A — a clean theft of the victim's deposit.

**Recommendation**: Implement the mitigation properly. Two options, in order of preference:

1. **Uniswap-V2 pattern — mint dead shares**. On first deposit, mint `MINIMUM_LIQUIDITY` LP to a pool-owned ATA (the `pool_authority` PDA's own LP ATA) in addition to the user's mint. The user receives `sqrt(a*b) - MINIMUM_LIQUIDITY`. `lp_mint.supply` stays ≥ `MINIMUM_LIQUIDITY` forever. Require the program never expose a burn path for the locked ATA.

   ```rust
   // After computing lp_to_mint = sqrt(a*b) - MINIMUM_LIQUIDITY:
   if total_lp == 0 {
       token::mint_to(/* CPI to pool_authority's LP ATA */, MINIMUM_LIQUIDITY)?;
   }
   token::mint_to(/* CPI to depositor's LP ATA */, lp_to_mint)?;
   ```

2. **Require a minimum first deposit value and refuse to return to empty state**. Enforce `sqrt(a*b) >= MINIMUM_LIQUIDITY * 10` (or similar) on first deposit AND reject withdrawals that would leave `total_lp_supply < MINIMUM_LIQUIDITY`. Less elegant, more code, but doesn't require a second CPI.

Also: delete the misleading comment at `lib.rs:128-140` — it describes behavior that does not exist in the code.

---

### [H-01] `deposit_liquidity` accepts unbalanced deposits without refund — silent value loss for LPs

**Severity**: High
**Location**: `anchor/programs/limer_amm/src/lib.rs:113-207` + `math.rs:122-138`

**Description**: On subsequent deposits, the math takes `min(lp_from_a, lp_from_b)` so the LP amount honors whichever side is the smaller contribution relative to reserves. **But the code then transfers the caller-supplied `amount_a` and `amount_b` in full** — it does not compute the matching "other side" amount and refund the excess. Any imbalance above the pool's current ratio is silently donated to remaining LPs, directly diluting the depositor.

Concrete impact: pool at 1000/1000 with 1000 LP. User deposits `amount_a=500, amount_b=100, min_lp_out=0`. LP minted = `min(500, 100) = 100`. User contributed 500 A + 100 B = 600 units of value, received 100 LP worth `100/1100 * (1500+1100) = 236` units. **Depositor lost 60% of their deposit** to the existing LPs.

Mitigation partially present: `min_lp_out` slippage bound. A careful caller who knows the current ratio can set it to the expected balanced amount and revert. But the seed scripts and a typical UI will pass `0` or a loose value, and the UX assumption from DESIGN.md is "caller-provided values directly" — wrong for subsequent deposits.

**Exploit** (griefing + sandwich): MEV bot sees a pending `deposit_liquidity(500, 500, 0)` on a 1000/1000 pool. Bot front-runs with a swap that pushes pool to 1500/667. Victim's deposit at new ratio: `lp_from_a = 500*1000/1500 = 333`, `lp_from_b = 500*1000/667 = 749`, min = 333 LP. Victim contributed 500+500=1000 value, received 333/1333 * (2000+1167) = 791 value. Bot back-runs with reverse swap, pocketing the ~200 of donation. Standard sandwich.

**Recommendation**:

1. In `deposit_liquidity`, after computing `lp_to_mint`, compute the matching amounts:
   ```rust
   let actual_a = if first { amount_a } else { lp_to_mint * reserve_a / total_lp };
   let actual_b = if first { amount_b } else { lp_to_mint * reserve_b / total_lp };
   require!(actual_a <= amount_a && actual_b <= amount_b, AmmError::...);
   // transfer only actual_a and actual_b, not amount_a/amount_b
   ```
2. Consider also rejecting deposits with `lp_to_mint == 0` explicitly — currently reachable on a skewed pool and guaranteed value loss.

---

### [H-02] `award_xp` / `award_lp` / `record_badge` / `record_module` / `record_trade` — any wallet can self-award, competition leaderboard is trivially gamed

**Severity**: High (already tracked as open — remediation log §H-01)
**Location**: `anchor/programs/limer/src/lib.rs:35-132, 197-223`

**Description**: Every mutating instruction on the `limer` program is gated only by `has_one = owner` + `Signer`, meaning the profile owner is allowed to call it. There is no server-signed attestation, no oracle, no proof-of-completion. A user can call `award_xp(u64::MAX)`, `award_lp(u64::MAX, 1000)`, `record_badge(0..=31)`, `record_module(0..=7)`, `record_trade(u64::MAX, u64::MAX)` to max out every field. Leaderboard, badge display, and any reward tied to these fields is meaningless.

This is already listed as open in `docs/remediation-log.md` (H-01 "client-editable competition state"). Re-flagging at high severity because any Colosseum judge who reads the IDL will see this within 30 seconds. Also: `.unwrap_or(u64::MAX)` on every `checked_add` silently saturates instead of erroring (lib.rs:37, 52-53, 87, 115-123) — this hides the fact that overflow is even possible and makes the contract look buggy rather than malicious if a griefer does max out fields.

**Recommendation**:

1. Add a server-signed attestation pattern (Ed25519 signature from a backend keypair, verified in-program via `ed25519_program` CPI or a PDA-held authorized-signer list). Or move to a PDA-gated authority where only a dedicated "awarder" program/signer (e.g., a Jupiter swap wrapper that authenticates a real trade occurred) can call these.
2. Replace `.unwrap_or(u64::MAX)` / `.unwrap_or(0)` with `.ok_or(LimerError::MathOverflow)?`. Silent saturation is never what you want in accounting.
3. Bound inputs: `require!(amount <= MAX_XP_PER_AWARD, ...)`. Today `u64::MAX` is accepted.

---

### [M-01] Admin key can instantly update pool fee (if a fee-update IX is added) and currently holds the LP-mint freeze authority

**Severity**: Medium
**Location**: `anchor/programs/limer_amm/src/lib.rs:482-496` (LP mint freeze_authority = pool_authority PDA) + absence of a governance/timelock pattern

**Description**: Two linked concerns:
1. The LP mint's `freeze_authority` is set to `pool_authority` (a PDA owned by the program). There is no freeze instruction in v1, but the **program itself is upgradeable** — an upgrade could add one. The `DESIGN.md` comment at lib.rs:492-496 acknowledges the intent was to later set it to `None`, but no such instruction exists. The LP holders therefore implicitly trust the program upgrade authority.
2. No `update_fee` / `pause` / `set_admin` instructions exist — which is good for v1 immutability — but the `_reserved` bytes in `AmmConfig` and `Pool` telegraph that such instructions are planned. When they are added, they should ship with a timelock (N-slot delay between queuing and executing) so a swap cannot be sandwiched with `update_fee(9999) → swap → update_fee(30)`.

**Recommendation**: Before mainnet, ship an `update_lp_mint_authorities_to_none` admin IX and call it immediately post-init. When adding `update_fee`, require a `FeeChangeProposal` account with `queued_slot + 216000` (≈1 day) before it can be finalized. Cap `fee_bps` at `MAX_FEE_BPS = 100` in both the proposal and the execution paths.

---

### [M-02] No emergency pause — a critical bug in a deployed pool requires a program upgrade to mitigate

**Severity**: Medium
**Location**: `anchor/programs/limer_amm/src/lib.rs` — no pause state on `AmmConfig` or `Pool`

**Description**: Standard AMM hygiene. If C-01 (or any future critical) is discovered post-mainnet-deploy, you have no way to freeze deposits/swaps while rolling an upgrade. For a program that routes real money, this is a standard ask.

**Recommendation**: Add `paused: bool` to `AmmConfig` + optionally per-pool. Gate `deposit_liquidity`/`swap`/`withdraw_liquidity` behind `require!(!cfg.paused, AmmError::Paused)`. Admin-only `pause` / `unpause` IXs. (Withdraw should stay open during pause so users can always exit — industry standard.)

---

### [M-03] Token-2022 confusion not explicitly blocked for user ATAs

**Severity**: Medium
**Location**: `anchor/programs/limer_amm/src/lib.rs:544, 584, 618` — `token_program: Program<'info, Token>`

**Description**: The program constrains `token_program` to the SPL Token program (`Token` = legacy), not Token-2022. This is correct and blocks the class of attack where an attacker substitutes a Token-2022 mint with transfer-hook or transfer-fee extensions on the vault side. However:
- The `depositor_token_a/b`, `trader_token_a/b`, and `depositor_lp` accounts are `Account<'info, TokenAccount>` without an explicit `token::token_program = token_program` constraint. Anchor's `Account<Mint/TokenAccount>` deserializer will reject Token-2022 accounts by default via discriminator mismatch, so this is probably safe, but make it explicit.

**Recommendation**: Add `token::token_program = token_program` to every `TokenAccount` constraint block, and verify this in a unit test by attempting to pass a Token-2022 account (should fail).

---

### [M-04] `check_in_daily` uses unchecked signed-timestamp subtraction

**Severity**: Medium
**Location**: `anchor/programs/limer/src/lib.rs:77-106`

**Description**: Line 83: `let days_since = (now - last) / 86400;`. Both `now` and `last` are `i64`. If a corrupted or malicious `last_login` (set via a future admin IX or legacy data) is greater than `now`, the result is negative and `days_since == 0` branch takes effect — the streak is preserved across a regression. Not exploitable today because the user is the only one who writes `last_login` and Solana's clock is monotonic-ish, but the pattern is fragile. Also, `now - last` is not `checked_sub` — on pathological inputs it can overflow.

**Recommendation**: `let days_since = now.saturating_sub(last).max(0) / 86400;` or `checked_sub` + explicit error.

---

### [M-05] `pool.total_lp_supply` drifts from `lp_mint.supply` (uses saturating, not checked, arithmetic)

**Severity**: Medium (informational-tilt)
**Location**: `lib.rs:188, 275` — `saturating_add`/`saturating_sub`

**Description**: The pool mirrors the mint supply in state for "math convenience" (state.rs:35) but the math code reads the live `lp_mint.supply` (lib.rs:121, 219). The pool field is therefore redundant, AND it uses saturating arithmetic so at u64::MAX it silently stops tracking. If anything ever reads `pool.total_lp_supply` instead of `lp_mint.supply` (e.g. an off-chain indexer), it will disagree with reality.

**Recommendation**: Either delete the field (and use `_reserved` to preserve account size for migration), or switch to `checked_add`/`checked_sub` and assert `pool.total_lp_supply == lp_mint.supply` at the end of each state-changing IX as a correctness invariant.

---

### [M-06] `deposit_liquidity` does not verify `depositor_lp` is owned by `depositor`

**Severity**: Medium (social-engineering)
**Location**: `anchor/programs/limer_amm/src/lib.rs:538-539`

**Description**: `depositor_lp` is only constrained on its mint. A front-end bug or phishing UI could send freshly-minted LP tokens to an arbitrary ATA belonging to the attacker. The depositor pays the A/B; the attacker receives the LP. The depositor signs the tx so they authorize it, but they likely believe they're minting to their own ATA.

**Recommendation**: Add `constraint = depositor_lp.owner == depositor.key()` — trivial, defense-in-depth against malicious front-ends.

---

### [L-01] `swap_out_amount` dead branch — `amount_out >= reserve_out` is mathematically unreachable
**Location**: `math.rs:64-66`. With the constant-product formula `out = (reserve_out * amount_in_with_fee) / (reserve_in * BPS + amount_in_with_fee)`, `out == reserve_out` requires `amount_in_with_fee >= reserve_in * BPS + amount_in_with_fee`, impossible for positive `reserve_in`. The branch is dead code. Harmless but clean it up or replace with `out < reserve_out` as an assertion.

### [L-02] `sqrt_u128` test tolerance is quietly ±1
**Location**: `math.rs:180-189` — `assert!(sqrt_u128(big * big) >= big - 1)`. Newton's method on u128 without refinement can return `floor(sqrt(n)) ± 1`. For `lp_tokens_for_deposit` a 1-unit overstatement of sqrt on the first deposit branch lets an attacker mint 1 extra LP. Not exploitable given u64 ranges in practice, but the test silently accepts an incorrect implementation. Replace with an exact floor test (e.g. `assert!(r*r <= n && (r+1)*(r+1) > n)`).

### [L-03] No deadline/blockhash expiry beyond Solana's default 60-90s
Acceptable for Solana vs EVM; note in docs that clients should use low `max_retries` / short confirm timeouts.

### [L-04] Events emitted after CPIs with state reloads — correct, but `LiquidityAdded.amount_a/amount_b` reports *attempted* amounts, not actual transferred
Today they're equal; will diverge if H-01 is fixed with refund logic. Make sure to emit the actual transferred amounts.

### [L-05] `AmmConfig.pool_count` uses `saturating_add`
Cap at u64::MAX is cosmetic, not security-relevant.

### [L-06] `initialize_pool` stores `created_at` and `last_update_slot` but neither is used for anything state-relevant on-chain
Informational. If you intend to build an oracle adapter (`last_update_slot` comment, state.rs:37), spec out the adapter now — freshness checks are the whole point.

### [L-07] `deposit_liquidity` transfers A and B with two separate CPIs; a failure on transfer B leaves A transferred
Standard Anchor pattern — if the second CPI fails, the entire tx reverts (Solana atomicity). Not a vuln. Noted for completeness.

---

## Coverage — categories reviewed with no findings

- **PDA seed correctness + bump validation**: reviewed all five contexts. Seeds match both sides of CPIs. `authority_bump` is stored and re-used via `pool.authority_bump` — no redundant `find_program_address` on the hot path. `has_one = admin` correctly gates the AmmConfig.
- **Signer checks on swap/deposit authority**: reviewed. `depositor`/`withdrawer`/`trader` are `Signer<'info>` and correctly pass as transfer authority for user-side transfers. `pool_authority` PDA signs vault-outflow transfers with proper seed construction (lib.rs:166-171, 239-243, 368-374).
- **K-invariant after fee**: `swap_out_amount` math rounds down in favor of the pool; `new_k = (reserve_in + amount_in) * (reserve_out - amount_out)` is ≥ old_k by construction of the Uniswap-V2 formula with the fee kept in the pool. Verified algebraically.
- **CPI ordering / reentrancy**: all CPIs target SPL Token program only — no user-controlled callback surface. Reentrancy is not a concern on Solana for this code.
- **Rent exemption**: all accounts use `init` with Anchor's automatic rent-exempt sizing. No `init_if_needed` used. Fine.

---

## Defense-in-depth — things done well

- **Canonical mint ordering enforced** (`lib.rs:63-66`). Prevents the "same pool under reversed A/B" foot-gun.
- **Freeze-authority rejection on init** (`lib.rs:67-74`). Protects against freezable RWA mints breaking composability mid-swap. Good instinct.
- **`checked_mul` / `checked_add` / `checked_div` throughout `math.rs`**. All arithmetic is bounds-aware.
- **Consistent rounding-down in favor of the pool** in both swap and LP math (`math.rs:57-59, 122-132, 156-167`). Prevents the repeated-1-unit-swap rounding attack.
- **u128 intermediate for all u64 × u64 multiplications** in the math module. Standard and correct.
- **`Signer` bound on `admin` in `InitializePool`** combined with `has_one = admin` on AmmConfig — double-checked admin authority, Anchor-idiomatic.

---

## Questions for the team

1. **Who holds the upgrade authority on `FVk7LzdZ976beSEJkdXD5ww1xRxpZpYjxodN9Kq1Bpwo` today?** Remediation log C-01 covers only the `limer` program (`HuCC...`). If the AMM program upgrade authority is also a single EOA, that should be transferred to the 2-of-3 mainnet Squads vault before any LP provides liquidity from outside the founder team.
2. **Is `initialize_pool` meant to stay admin-gated post-hackathon, or is the plan to eventually allow anyone to create pools?** If the latter, C-01 must be fixed first — permissionless pool creation + broken first-deposit protection = guaranteed rugs.
3. **Are the devnet seed scripts ever expected to be re-run against already-drained pools?** If yes, the "return to `total_lp_supply == 0`" re-arming of C-01 applies even on devnet — a demo attendee could drain + re-exploit.
4. **For H-02, is there an existing design doc for the server-signed-attestation pattern you want to adopt?** The remediation log says H-01 is open but doesn't link a design. This is a gating issue for Colosseum credibility.
5. **Is the plan to remove `pool.total_lp_supply` + `created_at` + `last_update_slot` or to actually use them?** If the oracle adapter is planned for v2, I'd spec it now so the fields aren't just cargo.
