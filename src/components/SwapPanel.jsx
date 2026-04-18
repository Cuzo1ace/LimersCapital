import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelectedWalletAccount } from '@solana/react';
import { useWallets } from '@wallet-standard/react';
import { Connection, PublicKey } from '@solana/web3.js';
import useStore from '../store/useStore';
import { CLUSTERS, DEFAULT_CLUSTER } from '../solana/config';
import { listTokens, getToken } from '../solana/tokens';
import {
  findPool,
  quoteSwap,
  executeSwap,
  listPools,
} from '../solana/amm-swap';

/**
 * SwapPanel — mTTDC ↔ mStock swap UI powered by the limer_amm program.
 *
 * Uses wallet-standard (via @solana/react useSelectedWalletAccount) and
 * @anchor-lang/core through the helpers in src/solana/amm-swap.js. Matches
 * JupiterSwap's visual language (unified variant: #C46CFF accent, same
 * input / status banner styles).
 *
 * Design:
 *   - "You pay" side defaults to mTTDC (most common flow: buy local stock).
 *   - "You receive" side is selectable from any pool counterpart of the
 *     current "pay" token.
 *   - Quote fetches live on every amount/token change (debounced 400ms).
 *   - Swap button guards: wallet connected, amount > 0, quote fresh < 30s.
 */

const SLIPPAGE_OPTIONS = [
  { bps: 50n, label: '0.50%' },
  { bps: 100n, label: '1.00%' },
  { bps: 300n, label: '3.00%' },
];

const QUOTE_DEBOUNCE_MS = 400;
const QUOTE_STALE_MS = 30_000;

function humanToRaw(human, decimals) {
  if (!human || isNaN(+human)) return 0n;
  // Normalize to an exact raw integer via string manipulation to avoid FP drift
  const [intPart, fracPart = ''] = String(human).split('.');
  const padded = (fracPart + '0'.repeat(decimals)).slice(0, decimals);
  try {
    return BigInt(intPart || '0') * 10n ** BigInt(decimals) + BigInt(padded || '0');
  } catch {
    return 0n;
  }
}

function rawToHuman(raw, decimals, maxFrac = 4) {
  if (raw == null) return '—';
  const r = BigInt(raw);
  const divisor = 10n ** BigInt(decimals);
  const int = r / divisor;
  const frac = r % divisor;
  if (frac === 0n) return int.toString();
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, maxFrac).replace(/0+$/, '');
  if (!fracStr) return int.toString();
  return `${int}.${fracStr}`;
}

function bpsToPct(bps) {
  if (bps == null) return '0%';
  const n = Number(bps);
  if (Number.isNaN(n)) return '0%';
  return `${(n / 100).toFixed(2)}%`;
}

export default function SwapPanel() {
  // NOTE: useSelectedWalletAccount returns a [account] tuple (like useState).
  // We also need the Wallet object (not just the account) to access feature
  // implementations like solana:signAndSendTransaction. useWallets() from
  // @wallet-standard/react gives us the list of wallets; we match by account
  // address. Pattern mirrors JupiterSwap.jsx:143-164.
  const [selectedAccount] = useSelectedWalletAccount();
  const wallets = useWallets();
  const walletConnected = !!selectedAccount;
  const connectedWallet = useMemo(() => {
    if (!selectedAccount || !wallets?.length) return null;
    return wallets.find((w) =>
      w.accounts?.some((a) => a.address === selectedAccount.address),
    ) || null;
  }, [wallets, selectedAccount]);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const allTokens = useMemo(() => listTokens(DEFAULT_CLUSTER), []);
  const pools = useMemo(() => listPools(), []);

  // Defaults: pay mTTDC, receive mNEL (arbitrary — any mStock works)
  const mttdc = getToken('mTTDC', DEFAULT_CLUSTER);
  const firstMStock = allTokens.find((t) => t.category === 'equity') || null;

  const [payToken, setPayToken] = useState(mttdc);
  const [receiveToken, setReceiveToken] = useState(firstMStock);
  const [payAmount, setPayAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState(50n);

  const [quote, setQuote] = useState(null); // { amountOut, minAmountOut, priceImpactBps, fetchedAt }
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | quoting | building | signing | sending | confirming | success | error
  const [txSig, setTxSig] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Valid receive-token options = any token that shares a pool with the pay token
  const receiveOptions = useMemo(() => {
    if (!payToken) return [];
    return allTokens.filter((t) => t.mint !== payToken.mint && !!findPool(payToken.mint, t.mint));
  }, [payToken, allTokens, pools]);

  const activePool = useMemo(() => {
    if (!payToken || !receiveToken) return null;
    return findPool(payToken.mint, receiveToken.mint);
  }, [payToken, receiveToken]);

  // Keep receiveToken valid when payToken changes
  useEffect(() => {
    if (!receiveOptions.length) {
      setReceiveToken(null);
      return;
    }
    if (!receiveToken || !receiveOptions.some((t) => t.mint === receiveToken.mint)) {
      setReceiveToken(receiveOptions[0]);
    }
  }, [receiveOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced quote fetch ─────────────────────────────────────────
  useEffect(() => {
    setQuoteError(null);
    if (!activePool || !payAmount || !(+payAmount > 0)) {
      setQuote(null);
      return;
    }
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const rpc = CLUSTERS[DEFAULT_CLUSTER].rpc;
        const connection = new Connection(rpc, 'confirmed');
        const amountIn = humanToRaw(payAmount, payToken.decimals);
        const q = await quoteSwap({
          connection,
          pool: activePool,
          amountIn,
          fromMint: payToken.mint,
          slippageBps,
        });
        setQuote({
          ...q,
          fetchedAt: Date.now(),
        });
      } catch (err) {
        setQuoteError(String(err?.message || err).slice(0, 200));
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }, QUOTE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [activePool, payAmount, slippageBps, payToken]);

  const handleFlip = useCallback(() => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
    setPayAmount('');
    setQuote(null);
    setStatus('idle');
  }, [payToken, receiveToken]);

  const handleSwap = useCallback(async () => {
    setStatus('idle');
    setErrorMsg(null);
    setTxSig(null);

    if (!selectedAccount) {
      setErrorMsg('Connect a devnet wallet first.');
      setStatus('error');
      return;
    }
    if (!activePool) {
      setErrorMsg('No pool exists for this pair.');
      setStatus('error');
      return;
    }
    if (!quote || quote.amountOut <= 0n) {
      setErrorMsg('No valid quote — try a different amount.');
      setStatus('error');
      return;
    }
    if (Date.now() - quote.fetchedAt > QUOTE_STALE_MS) {
      setErrorMsg('Quote stale — click Refresh and try again.');
      setStatus('error');
      return;
    }

    if (!connectedWallet) {
      setErrorMsg('Could not find your wallet in the wallet-standard registry. Try reconnecting.');
      setStatus('error');
      return;
    }

    try {
      const result = await executeSwap({
        wallet: connectedWallet,
        account: selectedAccount,
        pool: activePool,
        amountIn: quote.amountIn,
        slippageBps,
        fromMint: payToken.mint,
        cluster: DEFAULT_CLUSTER,
        onStatusChange: (s) => setStatus(s),
      });
      setTxSig(result.signature);
      setStatus('success');
      // Clear input after success so user can enter a fresh amount
      setPayAmount('');
      setQuote(null);
    } catch (err) {
      setErrorMsg(String(err?.message || err).slice(0, 240));
      setStatus('error');
    }
  }, [selectedAccount, activePool, quote, slippageBps, payToken]);

  const canSwap =
    walletConnected &&
    !!activePool &&
    !!quote &&
    quote.amountOut > 0n &&
    !['building', 'signing', 'sending', 'confirming'].includes(status);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-[#C46CFF]/20 bg-black/30 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <h3 className="text-base font-semibold" style={{ color: '#C46CFF' }}>
            Swap · Limer AMM
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            mTTDC ↔ mStock · devnet · our own AMM, not Jupiter
          </p>
        </div>
        <div className="flex gap-1 text-[11px]">
          {SLIPPAGE_OPTIONS.map((opt) => (
            <button
              key={String(opt.bps)}
              onClick={() => setSlippageBps(opt.bps)}
              className={`px-2 py-1 rounded border ${
                slippageBps === opt.bps
                  ? 'border-[#C46CFF]/60 bg-[#C46CFF]/15 text-[#C46CFF]'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pay */}
      <div className="rounded-xl border border-white/10 bg-black/40 p-3 mb-2">
        <div className="flex items-center justify-between text-[11px] text-white/50 mb-1.5">
          <span>You pay</span>
          <span>{payToken?.symbol || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.0"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-white/20"
          />
          <select
            value={payToken?.symbol || ''}
            onChange={(e) => {
              const t = getToken(e.target.value, DEFAULT_CLUSTER);
              if (t) setPayToken(t);
            }}
            className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
          >
            {allTokens.map((t) => (
              <option key={t.mint} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flip */}
      <div className="flex justify-center my-1">
        <button
          onClick={handleFlip}
          className="w-8 h-8 rounded-full border border-white/10 bg-black/50 text-white/60 hover:border-[#C46CFF]/60 hover:text-[#C46CFF] transition"
          title="Flip pay/receive"
        >
          ⇅
        </button>
      </div>

      {/* Receive */}
      <div className="rounded-xl border border-white/10 bg-black/40 p-3 mb-3">
        <div className="flex items-center justify-between text-[11px] text-white/50 mb-1.5">
          <span>You receive (est.)</span>
          <span>{receiveToken?.symbol || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={
              quote && receiveToken
                ? rawToHuman(quote.amountOut, receiveToken.decimals, 6)
                : quoteLoading
                  ? 'Fetching…'
                  : ''
            }
            placeholder="0.0"
            className="flex-1 bg-transparent text-2xl font-semibold text-white/80 outline-none placeholder:text-white/20"
          />
          <select
            value={receiveToken?.symbol || ''}
            onChange={(e) => {
              const t = getToken(e.target.value, DEFAULT_CLUSTER);
              if (t) setReceiveToken(t);
            }}
            className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
            disabled={!receiveOptions.length}
          >
            {receiveOptions.length === 0 && <option value="">—</option>}
            {receiveOptions.map((t) => (
              <option key={t.mint} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quote details */}
      {quote && (
        <div className="text-[11px] text-white/50 mb-3 space-y-1">
          <div className="flex justify-between">
            <span>Minimum received (slippage {bpsToPct(Number(slippageBps))})</span>
            <span className="text-white/80">
              {rawToHuman(quote.minAmountOut, receiveToken.decimals, 6)} {receiveToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Price impact</span>
            <span className={Number(quote.priceImpactBps) > 300 ? 'text-coral' : 'text-white/80'}>
              {bpsToPct(Number(quote.priceImpactBps))}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Fee</span>
            <span className="text-white/80">{bpsToPct(Number(quote.feeBps))}</span>
          </div>
          <div className="flex justify-between">
            <span>Pool</span>
            <span className="text-white/40 font-mono">{activePool?.pool.slice(0, 8)}…</span>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && errorMsg && (
        <div className="mb-3 rounded-lg border border-coral/30 bg-coral/10 p-2 text-xs text-coral">
          {errorMsg}
        </div>
      )}
      {quoteError && !errorMsg && (
        <div className="mb-3 rounded-lg border border-coral/30 bg-coral/10 p-2 text-xs text-coral">
          Quote error: {quoteError}
        </div>
      )}

      {/* Success */}
      {status === 'success' && txSig && (
        <div className="mb-3 rounded-lg border border-palm/30 bg-palm/10 p-2 text-xs text-palm">
          Swap confirmed. Tx:{' '}
          <a
            href={`https://solscan.io/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {txSig.slice(0, 16)}…
          </a>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleSwap}
        disabled={!canSwap}
        className="w-full py-3 rounded-xl font-semibold text-black transition disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#C46CFF' }}
      >
        {!walletConnected
          ? 'Connect wallet to swap'
          : !activePool
            ? 'No pool for this pair'
            : status === 'building' || status === 'signing'
              ? 'Sign in wallet…'
              : status === 'sending'
                ? 'Sending…'
                : status === 'confirming'
                  ? 'Confirming…'
                  : status === 'quoting' || quoteLoading
                    ? 'Quoting…'
                    : `Swap ${payToken?.symbol || ''} → ${receiveToken?.symbol || ''}`}
      </button>

      <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-white/35">
        AMM program: FVk7Lzd…Bpwo · 6 pools · 30 bps fee · devnet only
      </div>
    </div>
  );
}
