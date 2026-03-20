# 08 — Testing

## Problem

Test Solana programs and client-side interactions using modern testing tools without needing a live network.

## Solution

### Testing stack overview

| Tool | Purpose | Speed | Use for |
|------|---------|-------|---------|
| **LiteSVM** | Lightweight SVM simulator | Fast | Unit tests for programs |
| **Mollusk** | Instruction-level test harness | Very fast | Single instruction testing |
| **Bankrun** | Full validator simulation | Medium | Integration tests |
| **Anchor test** | Built-in Anchor testing | Medium | Anchor program tests |
| **Local validator** | `solana-test-validator` | Slow | End-to-end with real RPC |

### Anchor tests (TypeScript)

```typescript
// tests/limer-staking.ts
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { LimerStaking } from '../target/types/limer_staking';
import { assert } from 'chai';

describe('limer-staking', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.LimerStaking as Program<LimerStaking>;

  it('initializes the stake pool', async () => {
    const [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('pool')],
      program.programId
    );

    await program.methods
      .initialize(new anchor.BN(100)) // reward rate
      .accounts({ stakePool: poolPda })
      .rpc();

    const pool = await program.account.stakePool.fetch(poolPda);
    assert.equal(pool.rewardRate.toNumber(), 100);
    assert.equal(pool.totalStaked.toNumber(), 0);
  });

  it('stakes tokens', async () => {
    // ... setup token accounts, mint test tokens
    await program.methods
      .stake(new anchor.BN(1_000_000_000))
      .accounts({
        stakePool: poolPda,
        userStake: userStakePda,
        userTokenAccount: userAta,
        vault: vaultPda,
      })
      .rpc();

    const stake = await program.account.userStake.fetch(userStakePda);
    assert.equal(stake.amount.toNumber(), 1_000_000_000);
  });

  it('fails to unstake more than staked', async () => {
    try {
      await program.methods
        .unstake(new anchor.BN(999_000_000_000))
        .accounts({ /* ... */ })
        .rpc();
      assert.fail('Should have thrown');
    } catch (err) {
      assert.include(err.message, 'InsufficientStake');
    }
  });
});
```

Run with:
```bash
anchor test  # starts local validator, deploys, runs tests
```

### LiteSVM (Rust unit tests)

```rust
// programs/limer-staking/tests/integration.rs
use litesvm::LiteSVM;
use solana_sdk::{signature::Keypair, signer::Signer, transaction::Transaction};

#[test]
fn test_initialize() {
    let mut svm = LiteSVM::new();
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 10_000_000_000).unwrap();

    // Deploy your program
    let program_id = svm.deploy_program("path/to/program.so");

    // Build and send transaction
    let ix = /* build your instruction */;
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&payer.pubkey()),
        &[&payer],
        svm.latest_blockhash(),
    );

    let result = svm.send_transaction(tx);
    assert!(result.is_ok());
}
```

### Frontend testing with devnet

```js
// src/solana/__tests__/accounts.test.js
import { describe, it, expect } from 'vitest';
import { createRpc } from '../config';
import { fetchSolBalance } from '../accounts';

describe('fetchSolBalance', () => {
  it('fetches balance for a known devnet address', async () => {
    const rpc = createRpc('devnet');
    // Use a known funded devnet address for testing
    const balance = await fetchSolBalance(rpc, 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg');
    expect(balance.sol).toBeGreaterThanOrEqual(0);
    expect(balance.lamports).toBeDefined();
  });
});
```

### Local validator for E2E

```bash
# Start local validator
solana-test-validator

# In another terminal, run your app pointing to localhost
VITE_SOLANA_RPC_URL=http://127.0.0.1:8899 npm run dev

# Airdrop test SOL
solana airdrop 100 <your-wallet-address> --url http://127.0.0.1:8899
```

### Test checklist for caribcryptomap

```
Phase 1 (Wallet):
  [ ] Wallet connects via Solflare
  [ ] Wallet connects via Phantom
  [ ] Disconnect clears state
  [ ] Paper trading still works after wallet upgrade (regression)
  [ ] Network toggle switches between devnet/mainnet

Phase 2 (Reads):
  [ ] SOL balance displays correctly
  [ ] Token accounts list with correct balances
  [ ] Balances refresh on interval
  [ ] Disconnecting wallet clears on-chain data

Phase 3 (Writes):
  [ ] SOL transfer sends correct amount
  [ ] Jupiter quote returns valid data
  [ ] Swap executes and confirms
  [ ] Slippage protection works
  [ ] Insufficient balance shows error

Phase 4 (Programs):
  [ ] Stake pool initializes
  [ ] Staking deposits tokens
  [ ] Unstaking returns tokens
  [ ] Rewards accrue correctly
  [ ] Tier calculation matches tokenomics.js
```

## Explanation

- **LiteSVM**: Runs the Solana Virtual Machine in-process. No network needed. Best for Rust unit tests
- **Anchor test**: Full integration tests with a local validator. Best for testing complete instruction flows
- **Devnet testing**: Use for frontend integration. Free SOL via `solana airdrop`
- **Vitest**: The project uses Vite, so Vitest is the natural choice for frontend tests

## Gotchas

- **Local validator state**: `solana-test-validator` starts fresh each time. Use `--reset` to clear
- **Devnet rate limits**: Airdrop is limited to 2 SOL per request, can be rate-limited
- **Clock-dependent tests**: If your program uses `Clock::get()`, use LiteSVM's `set_sysvar` to control time
- **Account size in tests**: Anchor tests may fail if account space doesn't match the `space` parameter in `init`
- **Program deploy size**: Programs have a max size of ~1.2MB (BPF). Check with `anchor build` output

## References

- [LiteSVM](https://github.com/LiteSVM/litesvm)
- [Mollusk](https://github.com/buffalojoec/mollusk)
- [Anchor Testing](https://www.anchor-lang.com/docs/testing)
- [solana-test-validator](https://docs.solana.com/developing/test-validator)
