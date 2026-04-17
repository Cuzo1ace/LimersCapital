# B3 Design Amendment — LP Token Metadata (deferred)

**Status:** Designed, not deployed. Metadata JSONs ready at `public/metadata/lp-*.json`.
**Blocker:** Requires a new admin-gated `create_lp_metadata` instruction on `limer_amm`, which means a program upgrade (`anchor upgrade`). Deferred until post-Colosseum because upgrading a deployed program mid-sprint carries non-zero regression risk in the swap/deposit/withdraw paths.

---

## Why this is blocked on a program upgrade

LP mints are created at `initialize_pool` with `mint_authority = pool_authority` PDA and seeded at `[b"lp_mint", pool.key().as_ref()]`. Metaplex Token Metadata's `CreateMetadataAccountV3` instruction requires the `mint_authority` of the target mint to sign. Since a PDA can only sign via `invoke_signed` from inside our program, no external caller (founder keypair, multisig, etc.) can attach metadata.

## Planned instruction (Rust skeleton)

```rust
/// Admin-gated. Creates the Metaplex Token Metadata PDA for a pool's
/// LP mint. Only callable once per pool (CreateMetadataAccountV3 fails
/// if the metadata PDA already exists — acts as a natural idempotency
/// guard). `update_authority` is set to the AMM admin, so future
/// metadata edits can happen without another program upgrade.
pub fn create_lp_metadata(
    ctx: Context<CreateLpMetadata>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    require!(name.len() <= 32, AmmError::NameTooLong);
    require!(symbol.len() <= 10, AmmError::SymbolTooLong);
    require!(uri.len() <= 200, AmmError::UriTooLong);

    let pool_key = ctx.accounts.pool.key();
    let seeds = &[
        POOL_AUTHORITY_SEED,
        pool_key.as_ref(),
        &[ctx.accounts.pool.authority_bump],
    ];
    let signer = &[&seeds[..]];

    // CPI into mpl-token-metadata's CreateMetadataAccountV3
    let cpi_accounts = mpl_token_metadata::instructions::CreateMetadataAccountV3CpiAccounts {
        metadata: ctx.accounts.metadata.to_account_info(),
        mint: ctx.accounts.lp_mint.to_account_info(),
        mint_authority: ctx.accounts.pool_authority.to_account_info(),
        payer: ctx.accounts.admin.to_account_info(),
        update_authority: (ctx.accounts.admin.to_account_info(), true),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: Some(ctx.accounts.rent.to_account_info()),
    };
    let cpi_args = mpl_token_metadata::instructions::CreateMetadataAccountV3InstructionArgs {
        data: mpl_token_metadata::types::DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        is_mutable: true,
        collection_details: None,
    };
    mpl_token_metadata::instructions::CreateMetadataAccountV3Cpi::new(
        &ctx.accounts.token_metadata_program.to_account_info(),
        cpi_accounts,
        cpi_args,
    )
    .invoke_signed(signer)?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateLpMetadata<'info> {
    #[account(
        seeds = [AMM_CONFIG_SEED],
        bump = amm_config.bump,
        has_one = admin,
    )]
    pub amm_config: Account<'info, AmmConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub pool: Account<'info, Pool>,

    /// CHECK: PDA authority; no data.
    #[account(
        seeds = [POOL_AUTHORITY_SEED, pool.key().as_ref()],
        bump = pool.authority_bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    #[account(mut, address = pool.lp_mint)]
    pub lp_mint: Account<'info, Mint>,

    /// CHECK: derived + created by mpl-token-metadata's CreateMetadataAccountV3
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: program constant
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
```

## Matching error codes to add to `errors.rs`

```rust
#[msg("LP metadata name must be ≤ 32 bytes.")]
NameTooLong,
#[msg("LP metadata symbol must be ≤ 10 bytes.")]
SymbolTooLong,
#[msg("LP metadata URI must be ≤ 200 bytes.")]
UriTooLong,
```

## New Cargo.toml dep

```toml
mpl-token-metadata = { version = "5.1", features = ["no-entrypoint"] }
```

Adds ~50–80 KB to the compiled program binary. Well within the 10 MB upper limit.

## Upgrade procedure (when we're ready, ~45 min)

1. Add the instruction + error codes to the program source.
2. `anchor build` (from workspace root). Verify no stack overflow on the new context.
3. `anchor upgrade target/deploy/limer_amm.so --program-id FVk7LzdZ976beSEJkdXD5ww1xRxpZpYjxodN9Kq1Bpwo --provider.cluster devnet`
4. Verify on-chain: `solana program show FVk7LzdZ…` — `Last Deployed In Slot` should advance.
5. Run `scripts/amm/attach-lp-metadata.ts` (below) to call `create_lp_metadata` once per pool.
6. Verify in Solflare: LP tokens now display as "Limer LP mTTDC/mNEL" etc.

## TS script (pre-written, ready to run after upgrade)

See `scripts/amm/attach-lp-metadata.ts` (will be added alongside this doc). For each of the 6 pools, it:
- Derives the metadata PDA: `["metadata", MPL_TOKEN_METADATA_PROGRAM_ID, lp_mint]`
- Calls `program.methods.createLpMetadata(name, symbol, uri).accounts({...}).rpc()`
- Skips if metadata PDA already exists (idempotent)
- Records tx sigs to `src/solana/generated/amm-pools.json`

## Risk if we upgrade now vs. post-Colosseum

- **Regression risk:** program upgrade replaces bytecode. If the new code has a bug in the swap path (unlikely since we don't touch it), existing pools become unusable until another upgrade.
- **State compatibility:** no state schema change — Pool and AmmConfig layouts stay identical. Upgrade is purely additive.
- **Rent:** program rent is already locked at 2.85 SOL; `anchor upgrade` only pays per-instruction gas (~0.0001 SOL).
- **Colosseum demo impact:** LP tokens currently show as "Unknown Token" in wallets. Judges looking at wallet screenshots notice. Fixing this is a polish item, not a functional blocker.

## Decision matrix for when to ship B3

| Condition | Action |
|---|---|
| Colosseum demo video being recorded | Ship the upgrade (LP tokens in wallet shots look pro) |
| Active pitch meetings with Kamino/DFlow | Ship (Kamino listing review expects metadata) |
| Normal development week | Defer — work on higher-priority items |
| Post-Colosseum, before mainnet | **Ship as part of the mainnet deploy sprint** (bundled with multisig migration + full program re-audit) |
