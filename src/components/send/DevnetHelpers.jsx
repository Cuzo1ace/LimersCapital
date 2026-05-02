import { useState, useEffect, useCallback } from 'react';
import { useSelectedWalletAccount } from '@solana/react';
import { useCluster, useRpc } from '../../solana/provider';
import {
  fetchSolBalance,
  fetchTokenBalanceByMint,
  requestDevnetAirdrop,
} from '../../../apps/pusd-sundollar/src/solana/accounts';
import { getStablecoin, getMintAddress } from '../../../apps/pusd-sundollar/src/stablecoins';

const CIRCLE_DEVNET_FAUCET = 'https://faucet.circle.com/?chain=solana';

/**
 * Devnet helper panel — only renders when on devnet with a connected wallet.
 * Surfaces:
 *   - SOL balance + "Request 1 SOL airdrop" (programmatic via RPC)
 *   - USDC devnet balance + link to Circle's faucet (web-based)
 *
 * Hidden on mainnet so it doesn't pollute the production-feeling surface.
 */
export default function DevnetHelpers() {
  const [selectedAccount] = useSelectedWalletAccount();
  const { cluster, label: clusterLabel } = useCluster();
  const rpc = useRpc();

  const [sol, setSol] = useState(null);
  const [usdc, setUsdc] = useState(null);
  const [airdropStatus, setAirdropStatus] = useState('idle'); // idle | requesting | requested | failed
  const [airdropError, setAirdropError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const usdc_stable = getStablecoin('usdc');
  const usdcMint = getMintAddress(usdc_stable, cluster);

  // Reload balances any time the wallet, cluster, or refresh tick changes.
  useEffect(() => {
    if (!selectedAccount?.address || !rpc) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await fetchSolBalance(rpc, selectedAccount.address);
        if (!cancelled) setSol(s.sol);
      } catch (e) {
        if (!cancelled) setSol(null);
      }
      if (usdcMint) {
        try {
          const u = await fetchTokenBalanceByMint(rpc, selectedAccount.address, usdcMint);
          if (!cancelled) setUsdc(u.balance);
        } catch (e) {
          if (!cancelled) setUsdc(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedAccount?.address, cluster, refreshKey, rpc, usdcMint]);

  const handleAirdrop = useCallback(async () => {
    if (!selectedAccount?.address) return;
    setAirdropStatus('requesting');
    setAirdropError(null);
    try {
      await requestDevnetAirdrop(rpc, selectedAccount.address, 1);
      setAirdropStatus('requested');
      // Devnet airdrops settle in seconds — refresh balance after a beat.
      setTimeout(() => setRefreshKey((k) => k + 1), 4000);
    } catch (e) {
      setAirdropError(e?.message || 'Airdrop failed (devnet rate limit?)');
      setAirdropStatus('failed');
    }
  }, [rpc, selectedAccount?.address]);

  // Hide entirely when off-devnet or no wallet — keep the surface clean.
  if (cluster !== 'devnet') return null;
  if (!selectedAccount) return null;

  return (
    <section
      className="rounded-[14px] p-4 border border-[var(--color-warn)]/30"
      style={{ background: 'color-mix(in srgb, var(--color-warn) 4%, transparent)' }}
    >
      <div className="text-[.66rem] uppercase tracking-widest mb-2 flex items-center gap-2 text-[var(--color-warn)]">
        Devnet helpers
        <span className="text-[var(--color-muted)] text-[.6rem] font-normal normal-case tracking-normal">
          Fund your wallet on {clusterLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* SOL */}
        <div className="rounded-lg border border-[var(--color-border)] p-3 bg-black/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[.66rem] uppercase tracking-widest text-[var(--color-muted)]">SOL</span>
            <span className="font-mono text-[.78rem] text-[var(--color-txt)]">
              {sol == null ? '—' : sol.toFixed(4)}
            </span>
          </div>
          <button
            onClick={handleAirdrop}
            disabled={airdropStatus === 'requesting'}
            className="w-full mt-1 py-1.5 rounded-md text-[.7rem] font-mono cursor-pointer border border-[var(--color-warn)]/40 bg-[var(--color-warn)]/15 text-[var(--color-warn)] hover:bg-[var(--color-warn)]/25 transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            {airdropStatus === 'requesting' ? 'Requesting…'
              : airdropStatus === 'requested' ? '✓ Airdrop sent — refreshing balance'
              : airdropStatus === 'failed' ? 'Retry airdrop'
              : 'Request 1 SOL airdrop'}
          </button>
          {airdropStatus === 'failed' && airdropError && (
            <div className="mt-1 text-[.6rem] text-[var(--color-down)]">{airdropError}</div>
          )}
        </div>

        {/* USDC */}
        <div className="rounded-lg border border-[var(--color-border)] p-3 bg-black/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[.66rem] uppercase tracking-widest text-[var(--color-muted)]">USDC (devnet)</span>
            <span className="font-mono text-[.78rem] text-[var(--color-txt)]">
              {usdc == null ? '—' : usdc.toFixed(2)}
            </span>
          </div>
          <a
            href={CIRCLE_DEVNET_FAUCET}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center w-full mt-1 py-1.5 rounded-md text-[.7rem] font-mono cursor-pointer border border-[var(--color-sea)]/40 bg-[var(--color-sea)]/15 text-[var(--color-sea)] hover:bg-[var(--color-sea)]/25 no-underline transition-colors"
          >
            Get devnet USDC ↗
          </a>
        </div>
      </div>

      <p className="mt-2 text-[.6rem] text-[var(--color-muted)] leading-relaxed">
        Devnet airdrops are public-RPC rate-limited; if you hit the limit, try faucet.solana.com directly.
        Circle’s faucet drips devnet USDC to any wallet you paste in.
      </p>
    </section>
  );
}
