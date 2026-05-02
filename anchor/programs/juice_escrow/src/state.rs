//! On-chain state for juice_escrow.
//!
//! This file currently contains the SavingsAccount layout. The discriminator
//! comes from anchor-lang's #[account] derive — DO NOT change the struct name
//! or field order without a migration; both will rotate the discriminator and
//! invalidate every existing escrow.

use anchor_lang::prelude::*;

#[account]
pub struct SavingsAccount {
    /// The Metaplex Core asset address (receipt NFT). Acts as the goal_id —
    /// duplicates impossible because Core asset addresses are unique.
    pub asset: Pubkey,

    /// The mint of the underlying stablecoin (PUSD / USDC / future).
    pub mint: Pubkey,

    /// The SPL token program owning the mint — Token (legacy) vs Token-2022.
    /// Stored explicitly because Token-2022 is non-default for vault ops.
    pub token_program: Pubkey,

    /// Wallet that called initialize_savings. Recorded for indexing only;
    /// claim authority is the current NFT holder, not this field.
    pub creator: Pubkey,

    /// Wallet that received the receipt NFT at mint. Recorded for indexing
    /// — same caveat as `creator`. NFT can be transferred; claim follows.
    pub original_recipient: Pubkey,

    /// Goal target in raw token units (decimals from the mint).
    pub goal_amount_raw: u64,

    /// Sum of all deposits in raw token units.
    pub deposits_total_raw: u64,

    /// Number of distinct deposit instructions executed against this escrow.
    pub deposit_count: u32,

    /// Unix timestamp at which the escrow can be claimed without penalty.
    /// 0 means "no maturity gate" — claim allowed any time.
    pub maturity_unix: i64,

    /// Unix timestamp at which initialize_savings landed.
    pub created_unix: i64,

    /// True once any non-creator deposit lands. After this flips, `cancel`
    /// is permanently disabled — depositors can't be rug-pulled.
    pub locked_for_creator: bool,

    /// Bump for the SavingsAccount PDA.
    pub bump: u8,

    /// Bump for the vault token account PDA.
    pub vault_bump: u8,

    /// Reserved for future plugins (paymaster sponsor, jurisdiction tag, etc.).
    /// Pre-allocated to avoid reallocs on upgrade.
    pub _reserved: [u8; 64],
}

impl SavingsAccount {
    /// Anchor 8-byte discriminator + the field sizes above.
    /// Recompute if you add/remove fields. Off by one → space exhaustion at runtime.
    pub const SIZE: usize = 8       // discriminator
        + 32 + 32 + 32 + 32 + 32    // asset, mint, token_program, creator, original_recipient
        + 8 + 8                      // goal_amount_raw, deposits_total_raw
        + 4                          // deposit_count
        + 8 + 8                      // maturity_unix, created_unix
        + 1 + 1 + 1                  // locked_for_creator, bump, vault_bump
        + 64;                        // _reserved
}
