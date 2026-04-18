import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { BN } from '@anchor-lang/core';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import ammPools from './generated/amm-pools.json';
import { CLUSTERS, DEFAULT_CLUSTER } from './config';
import { getLimerAmmProgram } from './amm-program';

/**
 * Swap utilities + mutation plumbing for limer_amm pools.
 *
 * Pools (static from `generated/amm-pools.json`) hold the canonical A/B
 * ordering, vault pubkeys, and LP mint per pair. This module provides:
 *
 *   - `findPool({mintX, mintY})`        — locate a pool regardless of which
 *                                         side the caller thinks is "input"
 *   - `quoteSwap({pool, amountIn, from})` — read on-chain reserves, apply
 *                                           the constant-product formula net
 *                                           of fee, return amountOut + price
 *                                           impact + minAmountOut (slippage)
 *   - `buildSwapTx({pool, wallet, ...})` — produces an unsigned Transaction
 *                                          the caller signs + sends via
 *                                          wallet-standard
 *   - `executeSwap({...})`               — one-shot: quote → build → sign →
 *                                          send → poll confirmation
 *
 * See `anchor/programs/limer_amm/DESIGN.md` §4 for the constant-product math.
 */

// ── Fee + math constants (must match anchor/programs/limer_amm/src/math.rs) ──
const BPS_DENOMINATOR = 10_000n;

/**
 * Find the pool record for a given mint pair. Normalizes the lookup so
 * callers can pass mints in either order.
 */
export function findPool(mintX, mintY) {
  const x = String(mintX);
  const y = String(mintY);
  return (
    ammPools.find(
      (p) =>
        (p.mintA === x && p.mintB === y) || (p.mintA === y && p.mintB === x),
    ) || null
  );
}

/** All pools that include a given mint (for "which pools is mTTDC in?"). */
export function poolsContaining(mintStr) {
  return ammPools.filter((p) => p.mintA === mintStr || p.mintB === mintStr);
}

/** Full registry — for listing purposes. */
export function listPools() {
  return ammPools;
}

/**
 * Fetch on-chain reserves for a pool by looking at the two vault token
 * accounts. Returns `{ reserveA, reserveB, feeBps }` — all raw units.
 */
export async function readPoolState(connection, pool) {
  const [vaultAInfo, vaultBInfo] = await Promise.all([
    connection.getTokenAccountBalance(new PublicKey(pool.tokenAVault)),
    connection.getTokenAccountBalance(new PublicKey(pool.tokenBVault)),
  ]);
  return {
    reserveA: BigInt(vaultAInfo.value.amount),
    reserveB: BigInt(vaultBInfo.value.amount),
    feeBps: BigInt(pool.feeBps ?? 30),
  };
}

/**
 * Constant-product output, matching anchor math::swap_out_amount exactly.
 * Rounds DOWN in favor of the pool.
 *
 * @param amountIn       raw input amount (bigint)
 * @param reserveIn      raw pool reserve of the input side
 * @param reserveOut     raw pool reserve of the output side
 * @param feeBps         swap fee in basis points (usually 30)
 */
export function computeAmountOut(amountIn, reserveIn, reserveOut, feeBps) {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const feeNumer = BPS_DENOMINATOR - feeBps;
  const amountInWithFee = amountIn * feeNumer;
  const numerator = reserveOut * amountInWithFee;
  const denominator = reserveIn * BPS_DENOMINATOR + amountInWithFee;
  const out = numerator / denominator;
  return out >= reserveOut ? 0n : out;
}

/**
 * Quote a swap: given a pool, direction, and input amount, compute the
 * expected output + price impact + safe minAmountOut at the requested
 * slippage tolerance.
 */
export async function quoteSwap({
  connection,
  pool,
  amountIn,    // bigint (raw units)
  fromMint,    // PublicKey or string — the side the user is sending
  slippageBps = 50n,  // default 0.50%
}) {
  if (!pool) return null;
  const { reserveA, reserveB, feeBps } = await readPoolState(connection, pool);
  const fromStr = String(fromMint);
  const isAtoB = fromStr === pool.mintA;
  if (!isAtoB && fromStr !== pool.mintB) {
    throw new Error(`fromMint ${fromStr} is not part of pool ${pool.pool}`);
  }

  const reserveIn = isAtoB ? reserveA : reserveB;
  const reserveOut = isAtoB ? reserveB : reserveA;
  const amountOut = computeAmountOut(amountIn, reserveIn, reserveOut, feeBps);

  // Minimum output after user slippage tolerance (rounded down).
  const slipFactor = BPS_DENOMINATOR - BigInt(slippageBps);
  const minAmountOut = (amountOut * slipFactor) / BPS_DENOMINATOR;

  // Price impact: (mid_before - mid_after) / mid_before
  // Using integer math with a *1e6 scale for readable percentages.
  let priceImpactBps = 0n;
  if (reserveIn > 0n && reserveOut > 0n && amountOut > 0n) {
    // reserves AFTER the hypothetical swap (without fee baked in for simplicity)
    const newReserveIn = reserveIn + amountIn;
    const newReserveOut = reserveOut - amountOut;
    // price = reserveOut / reserveIn. Compare before vs after.
    // delta% = (oldPrice - newPrice) / oldPrice
    // Scaled: (reserveOut * newReserveIn - newReserveOut * reserveIn) / (reserveOut * newReserveIn)
    const before = reserveOut * newReserveIn;
    const after = newReserveOut * reserveIn;
    const num = before > after ? before - after : 0n;
    priceImpactBps = (num * BPS_DENOMINATOR) / before;
  }

  return {
    isAtoB,
    direction: isAtoB ? 0 : 1,
    amountIn,
    amountOut,
    minAmountOut,
    reserveIn,
    reserveOut,
    feeBps,
    priceImpactBps,
  };
}

/**
 * Build the unsigned swap transaction. Ensures both trader ATAs exist
 * (idempotent creation), then adds the swap instruction.
 *
 * Returns a Transaction with feePayer set. Caller sets recentBlockhash +
 * signs via wallet-standard.
 */
export async function buildSwapTx({
  program,          // Anchor Program instance
  pool,             // pool record from amm-pools.json
  traderPubkey,     // PublicKey
  amountIn,         // bigint
  minAmountOut,     // bigint
  direction,        // 0 = A→B, 1 = B→A
}) {
  const mintA = new PublicKey(pool.mintA);
  const mintB = new PublicKey(pool.mintB);
  const traderAtaA = await getAssociatedTokenAddress(mintA, traderPubkey);
  const traderAtaB = await getAssociatedTokenAddress(mintB, traderPubkey);

  const preIxs = [
    createAssociatedTokenAccountIdempotentInstruction(
      traderPubkey,
      traderAtaA,
      traderPubkey,
      mintA,
      TOKEN_PROGRAM_ID,
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      traderPubkey,
      traderAtaB,
      traderPubkey,
      mintB,
      TOKEN_PROGRAM_ID,
    ),
  ];

  const swapIx = await program.methods
    .swap(new BN(amountIn.toString()), new BN(minAmountOut.toString()), direction)
    .accounts({
      pool: new PublicKey(pool.pool),
      poolAuthority: new PublicKey(pool.poolAuthority),
      tokenAVault: new PublicKey(pool.tokenAVault),
      tokenBVault: new PublicKey(pool.tokenBVault),
      traderTokenA: traderAtaA,
      traderTokenB: traderAtaB,
      trader: traderPubkey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const tx = new Transaction();
  tx.add(...preIxs, swapIx);
  tx.feePayer = traderPubkey;
  return tx;
}

/**
 * Confirm a transaction via HTTP polling (getSignatureStatuses). Compatible
 * with Cloudflare Workers + matches the pattern in workers/faucet.js.
 */
export async function pollConfirm(connection, signature, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const statuses = await connection.getSignatureStatuses([signature]);
    const s = statuses?.value?.[0];
    if (s && (s.confirmationStatus === 'confirmed' || s.confirmationStatus === 'finalized')) {
      if (s.err) {
        throw new Error(`Transaction reverted: ${JSON.stringify(s.err)}`);
      }
      return { signature, status: s.confirmationStatus };
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Transaction not confirmed within ${timeoutMs}ms: ${signature}`);
}

/**
 * Base58-encode a byte array. Minimal implementation to avoid pulling
 * `bs58` as a direct dep (it's already a transitive dep of web3.js but
 * the export path isn't stable across versions).
 */
function bs58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const b of bytes) num = num * 256n + BigInt(b);
  let out = '';
  while (num > 0n) {
    const rem = Number(num % 58n);
    out = alphabet[rem] + out;
    num = num / 58n;
  }
  // Preserve leading zeros
  for (const b of bytes) {
    if (b === 0) out = '1' + out;
    else break;
  }
  return out;
}

/**
 * Resolve the currently-connected wallet-standard Wallet matching a given
 * account. Uses the global wallet-standard registry (window.navigator.wallets)
 * which exposes the full Wallet interface with features keyed by name —
 * NOT @wallet-standard/react's useWallets() which returns wrapped objects
 * where `features` is an array of feature-name strings instead of the
 * implementation-keyed object we need.
 */
function resolveWalletForAccount(account) {
  if (typeof window === 'undefined') return null;
  const wallets = window.navigator?.wallets?.get?.() || [];
  return wallets.find((w) => w.accounts?.some((a) => a.address === account.address)) || null;
}

/**
 * One-shot swap using wallet-standard directly. Works with any wallet
 * that exposes either `solana:signAndSendTransaction` (preferred — modern
 * wallets) or `solana:signTransaction` (fallback — older wallets).
 *
 * CRITICAL: wallet-standard feature implementations live on the Wallet
 * object (`wallet.features['solana:signAndSendTransaction']`), NOT on the
 * account. We resolve the Wallet from the global registry — the pattern
 * JupiterSwap.jsx:143-164 uses and proves out.
 *
 * Flow:
 *   1. Refresh quote with current reserves (stale-price guard)
 *   2. Build unsigned tx
 *   3. Wallet-standard sign + send (one user prompt)
 *   4. Poll confirmation via HTTP
 *   5. Return { signature, quote, elapsed, solscanUrl }
 */
export async function executeSwap({
  account,         // wallet-standard WalletAccount (from useSelectedWalletAccount)
  pool,            // pool record
  amountIn,        // bigint
  slippageBps,     // bigint, default 50 = 0.50%
  fromMint,        // PublicKey or string — which side the trader sends
  cluster = DEFAULT_CLUSTER,
  onStatusChange,
}) {
  const emit = onStatusChange || (() => {});
  emit('quoting');

  if (!account) throw new Error('No account selected');

  const wallet = resolveWalletForAccount(account);
  if (!wallet) {
    throw new Error(
      'Could not resolve the connected wallet from window.navigator.wallets. ' +
        'Try reconnecting your wallet.',
    );
  }

  const features = wallet.features || {};
  const signAndSend = features['solana:signAndSendTransaction'];
  const signOnly = features['solana:signTransaction'];
  if (!signAndSend && !signOnly) {
    const available = Object.keys(features).join(', ') || '(none)';
    throw new Error(
      `Wallet "${wallet.name || 'unknown'}" exposes no signing feature. ` +
        `Available features: ${available}`,
    );
  }

  const traderPubkey = new PublicKey(account.address);

  // Stub wallet for Anchor — Anchor requires a wallet shape to instantiate
  // a Program, but we only need it to build the instruction (not sign).
  // The actual signing happens below via wallet-standard.
  const stubWallet = {
    publicKey: traderPubkey,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
  const program = await getLimerAmmProgram(stubWallet, cluster);
  if (!program) throw new Error('limer_amm program client unavailable');
  const connection = program.provider.connection;

  const quote = await quoteSwap({
    connection,
    pool,
    amountIn,
    fromMint,
    slippageBps: slippageBps ?? 50n,
  });
  if (!quote || quote.amountOut <= 0n) {
    throw new Error('Swap would produce zero output — pool too shallow');
  }

  emit('building');
  const tx = await buildSwapTx({
    program,
    pool,
    traderPubkey,
    amountIn: quote.amountIn,
    minAmountOut: quote.minAmountOut,
    direction: quote.direction,
  });

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = traderPubkey;

  const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });

  emit('signing');
  const start = Date.now();
  let sig;

  if (signAndSend) {
    // Preferred path — wallet handles signing + sending in one user prompt.
    // Matches JupiterSwap.jsx:163 pattern: pass the single tx bytes + account.
    const chain = `solana:${cluster === 'mainnet-beta' ? 'mainnet' : cluster}`;
    const result = await signAndSend.signAndSendTransaction({
      account,
      transaction: serialized,
      chain,
    });
    // Different wallets return different shapes. Normalize to base58 string.
    const sigBytes =
      result?.signature ||
      result?.[0]?.signature ||
      (Array.isArray(result) ? result[0] : null);
    if (!sigBytes) throw new Error('Wallet did not return a signature');
    sig = bs58Encode(sigBytes instanceof Uint8Array ? sigBytes : new Uint8Array(sigBytes));
  } else {
    // Fallback — wallet signs, we send
    const { signedTransactions } = await signOnly.signTransaction({
      account,
      transactions: [serialized],
    });
    const signedBytes = signedTransactions[0] instanceof Uint8Array
      ? signedTransactions[0]
      : new Uint8Array(signedTransactions[0]);
    emit('sending');
    sig = await connection.sendRawTransaction(signedBytes, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
  }

  emit('confirming');
  await pollConfirm(connection, sig);

  emit('success');
  return {
    signature: sig,
    quote,
    elapsedMs: Date.now() - start,
    solscanUrl: `https://solscan.io/tx/${sig}?cluster=${cluster === 'mainnet-beta' ? 'mainnet' : cluster}`,
  };
}
