import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import useStore from '../store/useStore';

/**
 * Jupiter V6 Swap API Integration
 * Real token swaps on Solana via Jupiter aggregator.
 * Uses Quote API → Swap API → wallet signs → send transaction.
 */

const JUP_API = 'https://api.jup.ag';
const POPULAR_TOKENS = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9, logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg' },
  { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6, logo: 'https://static.jup.ag/jup/icon.png' },
  { symbol: 'RAY', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6, logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png' },
  { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I' },
  { symbol: 'ONDO', mint: 'ONDO4ssPXuZ7o63SXHF5si6fLByPR7fhoSiWtCXEJUP', decimals: 9, logo: null },
  { symbol: 'HNT', mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', decimals: 8, logo: null },
];

const fmtNum = (n, dec = 4) => {
  if (n == null) return '—';
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(dec > 2 ? 2 : dec);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toPrecision(4);
};

export default function JupiterSwap({ variant } = {}) {
  const unified = variant === 'unified';
  const { walletConnected, walletAddress } = useStore();

  const [inputToken, setInputToken] = useState(POPULAR_TOKENS[0]); // SOL
  const [outputToken, setOutputToken] = useState(POPULAR_TOKENS[1]); // USDC
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState(50); // in bps (0.5%)
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [swapStatus, setSwapStatus] = useState(null); // null | 'signing' | 'sending' | 'success' | 'error'
  const [txSignature, setTxSignature] = useState(null);
  const [showSlippage, setShowSlippage] = useState(false);

  // Swap input/output tokens
  const handleFlip = useCallback(() => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount('');
    setQuoteData(null);
    setQuoteError(null);
  }, [inputToken, outputToken]);

  // Fetch quote from Jupiter
  const fetchQuote = useCallback(async () => {
    const amt = parseFloat(inputAmount);
    if (!amt || amt <= 0) return;

    setQuoteLoading(true);
    setQuoteError(null);
    setQuoteData(null);

    try {
      const amountLamports = Math.floor(amt * Math.pow(10, inputToken.decimals));
      const url = `${JUP_API}/quote?inputMint=${inputToken.mint}&outputMint=${outputToken.mint}&amount=${amountLamports}&slippageBps=${slippage}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Quote error: ${res.status}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setQuoteData(data);
    } catch (e) {
      setQuoteError(e.message);
    } finally {
      setQuoteLoading(false);
    }
  }, [inputAmount, inputToken, outputToken, slippage]);

  // Execute swap
  const executeSwap = useCallback(async () => {
    if (!quoteData || !walletAddress) return;

    setSwapStatus('signing');
    setTxSignature(null);

    try {
      // Get serialized transaction from Jupiter
      const swapRes = await fetch(`${JUP_API}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quoteData,
          userPublicKey: walletAddress,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });

      if (!swapRes.ok) throw new Error(`Swap API error: ${swapRes.status}`);
      const { swapTransaction } = await swapRes.json();

      if (!swapTransaction) throw new Error('No transaction returned from Jupiter');

      // The transaction needs to be signed by the wallet
      // This requires wallet-standard signAndSendTransaction
      setSwapStatus('sending');

      // Import the transaction handling
      const { VersionedTransaction, Connection } = await import('@solana/web3.js');
      const txBuf = Uint8Array.from(atob(swapTransaction), c => c.charCodeAt(0));
      const transaction = VersionedTransaction.deserialize(txBuf);

      // Get wallet from window (wallet-standard)
      const wallets = window.navigator?.wallets?.get?.() || [];
      const connectedWallet = wallets.find(w => w.accounts?.some(a => a.address === walletAddress));

      if (!connectedWallet) {
        // Try Solflare directly
        if (window.solflare?.isConnected) {
          const signed = await window.solflare.signTransaction(transaction);
          const connection = new Connection('https://api.mainnet-beta.solana.com');
          const sig = await connection.sendRawTransaction(signed.serialize());
          await connection.confirmTransaction(sig, 'confirmed');
          setTxSignature(sig);
          setSwapStatus('success');
          return;
        }
        throw new Error('No connected wallet found. Please reconnect your wallet.');
      }

      // Use wallet-standard signAndSendTransaction
      const account = connectedWallet.accounts.find(a => a.address === walletAddress);
      const result = await connectedWallet.features['solana:signAndSendTransaction']
        .signAndSendTransaction({ transaction: txBuf, account });

      setTxSignature(result.signature);
      setSwapStatus('success');
    } catch (e) {
      console.error('Swap error:', e);
      setSwapStatus('error');
      setQuoteError(e.message || 'Transaction failed');
    }
  }, [quoteData, walletAddress]);

  // Computed values from quote
  const outputAmount = useMemo(() => {
    if (!quoteData) return null;
    return Number(quoteData.outAmount) / Math.pow(10, outputToken.decimals);
  }, [quoteData, outputToken]);

  const priceImpact = quoteData?.priceImpactPct ? parseFloat(quoteData.priceImpactPct) : null;
  const routePlan = quoteData?.routePlan?.map(r => r.swapInfo?.label).filter(Boolean) || [];

  // Accent color for unified variant
  const accent = '#C46CFF';

  return (
    <div className={unified ? 'p-3 flex flex-col gap-2.5' : "rounded-xl border border-sea/25 p-5"} style={unified ? {} : { background: 'linear-gradient(135deg, rgba(56,189,248,.05) 0%, var(--color-card) 100%)' }}>
      {/* Header — hidden in unified */}
      {!unified && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sea/15 flex items-center justify-center text-base">⚡</div>
            <div>
              <h3 className="font-headline text-[.88rem] font-bold text-txt m-0">Jupiter Swap</h3>
              <div className="text-[.6rem] text-muted">Real on-chain swaps via Jupiter aggregator</div>
            </div>
          </div>
        </div>
      )}

      {/* Slippage toggle */}
      <button
        onClick={() => setShowSlippage(!showSlippage)}
        className={unified
          ? "text-[.62rem] text-muted bg-transparent border border-border rounded px-2 py-1 cursor-pointer hover:text-txt transition-all self-end"
          : "text-[.65rem] text-muted bg-transparent border border-border rounded-lg px-2 py-1 cursor-pointer hover:text-txt hover:border-white/20 transition-all mb-3"}
      >
        ⚙ {slippage / 100}% slippage
      </button>

      {/* Slippage settings */}
      {showSlippage && (
        <div className={unified ? "p-2.5 rounded border border-border bg-black/20 mb-1" : "mb-4 p-3 rounded-lg border border-border bg-black/20"}>
          <div className="text-[.56rem] text-muted uppercase tracking-wider mb-2">Slippage Tolerance</div>
          <div className="flex gap-1">
            {[10, 50, 100, 300].map(bps => (
              <button key={bps}
                onClick={() => setSlippage(bps)}
                className={`flex-1 py-1.5 rounded text-[.68rem] font-mono font-bold cursor-pointer border transition-all
                  ${slippage === bps
                    ? (unified ? `border-[${accent}]/40 bg-[${accent}]/10 text-[${accent}]` : 'bg-sea/15 border-sea/40 text-sea')
                    : 'bg-transparent border-border text-muted hover:text-txt'}`}
                style={slippage === bps && unified ? { borderColor: `${accent}66`, background: `${accent}1a`, color: accent } : {}}>
                {bps / 100}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input token */}
      <div className={unified ? "flex flex-col gap-1" : "rounded-xl border border-border p-4 mb-2"} style={unified ? {} : { background: 'rgba(0,0,0,.2)' }}>
        <span className={unified ? "text-[.56rem] text-muted uppercase tracking-wider" : "text-[.6rem] text-muted uppercase tracking-widest mb-2 block"}>You Pay</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={inputAmount}
            onChange={e => { setInputAmount(e.target.value); setQuoteData(null); }}
            placeholder="0.00"
            className={unified
              ? "flex-1 bg-black/30 border border-border text-txt rounded px-2.5 py-1.5 font-mono text-[.76rem] outline-none focus:border-[#C46CFF]/60 w-0 min-w-0"
              : "flex-1 bg-transparent border-none text-[1.4rem] font-headline font-bold text-txt outline-none w-0 min-w-0"}
          />
          <select
            value={inputToken.mint}
            onChange={e => {
              const t = POPULAR_TOKENS.find(t => t.mint === e.target.value);
              if (t) { setInputToken(t); setQuoteData(null); }
            }}
            className={unified
              ? "bg-black/30 border border-border text-txt rounded px-2.5 py-1.5 font-mono text-[.76rem] outline-none cursor-pointer min-w-[80px]"
              : "bg-black/40 border border-border text-txt rounded-xl px-3 py-2 font-mono text-[.8rem] outline-none cursor-pointer min-w-[100px]"}
          >
            {POPULAR_TOKENS.map(t => (
              <option key={t.mint} value={t.mint}>{t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Flip button */}
      <div className="flex justify-center -my-0.5 relative z-10">
        <button onClick={handleFlip}
          className={unified
            ? "w-8 h-8 rounded-full bg-[#C46CFF]/15 border border-[#C46CFF]/30 text-[#C46CFF] flex items-center justify-center cursor-pointer hover:bg-[#C46CFF]/25 transition-all text-sm"
            : "w-9 h-9 rounded-full bg-sea/15 border border-sea/30 text-sea flex items-center justify-center cursor-pointer hover:bg-sea/25 transition-all text-base"}>
          ⇅
        </button>
      </div>

      {/* Output token */}
      <div className={unified ? "flex flex-col gap-1" : "rounded-xl border border-border p-4 mt-2 mb-4"} style={unified ? {} : { background: 'rgba(0,0,0,.2)' }}>
        <span className={unified ? "text-[.56rem] text-muted uppercase tracking-wider" : "text-[.6rem] text-muted uppercase tracking-widest mb-2 block"}>You Receive</span>
        <div className="flex items-center gap-2">
          <div className={unified
            ? "flex-1 bg-black/30 border border-border rounded px-2.5 py-1.5 font-mono text-[.76rem] text-txt min-w-0"
            : "flex-1 text-[1.4rem] font-headline font-bold text-txt min-w-0"}>
            {quoteLoading ? (
              <span className="text-muted text-[.72rem]">Fetching...</span>
            ) : outputAmount != null ? (
              fmtNum(outputAmount)
            ) : (
              <span className="text-muted/40">0.00</span>
            )}
          </div>
          <select
            value={outputToken.mint}
            onChange={e => {
              const t = POPULAR_TOKENS.find(t => t.mint === e.target.value);
              if (t) { setOutputToken(t); setQuoteData(null); }
            }}
            className={unified
              ? "bg-black/30 border border-border text-txt rounded px-2.5 py-1.5 font-mono text-[.76rem] outline-none cursor-pointer min-w-[80px]"
              : "bg-black/40 border border-border text-txt rounded-xl px-3 py-2 font-mono text-[.8rem] outline-none cursor-pointer min-w-[100px]"}
          >
            {POPULAR_TOKENS.map(t => (
              <option key={t.mint} value={t.mint}>{t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quote details */}
      {quoteData && (
        <div className={unified
          ? "rounded p-2.5 text-[.7rem] border border-border bg-black/20 flex flex-col gap-1"
          : "rounded-lg border border-border p-3 mb-4 text-[.72rem]"} style={unified ? {} : { background: 'rgba(0,0,0,.15)' }}>
          <div className="flex justify-between"><span className="text-muted">Rate</span>
            <span className="text-txt font-mono font-bold">1 {inputToken.symbol} ≈ {fmtNum(outputAmount / parseFloat(inputAmount))} {outputToken.symbol}</span>
          </div>
          <div className="flex justify-between"><span className="text-muted">Price Impact</span>
            <span className={`font-mono ${priceImpact > 1 ? 'text-down font-bold' : priceImpact > 0.3 ? 'text-[#FFCA3A]' : 'text-up'}`}>
              {priceImpact != null ? `${priceImpact.toFixed(4)}%` : '—'}
            </span>
          </div>
          <div className="flex justify-between"><span className="text-muted">Route</span>
            <span className={unified ? "text-[#C46CFF] text-[.64rem] font-mono" : "text-sea text-[.65rem]"}>{routePlan.length ? routePlan.join(' → ') : 'Direct'}</span>
          </div>
          <div className="flex justify-between"><span className="text-muted">Slippage</span><span className="text-txt font-mono">{slippage / 100}%</span></div>
        </div>
      )}

      {/* Error */}
      {quoteError && (
        <div className={`rounded border border-down/30 bg-down/10 p-2.5 text-[.72rem] text-down ${unified ? '' : 'mb-4'}`}>
          {quoteError}
        </div>
      )}

      {/* Success */}
      {swapStatus === 'success' && txSignature && (
        <div className={`rounded border border-up/30 bg-up/10 p-2.5 text-[.72rem] ${unified ? '' : 'mb-4'}`}>
          <div className="text-up font-bold mb-1">Swap Successful!</div>
          <a href={`https://solscan.io/tx/${txSignature}`} target="_blank" rel="noopener noreferrer"
            className="text-[#C46CFF] text-[.66rem] hover:underline break-all no-underline">
            View on Solscan →
          </a>
        </div>
      )}

      {/* Action buttons */}
      {!walletConnected ? (
        <div className={unified
          ? "rounded border border-border p-4 text-center bg-black/20"
          : "rounded-xl border border-border p-5 text-center"} style={unified ? {} : { background: 'rgba(0,0,0,.2)' }}>
          <div className="text-xl mb-1.5">🔗</div>
          <div className="text-[.78rem] font-bold text-txt mb-0.5">Connect Wallet to Swap</div>
          <div className="text-[.66rem] text-muted">Connect your Solana wallet to execute real swaps.</div>
        </div>
      ) : !quoteData ? (
        <button
          onClick={fetchQuote}
          disabled={!inputAmount || parseFloat(inputAmount) <= 0 || quoteLoading}
          className={unified
            ? `w-full py-3 rounded font-bold text-[.82rem] border-none cursor-pointer transition-all
                ${!inputAmount || parseFloat(inputAmount) <= 0 ? 'bg-border text-muted cursor-not-allowed' : 'text-white hover:brightness-110 disabled:opacity-30'}`
            : `w-full py-3.5 rounded-xl text-[.88rem] font-headline font-bold border-none cursor-pointer transition-all
                ${!inputAmount || parseFloat(inputAmount) <= 0 ? 'bg-border text-muted cursor-not-allowed' : 'bg-sea text-night hover:opacity-90'}`}
          style={unified && inputAmount && parseFloat(inputAmount) > 0 ? { background: accent } : {}}
        >
          {quoteLoading ? 'Fetching Best Route...' : 'Get Quote'}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => { setQuoteData(null); setQuoteError(null); setSwapStatus(null); }}
            className={unified
              ? "flex-1 py-2.5 rounded border border-border bg-transparent text-muted text-[.76rem] font-bold cursor-pointer hover:text-txt transition-all"
              : "flex-1 py-3 rounded-xl text-[.82rem] font-headline font-bold border border-border bg-transparent text-muted cursor-pointer hover:text-txt transition-all"}
          >
            ← New Quote
          </button>
          <button
            onClick={executeSwap}
            disabled={swapStatus === 'signing' || swapStatus === 'sending'}
            className={unified
              ? "flex-[2] py-2.5 rounded text-[.78rem] font-bold border-none cursor-pointer transition-all bg-up text-night hover:brightness-110 disabled:opacity-30"
              : "flex-[2] py-3 rounded-xl text-[.88rem] font-headline font-bold border-none cursor-pointer transition-all bg-up text-night hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"}
          >
            {swapStatus === 'signing' ? 'Signing...' :
             swapStatus === 'sending' ? 'Sending...' :
             `Swap ${inputToken.symbol} → ${outputToken.symbol}`}
          </button>
        </div>
      )}

      {/* Footer — hidden in unified */}
      {!unified && (
        <div className="mt-4 flex items-center justify-between text-[.58rem] text-muted">
          <span>Powered by Jupiter Aggregator</span>
          <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" className="text-sea hover:underline no-underline">
            jup.ag ↗
          </a>
        </div>
      )}
    </div>
  );
}
