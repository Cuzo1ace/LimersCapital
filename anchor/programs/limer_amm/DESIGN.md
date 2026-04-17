# `limer_amm` — AMM Design Document

**Status:** Design only — program not yet implemented.
**Target implementation:** Phase B2 in `project_devnet_roadmap.md`.
**Audience:** The person writing the Rust (probably me next turn, possibly you), the person reviewing before deploy, and the Superteam bounty reviewer evaluating Kamino/DFlow/Solflare composability.

---

## 1. Why a custom AMM (vs. forking Raydium or Orca)

**Option considered:** Deploy a thin program that CPIs into Raydium v4 or Orca Whirlpools on devnet.

**Chosen path:** Custom minimal constant-product AMM (~200 lines of Rust).

Rationale:
- **Pedagogical clarity for the pitch.** "We wrote our own DeFi primitive" is a stronger narrative for Colosseum judges than "we wrapped Raydium." A 200-line Anchor program is reviewable in a live demo.
- **Zero external program dependencies.** On devnet, Raydium and Orca program addresses, pool registries, and liquidity state are unstable. Our own program means our demo doesn't break when upstream devnet programs churn.
- **LP token sovereignty.** We own the LP mint metadata and can design it specifically for Kamino listing eligibility. Raydium LP tokens have their own metadata patterns that may not match Kamino's expectations.
- **Audit scope control.** When we eventually security-audit this platform, a 200-line program is auditable for ~$3-5K. A Raydium wrap + custom logic is harder to scope.

**Trade-off accepted:** No concentrated liquidity, no smart order routing, no oracle-priced pools. We're building a Uniswap-v2-style AMM, not a Uniswap-v3 or Curve StableSwap. That's fine for the scope — we're not competing with Raydium on liquidity depth; we're providing programmable composable primitives for our specific assets.

## 2. Pool architecture

6 pools total:

| Pool ID | Token A | Token B | Purpose |
|---|---|---|---|
| POOL_WCO | mWCO | mTTDC | Local stock / local stable — primary trading |
| POOL_NEL | mNEL | mTTDC | Local stock / local stable — primary trading |
| POOL_RFHL | mRFHL | mTTDC | Local stock / local stable — primary trading |
| POOL_GKC | mGKC | mTTDC | Local stock / local stable — primary trading |
| POOL_NGL | mNGL | mTTDC | Local stock / local stable — primary trading |
| POOL_TTDC_SOL | mTTDC | wSOL | Bridge — users arrive with SOL, swap to mTTDC to trade local stocks |

**Convention:** Token A is the "base" (non-quote) asset by convention. For mStock pools, base = mStock. For the bridge pool, base = mTTDC.

**Why not USDC pools?** Circle's devnet USDC faucet rate-limits prevent seeding with meaningful depth (see earlier scope analysis). Jupiter will route `USDC → mTTDC → mStock` via the bridge pool + future `mTTDC/USDC` pool on mainnet. For devnet, SOL is the onramp.

**Why no direct mStock/SOL pools?** Fragments liquidity for no real gain. If a user arrives with SOL and wants mNEL, Jupiter (or our own in-app router) can route `SOL → mTTDC → mNEL` in a single user signature with two hops. The user experience is identical — just one pool creation for us to save.

## 3. Account structure

### `Pool` account (PDA)

Per-pool state. Seeded with `[b"pool", token_a_mint.as_ref(), token_b_mint.as_ref()]` so the pool address is deterministic and queryable by mint pair.

```rust
#[account]
pub struct Pool {
    pub bump: u8,
    pub authority_bump: u8,        // bump for the pool_authority PDA
    pub token_a_mint: Pubkey,      // 32
    pub token_b_mint: Pubkey,      // 32
    pub token_a_vault: Pubkey,     // 32 — PDA ATA owned by pool_authority
    pub token_b_vault: Pubkey,     // 32
    pub lp_mint: Pubkey,           // 32 — LP mint, authority = pool_authority PDA
    pub fee_bps: u16,              // 30 = 0.30% swap fee (Uniswap v2 default)
    pub total_lp_supply: u64,      // 8 — tracked locally for math; authoritative value is on the mint
    pub created_at: i64,           // 8
    pub reserved: [u8; 64],        // 64 — future fields without migration
}
// size: 1 + 1 + 32×5 + 2 + 8 + 8 + 64 = 244 bytes + 8 discriminator = 252
```

### `pool_authority` PDA (signer-only, no data)

Seeded with `[b"authority", pool.key().as_ref()]`. Owns the token vaults and is the mint authority for the LP mint. Enables the program to `invoke_signed` for transfers out of vaults and LP mints/burns.

### Token vaults

Each pool holds two SPL token accounts (one per side), owned by the `pool_authority` PDA. Created at pool initialization via `init` on the account struct.

### LP mint

One fresh SPL token mint per pool, `mint_authority = pool_authority`, `freeze_authority = None` (non-negotiable for Kamino compatibility). 9 decimals (standard for LP tokens — enables fine-grained share accounting).

## 4. Constant-product math (x*y=k)

**Swap formula** (input A, output B, with fee):

```
fee_numerator = 10_000 - fee_bps  // e.g. 9_970 for 30 bps fee
amount_in_with_fee = amount_in * fee_numerator / 10_000
amount_out = (reserve_b * amount_in_with_fee) / (reserve_a + amount_in_with_fee)
```

The fee stays in the pool vault, which grows the LP share value over time. This is the Uniswap v2 convention — no separate fee sweep.

**Deposit formula** (first deposit):

```
lp_tokens_minted = sqrt(amount_a * amount_b) - MINIMUM_LIQUIDITY
// MINIMUM_LIQUIDITY = 10^3 (tokens permanently locked to prevent the
// "donate 1 token, steal the pool" first-deposit attack — see §9)
```

**Deposit formula** (subsequent, given existing reserves):

```
lp_tokens_minted = min(
  amount_a * total_lp_supply / reserve_a,
  amount_b * total_lp_supply / reserve_b
)
```

The `min` ensures deposits preserve the pool ratio; any excess of one side is left with the depositor.

**Withdraw formula**:

```
amount_a_out = lp_burned * reserve_a / total_lp_supply
amount_b_out = lp_burned * reserve_b / total_lp_supply
```

## 5. Instructions

### `initialize_pool(fee_bps: u16)`

- **Permissions:** Signer must match the AMM's `admin` pubkey stored in a global `AmmConfig` account (for now, this is the founder EOA; will migrate to the devnet Squads vault at Phase A1.5 resumption).
- **Arguments:** `fee_bps` — swap fee in basis points. Default 30 (0.30%). Capped at 100 (1%) via an assertion.
- **Effect:** Creates the Pool PDA, creates both vaults (ATAs owned by pool_authority), creates the LP mint with pool_authority as mint authority and freeze = None.
- **Pre-conditions:** `token_a_mint != token_b_mint`; neither can be the zero pubkey; pool must not already exist.
- **Post-conditions:** Pool is created empty (0 reserves, 0 LP supply). Ready for first `deposit_liquidity`.

### `deposit_liquidity(amount_a_max: u64, amount_b_max: u64, min_lp_out: u64)`

- **Permissions:** Anyone with balances of both tokens.
- **Effect:** Transfers tokens from user to vaults, mints LP tokens to user's LP ATA.
- **Slippage protection:** `min_lp_out` — if computed LP < min_lp_out, revert. User sets this based on expected price at submit time.
- **First deposit locks MINIMUM_LIQUIDITY LP tokens forever** — protects against the classic "first depositor manipulation" attack.

### `withdraw_liquidity(lp_amount: u64, min_a_out: u64, min_b_out: u64)`

- **Permissions:** Anyone holding LP tokens.
- **Effect:** Burns LP tokens from user, transfers pro-rata share of both reserves.
- **Slippage protection:** `min_a_out`, `min_b_out` — revert if computed amounts are less. Protects against withdrawing at a bad moment.

### `swap(amount_in: u64, min_amount_out: u64, direction: u8)`

- **Permissions:** Anyone with the input token.
- **Arguments:** `amount_in` — exact input amount. `min_amount_out` — slippage bound. `direction` — 0 = A→B, 1 = B→A.
- **Effect:** Applies fee, runs constant-product math, transfers output to user.
- **Slippage protection:** `min_amount_out` — revert if math produces less.
- **Rejects:** if `amount_out < 1` (pool too shallow), or if a reserve would go to zero (ditto).

### `(Phase 2, out of scope for now)` — `admin` instructions

- `pause_pool(pool: Pubkey)` — halts swaps and deposits; withdrawals still permitted (exit window).
- `update_fee(pool: Pubkey, new_fee_bps: u16)` — requires admin sig + timelock.
- `migrate_admin(new_admin: Pubkey)` — transfer admin rights to a multisig PDA.

Not implemented in v1. Admin changes require a program upgrade until these ship.

## 6. LP token design (for Kamino compatibility)

Kamino's permissionless lending markets have unwritten but consistent expectations for listable tokens:

1. **Metaplex Token Metadata attached** ✓ we add this at pool init
2. **Freeze authority = None** ✓ we set this at LP mint creation
3. **Mint authority = a PDA (not an EOA)** ✓ our `pool_authority` PDA owns the LP mint
4. **Sufficient liquidity on at least one mainnet DEX** ⚠ devnet: N/A; mainnet: initially a blocker we'll solve with seeded pools at launch
5. **Stable name/symbol** ✓ pattern: `LP-<TICKER_A>-<TICKER_B>` (must be ≤10 chars) — see below

**LP token naming:**

| Pool | LP symbol | LP name |
|---|---|---|
| POOL_WCO | `LP-WCO` | `Limer LP WCO/TTDC` |
| POOL_NEL | `LP-NEL` | `Limer LP NEL/TTDC` |
| POOL_RFHL | `LP-RFHL` | `Limer LP RFHL/TTDC` |
| POOL_GKC | `LP-GKC` | `Limer LP GKC/TTDC` |
| POOL_NGL | `LP-NGL` | `Limer LP NGL/TTDC` |
| POOL_TTDC_SOL | `LP-SOL` | `Limer LP TTDC/SOL` |

Symbol dropping "m" prefix and one side to stay within the 10-char Metaplex cap. Name is ≤ 32 chars.

**LP metadata JSON** (one per pool, hosted at `public/metadata/lp-<pool>.json`): same disclaimer block as our tokens, plus `"properties": { "category": "fungible" }` and attributes listing the underlying pool PDA, token pair, and fee tier.

## 7. Pyth / oracle strategy

**The problem:** Kamino wants a price feed per collateral asset. Pyth has feeds for SOL, USDC, BTC, major crypto, and a growing set of tokenized equities (xStocks AAPL, NVDA, etc.). **Pyth does NOT have feeds for mTTDC, mWCO, mNEL, mRFHL, mGKC, mNGL** — because these are our mocks.

**Options considered:**

1. **Wait for permissionless Pyth publishers.** Not happening on our timeline; Pyth permissionless publishing is whitelist-controlled.
2. **Deploy our own oracle program.** Too much scope.
3. **Publish AMM-implied prices via a tiny "price view" account.** Read the pool reserves, compute `price_a_in_b = reserve_b / reserve_a`, expose as a fetchable account. Not a proper oracle (manipulable, stale), but a Kamino adapter could read it for devnet demo.
4. **Hardcoded TTD-to-USD conversion + AMM-implied mStock prices in TTD.** Our AMM gives `mStock_in_mTTDC` price; a constant `~6.79 TTD/USD` (from `src/api/ttse.js`) converts to USD. Simple, demo-grade, not production.

**Decision:** **Option 3 for devnet demo, Option 4 as UI fallback.** We add a read-only instruction `get_implied_price(pool: Pubkey)` to `limer_amm` that returns `(reserve_a, reserve_b, last_update_slot)`. Document how a Kamino-compatible oracle adapter would consume this. For real mainnet lending, we commit to either getting Pyth to list our tokens OR partnering with an oracle provider (Switchboard has more permissive publishing). This is a P0 follow-up.

**What this means for the bounty narrative:** "We have a documented oracle strategy; devnet exposes AMM-implied prices; mainnet requires Pyth/Switchboard partnership which we can pursue post-Colosseum."

## 8. Jupiter / DFlow routing

**Jupiter devnet:** unreliable. We will not rely on it for the demo.

**In-app routing:** For mainnet-realistic multi-hop swaps on devnet (e.g., `SOL → mTTDC → mNEL`), our frontend chains two direct `swap` instructions into one transaction. Two hops, two vault transfers, one user signature. This is transparent to the user — the UI shows "You pay X SOL, you receive Y mNEL" and signs one tx.

**DFlow integration:** DFlow's SDK lets liquidity providers register as RFQ makers. For devnet, we don't register (their devnet infra is also unreliable). For mainnet, after we seed pools with real liquidity, we submit an RFQ maker registration pointing at our AMM addresses.

**Jupiter mainnet integration (post-Colosseum):** Submit a pool-registration PR to the Jupiter token list repo. Once merged, Jupiter routes through our pools automatically.

**Deliverable for the bounty:** A `docs/integrations/jupiter-dflow-plan.md` (separate, not blocking B2) that documents the exact submission process for each.

## 9. Security considerations

### Integer overflow

All math uses `checked_*` on u64/u128. Intermediate calculations for `sqrt(a*b)` widen to `u128` to prevent overflow for large reserves. A final `u64` check rejects results too large to represent.

### First-deposit manipulation

Classic attack: first depositor puts in 1 unit of each side, gets all LP. Attacker then donates 1 billion tokens to the pool, making each LP share worth 500M. Legitimate depositors get 0 LP for reasonable deposits (rounding to zero).

**Mitigation:** `MINIMUM_LIQUIDITY = 1_000` — the first deposit locks 1,000 LP tokens permanently (sent to a burn address or the pool itself). This makes the exploit cost more than it returns.

### Rounding against the pool

All math rounds in favor of the pool, against the user, on every operation:
- Swaps: `amount_out` rounds down
- Deposits: `lp_tokens_minted` rounds down
- Withdrawals: `amount_a_out`, `amount_b_out` round down

This prevents dust-accumulation exploits where rounding-up would let an attacker extract reserves over millions of tiny trades.

### Sandwich / MEV

A sandwich attacker front-runs a user's `swap` with their own `swap` in the same direction, then back-runs with the opposite. User eats the price movement. Standard AMM problem.

**Devnet mitigation:** `min_amount_out` slippage bound. User sets tight bound; attack becomes unprofitable if slippage is tight.

**Mainnet mitigation (future):** private mempool via Jito bundles, or MEV redistribution (Uniswap v4 hooks-style). Out of scope for v1.

### Reentrancy

Solana's account model + sequential IX execution make classic reentrancy less of a concern than on EVM. We don't CPI into untrusted programs during swap/deposit/withdraw. Token program CPIs are trusted.

### Oracle manipulation (if we later add TWAP)

Not applicable to v1 — we don't use our AMM's price as a canonical reference. If a future `oracle_view` instruction exposes price, callers must implement their own TWAP smoothing (Kamino already does this).

### Freeze authority backdoor

Explicitly checked at pool initialization: the LP mint's freeze authority is set to None. An assertion verifies both pool tokens' freeze authorities are also None — rejecting any deposit of a token that still has freeze authority. This prevents a malicious token issuer from freezing pool reserves.

## 10. Admin governance

**Current state:** single `admin` pubkey (founder EOA) stored in a global `AmmConfig` account. Admin can:
- `initialize_pool` (anyone shouldn't be able to create pools at will — see §11)
- Future: pause, update fee, migrate admin

**Migration path:**
- Phase A1.5 resumption: admin migrates to the devnet Squads vault (PDA). `invoke_signed` pattern, same as the mTTDC mint authority migration.
- Mainnet deploy: admin starts as the mainnet Squads vault from tx 0. No interim single-signer.

## 11. Permissioned vs. permissionless pool creation

**Option A — permissioned (chosen for v1):** only admin can call `initialize_pool`. Prevents griefing (anyone creating confusing clone pools for the same token pair).

**Option B — permissionless:** anyone can create a pool for any token pair. Matches Uniswap v2 culture. Grief vector: attacker creates `mNEL/<scam-token>` pool, users confuse with `mNEL/mTTDC`.

**v1 chooses A.** v2 can flip to B with a rate-limit + unique-pair constraint (one pool per token-pair, first-come-first-served).

## 12. Program structure (files to create in Phase B2)

```
anchor/programs/limer_amm/
├── Cargo.toml
├── Xargo.toml           (if needed by Anchor 0.30.x for sbf target)
├── DESIGN.md            (this document)
└── src/
    ├── lib.rs           — #[program] with the 4 instructions
    ├── state.rs         — Pool, AmmConfig structs
    ├── math.rs          — pure constant-product math + sqrt
    ├── errors.rs        — custom error codes
    └── events.rs        — #[event] structs for SwapExecuted, LiquidityAdded, etc.
```

Estimated LOC: `lib.rs` ~100, `math.rs` ~60, `state.rs` ~40, `errors.rs` ~30, `events.rs` ~30 → **~260 lines** of Rust.

## 13. Testing strategy (Phase B2f)

### Unit tests (math.rs)

Pure-function tests for:
- Swap amount_out for various (reserve, input, fee) combinations
- sqrt for edge cases (0, 1, u64::MAX)
- LP mint amount for first deposit vs. subsequent deposits
- Withdrawal amounts for various LP burn amounts

### Integration tests (tests/limer-amm.ts)

TypeScript tests using `@coral-xyz/anchor`:
- Full lifecycle: initialize_pool → deposit_liquidity (first) → deposit_liquidity (second) → swap → withdraw_liquidity
- Rejection tests: swap below min_amount_out, deposit below min_lp_out, withdraw below min_out
- Authority tests: non-admin cannot initialize_pool
- First-deposit-attack reproduction test: verify MINIMUM_LIQUIDITY lock actually prevents exploitation
- Freeze-authority rejection test: deposit a token with freeze authority fails at initialize_pool

## 14. Deployment plan (Phase B2f)

1. `anchor build` → produces `limer_amm.so`
2. Generate fresh program keypair: `solana-keygen new -o anchor/target/deploy/limer_amm-keypair.json`
3. Update `declare_id!` in `lib.rs` to match
4. `anchor deploy --provider.cluster devnet` — deploys with founder's keypair as upgrade authority (same caveat as `limer` program; migrate to multisig post-Colosseum per `SECURITY_MODEL.md`)
5. Write deployment record to `docs/program-upgrade-log.md`
6. Initialize `AmmConfig` with founder as admin
7. Initialize 6 pools via `initialize_pool` calls — one per pair
8. Seed each pool with initial liquidity (Phase B4)
9. Write pool pubkeys + LP mint pubkeys to `src/solana/generated/amm-pools.json`

## 15. Out of scope for this AMM

- Concentrated liquidity (Uniswap v3 / Orca Whirlpools style)
- Stable pools (Curve StableSwap math)
- Multi-hop routing (frontend composes two swaps into one tx)
- Oracle-enforced pricing (AMM price is AMM price)
- Flash loans
- LP fee tiers (all pools have one fee: 30 bps)
- Governance voting (admin = pubkey, no DAO in v1)
- Incentives / liquidity mining (no program-level bribes; can be layered via a separate rewards program later)

## 16. Open questions (answer before writing Rust)

1. **Token order in pool seeds.** Should we enforce a canonical order (e.g., lexicographic sort of mint pubkeys) to prevent creating the same pool twice with reversed A/B? **Decision: yes, canonical sort by mint pubkey at initialization.** Allows `getProgramAccounts`-style lookup without knowing which side is A.

2. **Do we store `last_update_slot` on Pool?** Useful for Kamino-compatible oracle adapters but adds 8 bytes per account. **Decision: yes, cheap and required for the oracle strategy in §7.**

3. **LP mint freeze authority — leave as None forever, or allow future governance?** **Decision: None forever.** Changing later would require a program upgrade + wallet migration. Design for immutability.

4. **MINIMUM_LIQUIDITY value.** Uniswap v2 uses `10^3`. For 9-decimal LP tokens, that's `0.000001` LP tokens locked — negligible. **Decision: 10^3 (1_000).**

5. **Admin can pause / unpause pools?** Not in v1 (listed as Phase 2 above). **Decision: defer. Documented as known-gap.**

---

*This document is frozen for Phase B2 implementation. Any deviation during coding must be justified with an amendment here, not silently in Rust.*
