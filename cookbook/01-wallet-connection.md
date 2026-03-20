# 01 — Wallet Connection

## Problem

Connect to Solana wallets (Solflare, Phantom, Backpack) in a React app using the wallet standard, without hard-coding support for any single provider.

## Solution

### Install dependencies

```bash
npm install @solana/kit @solana/react @solana/wallet-standard-features @wallet-standard/app
```

### Create a Solana provider

```jsx
// src/solana/provider.jsx
import { createSolanaRpc } from '@solana/kit';
import { SolanaProvider } from '@solana/react';
import { createContext, useContext, useMemo } from 'react';

const RpcContext = createContext(null);

const ENDPOINTS = {
  devnet: 'https://api.devnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
};

export function AppSolanaProvider({ cluster = 'devnet', children }) {
  const rpc = useMemo(() => {
    const url = import.meta.env.VITE_SOLANA_RPC_URL || ENDPOINTS[cluster];
    return createSolanaRpc(url);
  }, [cluster]);

  return (
    <RpcContext.Provider value={rpc}>
      <SolanaProvider>
        {children}
      </SolanaProvider>
    </RpcContext.Provider>
  );
}

export function useRpc() {
  return useContext(RpcContext);
}
```

### Wrap your app

```jsx
// src/main.jsx
import { AppSolanaProvider } from './solana/provider';

createRoot(document.getElementById('root')).render(
  <AppSolanaProvider cluster="devnet">
    <App />
  </AppSolanaProvider>
);
```

### Use wallet hooks in components

```jsx
import { useWallets, useConnect, useDisconnect, useWalletAccount } from '@solana/react';

function WalletButton() {
  const wallets = useWallets();       // all detected wallets
  const [connect] = useConnect();      // connect function
  const [disconnect] = useDisconnect();
  const account = useWalletAccount();  // currently connected account

  if (account) {
    return (
      <div>
        <span>{account.address.slice(0, 4)}...{account.address.slice(-4)}</span>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {wallets.map(wallet => (
        <button key={wallet.name} onClick={() => connect(wallet)}>
          Connect {wallet.name}
        </button>
      ))}
    </div>
  );
}
```

## Explanation

The **Wallet Standard** is a protocol that lets any wallet register itself with the browser. `@solana/react` auto-detects all wallets that implement the standard — no need to install adapter packages for each wallet.

- `useWallets()` returns all detected wallet extensions
- `useConnect()` triggers the wallet's connection flow
- `useWalletAccount()` returns the connected account (address, public key)
- `useSignTransaction()` and `useSignMessage()` handle signing

This replaces the old pattern of directly calling `window.solflare.connect()`.

## Gotchas

- **Wallet must be installed**: If no wallets are detected, show a "Get a wallet" link (e.g., to Solflare or Phantom download pages)
- **Multiple accounts**: Some wallets support multiple accounts. `useWalletAccount()` returns the active one
- **SSR**: `@solana/react` hooks only work client-side. If using SSR/Next.js, wrap in a client-only boundary
- **Autoconnect**: The wallet standard doesn't auto-reconnect by default. Store the last wallet name and reconnect on mount if desired
- **Buffer polyfill**: Some wallet extensions still inject code that references Node's `Buffer`. You may need to add a polyfill to `vite.config.js`

## References

- [Wallet Standard Specification](https://github.com/wallet-standard/wallet-standard)
- [@solana/react docs](https://github.com/solana-labs/solana-web3.js/tree/master/packages/react)
- [Solana Cookbook — Wallets](https://solana.com/developers/cookbook/wallets)
