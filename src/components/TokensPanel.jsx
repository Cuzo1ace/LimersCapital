import { useState, useEffect, useCallback } from 'react';
import { useSelectedWalletAccount } from '@solana/react';
import { TOKENS_BY_CLUSTER, listTokens } from '../solana/tokens';
import { DEFAULT_CLUSTER } from '../solana/config';

/**
 * TokensPanel — devnet demo surface for Phase B5.
 *
 * Shows the 7 on-chain tokens issued on devnet (mTTDC, USDC-devnet, and the
 * 5 tokenized TTSE stocks) with the current wallet's balance for each, plus
 * a "Claim 10K mTTDC" button wired to the Worker faucet at
 * `${VITE_API_PROXY_URL}/faucet/mttdc`.
 *
 * Design notes:
 *   - Uses raw JSON RPC via fetch (no @solana/web3.js bundle cost on the
 *     critical path). Token balances come from `getTokenAccountsByOwner`.
 *   - Polls for balance refresh every 20s and immediately after a claim
 *     succeeds so the user sees their new mTTDC instantly.
 *   - Does NOT trigger wallet adapter signature — claims are server-signed
 *     by the devnet faucet keypair (see workers/faucet.js).
 *   - Safe to render when wallet is disconnected: just shows the token
 *     catalog without balances.
 */

const RPC_URL =
  import.meta.env.VITE_SOLANA_RPC_URL ||
  (DEFAULT_CLUSTER === 'devnet'
    ? 'https://api.devnet.solana.com'
    : 'https://api.mainnet-beta.solana.com');

const API_PROXY =
  import.meta.env.VITE_API_PROXY_URL ||
  'https://limer-api-proxy.solanacaribbean-team.workers.dev';

async function fetchTokenBalances(walletAddress) {
  if (!walletAddress) return {};
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getTokenAccountsByOwner',
    params: [
      walletAddress,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' },
    ],
  };
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return {};
  const j = await res.json();
  const accounts = j?.result?.value || [];
  const out = {};
  for (const a of accounts) {
    const info = a?.account?.data?.parsed?.info;
    if (!info) continue;
    const mint = info.mint;
    const amount = info.tokenAmount?.uiAmount ?? 0;
    out[mint] = amount;
  }
  return out;
}

async function fetchSolBalance(walletAddress) {
  if (!walletAddress) return null;
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getBalance',
    params: [walletAddress],
  };
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const j = await res.json();
  const lamports = j?.result?.value ?? 0;
  return lamports / 1e9;
}

function fmtBalance(b) {
  if (b == null) return '—';
  if (b === 0) return '0';
  if (b < 0.01) return b.toFixed(6);
  if (b < 1) return b.toFixed(4);
  if (b < 1000) return b.toFixed(2);
  return b.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function TokensPanel() {
  // Source of truth: wallet-standard's useSelectedWalletAccount. Previously
  // read from Zustand which could drift out of sync with the wallet-standard
  // provider that SwapPanel uses, causing a confusing "Connect wallet" message
  // on one card while the other card showed an active wallet.
  const selectedAccount = useSelectedWalletAccount();
  const walletAddress = selectedAccount?.address || null;
  const walletConnected = !!selectedAccount;
  const [balances, setBalances] = useState({});
  const [solBalance, setSolBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimState, setClaimState] = useState({ status: 'idle', message: '' });

  const tokens = listTokens(DEFAULT_CLUSTER);

  const refresh = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const [toks, sol] = await Promise.all([
        fetchTokenBalances(walletAddress),
        fetchSolBalance(walletAddress),
      ]);
      setBalances(toks);
      setSolBalance(sol);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;
    refresh();
    const iv = setInterval(refresh, 20_000);
    return () => clearInterval(iv);
  }, [walletAddress, refresh]);

  async function handleClaim() {
    if (!walletAddress) return;
    setClaimState({ status: 'pending', message: 'Claiming 10,000 mTTDC…' });
    try {
      const res = await fetch(`${API_PROXY}/faucet/mttdc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      const j = await res.json();
      if (!res.ok) {
        setClaimState({
          status: 'error',
          message: j.error
            ? `${j.error}${j.retryAfterHuman ? ` (retry in ${j.retryAfterHuman})` : ''}`
            : `Claim failed (HTTP ${res.status})`,
        });
        return;
      }
      setClaimState({
        status: 'success',
        message: `Received 10,000 mTTDC. Tx: ${j.txSignature.slice(0, 12)}…`,
      });
      // Immediate balance refresh so user sees the new balance
      setTimeout(refresh, 2_000);
    } catch (err) {
      setClaimState({
        status: 'error',
        message: `Network error: ${String(err?.message || err).slice(0, 80)}`,
      });
    }
  }

  // Build a display row for each token
  const rows = tokens.map((tok) => {
    const bal = balances[tok.mint];
    const isMttdc = tok.symbol === 'mTTDC';
    const isEquity = tok.category === 'equity';
    return {
      symbol: tok.symbol,
      name: tok.name,
      mint: tok.mint,
      balance: bal,
      category: tok.category,
      ref: tok.externalRef || null,
      sector: tok.sector || null,
      refPrice: tok.refPriceTtd || null,
      isMttdc,
      isEquity,
    };
  });

  return (
    <div className="rounded-2xl border border-palm/20 bg-black/30 backdrop-blur-sm p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-palm">Devnet Tokens</h3>
          <p className="text-xs text-white/50 mt-0.5">
            Your on-chain balances · {DEFAULT_CLUSTER}
          </p>
        </div>
        {walletConnected && (
          <button
            onClick={refresh}
            disabled={loading}
            className="text-xs px-2 py-1 rounded border border-white/10 hover:border-white/30 text-white/60 hover:text-white/90 transition disabled:opacity-40"
            title="Refresh balances"
          >
            {loading ? '↻ Loading…' : '↻ Refresh'}
          </button>
        )}
      </div>

      {!walletConnected && (
        <div className="text-center py-6 text-sm text-white/50">
          Connect your wallet to view balances and claim test mTTDC.
        </div>
      )}

      {walletConnected && (
        <>
          {/* Claim button */}
          <div className="mb-4 p-3 rounded-xl bg-palm/10 border border-palm/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">
                  Free 10,000 mTTDC (devnet)
                </div>
                <div className="text-xs text-white/50 mt-0.5">
                  One claim per wallet per 24h.
                </div>
              </div>
              <button
                onClick={handleClaim}
                disabled={claimState.status === 'pending'}
                className="px-4 py-2 rounded-lg bg-palm text-black font-semibold text-sm hover:bg-palm/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {claimState.status === 'pending' ? 'Claiming…' : 'Claim 🍋'}
              </button>
            </div>
            {claimState.status !== 'idle' && (
              <div
                className={`mt-2 text-xs ${
                  claimState.status === 'success'
                    ? 'text-palm'
                    : claimState.status === 'error'
                      ? 'text-coral'
                      : 'text-white/60'
                }`}
              >
                {claimState.message}
              </div>
            )}
          </div>

          {/* SOL balance */}
          <div className="mb-3 flex items-center justify-between text-sm border-b border-white/5 pb-2">
            <div>
              <span className="font-semibold text-white">SOL</span>
              <span className="text-white/40 ml-2 text-xs">Gas token</span>
            </div>
            <div className="font-mono text-white/80">
              {solBalance == null ? '—' : fmtBalance(solBalance)}
            </div>
          </div>

          {/* Token rows */}
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div
                key={r.mint}
                className="flex items-center justify-between py-1.5 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{r.symbol}</span>
                    {r.isMttdc && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-palm/20 text-palm border border-palm/30">
                        stable
                      </span>
                    )}
                    {r.isEquity && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7EB2FF]/20 text-[#7EB2FF] border border-[#7EB2FF]/30">
                        equity
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/40 truncate mt-0.5">
                    {r.ref && `${r.ref} · `}{r.sector && `${r.sector} · `}{r.refPrice && `TT$${r.refPrice}`}
                  </div>
                </div>
                <div className="font-mono text-white/80 pl-2">
                  {fmtBalance(r.balance)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-white/35">
            Balances refresh every 20s. mStock swap coming in Phase B — seeded AMM pools live soon.
          </div>
        </>
      )}
    </div>
  );
}
