# 03 — Transactions

## Problem

Build, sign, send, and confirm Solana transactions with proper fee handling and priority fee support.

## Solution

### Build a SOL transfer transaction

```js
// src/solana/transfer.js
import {
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  getSystemTransferInstruction,
  address,
  lamports,
} from '@solana/kit';

export async function buildSolTransfer(rpc, from, to, amountSol) {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transferIx = getSystemTransferInstruction({
    from: address(from),
    to: address(to),
    amount: lamports(BigInt(Math.round(amountSol * 1e9))),
  });

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    msg => setTransactionMessageFeePayer(msg, address(from)),
    msg => setTransactionMessageLifetimeUsingBlockhash(msg, latestBlockhash),
    msg => appendTransactionMessageInstruction(msg, transferIx),
  );

  return { message, latestBlockhash };
}
```

### Add priority fees (Compute Budget)

```js
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana/kit';

export function addPriorityFee(message, { computeUnits = 200_000, microLamports = 1000 } = {}) {
  return pipe(
    message,
    msg => appendTransactionMessageInstruction(msg, getSetComputeUnitLimitInstruction({ units: computeUnits })),
    msg => appendTransactionMessageInstruction(msg, getSetComputeUnitPriceInstruction({ microLamports })),
  );
}
```

### Sign and send

```js
// src/solana/signing.js
import { signTransaction, sendTransaction } from '@solana/kit';

export async function signAndSend(wallet, transactionMessage, rpc) {
  // Wallet signs the transaction
  const signedTx = await wallet.signTransaction(transactionMessage);

  // Send to network
  const signature = await sendTransaction(rpc, signedTx, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  return signature;
}
```

### Confirm transaction

```js
export async function confirmTransaction(rpc, signature, { timeout = 30_000, commitment = 'confirmed' } = {}) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const { value: status } = await rpc.getSignatureStatuses([signature]).send();

    if (status[0]) {
      if (status[0].err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status[0].err)}`);
      }
      if (status[0].confirmationStatus === commitment || status[0].confirmationStatus === 'finalized') {
        return status[0];
      }
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  throw new Error('Transaction confirmation timeout');
}
```

### Full flow in a React component

```jsx
function SendSOL({ recipientAddress, amount }) {
  const rpc = useRpc();
  const account = useWalletAccount();
  const [status, setStatus] = useState('idle');

  async function handleSend() {
    setStatus('building');
    const { message } = await buildSolTransfer(rpc, account.address, recipientAddress, amount);

    setStatus('signing');
    const signature = await signAndSend(account, message, rpc);

    setStatus('confirming');
    await confirmTransaction(rpc, signature);

    setStatus('confirmed');
  }

  return <button onClick={handleSend} disabled={status !== 'idle'}>{status}</button>;
}
```

## Explanation

- **Transaction Messages** in `@solana/kit` use a functional pipe pattern — compose instructions into an immutable message
- **Blockhash lifetime**: Every transaction needs a recent blockhash. Transactions expire after ~60-90 seconds
- **Priority fees**: Set compute unit price (in microLamports) to prioritize your transaction. Higher = faster inclusion
- **Signing**: The wallet extension handles signing — your app never sees private keys
- **Confirmation**: Poll `getSignatureStatuses` until the desired commitment level is reached

## Gotchas

- **Blockhash expiry**: If the user takes too long to sign, the blockhash expires. Re-fetch and rebuild the transaction
- **Preflight simulation**: By default, `sendTransaction` simulates first. Set `skipPreflight: true` only if you're sure the tx will succeed (saves latency)
- **Priority fee estimation**: For accurate priority fees, use `getRecentPrioritizationFees` RPC method to see what recent transactions paid
- **Transaction size**: Max 1232 bytes. Versioned transactions (v0) with Address Lookup Tables can reference more accounts
- **Compute units**: Default is 200K CU. Set to the actual amount needed to avoid overpaying. Simulate first to estimate

## References

- [Solana Cookbook — Transactions](https://solana.com/developers/cookbook/transactions)
- [Priority Fees Guide](https://solana.com/docs/core/fees)
- [Transaction Confirmation](https://solana.com/docs/advanced/confirmation)
