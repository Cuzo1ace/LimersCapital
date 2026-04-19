import { useState } from 'react';
import { useWalletBalance, useTokenAccounts, useSolanaRpc } from '../../solana/hooks';
import { useCluster } from '../../solana/provider';
import { getAccountExplorerUrl } from '../../solana/config';
import { getTokenInfoForMint, getSymbolForMint } from '../../api/prices';
import { requestDevnetAirdrop } from '../../solana/accounts';

const fmtSol = n => n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const fmtUsd = n => n == null ? '—' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function WalletBalances({ walletAddress, solPrice }) {
  const { cluster } = useCluster();
  const rpc = useSolanaRpc();
  const balanceQ = useWalletBalance(walletAddress);
  const tokensQ = useTokenAccounts(walletAddress);
  const [airdropStatus, setAirdropStatus] = useState('idle'); // idle | loading | success | error

  const solBalance = balanceQ.data?.sol ?? null;
  const solUsdValue = solBalance != null && solPrice ? solBalance * solPrice : null;
  const tokens = tokensQ.data || [];

  async function handleAirdrop() {
    if (!rpc || !walletAddress || airdropStatus === 'loading') return;
    setAirdropStatus('loading');
    try {
      await requestDevnetAirdrop(rpc, walletAddress, 1);
      setAirdropStatus('success');
      // Refresh balance after a short delay
      setTimeout(() => {
        balanceQ.refetch();
        setAirdropStatus('idle');
      }, 3000);
    } catch {
      setAirdropStatus('error');
      setTimeout(() => setAirdropStatus('idle'), 3000);
    }
  }

  return (
    <div>
      {/* SOL Balance */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <div className="text-[.66rem] text-muted uppercase tracking-widest mb-1">SOL Balance</div>
          <div className="font-serif text-[1.6rem] font-black text-txt">
            {balanceQ.isLoading ? (
              <span className="text-muted animate-pulse">Loading...</span>
            ) : (
              fmtSol(solBalance)
            )}
          </div>
          {solUsdValue != null && (
            <div className="text-[.72rem] text-txt-2">{fmtUsd(solUsdValue)}</div>
          )}
        </div>

        {/* Airdrop button — devnet only */}
        {cluster === 'devnet' && (
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={handleAirdrop}
              disabled={airdropStatus === 'loading'}
              className={`px-3 py-1.5 rounded-lg text-[.72rem] font-mono cursor-pointer border transition-all
                ${airdropStatus === 'success'
                  ? 'bg-up/12 border-up/30 text-up'
                  : airdropStatus === 'error'
                    ? 'bg-down/12 border-down/30 text-down'
                    : 'bg-sea/8 border-sea/25 text-sea hover:bg-sea/15'
                } disabled:opacity-50`}
            >
              {airdropStatus === 'loading' ? 'Airdropping...'
                : airdropStatus === 'success' ? '+1 SOL'
                : airdropStatus === 'error' ? 'Failed (rate limited?)'
                : 'Airdrop 1 SOL'}
            </button>
            {airdropStatus === 'error' && (
              <div className="flex items-center gap-2 text-[.62rem] font-mono text-txt-2">
                <a
                  href="https://faucet.solana.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sea hover:text-txt underline"
                >
                  Use faucet.solana.com →
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(String(walletAddress))}
                  className="px-1.5 py-0.5 rounded bg-sea/10 border border-sea/25 text-sea hover:bg-sea/20 cursor-pointer"
                >
                  Copy address
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SPL Token Accounts */}
      {tokens.length > 0 && (
        <div>
          <div className="text-[.66rem] text-muted uppercase tracking-widest mb-2">Token Holdings</div>
          <div className="flex flex-col gap-1">
            {tokens.map(token => {
              const info = getTokenInfoForMint(token.mint);
              const symbol = info?.symbol || getSymbolForMint(token.mint) || token.mint.slice(0, 6) + '...';
              const explorerUrl = getAccountExplorerUrl(token.address, cluster);

              return (
                <div
                  key={token.address}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 border border-border text-[.76rem]"
                  style={{ background: 'var(--color-card)' }}
                >
                  {info?.col && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: info.col }} />
                  )}
                  <span className="font-sans font-bold w-16">{symbol}</span>
                  <span className="text-txt">{token.balance.toLocaleString('en-US', { maximumFractionDigits: token.decimals })}</span>
                  {info?.name && <span className="text-txt-2 text-[.68rem]">{info.name}</span>}
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-[.65rem] text-sea hover:text-txt no-underline transition-colors"
                  >
                    Solscan
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!balanceQ.isLoading && tokens.length === 0 && solBalance != null && solBalance === 0 && (
        <div className="text-[.75rem] text-muted text-center py-3 border border-border rounded-xl" style={{ background: 'var(--color-card)' }}>
          {cluster === 'devnet'
            ? 'No tokens yet. Click "Airdrop 1 SOL" to get started!'
            : 'No tokens found in this wallet.'}
        </div>
      )}
    </div>
  );
}
