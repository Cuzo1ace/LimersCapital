# 06 — PDAs & Programs

## Problem

Interact with on-chain Solana programs using Program Derived Addresses (PDAs) for deterministic account storage.

## Solution

### What is a PDA?

A PDA is a deterministic address derived from a program ID + seeds. It has no private key — only the program can sign for it.

```
PDA = findProgramAddress([seed1, seed2, ...], programId)
```

### Derive a PDA (client-side)

```js
import { getProgramDerivedAddress, getAddressEncoder, address } from '@solana/kit';

const PROGRAM_ID = address('YourProgramId11111111111111111111111111111');

// Example: User's staking account PDA
async function getStakePda(userAddress) {
  const encoder = getAddressEncoder();
  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: PROGRAM_ID,
    seeds: [
      Buffer.from('stake'),
      encoder.encode(address(userAddress)),
    ],
  });
  return { pda, bump };
}
```

### Common PDA patterns

```
Global config:       seeds = ["config"]
User-specific data:  seeds = ["user", user_pubkey]
Token vault:         seeds = ["vault", mint_pubkey]
Order/ticket:        seeds = ["order", user_pubkey, order_id]
```

### Call a program instruction (using Anchor client)

```js
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from './idl/my_program.json';

// Set up the provider and program
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
const program = new Program(idl, PROGRAM_ID, provider);

// Call an instruction
const tx = await program.methods
  .stake(new BN(1_000_000_000)) // 1 token
  .accounts({
    user: wallet.publicKey,
    stakeAccount: stakePda,
    tokenAccount: userAta,
    vault: vaultPda,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Fetch program account data

```js
// Using Anchor
const stakeData = await program.account.userStake.fetch(stakePda);
console.log('Staked amount:', stakeData.amount.toString());
console.log('Staked at:', new Date(stakeData.stakedAt * 1000));

// Using raw RPC
const accountInfo = await rpc.getAccountInfo(stakePda, { encoding: 'base64' }).send();
// Manually decode using borsh or your IDL's codec
```

### Listen for account changes

```js
// Subscribe to account updates (WebSocket)
const subscriptions = createRpcSubscriptions('devnet');
const sub = await subscriptions.accountNotifications(stakePda, { encoding: 'jsonParsed' });

for await (const notification of sub) {
  console.log('Account updated:', notification);
}
```

## Explanation

- **PDAs** are the primary storage mechanism on Solana. They replace databases for on-chain state
- **Seeds** make PDAs deterministic — same seeds always produce the same address
- **Bump seed**: PDAs must not be on the ed25519 curve. The bump is a byte that ensures this. Always store/use the canonical bump
- **Program ownership**: Only the program that derived the PDA can modify the account data
- **Anchor**: Simplifies program interaction by generating typed clients from IDL (Interface Definition Language)

## Gotchas

- **PDA ≠ keypair**: You cannot sign with a PDA from the client. Only the program can use `invoke_signed` with the PDA's seeds
- **Account size**: PDA accounts have a fixed size set at creation. Plan your data layout carefully
- **Rent**: Accounts must hold enough SOL for rent exemption (~0.002 SOL per KB). Use `getMinimumBalanceForRentExemption`
- **Seeds encoding**: Seeds are raw bytes. Encode strings as UTF-8, public keys as 32-byte arrays, numbers as little-endian
- **Reinitialization attacks**: Always check `is_initialized` when creating accounts. Anchor's `init` constraint handles this
- **Account discriminator**: Anchor uses an 8-byte discriminator at the start of each account. Don't forget this when sizing accounts

## References

- [Solana Cookbook — PDAs](https://solana.com/developers/cookbook/accounts/create-pda)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Program Derived Addresses](https://solana.com/docs/core/pda)
