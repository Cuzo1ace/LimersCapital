import { useRecentTransactions } from '../../solana/hooks';
import { useCluster } from '../../solana/provider';
import { getTxExplorerUrl } from '../../solana/config';

function shortenSig(sig) {
  if (!sig) return '—';
  return sig.slice(0, 8) + '...' + sig.slice(-8);
}

function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString();
}

export default function TransactionHistory({ walletAddress }) {
  const { cluster } = useCluster();
  const txnsQ = useRecentTransactions(walletAddress);
  const transactions = txnsQ.data || [];

  if (txnsQ.isLoading) {
    return (
      <div className="text-[.75rem] text-muted animate-pulse py-3 text-center">
        Loading transactions...
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-[.75rem] text-muted text-center py-3 border border-border rounded-xl" style={{ background: 'var(--color-card)' }}>
        No on-chain transactions yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {transactions.map(tx => (
        <div
          key={tx.signature}
          className="flex items-center gap-3 rounded-xl px-4 py-2 border border-border text-[.74rem]"
          style={{ background: 'var(--color-card)' }}
        >
          <span className={`px-1.5 py-0.5 rounded text-[.6rem] font-semibold uppercase
            ${tx.status === 'success' ? 'bg-up/12 text-up' : 'bg-down/12 text-down'}`}>
            {tx.status}
          </span>
          <a
            href={getTxExplorerUrl(tx.signature, cluster)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sea hover:text-txt no-underline transition-colors"
          >
            {shortenSig(tx.signature)}
          </a>
          <span className="text-muted text-[.65rem] ml-auto">{formatTime(tx.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}
