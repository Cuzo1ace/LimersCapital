use anchor_lang::prelude::*;

#[error_code]
pub enum JuiceEscrowError {
    #[msg("Caller does not own the receipt NFT.")]
    NotReceiptHolder,

    #[msg("Caller is not the original creator of this escrow.")]
    NotCreator,

    #[msg("Escrow has been locked because at least one non-creator deposit has landed.")]
    EscrowLockedForCreator,

    #[msg("Pre-maturity claims must withdraw the full balance in a single call.")]
    PartialClaimBeforeMaturity,

    #[msg("Claim amount exceeds the vault balance.")]
    InsufficientVaultBalance,

    #[msg("Token program on this escrow does not match the program of the supplied vault account.")]
    TokenProgramMismatch,

    #[msg("Mint on this escrow does not match the supplied vault mint.")]
    MintMismatch,

    #[msg("Asset address on this escrow does not match the supplied receipt NFT.")]
    AssetMismatch,

    #[msg("Amount must be greater than zero.")]
    ZeroAmount,

    #[msg("Numeric overflow recording a deposit or claim.")]
    NumericOverflow,
}
