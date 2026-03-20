# 04 — SPL Tokens

## Problem

Create SPL token mints, manage associated token accounts, and transfer tokens between wallets.

## Solution

### Install

```bash
npm install @solana/spl-token
```

### Key concepts

```
Mint Account     → Defines a token (decimals, supply, authorities)
Token Account    → Holds a balance of a specific mint for an owner
ATA              → Associated Token Account (deterministic address per owner+mint)
Mint Authority   → Can mint new tokens
Freeze Authority → Can freeze token accounts
```

### Create a token mint (script, not frontend)

```js
import { createMint } from '@solana/spl-token';
import { Connection, Keypair } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const payer = Keypair.fromSecretKey(/* your keypair */);

const mint = await createMint(
  connection,
  payer,
  payer.publicKey,  // mint authority
  payer.publicKey,  // freeze authority (null to disable)
  9,                // decimals (9 = SOL-like precision)
);

console.log('Mint address:', mint.toBase58());
```

### Get or create Associated Token Account

```js
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

const ata = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,           // fee payer
  mint,            // token mint
  ownerPublicKey,  // token owner
);

console.log('ATA address:', ata.address.toBase58());
console.log('Balance:', ata.amount.toString());
```

### Transfer tokens

```js
import { transfer } from '@solana/spl-token';

const signature = await transfer(
  connection,
  payer,             // fee payer + signer
  sourceATA,         // source token account
  destinationATA,    // destination token account
  ownerPublicKey,    // owner of source account
  1_000_000_000n,    // amount in raw units (1 token with 9 decimals)
);
```

### Mint new tokens

```js
import { mintTo } from '@solana/spl-token';

const signature = await mintTo(
  connection,
  payer,            // fee payer
  mint,             // mint address
  destinationATA,   // where to send minted tokens
  mintAuthority,    // mint authority signer
  1_000_000_000n,   // amount (1 token with 9 decimals)
);
```

### Read token balance in the frontend

```js
// Using @solana/kit (modern approach)
export async function fetchTokenBalance(rpc, tokenAccountAddress) {
  const { value } = await rpc.getTokenAccountBalance(
    address(tokenAccountAddress)
  ).send();

  return {
    amount: value.amount,
    decimals: value.decimals,
    uiAmount: value.uiAmount,
  };
}
```

### Derive ATA address (no RPC call needed)

```js
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const ataAddress = getAssociatedTokenAddressSync(
  mintAddress,    // token mint
  ownerAddress,   // wallet owner
);
```

## Explanation

- **SPL Token Program**: The standard program for fungible tokens on Solana (like ERC-20 on Ethereum)
- **Associated Token Accounts (ATAs)**: Deterministic addresses derived from (owner, mint). One ATA per token per wallet
- **Decimals**: Most tokens use 6 (USDC) or 9 (SOL-like) decimals. Raw amounts are integers
- **Rent**: Token accounts require ~0.002 SOL for rent exemption. ATAs are created by the sender if needed
- **Token-2022**: The newer token program with extensions (confidential transfers, transfer fees, etc.)

## Gotchas

- **ATA creation cost**: Creating an ATA costs ~0.002 SOL rent. The sender usually pays
- **Raw vs UI amounts**: Always work with raw BigInt amounts internally. Only convert to UI amounts for display: `uiAmount = rawAmount / 10^decimals`
- **Mint authority**: Once revoked (set to null), no more tokens can be minted. This is often desired for trust
- **Freeze authority**: Can freeze any token account. Remove it if you don't need it (users trust tokens without freeze authority)
- **Close account**: Empty token accounts can be closed to reclaim rent SOL. Use `closeAccount()`
- **Token-2022 vs Token Program**: Some tokens use the new Token-2022 program. Check which program owns the mint

## References

- [SPL Token Docs](https://spl.solana.com/token)
- [Token-2022 Extensions](https://spl.solana.com/token-2022)
- [Solana Cookbook — Tokens](https://solana.com/developers/cookbook/tokens)
