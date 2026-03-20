# 05 — Jupiter Integration

## Problem

Swap tokens on Solana using Jupiter's aggregation API for best prices with slippage protection.

## Solution

### Jupiter API endpoints

```js
// src/solana/jupiter.js
const JUPITER_API = 'https://quote-api.jup.ag/v6';
```

### Get a swap quote

```js
export async function fetchJupiterQuote({
  inputMint,
  outputMint,
  amount,          // raw amount (integer string)
  slippageBps = 50, // 0.5% default
}) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: 'false',
    asLegacyTransaction: 'false',
  });

  const res = await fetch(`${JUPITER_API}/quote?${params}`);
  if (!res.ok) throw new Error(`Jupiter quote failed: ${res.status}`);
  const quote = await res.json();

  return {
    inputAmount: quote.inAmount,
    outputAmount: quote.outAmount,
    priceImpactPct: quote.priceImpactPct,
    routePlan: quote.routePlan,
    raw: quote, // pass to swap endpoint
  };
}
```

### Build a swap transaction

```js
export async function fetchJupiterSwapTransaction(quoteResponse, userPublicKey) {
  const res = await fetch(`${JUPITER_API}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });

  if (!res.ok) throw new Error(`Jupiter swap failed: ${res.status}`);
  const { swapTransaction } = await res.json();

  return swapTransaction; // base64-encoded versioned transaction
}
```

### Deserialize, sign, and send

```js
import { getTransactionDecoder } from '@solana/kit';

export async function executeJupiterSwap(wallet, rpc, quoteResponse, userPublicKey) {
  // 1. Get the swap transaction
  const swapTxBase64 = await fetchJupiterSwapTransaction(quoteResponse, userPublicKey);

  // 2. Deserialize
  const txBytes = Uint8Array.from(atob(swapTxBase64), c => c.charCodeAt(0));

  // 3. Sign with wallet
  const signedTx = await wallet.signTransaction(txBytes);

  // 4. Send
  const signature = await rpc.sendTransaction(signedTx, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  }).send();

  return signature;
}
```

### Full swap UI component

```jsx
function SwapPanel() {
  const rpc = useRpc();
  const account = useWalletAccount();
  const [inputMint, setInputMint] = useState(SOL_MINT);
  const [outputMint, setOutputMint] = useState(USDC_MINT);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState('idle');

  async function handleQuote() {
    const rawAmount = Math.round(parseFloat(amount) * 1e9).toString();
    const q = await fetchJupiterQuote({ inputMint, outputMint, amount: rawAmount });
    setQuote(q);
  }

  async function handleSwap() {
    if (!quote || !account) return;
    setStatus('signing');
    const sig = await executeJupiterSwap(account, rpc, quote.raw, account.address);
    setStatus('confirming');
    await confirmTransaction(rpc, sig);
    setStatus('done');
  }

  return (
    <div>
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" />
      <button onClick={handleQuote}>Get Quote</button>
      {quote && (
        <div>
          <p>You receive: {(Number(quote.outputAmount) / 1e6).toFixed(2)} USDC</p>
          <p>Price impact: {quote.priceImpactPct}%</p>
          <button onClick={handleSwap}>Swap</button>
        </div>
      )}
    </div>
  );
}
```

### Common mint addresses

```js
// Already defined in src/api/prices.js SOL_TOKENS
export const MINTS = {
  SOL:    'So11111111111111111111111111111111111111112',
  USDC:   'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT:   'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  JUP:    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY:    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  BONK:   'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};
```

## Explanation

- **Jupiter** is the leading DEX aggregator on Solana. It finds the best route across all DEXes (Raydium, Orca, Meteora, etc.)
- **Quote API**: Returns the expected output, price impact, and route plan. No signing needed
- **Swap API**: Returns a serialized transaction ready for wallet signing
- **slippageBps**: Basis points (100 bps = 1%). Protects against price movement between quote and execution
- **wrapAndUnwrapSol**: Automatically wraps native SOL to wSOL for swaps and unwraps back

## Gotchas

- **Slippage**: Default 50 bps (0.5%) is safe for major pairs. Increase for volatile/low-liquidity tokens
- **Price impact**: If > 1%, warn the user. If > 5%, strongly discourage
- **Quote expiry**: Quotes are valid for ~30 seconds. Re-quote if the user takes too long
- **Amount precision**: Input amounts must be in raw integer units (lamports for SOL, smallest unit for tokens). Always use the token's decimal places
- **Rate limiting**: Jupiter API has rate limits. Cache quotes for a few seconds
- **Versioned transactions**: Jupiter returns v0 transactions. Ensure your wallet supports versioned transactions (all modern wallets do)
- **Fees**: Jupiter charges no protocol fee. You pay network fees + DEX fees (baked into the quote)

## References

- [Jupiter API Docs](https://station.jup.ag/docs/apis/swap-api)
- [Jupiter Quote API](https://quote-api.jup.ag/v6/quote)
- [caribcryptomap prices.js](../src/api/prices.js) — existing Jupiter price integration
