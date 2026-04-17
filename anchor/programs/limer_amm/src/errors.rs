use anchor_lang::prelude::*;

#[error_code]
pub enum AmmError {
    #[msg("Admin mismatch — only the AMM admin can perform this action.")]
    AdminMismatch,

    #[msg("Fee basis points exceed the maximum of 100 (1%).")]
    FeeTooHigh,

    #[msg("Token A and Token B mints must differ.")]
    DuplicateMints,

    #[msg("Mint canonical order violated — pass mints in lexicographic order.")]
    NonCanonicalMintOrder,

    #[msg("Pool tokens must have freeze authority revoked (set to None).")]
    FreezeAuthorityPresent,

    #[msg("Deposit rejected — computed LP tokens below caller's minimum.")]
    SlippageDepositLpBelowMinimum,

    #[msg("Withdrawal rejected — output below caller's minimum for token A.")]
    SlippageWithdrawBelowMinimumA,

    #[msg("Withdrawal rejected — output below caller's minimum for token B.")]
    SlippageWithdrawBelowMinimumB,

    #[msg("Swap rejected — output below caller's minimum.")]
    SlippageSwapBelowMinimum,

    #[msg("Swap would drain a pool reserve to zero — refusing.")]
    SwapWouldEmptyReserve,

    #[msg("Swap produced zero output — pool too shallow for this trade size.")]
    SwapZeroOutput,

    #[msg("Arithmetic overflow.")]
    MathOverflow,

    #[msg("First deposit must exceed MINIMUM_LIQUIDITY on both sides.")]
    FirstDepositTooSmall,

    #[msg("LP amount to burn exceeds caller's LP balance.")]
    InsufficientLpBalance,

    #[msg("Direction flag must be 0 (A→B) or 1 (B→A).")]
    InvalidSwapDirection,

    #[msg("Pool is uninitialized — reserves are zero.")]
    PoolEmpty,
}
