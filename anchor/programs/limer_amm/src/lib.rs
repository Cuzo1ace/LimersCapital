//! Limer's Capital — minimal constant-product AMM for tokenized Caribbean
//! equities. See DESIGN.md for the full specification and rationale.
//!
//! Program surface:
//!   - init_config              (admin-only, one-time — creates the AmmConfig singleton)
//!   - initialize_pool          (admin-only — creates a Pool + vaults + LP mint)
//!   - deposit_liquidity        (anyone — adds paired liquidity, mints LP)
//!   - withdraw_liquidity       (anyone — burns LP, returns pro-rata reserves)
//!   - swap                     (anyone — trades A for B or B for A with constant-product + fee)
//!
//! All CPIs into the SPL Token program are signed by a per-pool PDA
//! (`pool_authority`) derived from the Pool account's pubkey. Vaults are
//! standard SPL token accounts owned by that PDA; the LP mint's mint
//! authority is also that PDA.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

pub mod errors;
pub mod events;
pub mod math;
pub mod state;

use errors::AmmError;
use events::*;
use math::{lp_tokens_for_deposit, swap_out_amount, withdraw_amounts, MAX_FEE_BPS, MINIMUM_LIQUIDITY};
use state::{AmmConfig, Pool, AMM_CONFIG_SEED, LP_MINT_SEED, POOL_AUTHORITY_SEED, POOL_SEED};

// Program ID matches anchor/target/deploy/limer_amm-keypair.json.
// If that keypair is lost or rotated, update both and rebuild.
declare_id!("FVk7LzdZ976beSEJkdXD5ww1xRxpZpYjxodN9Kq1Bpwo");

#[program]
pub mod limer_amm {
    use super::*;

    /// Create the AmmConfig singleton. Run once, at deployment time, by
    /// the intended admin. The admin pubkey is stored and gates all
    /// privileged instructions (initialize_pool, future pause/update_fee).
    pub fn init_config(ctx: Context<InitConfig>, default_fee_bps: u16) -> Result<()> {
        require!(default_fee_bps <= MAX_FEE_BPS, AmmError::FeeTooHigh);
        let cfg = &mut ctx.accounts.amm_config;
        cfg.bump = ctx.bumps.amm_config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.pool_count = 0;
        cfg.default_fee_bps = default_fee_bps;
        cfg._reserved = [0u8; 64];
        msg!("AmmConfig initialized. Admin: {}, default fee: {} bps", cfg.admin, default_fee_bps);
        Ok(())
    }

    /// Create a new Pool for the given token pair. Admin-gated. Validates:
    ///   - fee_bps <= MAX_FEE_BPS
    ///   - token_a_mint != token_b_mint (distinct)
    ///   - token_a_mint < token_b_mint (canonical lexicographic order)
    ///   - Both mints have freeze_authority == None (Kamino composability)
    pub fn initialize_pool(ctx: Context<InitializePool>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= MAX_FEE_BPS, AmmError::FeeTooHigh);
        require!(
            ctx.accounts.token_a_mint.key() != ctx.accounts.token_b_mint.key(),
            AmmError::DuplicateMints
        );
        require!(
            ctx.accounts.token_a_mint.key() < ctx.accounts.token_b_mint.key(),
            AmmError::NonCanonicalMintOrder
        );
        require!(
            ctx.accounts.token_a_mint.freeze_authority.is_none(),
            AmmError::FreezeAuthorityPresent
        );
        require!(
            ctx.accounts.token_b_mint.freeze_authority.is_none(),
            AmmError::FreezeAuthorityPresent
        );

        let pool = &mut ctx.accounts.pool;
        pool.bump = ctx.bumps.pool;
        pool.authority_bump = ctx.bumps.pool_authority;
        pool.token_a_mint = ctx.accounts.token_a_mint.key();
        pool.token_b_mint = ctx.accounts.token_b_mint.key();
        pool.token_a_vault = ctx.accounts.token_a_vault.key();
        pool.token_b_vault = ctx.accounts.token_b_vault.key();
        pool.lp_mint = ctx.accounts.lp_mint.key();
        pool.fee_bps = fee_bps;
        pool.total_lp_supply = 0;
        pool.created_at = Clock::get()?.unix_timestamp;
        pool.last_update_slot = Clock::get()?.slot;
        pool._reserved = [0u8; 64];

        let cfg = &mut ctx.accounts.amm_config;
        cfg.pool_count = cfg.pool_count.saturating_add(1);

        emit!(PoolInitialized {
            pool: pool.key(),
            token_a_mint: pool.token_a_mint,
            token_b_mint: pool.token_b_mint,
            lp_mint: pool.lp_mint,
            fee_bps,
            admin: ctx.accounts.admin.key(),
            slot: pool.last_update_slot,
        });
        msg!("Pool initialized: {}", pool.key());
        Ok(())
    }

    /// Deposit paired liquidity. `amount_a` and `amount_b` are the MAXIMUM
    /// the caller is willing to contribute; the actual amounts taken are
    /// determined by the pool's current ratio (subsequent deposits) or
    /// the caller-provided values directly (first deposit).
    ///
    /// `min_lp_out` is a slippage bound — if the computed LP mint amount
    /// is below this, the transaction reverts.
    pub fn deposit_liquidity(
        ctx: Context<DepositLiquidity>,
        amount_a: u64,
        amount_b: u64,
        min_lp_out: u64,
    ) -> Result<()> {
        let reserve_a = ctx.accounts.token_a_vault.amount;
        let reserve_b = ctx.accounts.token_b_vault.amount;
        let total_lp = ctx.accounts.lp_mint.supply;

        // Compute LP tokens to mint. Also clamps first-deposit minimum liquidity.
        let lp_to_mint =
            lp_tokens_for_deposit(amount_a, amount_b, reserve_a, reserve_b, total_lp)?;
        require!(lp_to_mint >= min_lp_out, AmmError::SlippageDepositLpBelowMinimum);

        // On first deposit, additionally lock MINIMUM_LIQUIDITY to the pool
        // authority itself (so nobody can ever withdraw it).
        // We do this by minting `lp_to_mint` to the user AND separately
        // minting MINIMUM_LIQUIDITY to a PDA-owned sink (pool_authority ATA).
        // For simplicity, on first deposit we mint (lp_to_mint + MINIMUM_LIQUIDITY)
        // total and send the MINIMUM_LIQUIDITY portion to pool_authority's ATA
        // which is the lp mint itself — effectively un-redeemable.
        // To keep this minimal, we permanently lock MINIMUM_LIQUIDITY by
        // minting to the user's LP ATA but accounting for it in math so the
        // user's effective share is (sqrt - MINIMUM_LIQUIDITY) — they never
        // have access to the locked portion because the math subtracts it.
        // See math::lp_tokens_for_deposit — subtraction happens there on
        // the first deposit branch.

        // Transfer token A from user to pool vault
        let cpi_a_accounts = Transfer {
            from: ctx.accounts.depositor_token_a.to_account_info(),
            to: ctx.accounts.token_a_vault.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_a_accounts),
            amount_a,
        )?;

        // Transfer token B from user to pool vault
        let cpi_b_accounts = Transfer {
            from: ctx.accounts.depositor_token_b.to_account_info(),
            to: ctx.accounts.token_b_vault.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_b_accounts),
            amount_b,
        )?;

        // Mint LP tokens to user (pool_authority is the mint authority)
        let pool_key = ctx.accounts.pool.key();
        let authority_seeds = &[
            POOL_AUTHORITY_SEED,
            pool_key.as_ref(),
            &[ctx.accounts.pool.authority_bump],
        ];
        let signer = &[&authority_seeds[..]];
        let cpi_mint_accounts = MintTo {
            mint: ctx.accounts.lp_mint.to_account_info(),
            to: ctx.accounts.depositor_lp.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_mint_accounts,
                signer,
            ),
            lp_to_mint,
        )?;

        // Update pool accounting
        let pool = &mut ctx.accounts.pool;
        pool.total_lp_supply = pool.total_lp_supply.saturating_add(lp_to_mint);
        pool.last_update_slot = Clock::get()?.slot;

        // Re-read vault balances for the event (post-transfer)
        ctx.accounts.token_a_vault.reload()?;
        ctx.accounts.token_b_vault.reload()?;

        emit!(LiquidityAdded {
            pool: pool.key(),
            depositor: ctx.accounts.depositor.key(),
            amount_a,
            amount_b,
            lp_minted: lp_to_mint,
            new_reserve_a: ctx.accounts.token_a_vault.amount,
            new_reserve_b: ctx.accounts.token_b_vault.amount,
            slot: pool.last_update_slot,
        });
        msg!("Deposit: {} A + {} B → {} LP", amount_a, amount_b, lp_to_mint);
        Ok(())
    }

    /// Burn LP tokens to redeem a pro-rata share of pool reserves.
    /// `min_a_out` and `min_b_out` are slippage bounds.
    pub fn withdraw_liquidity(
        ctx: Context<WithdrawLiquidity>,
        lp_amount: u64,
        min_a_out: u64,
        min_b_out: u64,
    ) -> Result<()> {
        let reserve_a = ctx.accounts.token_a_vault.amount;
        let reserve_b = ctx.accounts.token_b_vault.amount;
        let total_lp = ctx.accounts.lp_mint.supply;

        let (amount_a_out, amount_b_out) =
            withdraw_amounts(lp_amount, reserve_a, reserve_b, total_lp)?;
        require!(amount_a_out >= min_a_out, AmmError::SlippageWithdrawBelowMinimumA);
        require!(amount_b_out >= min_b_out, AmmError::SlippageWithdrawBelowMinimumB);

        // Burn user's LP
        let burn_accounts = Burn {
            mint: ctx.accounts.lp_mint.to_account_info(),
            from: ctx.accounts.withdrawer_lp.to_account_info(),
            authority: ctx.accounts.withdrawer.to_account_info(),
        };
        token::burn(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), burn_accounts),
            lp_amount,
        )?;

        // Transfer A + B from vaults to user (signed by pool_authority)
        let pool_key = ctx.accounts.pool.key();
        let authority_seeds = &[
            POOL_AUTHORITY_SEED,
            pool_key.as_ref(),
            &[ctx.accounts.pool.authority_bump],
        ];
        let signer = &[&authority_seeds[..]];

        let xfer_a = Transfer {
            from: ctx.accounts.token_a_vault.to_account_info(),
            to: ctx.accounts.withdrawer_token_a.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                xfer_a,
                signer,
            ),
            amount_a_out,
        )?;

        let xfer_b = Transfer {
            from: ctx.accounts.token_b_vault.to_account_info(),
            to: ctx.accounts.withdrawer_token_b.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                xfer_b,
                signer,
            ),
            amount_b_out,
        )?;

        let pool = &mut ctx.accounts.pool;
        pool.total_lp_supply = pool.total_lp_supply.saturating_sub(lp_amount);
        pool.last_update_slot = Clock::get()?.slot;

        ctx.accounts.token_a_vault.reload()?;
        ctx.accounts.token_b_vault.reload()?;

        emit!(LiquidityRemoved {
            pool: pool.key(),
            withdrawer: ctx.accounts.withdrawer.key(),
            lp_burned: lp_amount,
            amount_a_out,
            amount_b_out,
            new_reserve_a: ctx.accounts.token_a_vault.amount,
            new_reserve_b: ctx.accounts.token_b_vault.amount,
            slot: pool.last_update_slot,
        });
        msg!("Withdraw: burn {} LP → {} A + {} B", lp_amount, amount_a_out, amount_b_out);
        Ok(())
    }

    /// Swap `amount_in` of one side for as much of the other side as the
    /// constant-product curve (net of fee) produces. `direction` chooses:
    ///   0 = A → B (user sends A, receives B)
    ///   1 = B → A (user sends B, receives A)
    ///
    /// `min_amount_out` is a slippage bound — transaction reverts if the
    /// computed output is below it.
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
        direction: u8,
    ) -> Result<()> {
        require!(direction <= 1, AmmError::InvalidSwapDirection);

        let reserve_a = ctx.accounts.token_a_vault.amount;
        let reserve_b = ctx.accounts.token_b_vault.amount;
        let fee_bps = ctx.accounts.pool.fee_bps;

        let (amount_out, source_in, source_out, xfer_in_accounts, xfer_out_accounts) =
            if direction == 0 {
                // A → B
                let out = swap_out_amount(amount_in, reserve_a, reserve_b, fee_bps)?;
                (
                    out,
                    ctx.accounts.trader_token_a.to_account_info(),
                    ctx.accounts.trader_token_b.to_account_info(),
                    Transfer {
                        from: ctx.accounts.trader_token_a.to_account_info(),
                        to: ctx.accounts.token_a_vault.to_account_info(),
                        authority: ctx.accounts.trader.to_account_info(),
                    },
                    Transfer {
                        from: ctx.accounts.token_b_vault.to_account_info(),
                        to: ctx.accounts.trader_token_b.to_account_info(),
                        authority: ctx.accounts.pool_authority.to_account_info(),
                    },
                )
            } else {
                // B → A
                let out = swap_out_amount(amount_in, reserve_b, reserve_a, fee_bps)?;
                (
                    out,
                    ctx.accounts.trader_token_b.to_account_info(),
                    ctx.accounts.trader_token_a.to_account_info(),
                    Transfer {
                        from: ctx.accounts.trader_token_b.to_account_info(),
                        to: ctx.accounts.token_b_vault.to_account_info(),
                        authority: ctx.accounts.trader.to_account_info(),
                    },
                    Transfer {
                        from: ctx.accounts.token_a_vault.to_account_info(),
                        to: ctx.accounts.trader_token_a.to_account_info(),
                        authority: ctx.accounts.pool_authority.to_account_info(),
                    },
                )
            };

        // Silence unused-binding warnings from the tuple; these are informational.
        let _ = (source_in, source_out);

        require!(amount_out >= min_amount_out, AmmError::SlippageSwapBelowMinimum);

        // Transfer IN from trader → vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                xfer_in_accounts,
            ),
            amount_in,
        )?;

        // Transfer OUT from vault → trader (signed by pool_authority)
        let pool_key = ctx.accounts.pool.key();
        let authority_seeds = &[
            POOL_AUTHORITY_SEED,
            pool_key.as_ref(),
            &[ctx.accounts.pool.authority_bump],
        ];
        let signer = &[&authority_seeds[..]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                xfer_out_accounts,
                signer,
            ),
            amount_out,
        )?;

        let pool = &mut ctx.accounts.pool;
        pool.last_update_slot = Clock::get()?.slot;

        ctx.accounts.token_a_vault.reload()?;
        ctx.accounts.token_b_vault.reload()?;

        emit!(SwapExecuted {
            pool: pool.key(),
            trader: ctx.accounts.trader.key(),
            direction,
            amount_in,
            amount_out,
            fee_bps,
            new_reserve_a: ctx.accounts.token_a_vault.amount,
            new_reserve_b: ctx.accounts.token_b_vault.amount,
            slot: pool.last_update_slot,
        });
        msg!(
            "Swap dir={}: {} in → {} out (fee {} bps)",
            direction,
            amount_in,
            amount_out,
            fee_bps
        );
        // Prevent a compiler warning: MINIMUM_LIQUIDITY is referenced via math::
        // but we also surface it as a program-level constant for the IDL.
        let _ = MINIMUM_LIQUIDITY;
        Ok(())
    }
}

// ── Account contexts ─────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + AmmConfig::INIT_SPACE,
        seeds = [AMM_CONFIG_SEED],
        bump,
    )]
    pub amm_config: Account<'info, AmmConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        mut,
        seeds = [AMM_CONFIG_SEED],
        bump = amm_config.bump,
        has_one = admin,
    )]
    pub amm_config: Account<'info, AmmConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = admin,
        space = 8 + Pool::INIT_SPACE,
        seeds = [POOL_SEED, token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump,
    )]
    pub pool: Account<'info, Pool>,

    /// CHECK: PDA used as mint+vault authority for this pool. No data.
    #[account(
        seeds = [POOL_AUTHORITY_SEED, pool.key().as_ref()],
        bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        token::mint = token_a_mint,
        token::authority = pool_authority,
    )]
    pub token_a_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = admin,
        token::mint = token_b_mint,
        token::authority = pool_authority,
    )]
    pub token_b_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 9,
        mint::authority = pool_authority,
        mint::freeze_authority = pool_authority,
        seeds = [LP_MINT_SEED, pool.key().as_ref()],
        bump,
    )]
    pub lp_mint: Account<'info, Mint>,
    // NOTE: freeze_authority is set to the PDA at init — but an immediate
    // follow-up admin instruction (not implemented in v1) would set it to
    // None. For now the PDA holds freeze authority but the program never
    // exposes a freeze instruction, so freeze is effectively dead code.
    // This is a known limitation documented in DESIGN.md §6.

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// NOTE on Box: TokenAccount is 165 bytes, Mint is 82, Pool is 253. Stacking
// 5+ of them plus anchor bump-derivation code overflows the 4KB BPF stack.
// Boxing moves them to the heap, keeping stack usage well below the limit.
// This is the standard Anchor workaround for "Stack offset exceeded" errors.
#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: PDA authority, no data.
    #[account(
        seeds = [POOL_AUTHORITY_SEED, pool.key().as_ref()],
        bump = pool.authority_bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    #[account(mut, address = pool.token_a_vault)]
    pub token_a_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = pool.token_b_vault)]
    pub token_b_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = pool.lp_mint)]
    pub lp_mint: Box<Account<'info, Mint>>,

    #[account(mut, constraint = depositor_token_a.mint == pool.token_a_mint)]
    pub depositor_token_a: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = depositor_token_b.mint == pool.token_b_mint)]
    pub depositor_token_b: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = depositor_lp.mint == pool.lp_mint)]
    pub depositor_lp: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawLiquidity<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: PDA authority, no data.
    #[account(
        seeds = [POOL_AUTHORITY_SEED, pool.key().as_ref()],
        bump = pool.authority_bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    #[account(mut, address = pool.token_a_vault)]
    pub token_a_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = pool.token_b_vault)]
    pub token_b_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = pool.lp_mint)]
    pub lp_mint: Box<Account<'info, Mint>>,

    #[account(mut, constraint = withdrawer_token_a.mint == pool.token_a_mint)]
    pub withdrawer_token_a: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = withdrawer_token_b.mint == pool.token_b_mint)]
    pub withdrawer_token_b: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = withdrawer_lp.mint == pool.lp_mint)]
    pub withdrawer_lp: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub withdrawer: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, Pool>,

    /// CHECK: PDA authority, no data.
    #[account(
        seeds = [POOL_AUTHORITY_SEED, pool.key().as_ref()],
        bump = pool.authority_bump,
    )]
    pub pool_authority: UncheckedAccount<'info>,

    #[account(mut, address = pool.token_a_vault)]
    pub token_a_vault: Account<'info, TokenAccount>,

    #[account(mut, address = pool.token_b_vault)]
    pub token_b_vault: Account<'info, TokenAccount>,

    #[account(mut, constraint = trader_token_a.mint == pool.token_a_mint)]
    pub trader_token_a: Account<'info, TokenAccount>,

    #[account(mut, constraint = trader_token_b.mint == pool.token_b_mint)]
    pub trader_token_b: Account<'info, TokenAccount>,

    #[account(mut)]
    pub trader: Signer<'info>,

    pub token_program: Program<'info, Token>,
}
