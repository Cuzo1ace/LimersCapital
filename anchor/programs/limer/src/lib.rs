use anchor_lang::prelude::*;

declare_id!("HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk");

#[program]
pub mod limer {
    use super::*;

    /// Create a new user profile PDA. Called once per wallet on first connect.
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let profile = &mut ctx.accounts.user_profile;
        profile.owner = ctx.accounts.owner.key();
        profile.xp = 0;
        profile.limer_points = 0;
        profile.current_streak = 0;
        profile.longest_streak = 0;
        profile.last_login = Clock::get()?.unix_timestamp;
        profile.badges_earned = 0;
        profile.modules_completed = 0;
        profile.created_at = Clock::get()?.unix_timestamp;
        profile.bump = ctx.bumps.user_profile;

        let trade_log = &mut ctx.accounts.trade_log;
        trade_log.owner = ctx.accounts.owner.key();
        trade_log.trade_count = 0;
        trade_log.total_volume_usd = 0;
        trade_log.total_fees = 0;
        trade_log.bump = ctx.bumps.trade_log;

        msg!("User profile initialized for {}", ctx.accounts.owner.key());
        Ok(())
    }

    /// Award XP to the user. Caller must be the profile owner.
    pub fn award_xp(ctx: Context<UpdateProfile>, amount: u64) -> Result<()> {
        let profile = &mut ctx.accounts.user_profile;
        profile.xp = profile.xp.checked_add(amount).unwrap_or(u64::MAX);
        msg!("Awarded {} XP. Total: {}", amount, profile.xp);
        Ok(())
    }

    /// Award Limer Points. Applies the on-chain multiplier.
    pub fn award_lp(ctx: Context<UpdateProfile>, base_amount: u64, multiplier_pct: u32) -> Result<()> {
        let profile = &mut ctx.accounts.user_profile;
        // multiplier_pct: 100 = 1.0x, 150 = 1.5x, etc.
        let amount = (base_amount as u128)
            .checked_mul(multiplier_pct as u128)
            .unwrap_or(0)
            / 100;
        profile.limer_points = profile
            .limer_points
            .checked_add(amount as u64)
            .unwrap_or(u64::MAX);
        msg!("Awarded {} LP ({}x). Total: {}", amount, multiplier_pct as f64 / 100.0, profile.limer_points);
        Ok(())
    }

    /// Record a badge as earned (bitmap — up to 32 badges).
    pub fn record_badge(ctx: Context<UpdateProfile>, badge_index: u8) -> Result<()> {
        require!(badge_index < 32, LimerError::InvalidBadgeIndex);
        let profile = &mut ctx.accounts.user_profile;
        profile.badges_earned |= 1 << badge_index;
        msg!("Badge {} recorded. Bitmap: {:032b}", badge_index, profile.badges_earned);
        Ok(())
    }

    /// Record module completion (bitmap — up to 8 modules).
    pub fn record_module(ctx: Context<UpdateProfile>, module_index: u8) -> Result<()> {
        require!(module_index < 8, LimerError::InvalidModuleIndex);
        let profile = &mut ctx.accounts.user_profile;
        profile.modules_completed |= 1 << module_index;
        msg!("Module {} completed. Bitmap: {:08b}", module_index, profile.modules_completed);
        Ok(())
    }

    /// Daily check-in: updates streak and awards streak bonus.
    pub fn check_in_daily(ctx: Context<UpdateProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.user_profile;
        let now = Clock::get()?.unix_timestamp;
        let last = profile.last_login;

        // Check if it's a new day (86400 seconds = 1 day)
        let days_since = (now - last) / 86400;

        if days_since == 1 {
            // Consecutive day
            profile.current_streak = profile.current_streak.checked_add(1).unwrap_or(u32::MAX);
        } else if days_since > 1 {
            // Streak broken
            profile.current_streak = 1;
        }
        // days_since == 0 means same day, don't update streak

        if profile.current_streak > profile.longest_streak {
            profile.longest_streak = profile.current_streak;
        }

        profile.last_login = now;

        msg!(
            "Daily check-in. Streak: {} (longest: {})",
            profile.current_streak,
            profile.longest_streak
        );
        Ok(())
    }

    /// Record a trade's aggregate data (volume + fees). Individual trades stay off-chain.
    pub fn record_trade(
        ctx: Context<UpdateTradeLog>,
        volume_usd: u64,
        fee_amount: u64,
    ) -> Result<()> {
        let trade_log = &mut ctx.accounts.trade_log;
        trade_log.trade_count = trade_log.trade_count.checked_add(1).unwrap_or(u32::MAX);
        trade_log.total_volume_usd = trade_log
            .total_volume_usd
            .checked_add(volume_usd)
            .unwrap_or(u64::MAX);
        trade_log.total_fees = trade_log
            .total_fees
            .checked_add(fee_amount)
            .unwrap_or(u64::MAX);

        msg!(
            "Trade recorded. Count: {}, Volume: {}, Fees: {}",
            trade_log.trade_count,
            trade_log.total_volume_usd,
            trade_log.total_fees
        );
        Ok(())
    }

    /// Close user profile and trade log, reclaim rent.
    pub fn close_account(_ctx: Context<CloseAccount>) -> Result<()> {
        msg!("User account closed, rent reclaimed");
        Ok(())
    }
}

// ── Account Structures ──────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub owner: Pubkey,          // 32
    pub xp: u64,                // 8
    pub limer_points: u64,      // 8
    pub current_streak: u32,    // 4
    pub longest_streak: u32,    // 4
    pub last_login: i64,        // 8
    pub badges_earned: u32,     // 4 (bitmap — up to 32 badges)
    pub modules_completed: u8,  // 1 (bitmap — up to 8 modules)
    pub created_at: i64,        // 8
    pub bump: u8,               // 1
}
// Total: 32 + 8 + 8 + 4 + 4 + 8 + 4 + 1 + 8 + 1 = 78 bytes + 8 discriminator = 86

#[account]
#[derive(InitSpace)]
pub struct TradeLog {
    pub owner: Pubkey,          // 32
    pub trade_count: u32,       // 4
    pub total_volume_usd: u64,  // 8
    pub total_fees: u64,        // 8
    pub bump: u8,               // 1
}
// Total: 32 + 4 + 8 + 8 + 1 = 53 bytes + 8 discriminator = 61

// ── Instruction Contexts ────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"user", owner.key().as_ref()],
        bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(
        init,
        payer = owner,
        space = 8 + TradeLog::INIT_SPACE,
        seeds = [b"trades", owner.key().as_ref()],
        bump,
    )]
    pub trade_log: Account<'info, TradeLog>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(
        mut,
        seeds = [b"user", owner.key().as_ref()],
        bump = user_profile.bump,
        has_one = owner,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateTradeLog<'info> {
    #[account(
        mut,
        seeds = [b"trades", owner.key().as_ref()],
        bump = trade_log.bump,
        has_one = owner,
    )]
    pub trade_log: Account<'info, TradeLog>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseAccount<'info> {
    #[account(
        mut,
        seeds = [b"user", owner.key().as_ref()],
        bump = user_profile.bump,
        has_one = owner,
        close = owner,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [b"trades", owner.key().as_ref()],
        bump = trade_log.bump,
        has_one = owner,
        close = owner,
    )]
    pub trade_log: Account<'info, TradeLog>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

// ── Errors ──────────────────────────────────────────────────────

#[error_code]
pub enum LimerError {
    #[msg("Badge index must be 0-31")]
    InvalidBadgeIndex,
    #[msg("Module index must be 0-7")]
    InvalidModuleIndex,
}
