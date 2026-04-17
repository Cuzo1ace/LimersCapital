use anchor_lang::prelude::*;

/// Emitted when a pool is initialized by the admin.
#[event]
pub struct PoolInitialized {
    pub pool: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub lp_mint: Pubkey,
    pub fee_bps: u16,
    pub admin: Pubkey,
    pub slot: u64,
}

/// Emitted on every deposit. LP amount minted is authoritative.
#[event]
pub struct LiquidityAdded {
    pub pool: Pubkey,
    pub depositor: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
    pub lp_minted: u64,
    pub new_reserve_a: u64,
    pub new_reserve_b: u64,
    pub slot: u64,
}

/// Emitted on every withdrawal. LP burned is authoritative.
#[event]
pub struct LiquidityRemoved {
    pub pool: Pubkey,
    pub withdrawer: Pubkey,
    pub lp_burned: u64,
    pub amount_a_out: u64,
    pub amount_b_out: u64,
    pub new_reserve_a: u64,
    pub new_reserve_b: u64,
    pub slot: u64,
}

/// Emitted on every successful swap.
#[event]
pub struct SwapExecuted {
    pub pool: Pubkey,
    pub trader: Pubkey,
    pub direction: u8,       // 0 = A→B, 1 = B→A
    pub amount_in: u64,
    pub amount_out: u64,
    pub fee_bps: u16,
    pub new_reserve_a: u64,
    pub new_reserve_b: u64,
    pub slot: u64,
}
