# juice_escrow — Send Juice savings escrow program (Sprint 2)

**Status:** instruction bodies are now implemented (this is no longer just a scaffold). Pre-deploy work remains: keypair generation, IDL discriminator sync, devnet deploy, and flipping the `JUICE_ESCROW_LIVE` flag in the JS client.

## What it does

Locks SPL Token / Token-2022 stablecoin deposits inside a per-receipt vault PDA. The Metaplex Core NFT minted by the Send Juice corridor flow ([apps/pusd-sundollar/src/solana/core.js](../../../apps/pusd-sundollar/src/solana/core.js)) is the bearer instrument — whoever holds the receipt can `claim` from the vault, gated by maturity.

Together with the receipt mint, this is the full Option B from the original sketch: real on-chain savings, transferable receipt, group-savings via `deposit`, no-rug for depositors via the `locked_for_creator` flip.

## PDA seeds (frozen)

```
SavingsAccount        : [b"juice-savings",       asset_pubkey]
Vault token account   : [b"juice-savings-vault", asset_pubkey]
```

`asset_pubkey` is the Metaplex Core asset address. Using the asset as the seed binds each escrow to exactly one receipt — no goal_id collisions, no lookup tables. The JS client at [apps/pusd-sundollar/src/solana/juice-escrow-client.js](../../../apps/pusd-sundollar/src/solana/juice-escrow-client.js) derives both PDAs from this same seed pattern.

## Instruction interface

| ix | who can call | what it does |
| --- | --- | --- |
| `initialize_savings(goal_amount, maturity_unix, initial_deposit)` | sender (creator) | opens the escrow, transfers `initial_deposit` into the vault, emits `DepositRecorded` |
| `deposit(amount)` | anyone | tops up an existing escrow; flips `locked_for_creator = true` if `depositor != creator`; emits `DepositRecorded` |
| `claim(amount)` | current NFT holder | verifies asset.owner == claimer via mpl-core deserialization; pre-maturity claims must drain full balance; transfers vault → claimer (PDA-signed) |
| `cancel()` | creator (only while `!locked_for_creator`) | drains vault back to creator, closes vault token account + SavingsAccount, refunds rent |

## Token-2022 support

Done via `anchor-spl::token_interface` — the same instruction routes to either the legacy Token program or Token-2022 based on the `token_program` Interface account passed at call time. PUSD (Token-2022) and USDC (legacy) both work without branching.

The `SavingsAccount.token_program` field is captured at init and enforced on every subsequent deposit/claim/cancel to prevent program-substitution attacks.

## Deploy walkthrough

```bash
cd /Users/ace369/Desktop/caribcryptomap/anchor

# 1. First-time keypair generation. This creates target/deploy/juice_escrow-keypair.json.
anchor build

# 2. Read the program ID and update three places to match.
anchor keys list
# → juice_escrow: <NEW_PUBKEY>

# Then in Cursor / your editor, replace JEscrowJ11111111111111111111111111111111111 with
# the new pubkey in:
#   - anchor/programs/juice_escrow/src/lib.rs       → declare_id!()
#   - anchor/Anchor.toml                             → [programs.devnet] juice_escrow
#   - apps/pusd-sundollar/src/solana/juice-escrow-client.js → JUICE_ESCROW_PROGRAM_ID

# 3. Re-build with the synced ID, then run the test suite locally.
anchor build
anchor test --skip-deploy   # uses the bundled local validator

# 4. Sync Anchor instruction discriminators to the JS client.
# Anchor recomputes sha256("global:<ix_name>")[..8] on every build. The first
# 8 bytes of each instruction in target/idl/juice_escrow.json must match the
# DISCRIMINATORS table in juice-escrow-client.js. If they don't, you'll see
# "instruction error: 0x67" at runtime. Easiest:
#   node -e "console.log(require('./target/idl/juice_escrow.json').instructions.map(i => ({ name: i.name, disc: i.discriminator })))"
# Paste each 8-byte array into DISCRIMINATORS in juice-escrow-client.js.

# 5. Deploy.
anchor deploy --provider.cluster devnet

# 6. Flip the live flag in juice-escrow-client.js:
#   export const JUICE_ESCROW_LIVE = true;

# 7. The SendPanel "Sprint 2" footnote is now load-bearing — wire its UI to
# call buildInitializeSavingsIx + buildDepositIx alongside the existing
# corridor transfer + receipt mint, and the Sprint 1 demo upgrades into the
# full escrow flow.
```

## Test coverage (anchor/tests/juice_escrow.ts)

Happy paths:
- `initialize_savings` opens escrow + initial deposit lands in vault
- creator deposit does NOT flip `locked_for_creator`
- third-party deposit DOES flip `locked_for_creator`
- `claim` by NFT holder transfers vault → claimer
- `cancel` after creator-only deposits drains + closes (TODO)

Error paths:
- `cancel` after locked_for_creator → `EscrowLockedForCreator`
- `claim` by non-holder → `NotReceiptHolder`
- pre-maturity partial claim → `PartialClaimBeforeMaturity` (TODO)
- mismatched mint or token_program in account constraints → constraint failure

## Open decisions still on the table

1. **Maturity penalty model.** Current: pre-maturity claim must drain the full vault. Alternative: pre-maturity partial claims with a fee routed to a Send Juice treasury PDA. Decide before mainnet.
2. **Group-savings hard cap.** The vault has no per-depositor accounting beyond the running total + the `locked_for_creator` flip. If we want the indexer to show a leaderboard of contributors to a goal, we need either an off-chain index keyed off `DepositRecorded` events, or a fixed-size `[Pubkey; N]` `top_depositors` array on `SavingsAccount`. Defaulting to off-chain.
3. **mpl-core ownership check via CPI vs direct deserialization.** Current: direct deserialization of `BaseAssetV1` from the asset account data. Alternative: CPI into mpl-core's `assert_ownership` helper. Direct deserialization is faster and the mpl-core layout is stable across v1.x; we accept the implicit dependency on Core's serialization contract.

## Why the seed strings + struct layout are load-bearing

The Sprint 1 client at [apps/pusd-sundollar/src/solana/juice-escrow-client.js](../../../apps/pusd-sundollar/src/solana/juice-escrow-client.js) is wired to:
- Derive `SavingsAccount` and `vault` PDAs from `[b"juice-savings", asset]` and `[b"juice-savings-vault", asset]`
- Decode `SavingsAccount` data positionally (after the 8-byte Anchor discriminator)

If you rename a seed string OR reorder fields in `state.rs`, every receipt minted under the previous layout becomes orphaned — the client can't find them, can't decode them. Bump the program version (and ideally the seed prefix) when migrating.
