import useStore from '../store/useStore';
import { fmtUSD } from '../utils/format';
import { InsightIcon } from './icons';

/**
 * TradeJournalView — Journal entries paired with P&L outcomes.
 *
 * Displayed as a tab on PortfolioPage. Shows journal entries alongside
 * trade results and highlights patterns in decision-making.
 */
export default function TradeJournalView() {
  const trades = useStore(s => s.trades);
  const tradeJournal = useStore(s => s.tradeJournal);

  // Get trades that have journal entries, sorted newest first
  const journaledTrades = trades
    .filter(t => tradeJournal[t.id])
    .map(t => ({ ...t, journal: tradeJournal[t.id] }));

  // Strategy performance summary
  const strategyStats = {};
  const emotionStats = {};

  journaledTrades.forEach(t => {
    const j = t.journal;
    if (j.strategy) {
      if (!strategyStats[j.strategy]) strategyStats[j.strategy] = { count: 0, totalPnl: 0 };
      strategyStats[j.strategy].count++;
      if (t.pnl !== undefined) strategyStats[j.strategy].totalPnl += t.pnl;
    }
    if (j.emotion) {
      if (!emotionStats[j.emotion]) emotionStats[j.emotion] = { count: 0, totalPnl: 0 };
      emotionStats[j.emotion].count++;
      if (t.pnl !== undefined) emotionStats[j.emotion].totalPnl += t.pnl;
    }
  });

  if (journaledTrades.length === 0) {
    return (
      <div className="text-center py-12">
        <InsightIcon size={34} className="mx-auto mb-3 text-sun" />
        <div className="font-body font-bold text-[.95rem] text-txt mb-2">Start Your Trading Journal</div>
        <div className="text-[.78rem] text-txt-2 max-w-sm mx-auto leading-relaxed">
          After each trade, you'll be prompted to record your strategy and mindset.
          Over time, you'll see which approaches work best for you.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Pattern Insights */}
      {(Object.keys(strategyStats).length > 1 || Object.keys(emotionStats).length > 1) && (
        <div className="rounded-xl border border-sea/15 p-4 mb-5" style={{ background: 'color-mix(in srgb, var(--color-sea) 3%, transparent)' }}>
          <div className="text-[.6rem] font-mono font-bold text-sea uppercase tracking-wider mb-3">
            Pattern Insights
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strategy breakdown */}
            {Object.keys(strategyStats).length > 0 && (
              <div>
                <div className="text-[.58rem] text-muted uppercase tracking-wider mb-2">By Strategy</div>
                {Object.entries(strategyStats).map(([strat, stats]) => (
                  <div key={strat} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-[.72rem] text-txt font-mono">{strat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[.62rem] text-muted">{stats.count} trades</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Emotion breakdown */}
            {Object.keys(emotionStats).length > 0 && (
              <div>
                <div className="text-[.58rem] text-muted uppercase tracking-wider mb-2">By Mindset</div>
                {Object.entries(emotionStats).map(([emot, stats]) => (
                  <div key={emot} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-[.72rem] text-txt font-mono">{emot}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[.62rem] text-muted">{stats.count} trades</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Journal Entries */}
      <div className="flex flex-col gap-3">
        {journaledTrades.map(t => (
          <div
            key={t.id}
            className="rounded-xl border border-border p-4"
            style={{ background: 'var(--color-card)' }}
          >
            {/* Trade header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[.6rem] font-bold font-mono px-1.5 py-0.5 rounded
                  ${t.side === 'buy' ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>
                  {t.side.toUpperCase()}
                </span>
                <span className="text-[.78rem] text-txt font-mono font-bold">{t.symbol}</span>
                <span className="text-[.66rem] text-muted">{t.market}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[.72rem] text-txt-2 font-mono">{fmtUSD(t.total)}</span>
                <span className="text-[.6rem] text-muted">{new Date(t.timestamp).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Journal content */}
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {t.journal.strategy && (
                <span className="text-[.6rem] font-mono px-2 py-0.5 rounded-full border border-sea/20 bg-sea/5 text-sea">
                  {t.journal.strategy}
                </span>
              )}
              {t.journal.emotion && (
                <span className="text-[.6rem] font-mono px-2 py-0.5 rounded-full border border-sun/20 bg-sun/5 text-sun">
                  {t.journal.emotion}
                </span>
              )}
            </div>
            {t.journal.reason && (
              <div className="text-[.72rem] text-txt-2 leading-relaxed italic">
                "{t.journal.reason}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
