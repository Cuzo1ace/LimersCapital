import { useMemo } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { computeEdgeStats } from '../utils/edgeStats';
import { TTD_RATE } from '../api/ttse';
import PrivateValue from './ui/PrivateValue';
import { SignalIcon } from './icons';

const EDGE_BG = 'linear-gradient(135deg, color-mix(in srgb, var(--color-sea) 3%, transparent), color-mix(in srgb, var(--color-coral) 3%, transparent))';
const EDGE_BG_STRONG = 'linear-gradient(135deg, color-mix(in srgb, var(--color-sea) 5%, transparent), color-mix(in srgb, var(--color-coral) 4%, transparent))';

/**
 * PersonalEdgeCard — reflects the user's own trading patterns back to them.
 *
 * Shows: overall winrate (with peer percentile framing), strongest / weakest
 * journal tag, market mix fingerprint, and journal coverage nudge. Every
 * figure is descriptive (past-data observation) — never prescriptive.
 *
 * Respects Private Mode by masking the overall pnl number while keeping
 * ordinal facts (winrate %, strongest/weakest labels) visible — a user's rank
 * and patterns reveal less than dollar figures.
 */

const fmtPct = (n) => {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${Math.round(n * 100)}%`;
};

const fmtUsdSigned = (n) => {
  if (n == null || !Number.isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '−';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border p-5 mb-5" style={{ background: EDGE_BG }}>
      <div className="flex items-center gap-2 mb-2">
        <SignalIcon size={14} className="text-sea" />
        <div className="text-[.66rem] font-mono font-bold uppercase tracking-widest text-sea">
          Your Edge
        </div>
      </div>
      <div className="text-[.82rem] text-txt font-body font-semibold mb-1">
        Start building your trading fingerprint.
      </div>
      <div className="text-[.72rem] text-txt-2 leading-relaxed">
        After each trade, the journal prompt captures your strategy and mindset.
        Once you have a few entries, this card starts showing which of your
        setups have worked and which haven&apos;t — the patterns you can only
        see when you look at your own history.
      </div>
    </div>
  );
}

function StatCell({ label, value, sub, accent = 'text-txt' }) {
  return (
    <div className="rounded-xl p-3 border border-border" style={{ background: 'var(--color-card)' }}>
      <div className="text-[.58rem] text-muted uppercase tracking-widest mb-1">{label}</div>
      <div className={`font-headline text-[1.1rem] font-black ${accent}`}>{value}</div>
      {sub && <div className="text-[.6rem] text-txt-2 mt-0.5">{sub}</div>}
    </div>
  );
}

function TagRow({ row, tone = 'strong' }) {
  if (!row) return null;
  const color =
    tone === 'strong'
      ? 'border-sea/30 bg-sea/8 text-sea'
      : 'border-sun/30 bg-sun/8 text-sun';
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <span className={`text-[.58rem] font-mono px-2 py-0.5 rounded-full border ${color}`}>
          {row.tag}
        </span>
        <span className="text-[.66rem] text-txt-2">{row.trades} trades</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[.72rem] font-mono font-bold text-txt">{fmtPct(row.winrate)}</span>
        <PrivateValue width={6}>
          <span className={`text-[.68rem] font-mono ${row.pnlUsd >= 0 ? 'text-up' : 'text-down'}`}>
            {fmtUsdSigned(row.pnlUsd)}
          </span>
        </PrivateValue>
      </div>
    </div>
  );
}

export default function PersonalEdgeCard() {
  const trades = useStore((s) => s.trades);
  const tradeJournal = useStore((s) => s.tradeJournal);

  const stats = useMemo(
    () => computeEdgeStats({ trades, tradeJournal, ttdRate: TTD_RATE }),
    [trades, tradeJournal]
  );

  if (!stats.hasEnoughData) return <EmptyState />;

  const { overall, strongest, weakest, marketMix, journalRate, peer } = stats;
  const totalMarketTrades = Math.max(1, marketMix.solana + marketMix.ttse + marketMix.perpetuals + marketMix.other);

  // Peer framing — purely descriptive ordinal phrasing, never performance claim.
  const peerPhrase = peer
    ? peer.percentile >= 60
      ? `Ahead of ${peer.percentile}% of baseline paper traders this month`
      : peer.percentile <= 40
      ? `Behind ${100 - peer.percentile}% of baseline paper traders this month`
      : 'Tracking near the baseline paper-trader winrate'
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-sea/20 p-5 mb-5"
      style={{ background: EDGE_BG_STRONG }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SignalIcon size={14} className="text-sea" />
          <div className="text-[.66rem] font-mono font-bold uppercase tracking-widest text-sea">
            Your Edge
          </div>
          <span className="text-[.55rem] text-muted font-mono">
            {overall.closedTrades} closed · {Math.round(journalRate * 100)}% journaled
          </span>
        </div>
        {peerPhrase && (
          <div className="text-[.58rem] font-mono uppercase tracking-wider text-txt-2 hidden sm:block">
            {peerPhrase}
          </div>
        )}
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCell
          label="Winrate"
          value={fmtPct(overall.winrate)}
          sub={`${overall.wins} / ${overall.closedTrades}`}
          accent={overall.winrate >= 0.5 ? 'text-up' : 'text-txt'}
        />
        <StatCell
          label="Realized P&L"
          value={<PrivateValue width={7}>{fmtUsdSigned(overall.pnlUsd)}</PrivateValue>}
          sub="All markets"
          accent={overall.pnlUsd >= 0 ? 'text-up' : 'text-down'}
        />
        <StatCell
          label="Mix"
          value={
            <span className="text-[.82rem] font-mono">
              {Math.round((marketMix.solana / totalMarketTrades) * 100)}/
              {Math.round((marketMix.ttse / totalMarketTrades) * 100)}/
              {Math.round((marketMix.perpetuals / totalMarketTrades) * 100)}
            </span>
          }
          sub="SOL / TTSE / Perps"
        />
      </div>

      {/* Peer framing on small screens */}
      {peerPhrase && (
        <div className="sm:hidden text-[.62rem] font-mono text-txt-2 mb-3 leading-relaxed">
          {peerPhrase}
        </div>
      )}

      {/* Best / worst tags */}
      {(strongest || weakest) && (
        <div className="rounded-xl border border-border p-3 mb-1" style={{ background: 'var(--color-card)' }}>
          <div className="text-[.58rem] font-mono uppercase tracking-wider text-muted mb-2">
            What your journal reveals
          </div>
          {strongest && <TagRow row={strongest} tone="strong" />}
          {weakest && weakest.tag !== strongest?.tag && <TagRow row={weakest} tone="weak" />}
        </div>
      )}

      {/* Soft nudge when journal coverage is thin */}
      {journalRate < 0.5 && overall.closedTrades >= 5 && (
        <div className="mt-3 text-[.64rem] text-txt-2 leading-relaxed italic">
          Journal more trades to sharpen this picture — untagged trades don&apos;t contribute to the strategy breakdown.
        </div>
      )}
    </motion.div>
  );
}
