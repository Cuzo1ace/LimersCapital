/**
 * Compact Solana-explorer preview card for hover-over-explorer-link UX.
 *
 * Renders a branded mini-card showing the cluster, a short form of the
 * account/tx address, and a hint at what the explorer page will show.
 * No external screenshot service needed — keeps us off Microlink's
 * quota and avoids CSP issues with api.microlink.io.
 *
 * Props:
 *   address     — full base58 address or tx signature
 *   cluster     — 'devnet' | 'mainnet-beta'
 *   kind        — 'account' | 'tx' (drives copy)
 *   label       — optional heading (e.g. "Your Access Pass")
 */
const CLUSTER_LABEL = {
  'devnet':       { name: 'Devnet',  chip: 'bg-gold/10 text-gold border-gold/30' },
  'mainnet-beta': { name: 'Mainnet', chip: 'bg-sea/10 text-sea border-sea/30' },
};

function shorten(s, head = 6, tail = 6) {
  if (!s || s.length <= head + tail + 1) return s || '';
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export default function ExplorerPreview({ address, cluster = 'devnet', kind = 'account', label }) {
  const c = CLUSTER_LABEL[cluster] || CLUSTER_LABEL['devnet'];
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[.55rem] uppercase tracking-[.3em] text-gold font-mono">
          Solana Explorer
        </div>
        <div className={`text-[.5rem] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded border ${c.chip}`}>
          {c.name}
        </div>
      </div>
      {label && (
        <div className="font-headline text-sm font-black text-txt mb-2 leading-tight">
          {label}
        </div>
      )}
      <div className="text-[.5rem] uppercase tracking-widest text-muted font-mono mb-1">
        {kind === 'tx' ? 'Transaction signature' : 'Account address'}
      </div>
      <div className="text-txt text-[.7rem] font-mono break-all leading-relaxed mb-3">
        {shorten(address, 12, 10)}
      </div>
      <div className="text-[.6rem] text-txt-2 font-mono leading-relaxed">
        {kind === 'tx'
          ? 'Opens the Solana Explorer transaction page — program logs, slot, fee, and raw instructions.'
          : 'Opens the Solana Explorer account page — balance, owner program, recent transactions, NFT metadata.'}
      </div>
      <div className="mt-2 text-[.55rem] text-sea font-mono">click to open ↗</div>
    </div>
  );
}
