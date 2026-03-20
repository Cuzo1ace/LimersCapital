# 09 — Security Patterns

## Problem

Avoid common Solana program vulnerabilities and follow security best practices for both on-chain programs and client-side code.

## Solution

### 1. Signer verification

**Vulnerability**: Missing signer checks allow anyone to call privileged instructions.

```rust
// BAD — no signer check
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // Anyone can call this!
    transfer_from_vault(amount)?;
    Ok(())
}

// GOOD — Anchor enforces Signer constraint
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,  // Must sign the transaction
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,
}
```

### 2. Account ownership validation

**Vulnerability**: An attacker passes a fake account owned by a different program.

```rust
// GOOD — Anchor validates program ownership automatically
#[derive(Accounts)]
pub struct Stake<'info> {
    // Anchor checks this is owned by our program
    #[account(mut, seeds = [b"pool"], bump)]
    pub stake_pool: Account<'info, StakePool>,

    // Anchor checks this is a valid SPL token account
    #[account(mut)]
    pub user_token: Account<'info, anchor_spl::token::TokenAccount>,
}
```

### 3. Reinitialization protection

**Vulnerability**: An attacker re-initializes an account to reset its state.

```rust
// GOOD — use `init` (fails if account exists) or check a flag
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 100, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,  // `init` prevents reinitialization
}
```

### 4. Arithmetic overflow

**Vulnerability**: Unchecked math can wrap around or panic.

```rust
// BAD — can overflow
user_stake.amount += amount;

// GOOD — checked arithmetic
user_stake.amount = user_stake.amount
    .checked_add(amount)
    .ok_or(StakingError::Overflow)?;
```

### 5. PDA bump seed validation

**Vulnerability**: Using a non-canonical bump allows account substitution.

```rust
// GOOD — Anchor's `bump` constraint uses the canonical bump
#[account(seeds = [b"vault", pool.key().as_ref()], bump)]
pub vault: Account<'info, TokenAccount>,

// Store the bump on init for CPI signing
pool.vault_bump = ctx.bumps.vault;
```

### 6. Close account drain

**Vulnerability**: Not properly closing accounts leaks rent SOL.

```rust
// GOOD — Anchor's `close` constraint handles lamport transfer + zeroing
#[derive(Accounts)]
pub struct CloseStake<'info> {
    #[account(mut, close = user, seeds = [b"stake", user.key().as_ref()], bump)]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user: Signer<'info>,
}
```

### 7. Client-side security

```js
// NEVER store private keys
// BAD
const keypair = Keypair.fromSecretKey(secretKey);

// GOOD — let the wallet handle signing
const signedTx = await wallet.signTransaction(transaction);

// NEVER trust client-side validation alone
// Always validate on-chain in your program

// ALWAYS validate addresses before use
import { isAddress } from '@solana/kit';

function validateRecipient(input) {
  if (!isAddress(input)) {
    throw new Error('Invalid Solana address');
  }
}

// ALWAYS show transaction details before signing
function TransactionPreview({ transaction }) {
  return (
    <div className="border p-4 rounded">
      <h3>Transaction Summary</h3>
      <p>Sending: {amount} SOL</p>
      <p>To: {recipient}</p>
      <p>Network fee: ~0.000005 SOL</p>
      <p>Priority fee: {priorityFee} SOL</p>
      <button onClick={onConfirm}>Confirm & Sign</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}
```

### 8. RPC endpoint security

```js
// Use environment variables for paid RPC endpoints
const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// NEVER commit API keys
// .env (gitignored)
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your-key

// .gitignore
.env
.env.local
```

### 9. Authority management

```rust
// For production: use multisig for critical authorities
// Mint authority, upgrade authority, pool authority

// Consider using Squads multisig: https://squads.so
// Or implement simple multi-sig in your program:
#[account]
pub struct Multisig {
    pub signers: Vec<Pubkey>,
    pub threshold: u8,  // e.g., 2 of 3
}
```

### Security checklist

```
Program:
  [ ] All privileged instructions check Signer
  [ ] Account ownership validated (Anchor does this automatically)
  [ ] No reinitialization vulnerabilities
  [ ] Checked arithmetic throughout
  [ ] PDA bumps validated and stored
  [ ] Accounts properly closed when done
  [ ] CPI calls use correct program IDs
  [ ] No integer truncation (u64 to u32 etc.)

Client:
  [ ] No private keys in code or localStorage
  [ ] RPC keys in environment variables
  [ ] Transaction preview before every sign
  [ ] Address validation on user input
  [ ] Slippage protection on swaps
  [ ] Error messages don't leak sensitive info

Deployment:
  [ ] Upgrade authority transferred to multisig
  [ ] Mint authority is multisig or PDA (not a single keypair)
  [ ] Program audited by a reputable firm
  [ ] Devnet testing complete before mainnet
```

## Explanation

Solana programs are immutable once deployed (unless upgrade authority is set). Bugs in production can lead to permanent loss of funds. The Anchor framework mitigates many common vulnerabilities through its constraint system, but developers must still think about:

- **Trust boundaries**: Your program is the only trust boundary. Client-side checks can be bypassed
- **Account validation**: Every account passed to an instruction could be attacker-controlled
- **Math safety**: Solana uses u64 for most values — overflow is possible at large scales

## Gotchas

- **Anchor's safety**: Anchor handles many checks automatically, but `UncheckedAccount` bypasses all validation. Use it sparingly
- **Program upgrade**: If upgrade authority is set, the program can be changed. Consider revoking for trust-critical programs
- **Rent**: Closing accounts in the wrong order can leave orphaned accounts
- **Concurrent transactions**: Two users can modify the same account simultaneously. Use atomic operations

## References

- [Solana Security Best Practices](https://solana.com/docs/programs/security)
- [Common Exploits](https://github.com/coral-xyz/sealevel-attacks)
- [Anchor Security](https://www.anchor-lang.com/docs/security)
- [Neodyme Blog — Solana Security](https://blog.neodyme.io/)
