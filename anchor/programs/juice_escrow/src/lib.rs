//! Send Juice escrow program — Sprint 2.
//!
//! Locks SPL Token / Token-2022 stablecoin deposits inside a per-receipt
//! vault PDA until either the maturity date passes or the holder of the
//! linked Metaplex Core NFT (the "savings receipt") calls `claim`.
//!
//! The receipt NFT is minted off-chain by the Send Juice corridor flow
//! (apps/pusd-sundollar/src/solana/core.js) BEFORE this program is called.
//! This program treats the asset address as an opaque Pubkey for PDA
//! derivation, and verifies ownership at claim time via mpl-core
//! deserialization.
//!
//! Token-2022 is supported through `anchor-spl::token_interface`, which
//! routes CPIs to either the legacy Token program or Token-2022 based on
//! the `token_program` Interface account passed at call time.
//!
//! ⚠ Pre-deploy checklist:
//!   1. `anchor keys list` to generate a deploy keypair, then update both
//!      `declare_id!` below AND `[programs.devnet]` in anchor/Anchor.toml.
//!   2. `anchor build && anchor test --skip-deploy` to run the test sketch.
//!   3. Seed and instruction interfaces are FROZEN — the Sprint 1 client
//!      (apps/pusd-sundollar/src/solana/juice-escrow-client.js) is wired
//!      against them. Renaming any seed string or instruction arg breaks
//!      every deployed receipt.

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked,
        CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked,
    },
};
use mpl_core::accounts::BaseAssetV1;

mod error;
mod state;

use error::JuiceEscrowError;
use state::SavingsAccount;

declare_id!("JEscrowJ11111111111111111111111111111111111");

pub const SEED_SAVINGS: &[u8] = b"juice-savings";
pub const SEED_VAULT: &[u8]   = b"juice-savings-vault";

#[program]
pub mod juice_escrow {
    use super::*;

    /// Open a new savings escrow tied to a Metaplex Core asset.
    ///
    /// The caller (`creator`) deposits `initial_deposit` raw token units
    /// into the freshly-created vault PDA. The receipt NFT identified by
    /// `asset` MUST already exist and be owned by `recipient` — this
    /// program treats the asset as opaque for PDA derivation and only
    /// verifies ownership on `claim`.
    pub fn initialize_savings(
        ctx: Context<InitializeSavings>,
        goal_amount: u64,
        maturity_unix: i64,
        initial_deposit: u64,
    ) -> Result<()> {
        require!(initial_deposit > 0, JuiceEscrowError::ZeroAmount);

        let now = Clock::get()?.unix_timestamp;
        let savings = &mut ctx.accounts.savings;
        savings.asset              = ctx.accounts.asset.key();
        savings.mint               = ctx.accounts.mint.key();
        savings.token_program      = ctx.accounts.token_program.key();
        savings.creator            = ctx.accounts.creator.key();
        savings.original_recipient = ctx.accounts.recipient.key();
        savings.goal_amount_raw    = goal_amount;
        savings.deposits_total_raw = initial_deposit;
        savings.deposit_count      = 1;
        savings.maturity_unix      = maturity_unix;
        savings.created_unix       = now;
        savings.locked_for_creator = false;
        savings.bump               = ctx.bumps.savings;
        savings.vault_bump         = ctx.bumps.vault;
        savings._reserved          = [0u8; 64];

        // Move the initial deposit into the vault PDA.
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.creator_token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        );
        transfer_checked(cpi_ctx, initial_deposit, ctx.accounts.mint.decimals)?;

        emit!(DepositRecorded {
            asset: savings.asset,
            depositor: savings.creator,
            amount: initial_deposit,
            new_total: savings.deposits_total_raw,
            timestamp: now,
        });
        Ok(())
    }

    /// Top up an existing escrow. Anyone may deposit — group savings.
    /// Once a non-creator deposit lands, `cancel` is permanently disabled
    /// so the creator can't rug the depositors.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, JuiceEscrowError::ZeroAmount);

        // CPI transfer first so a failure leaves on-chain state untouched.
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.depositor_token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.depositor.to_account_info(),
            },
        );
        transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

        let now = Clock::get()?.unix_timestamp;
        let savings = &mut ctx.accounts.savings;
        savings.deposits_total_raw = savings
            .deposits_total_raw
            .checked_add(amount)
            .ok_or(JuiceEscrowError::NumericOverflow)?;
        savings.deposit_count = savings
            .deposit_count
            .checked_add(1)
            .ok_or(JuiceEscrowError::NumericOverflow)?;
        if ctx.accounts.depositor.key() != savings.creator {
            savings.locked_for_creator = true;
        }

        emit!(DepositRecorded {
            asset: savings.asset,
            depositor: ctx.accounts.depositor.key(),
            amount,
            new_total: savings.deposits_total_raw,
            timestamp: now,
        });
        Ok(())
    }

    /// Claim from the vault. Caller must currently own the receipt NFT.
    /// Pre-maturity claims must drain the entire balance in a single call
    /// (intentional friction). After maturity, partial claims are allowed.
    pub fn claim(ctx: Context<Claim>, amount: u64) -> Result<()> {
        require!(amount > 0, JuiceEscrowError::ZeroAmount);

        let savings = &mut ctx.accounts.savings;
        require_keys_eq!(
            ctx.accounts.asset.key(),
            savings.asset,
            JuiceEscrowError::AssetMismatch
        );

        // Verify the claimer currently owns the receipt NFT.
        let asset_data = ctx.accounts.asset.try_borrow_data()?;
        let asset = BaseAssetV1::from_bytes(&asset_data)
            .map_err(|_| error!(JuiceEscrowError::AssetMismatch))?;
        require_keys_eq!(
            asset.owner,
            ctx.accounts.claimer.key(),
            JuiceEscrowError::NotReceiptHolder
        );
        drop(asset_data);

        // Maturity gate: pre-maturity claims must withdraw the full balance.
        let now = Clock::get()?.unix_timestamp;
        let pre_maturity = savings.maturity_unix > 0 && now < savings.maturity_unix;
        if pre_maturity {
            require!(
                amount == savings.deposits_total_raw,
                JuiceEscrowError::PartialClaimBeforeMaturity
            );
        }
        require!(
            amount <= savings.deposits_total_raw,
            JuiceEscrowError::InsufficientVaultBalance
        );

        // Vault → claimer, signed by the savings PDA.
        let asset_key = savings.asset;
        let savings_bump = savings.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[SEED_SAVINGS, asset_key.as_ref(), &[savings_bump]]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.claimer_token_account.to_account_info(),
                authority: ctx.accounts.savings.to_account_info(),
            },
            signer_seeds,
        );
        transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

        savings.deposits_total_raw = savings
            .deposits_total_raw
            .checked_sub(amount)
            .ok_or(JuiceEscrowError::NumericOverflow)?;
        Ok(())
    }

    /// Wind the escrow down. Only the creator may call, and only while
    /// no non-creator deposits have landed. Drains the vault back to the
    /// creator and closes both the vault token account and the
    /// SavingsAccount (rent refunded to the creator).
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        let savings = &ctx.accounts.savings;
        require!(
            !savings.locked_for_creator,
            JuiceEscrowError::EscrowLockedForCreator
        );
        require_keys_eq!(
            savings.creator,
            ctx.accounts.creator.key(),
            JuiceEscrowError::NotCreator
        );

        let asset_key = savings.asset;
        let savings_bump = savings.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[SEED_SAVINGS, asset_key.as_ref(), &[savings_bump]]];

        // Drain vault to creator if non-empty.
        if savings.deposits_total_raw > 0 {
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.creator_token_account.to_account_info(),
                    authority: ctx.accounts.savings.to_account_info(),
                },
                signer_seeds,
            );
            transfer_checked(
                cpi_ctx,
                savings.deposits_total_raw,
                ctx.accounts.mint.decimals,
            )?;
        }

        // Close vault token account, refund rent to creator.
        let close_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.creator.to_account_info(),
                authority: ctx.accounts.savings.to_account_info(),
            },
            signer_seeds,
        );
        close_account(close_ctx)?;

        // SavingsAccount itself is closed via the `close = creator` constraint
        // on the Cancel context — Anchor handles the rent refund.
        Ok(())
    }
}

// ── Account contexts ─────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeSavings<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: Metaplex Core asset address. Used as the unique seed for the
    /// savings + vault PDAs. Asset existence + ownership are NOT verified
    /// here — they're verified on `claim`. This keeps the create flow
    /// simple and lets the receipt mint and the escrow init bundle into a
    /// single tx without an mpl-core CPI on the hot path.
    pub asset: UncheckedAccount<'info>,

    /// CHECK: recipient of the receipt NFT. Stored on SavingsAccount as
    /// `original_recipient` for indexing — claim auth is gated by current
    /// NFT ownership, not by this field.
    pub recipient: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = creator,
        token::token_program = token_program,
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        space = SavingsAccount::SIZE,
        seeds = [SEED_SAVINGS, asset.key().as_ref()],
        bump,
    )]
    pub savings: Account<'info, SavingsAccount>,

    #[account(
        init,
        payer = creator,
        seeds = [SEED_VAULT, asset.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = savings,
        token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_SAVINGS, savings.asset.as_ref()],
        bump = savings.bump,
        constraint = savings.mint == mint.key() @ JuiceEscrowError::MintMismatch,
        constraint = savings.token_program == token_program.key() @ JuiceEscrowError::TokenProgramMismatch,
    )]
    pub savings: Account<'info, SavingsAccount>,

    #[account(
        mut,
        seeds = [SEED_VAULT, savings.asset.as_ref()],
        bump = savings.vault_bump,
        token::mint = mint,
        token::authority = savings,
        token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = depositor,
        token::token_program = token_program,
    )]
    pub depositor_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_SAVINGS, asset.key().as_ref()],
        bump = savings.bump,
        constraint = savings.mint == mint.key() @ JuiceEscrowError::MintMismatch,
        constraint = savings.token_program == token_program.key() @ JuiceEscrowError::TokenProgramMismatch,
    )]
    pub savings: Account<'info, SavingsAccount>,

    #[account(
        mut,
        seeds = [SEED_VAULT, asset.key().as_ref()],
        bump = savings.vault_bump,
        token::mint = mint,
        token::authority = savings,
        token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Metaplex Core asset. Owner is verified inline by deserializing
    /// BaseAssetV1 and asserting `asset.owner == claimer`.
    pub asset: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = claimer,
        token::token_program = token_program,
    )]
    pub claimer_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        close = creator,
        seeds = [SEED_SAVINGS, savings.asset.as_ref()],
        bump = savings.bump,
        constraint = savings.creator == creator.key() @ JuiceEscrowError::NotCreator,
        constraint = savings.mint == mint.key() @ JuiceEscrowError::MintMismatch,
        constraint = savings.token_program == token_program.key() @ JuiceEscrowError::TokenProgramMismatch,
    )]
    pub savings: Account<'info, SavingsAccount>,

    #[account(
        mut,
        seeds = [SEED_VAULT, savings.asset.as_ref()],
        bump = savings.vault_bump,
        token::mint = mint,
        token::authority = savings,
        token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = creator,
        token::token_program = token_program,
    )]
    pub creator_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

// ── Events ───────────────────────────────────────────────────────────

#[event]
pub struct DepositRecorded {
    pub asset: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    pub new_total: u64,
    pub timestamp: i64,
}
