# PHASE 2 — `TradeDispute` Instruction Design

**Status:** Design only. Not yet implemented in the deployed program.
**Audit reference:** `Limers-Capital-Security-Audit-Report-April-2026.md` **C-01** recommendation 2.
**Blocker for implementation:** Cannot deploy program upgrades while the upgrade authority is a single-signer EOA (audit C-01 recommendation 1). Must complete Squads v4 migration first (`docs/SECURITY_MODEL.md §3`).

---

## 1. Motivation

`LimerBridge` (`src/solana/bridge.js`) relays every Zustand state change to the Anchor program without server-side validation or reconciliation. A user with DevTools access can edit `localStorage.caribcrypto-storage` and have arbitrary XP, LP, badge, and trade-volume deltas written to their on-chain PDA (audit finding **H-01**).

Server-side authoritative paper-trade settlement (described in H-01 remediation) is the *prevention* mechanism. This instruction is the *remediation* mechanism: a trust-minimized way for the multisig to mark a poisoned PDA and roll its state back to a challenge-verified baseline.

## 2. State machine

```
              open_dispute()                 resolve_dispute()
  [UNFLAGGED] ───────────────▶ [OPEN] ──────────────────▶ [RESOLVED]
       ▲                          │                             │
       │                          │ challenge_window_expired()  │
       │                          ▼                             │
       │                      [AUTO_CLOSED]                     │
       │                                                        │
       └────────── rehabilitate() (multisig only) ──────────────┘
```

- **UNFLAGGED** — default. The PDA has never been disputed.
- **OPEN** — `open_dispute` was called. A 7-day (604,800 second) challenge window starts.
- **RESOLVED** — the multisig has voted on the dispute. Either the PDA state was reset to the disputed baseline (dispute upheld) or left as-is (dispute rejected).
- **AUTO_CLOSED** — the challenge window expired with no multisig resolution. Dispute is discarded; the PDA keeps its current state. This prevents indefinite freezes if the multisig is unresponsive.

## 3. Proposed instructions

### `open_dispute(reason: DisputeReason, challenger: Pubkey)`

**Permissions:** Anyone (including the profile owner themselves).
**Effect:** Creates a `TradeDispute` account seeded `[b"dispute", user_profile.key().as_ref(), clock.unix_timestamp.to_le_bytes().as_ref()]`. Records:

- Disputed `user_profile` pubkey.
- `challenger` pubkey (can be distinct from the signer — allows a third-party watchdog to file disputes).
- `reason` enum (see §4).
- `opened_at` unix timestamp.
- `challenge_window_ends_at` = `opened_at + 604_800`.
- `state` = `DisputeState::Open`.
- Snapshot of the `user_profile` at dispute time (XP, LP, badges_earned, etc.) — used as the target state if the dispute is upheld.

Rent for the account is paid by the signer. Rate-limited at the client side: the LimerBridge will reject dispute opens on the same profile more than once per 24h.

### `resolve_dispute(outcome: DisputeOutcome)`

**Permissions:** Must be signed by the `multisig_authority` account (set at program-init time to the Squads v4 vault PDA).
**Effect:** Updates the `TradeDispute` account's `state` to `DisputeState::Resolved` and applies the outcome:

- `DisputeOutcome::Upheld` — the `user_profile` is forcibly reset to the snapshot stored in the dispute. `TradeLog` counters are zeroed from the dispute's trade snapshot forward. A `RehabilitationEvent` is emitted.
- `DisputeOutcome::Rejected` — no state change to the `user_profile`. A `DisputeRejectedEvent` is emitted; the dispute opener's account is noted in a `frivolous_disputers` bitmap on the disputed profile to deter griefing.

Must be called before `challenge_window_ends_at`. After that timestamp, the instruction errors with `DisputeWindowExpired` and the dispute auto-closes.

### `rehabilitate(new_state: UserProfileSnapshot)` *(admin-only, manual path)*

**Permissions:** Multisig-only.
**Effect:** Allows the multisig to directly set a user's profile fields — bypassing the dispute flow — for cases where a user's legitimate state has been damaged by a program bug and needs manual restoration. Emits `ManualRehabilitationEvent` with the full before/after diff for audit trail.

## 4. Dispute reason enum

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum DisputeReason {
    /// The XP total on-chain does not match the user's verifiable trade history.
    XpInconsistentWithTrades,
    /// A badge was awarded without the corresponding module completion.
    BadgeWithoutModule,
    /// Trade volume was recorded without a matching signed-trade receipt
    /// from the server-authoritative path (H-01 remediation).
    TradeWithoutServerReceipt,
    /// General inconsistency — requires manual multisig review.
    Other,
}
```

## 5. Account layout

```rust
#[account]
#[derive(InitSpace)]
pub struct TradeDispute {
    pub disputed_profile: Pubkey,           // 32
    pub challenger:       Pubkey,           // 32
    pub reason:           DisputeReason,    // 1 (u8 enum discriminant)
    pub state:            DisputeState,     // 1
    pub opened_at:        i64,              // 8
    pub challenge_window_ends_at: i64,      // 8
    // Snapshot of the disputed profile at open time — used as rollback target.
    pub snapshot_xp:           u64,         // 8
    pub snapshot_limer_points: u64,         // 8
    pub snapshot_badges_earned: u32,        // 4
    pub snapshot_modules_completed: u8,     // 1
    pub snapshot_current_streak:   u32,     // 4
    pub snapshot_longest_streak:   u32,     // 4
    pub bump:             u8,               // 1
}
// Total: 32 + 32 + 1 + 1 + 8 + 8 + 8 + 8 + 4 + 1 + 4 + 4 + 1 = 112 bytes + 8 discriminator = 120
```

## 6. Context guards

```rust
#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"dispute", dispute.disputed_profile.as_ref(), dispute.opened_at.to_le_bytes().as_ref()],
        bump = dispute.bump,
    )]
    pub dispute: Account<'info, TradeDispute>,

    #[account(
        mut,
        seeds = [b"user", dispute.disputed_profile.as_ref()],
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// CHECK: asserted below to match program-state multisig_authority.
    pub multisig_authority: Signer<'info>,

    pub program_state: Account<'info, ProgramState>,
}
```

The `program_state` account (new) stores the Squads v4 vault PDA that is authorized to sign dispute resolutions. Set once via an `initialize_program_state` instruction called by the deploy keypair.

## 7. Error codes (additions to `LimerError`)

```rust
#[error_code]
pub enum LimerError {
    // ... existing errors ...
    #[msg("Dispute window has already expired; dispute is auto-closed.")]
    DisputeWindowExpired,
    #[msg("Dispute is not in Open state.")]
    DisputeNotOpen,
    #[msg("Only the multisig authority can resolve disputes.")]
    UnauthorizedMultisigSigner,
    #[msg("Rehabilitation requires all snapshot fields to be set explicitly.")]
    IncompleteRehabilitationSnapshot,
}
```

## 8. Client integration (future)

After this instruction ships:

1. Extend `src/solana/bridge.js` with a `flagDispute(profilePubkey, reason)` helper, called from an admin-only dashboard.
2. Add a `TradeDispute` view in `src/pages/` that lists all open disputes (queryable via `getProgramAccounts` with a `TradeDispute` discriminator filter).
3. Write a Cloudflare Worker cron that scans for `Open` disputes older than 6 days and posts a Slack notification to `#limerscapital-disputes` so the multisig knows to act before auto-close.

## 9. Out of scope for this phase

- **Timelock on the dispute resolution itself** — not worth the complexity. The 7-day challenge window already gives the user time to object out-of-band; layering a timelock on the multisig vote creates grief vectors.
- **Prize-money clawback in dispute outcomes** — deferred until the `$LIMER` token launches. At that point, the `DisputeOutcome::Upheld` branch may need to clawback distributed prize tokens.
- **On-chain reputation scoring** — discussed in `memory/project_devnet_roadmap.md` but not part of this audit finding.

## 10. Pre-implementation checklist

Before turning this design into code:

- [ ] C-01 Squads v4 migration complete (upgrade authority is the vault, not an EOA).
- [ ] H-01 server-authoritative paper-trade path exists, so disputes can cite a signed-trade receipt.
- [ ] `$LIMER` tokenomics frozen (affects dispute economics — frivolous disputes need a bond).
- [ ] Multisig signers trained on Squads v4 proposal UX so dispute resolution can complete within the 7-day window.
- [ ] Test plan: `anchor/tests/trade-dispute.ts` covers open → resolve (upheld), open → resolve (rejected), open → auto-close, and all error-path assertions.

---

*When this instruction ships, this document becomes the canonical design reference. Commit any deviations from this design with rationale.*
