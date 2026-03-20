# 07 — Anchor Development

## Problem

Build, test, and deploy Solana programs using the Anchor framework.

## Solution

### Install Anchor

```bash
# Install Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor anchor-cli
```

### Initialize a new project

```bash
anchor init limer-staking
cd limer-staking
```

This creates:

```
limer-staking/
  programs/limer-staking/
    src/lib.rs           # Program logic
    Cargo.toml
  tests/
    limer-staking.ts     # TypeScript tests
  Anchor.toml            # Project config
  migrations/deploy.ts
```

### Write a program (lib.rs)

```rust
use anchor_lang::prelude::*;

declare_id!("YourProgramId111111111111111111111111111111");

#[program]
pub mod limer_staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, reward_rate: u64) -> Result<()> {
        let pool = &mut ctx.accounts.stake_pool;
        pool.authority = ctx.accounts.authority.key();
        pool.reward_rate = reward_rate;
        pool.total_staked = 0;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::ZeroAmount);

        let user_stake = &mut ctx.accounts.user_stake;
        let pool = &mut ctx.accounts.stake_pool;

        // Transfer tokens from user to vault
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        user_stake.amount += amount;
        user_stake.last_stake_time = Clock::get()?.unix_timestamp;
        pool.total_staked += amount;

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let user_stake = &mut ctx.accounts.user_stake;
        require!(user_stake.amount >= amount, StakingError::InsufficientStake);

        // Transfer tokens from vault to user (PDA signs)
        let pool = &ctx.accounts.stake_pool;
        let seeds = &[b"vault", pool.to_account_info().key.as_ref(), &[pool.vault_bump]];
        let signer_seeds = &[&seeds[..]];

        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        user_stake.amount -= amount;
        ctx.accounts.stake_pool.total_staked -= amount;

        Ok(())
    }
}

// Account structures
#[account]
pub struct StakePool {
    pub authority: Pubkey,
    pub reward_rate: u64,
    pub total_staked: u64,
    pub vault_bump: u8,
}

#[account]
pub struct UserStake {
    pub owner: Pubkey,
    pub amount: u64,
    pub last_stake_time: i64,
    pub rewards_claimed: u64,
}

// Instruction account constraints
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8 + 8 + 1, seeds = [b"pool"], bump)]
    pub stake_pool: Account<'info, StakePool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, seeds = [b"pool"], bump)]
    pub stake_pool: Account<'info, StakePool>,
    #[account(init_if_needed, payer = user, space = 8 + 32 + 8 + 8 + 8,
              seeds = [b"stake", user.key().as_ref()], bump)]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, anchor_spl::token::TokenAccount>,
    #[account(mut, seeds = [b"vault", stake_pool.key().as_ref()], bump)]
    pub vault: Account<'info, anchor_spl::token::TokenAccount>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut, seeds = [b"pool"], bump)]
    pub stake_pool: Account<'info, StakePool>,
    #[account(mut, seeds = [b"stake", user.key().as_ref()], bump,
              has_one = owner @ StakingError::Unauthorized)]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, anchor_spl::token::TokenAccount>,
    #[account(mut, seeds = [b"vault", stake_pool.key().as_ref()], bump)]
    pub vault: Account<'info, anchor_spl::token::TokenAccount>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

// Custom errors
#[error_code]
pub enum StakingError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Insufficient staked amount")]
    InsufficientStake,
    #[msg("Unauthorized")]
    Unauthorized,
}
```

### Build and deploy

```bash
# Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet (careful!)
anchor deploy --provider.cluster mainnet
```

### Generate IDL for frontend

```bash
anchor build  # IDL is generated at target/idl/limer_staking.json
```

Copy the IDL to your frontend:
```bash
cp target/idl/limer_staking.json ../src/solana/idl/
```

## Explanation

- **Anchor** is the dominant framework for Solana programs. It provides macros for account validation, serialization, and error handling
- **`#[program]`**: Marks the module containing instruction handlers
- **`#[account]`**: Auto-implements borsh serialization + 8-byte discriminator
- **`#[derive(Accounts)]`**: Defines and validates the accounts each instruction expects
- **`init`**: Creates a new account with specified space and pays rent
- **`seeds + bump`**: Derives and validates PDA addresses
- **`has_one`**: Validates that an account field matches an expected value
- **CPI (Cross-Program Invocation)**: Call other programs (like Token Program) from your program

## Gotchas

- **Account space**: Calculate exactly: `8 (discriminator) + sum of field sizes`. Pubkey = 32, u64 = 8, i64 = 8, bool = 1, String = 4 + len
- **init_if_needed**: Convenient but can mask bugs. Prefer explicit `init` + separate handler when possible
- **Upgrade authority**: By default, the deployer is the upgrade authority. Transfer to a multisig before mainnet
- **Program ID**: After first deploy, copy the generated ID into `declare_id!()` and rebuild
- **Rent**: All accounts must be rent-exempt. Anchor's `init` handles this automatically
- **Testing**: Always test with `anchor test` before deploying. It spins up a local validator

## References

- [Anchor Book](https://www.anchor-lang.com/)
- [Anchor Examples](https://github.com/coral-xyz/anchor/tree/master/examples)
- [Solana Program Security](https://solana.com/docs/programs)
