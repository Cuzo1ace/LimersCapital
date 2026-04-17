use anchor_lang::prelude::*;

/// Global configuration for the AMM. Holds the admin pubkey that gates
/// privileged instructions (initialize_pool, future pause/unpause/update_fee).
///
/// Singleton — seeded with `[b"amm_config"]`. Created once at program
/// deployment by the admin.
#[account]
#[derive(InitSpace)]
pub struct AmmConfig {
    pub bump: u8,               // 1
    pub admin: Pubkey,          // 32 — current admin; upgrade target = devnet Squads vault PDA
    pub pool_count: u64,        // 8 — incremented on each initialize_pool
    pub default_fee_bps: u16,   // 2 — default swap fee for new pools (30 = 0.30%)
    pub _reserved: [u8; 64],    // 64 — future fields without migration
}

/// Per-pool state. One Pool per token pair.
///
/// Seed: `[b"pool", token_a_mint.key().as_ref(), token_b_mint.key().as_ref()]`
/// where `token_a_mint < token_b_mint` (canonical lexicographic order —
/// see §16.1 in DESIGN.md). This prevents creating the same pool twice
/// with reversed A/B.
#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub bump: u8,                     // 1
    pub authority_bump: u8,           // 1 — bump for the pool_authority PDA
    pub token_a_mint: Pubkey,         // 32
    pub token_b_mint: Pubkey,         // 32
    pub token_a_vault: Pubkey,        // 32 — ATA owned by pool_authority
    pub token_b_vault: Pubkey,        // 32
    pub lp_mint: Pubkey,              // 32 — mint authority = pool_authority
    pub fee_bps: u16,                 // 2 — swap fee (30 = 0.30%)
    pub total_lp_supply: u64,         // 8 — mirror of on-chain LP mint supply for math convenience
    pub created_at: i64,              // 8
    pub last_update_slot: u64,        // 8 — updated on every state-changing IX; used by oracle adapters (§7)
    pub _reserved: [u8; 64],          // 64 — future fields without migration
}

/// Seeds for the per-pool authority PDA. This PDA owns the two token
/// vaults and is the mint authority of the LP mint. It has no stored
/// state — used only as a signer via `invoke_signed`.
///
/// Seed: `[b"authority", pool.key().as_ref()]`
pub const POOL_AUTHORITY_SEED: &[u8] = b"authority";
pub const POOL_SEED: &[u8] = b"pool";
pub const AMM_CONFIG_SEED: &[u8] = b"amm_config";
pub const LP_MINT_SEED: &[u8] = b"lp_mint";
