//! Pure constant-product AMM math. No CPIs, no account access — just
//! arithmetic on u64/u128. Every function rounds in favor of the pool
//! (against the user) to prevent rounding-attack exploits.
//!
//! Referenced by §4 of DESIGN.md. Unit-tested via the `#[cfg(test)]`
//! block at the bottom of this file.

use crate::errors::AmmError;

/// Basis-point denominator. 10_000 = 100%. A fee of 30 bps = 0.30%.
pub const BPS_DENOMINATOR: u128 = 10_000;

/// Minimum liquidity locked at first deposit. Prevents the classic
/// first-depositor-manipulation attack. See §9 of DESIGN.md.
pub const MINIMUM_LIQUIDITY: u64 = 1_000;

/// Maximum permitted fee (1% = 100 bps).
pub const MAX_FEE_BPS: u16 = 100;

/// Compute the output amount of a swap, given input amount, reserves
/// on both sides, and a fee in basis points. Rounds DOWN.
///
/// Formula:
///   amount_in_with_fee = amount_in * (BPS - fee_bps)
///   amount_out = (reserve_out * amount_in_with_fee) / (reserve_in * BPS + amount_in_with_fee)
///
/// The fee stays in the pool (Uniswap v2 convention — fee grows LP share
/// value rather than being extracted separately).
pub fn swap_out_amount(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_bps: u16,
) -> Result<u64, AmmError> {
    if amount_in == 0 || reserve_in == 0 || reserve_out == 0 {
        return Err(AmmError::PoolEmpty);
    }
    let fee_denom = BPS_DENOMINATOR;
    let fee_numer = BPS_DENOMINATOR
        .checked_sub(fee_bps as u128)
        .ok_or(AmmError::MathOverflow)?;

    let amount_in_with_fee = (amount_in as u128)
        .checked_mul(fee_numer)
        .ok_or(AmmError::MathOverflow)?;

    let numerator = (reserve_out as u128)
        .checked_mul(amount_in_with_fee)
        .ok_or(AmmError::MathOverflow)?;

    let denominator = (reserve_in as u128)
        .checked_mul(fee_denom)
        .ok_or(AmmError::MathOverflow)?
        .checked_add(amount_in_with_fee)
        .ok_or(AmmError::MathOverflow)?;

    let amount_out = numerator
        .checked_div(denominator)
        .ok_or(AmmError::MathOverflow)?;

    if amount_out == 0 {
        return Err(AmmError::SwapZeroOutput);
    }
    if amount_out as u64 >= reserve_out {
        return Err(AmmError::SwapWouldEmptyReserve);
    }
    Ok(amount_out as u64)
}

/// Integer sqrt via Newton's method. Used for the first-deposit LP
/// calculation. Operates on u128 to prevent overflow on large products.
pub fn sqrt_u128(n: u128) -> u128 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

/// Compute LP tokens to mint for a deposit.
///
/// First deposit (total_lp_supply == 0):
///   lp = sqrt(amount_a * amount_b) - MINIMUM_LIQUIDITY
///   (caller must ensure both amounts > 0 and product > MINIMUM_LIQUIDITY^2)
///
/// Subsequent deposits:
///   lp = min(amount_a * total_lp / reserve_a, amount_b * total_lp / reserve_b)
///
/// Rounds DOWN in favor of the pool.
pub fn lp_tokens_for_deposit(
    amount_a: u64,
    amount_b: u64,
    reserve_a: u64,
    reserve_b: u64,
    total_lp_supply: u64,
) -> Result<u64, AmmError> {
    if total_lp_supply == 0 {
        // First deposit.
        let product = (amount_a as u128)
            .checked_mul(amount_b as u128)
            .ok_or(AmmError::MathOverflow)?;
        let sqrt_product = sqrt_u128(product);
        let lp = sqrt_product
            .checked_sub(MINIMUM_LIQUIDITY as u128)
            .ok_or(AmmError::FirstDepositTooSmall)?;
        if lp > u64::MAX as u128 {
            return Err(AmmError::MathOverflow);
        }
        return Ok(lp as u64);
    }

    if reserve_a == 0 || reserve_b == 0 {
        // Pool is in an invalid state.
        return Err(AmmError::PoolEmpty);
    }

    let lp_from_a = (amount_a as u128)
        .checked_mul(total_lp_supply as u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_div(reserve_a as u128)
        .ok_or(AmmError::MathOverflow)?;

    let lp_from_b = (amount_b as u128)
        .checked_mul(total_lp_supply as u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_div(reserve_b as u128)
        .ok_or(AmmError::MathOverflow)?;

    let lp = lp_from_a.min(lp_from_b);
    if lp > u64::MAX as u128 {
        return Err(AmmError::MathOverflow);
    }
    Ok(lp as u64)
}

/// Compute per-side outputs for a withdrawal.
///
/// amount_a_out = lp_burned * reserve_a / total_lp
/// amount_b_out = lp_burned * reserve_b / total_lp
///
/// Rounds DOWN.
pub fn withdraw_amounts(
    lp_burned: u64,
    reserve_a: u64,
    reserve_b: u64,
    total_lp_supply: u64,
) -> Result<(u64, u64), AmmError> {
    if total_lp_supply == 0 {
        return Err(AmmError::PoolEmpty);
    }

    let amount_a = (lp_burned as u128)
        .checked_mul(reserve_a as u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_div(total_lp_supply as u128)
        .ok_or(AmmError::MathOverflow)?;

    let amount_b = (lp_burned as u128)
        .checked_mul(reserve_b as u128)
        .ok_or(AmmError::MathOverflow)?
        .checked_div(total_lp_supply as u128)
        .ok_or(AmmError::MathOverflow)?;

    if amount_a > u64::MAX as u128 || amount_b > u64::MAX as u128 {
        return Err(AmmError::MathOverflow);
    }
    Ok((amount_a as u64, amount_b as u64))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sqrt_edge_cases() {
        assert_eq!(sqrt_u128(0), 0);
        assert_eq!(sqrt_u128(1), 1);
        assert_eq!(sqrt_u128(4), 2);
        assert_eq!(sqrt_u128(9), 3);
        assert_eq!(sqrt_u128(100), 10);
        // u128::MAX square root fits in u64
        let big = u64::MAX as u128;
        assert!(sqrt_u128(big * big) >= big - 1); // tolerant of ±1 from Newton
    }

    #[test]
    fn swap_happy_path() {
        // 100 in, reserve 1000/1000, 30 bps fee
        // in_with_fee = 100 * 9970 = 997_000
        // out = (1000 * 997_000) / (1000 * 10000 + 997_000) = 997_000_000 / 10_997_000 = 90
        let out = swap_out_amount(100, 1_000, 1_000, 30).unwrap();
        assert_eq!(out, 90);
    }

    #[test]
    fn swap_rejects_empty_pool() {
        assert!(swap_out_amount(100, 0, 1_000, 30).is_err());
        assert!(swap_out_amount(100, 1_000, 0, 30).is_err());
        assert!(swap_out_amount(0, 1_000, 1_000, 30).is_err());
    }

    #[test]
    fn first_deposit_locks_minimum_liquidity() {
        // sqrt(10_000 * 10_000) = 10_000. Minus MINIMUM_LIQUIDITY = 9_000 LP.
        let lp = lp_tokens_for_deposit(10_000, 10_000, 0, 0, 0).unwrap();
        assert_eq!(lp, 9_000);
    }

    #[test]
    fn first_deposit_too_small_errors() {
        // sqrt(10 * 10) = 10. 10 < MINIMUM_LIQUIDITY → error.
        assert!(lp_tokens_for_deposit(10, 10, 0, 0, 0).is_err());
    }

    #[test]
    fn subsequent_deposit_preserves_ratio() {
        // Pool at 1000/1000 with 1000 LP; deposit 500/500 → should get 500 LP
        let lp = lp_tokens_for_deposit(500, 500, 1_000, 1_000, 1_000).unwrap();
        assert_eq!(lp, 500);

        // Asymmetric deposit: 500/100 → min(500, 100) = 100 LP (honoring the smaller side)
        let lp2 = lp_tokens_for_deposit(500, 100, 1_000, 1_000, 1_000).unwrap();
        assert_eq!(lp2, 100);
    }

    #[test]
    fn withdraw_proportional() {
        // Pool 1000/2000 with 500 LP. Burn 100 LP → get 200/400.
        let (a, b) = withdraw_amounts(100, 1_000, 2_000, 500).unwrap();
        assert_eq!(a, 200);
        assert_eq!(b, 400);
    }
}
