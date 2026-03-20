# 02 — RPC & Accounts

## Problem

Connect to Solana RPC nodes and query on-chain data: SOL balances, token accounts, and account info.

## Solution

### Create an RPC client

```js
// src/solana/config.js
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

export const CLUSTERS = {
  devnet: {
    rpc: 'https://api.devnet.solana.com',
    ws: 'wss://api.devnet.solana.com',
    label: 'Devnet',
  },
  'mainnet-beta': {
    rpc: 'https://api.mainnet-beta.solana.com',
    ws: 'wss://api.mainnet-beta.solana.com',
    label: 'Mainnet',
  },
};

export function createRpc(cluster = 'devnet') {
  const url = import.meta.env.VITE_SOLANA_RPC_URL || CLUSTERS[cluster].rpc;
  return createSolanaRpc(url);
}

export function createRpcSubscriptions(cluster = 'devnet') {
  const url = CLUSTERS[cluster].ws;
  return createSolanaRpcSubscriptions(url);
}
```

### Fetch SOL balance

```js
// src/solana/accounts.js
import { lamports, address } from '@solana/kit';

export async function fetchSolBalance(rpc, walletAddress) {
  const addr = address(walletAddress);
  const { value: balanceLamports } = await rpc.getBalance(addr).send();
  return {
    lamports: balanceLamports,
    sol: Number(balanceLamports) / 1e9,
  };
}
```

### Fetch SPL token accounts

```js
import { address } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS } from '@solana/spl-token';

export async function fetchTokenAccounts(rpc, walletAddress) {
  const owner = address(walletAddress);
  const { value: accounts } = await rpc.getTokenAccountsByOwner(
    owner,
    { programId: TOKEN_PROGRAM_ADDRESS },
    { encoding: 'jsonParsed' }
  ).send();

  return accounts.map(({ pubkey, account }) => {
    const parsed = account.data.parsed.info;
    return {
      address: pubkey,
      mint: parsed.mint,
      balance: parsed.tokenAmount.uiAmount,
      decimals: parsed.tokenAmount.decimals,
      rawAmount: parsed.tokenAmount.amount,
    };
  });
}
```

### Fetch specific account info

```js
export async function fetchAccountInfo(rpc, accountAddress) {
  const addr = address(accountAddress);
  const { value: info } = await rpc.getAccountInfo(addr, {
    encoding: 'jsonParsed',
  }).send();

  if (!info) return null;

  return {
    owner: info.owner,
    lamports: info.lamports,
    data: info.data,
    executable: info.executable,
  };
}
```

### React hook for balance

```jsx
// src/solana/hooks.js
import { useQuery } from '@tanstack/react-query';
import { useRpc } from './provider';
import { fetchSolBalance, fetchTokenAccounts } from './accounts';

export function useWalletBalance(walletAddress) {
  const rpc = useRpc();

  return useQuery({
    queryKey: ['sol-balance', walletAddress],
    queryFn: () => fetchSolBalance(rpc, walletAddress),
    enabled: !!walletAddress && !!rpc,
    refetchInterval: 30_000, // 30s
  });
}

export function useTokenAccounts(walletAddress) {
  const rpc = useRpc();

  return useQuery({
    queryKey: ['token-accounts', walletAddress],
    queryFn: () => fetchTokenAccounts(rpc, walletAddress),
    enabled: !!walletAddress && !!rpc,
    refetchInterval: 30_000,
  });
}
```

## Explanation

- `createSolanaRpc()` creates a JSON-RPC client. All RPC methods return a builder with `.send()` to execute
- `address()` validates and wraps a base58 string into the proper address type
- `getBalance` returns lamports (1 SOL = 1,000,000,000 lamports)
- `getTokenAccountsByOwner` with `jsonParsed` encoding returns human-readable token data
- React Query handles caching, refetching, and loading/error states

## Gotchas

- **Rate limits**: Public RPC endpoints (api.devnet/mainnet) throttle at ~10 req/s. Use a paid provider (Helius, QuickNode) for production
- **Commitment levels**: Default is `finalized`. Use `confirmed` for faster reads, `processed` for lowest latency (but risk of rollback)
- **Large token portfolios**: `getTokenAccountsByOwner` can return many accounts. Paginate or limit display
- **Empty accounts**: Token accounts with 0 balance still exist and take rent. They can be closed to reclaim SOL
- **Encoding**: Always use `jsonParsed` for token accounts — raw binary parsing is error-prone

## References

- [Solana RPC Methods](https://solana.com/docs/rpc)
- [Solana Cookbook — Accounts](https://solana.com/developers/cookbook/accounts)
- [@solana/kit API](https://github.com/solana-labs/solana-web3.js)
