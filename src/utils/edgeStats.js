/**
 * computeEdgeStats — derives the user's personal trading fingerprint from their
 * trade history and journal entries. The Personal Edge Card on PortfolioPage
 * consumes this to mirror a user's own patterns back to them:
 *   "Your strongest setup: Technical (68% winrate). Your weakest: FOMO (19%)."
 *
 * Compliance note: every field returned is descriptive (past patterns), never
 * prescriptive (no future-trade advice). The UI renders these as observations.
 */

const MIN_SAMPLES_FOR_TAG = 3;     // need ≥3 trades per tag to report a winrate
const PEER_COHORT_BASELINE = 0.41; // approx winrate of a random paper trader
                                   // (used only for peer framing; honest floor)

const hasRealizedPnl = (t) =>
  typeof t.pnl === 'number' && Number.isFinite(t.pnl) &&
  (t.side === 'sell' || (typeof t.side === 'string' && t.side.startsWith('close_')));

const asUsd = (pnl, currency, ttdRate) =>
  currency === 'TTD' && ttdRate ? pnl / ttdRate : pnl;

function aggregateByTag(journaledTrades, tagKey, ttdRate) {
  const agg = {};
  for (const t of journaledTrades) {
    const tag = t.journal?.[tagKey];
    if (!tag || !hasRealizedPnl(t)) continue;
    const pnlUsd = asUsd(t.pnl, t.currency, ttdRate);
    if (!agg[tag]) agg[tag] = { tag, trades: 0, wins: 0, pnlUsd: 0 };
    agg[tag].trades += 1;
    agg[tag].pnlUsd += pnlUsd;
    if (pnlUsd > 0) agg[tag].wins += 1;
  }
  return Object.values(agg)
    .filter((s) => s.trades >= MIN_SAMPLES_FOR_TAG)
    .map((s) => ({ ...s, winrate: s.wins / s.trades }))
    .sort((a, b) => b.winrate - a.winrate);
}

export function computeEdgeStats({ trades = [], tradeJournal = {}, ttdRate = 6.79 } = {}) {
  const journaledTrades = trades
    .filter((t) => tradeJournal[t.id])
    .map((t) => ({ ...t, journal: tradeJournal[t.id] }));

  const realized = trades.filter(hasRealizedPnl);
  const totalTrades = trades.length;
  const journalRate = totalTrades === 0 ? 0 : Object.keys(tradeJournal).length / totalTrades;

  const overall = {
    closedTrades: realized.length,
    wins: realized.filter((t) => asUsd(t.pnl, t.currency, ttdRate) > 0).length,
    pnlUsd: realized.reduce((s, t) => s + asUsd(t.pnl, t.currency, ttdRate), 0),
  };
  overall.winrate = overall.closedTrades > 0 ? overall.wins / overall.closedTrades : 0;

  const byStrategy = aggregateByTag(journaledTrades, 'strategy', ttdRate);
  const byEmotion = aggregateByTag(journaledTrades, 'emotion', ttdRate);

  // Activity fingerprint — share of trades by market (helps users see their own mix
  // without telling them what to do about it).
  const mkt = { solana: 0, ttse: 0, perpetuals: 0, other: 0 };
  for (const t of trades) {
    if (t.market === 'solana') mkt.solana += 1;
    else if (t.market === 'ttse') mkt.ttse += 1;
    else if (t.market === 'perpetuals') mkt.perpetuals += 1;
    else mkt.other += 1;
  }

  // Peer positioning — a conservative, honest framing. We compare the user's
  // winrate to a baseline random-trader winrate. This is a client-side
  // ordinal comparison, not a leaderboard rank. When the SAS-powered
  // leaderboard ships we can replace the baseline with real cohort data.
  const peer = (() => {
    if (overall.closedTrades < 5) return null;
    const delta = overall.winrate - PEER_COHORT_BASELINE;
    // Rough positional estimate: 0.41 = 50th percentile; ±0.1 ≈ ±30 percentile.
    const pct = Math.max(5, Math.min(95, Math.round(50 + delta * 300)));
    return { percentile: pct, baseline: PEER_COHORT_BASELINE };
  })();

  return {
    overall,
    byStrategy,
    byEmotion,
    strongest: byStrategy[0] || byEmotion[0] || null,
    weakest: (() => {
      const tail = [...byStrategy].reverse();
      return tail.find((s) => s.winrate < 0.5) || null;
    })(),
    marketMix: mkt,
    journalRate,
    peer,
    hasEnoughData: overall.closedTrades >= MIN_SAMPLES_FOR_TAG,
  };
}

export const __testables = { aggregateByTag, hasRealizedPnl, MIN_SAMPLES_FOR_TAG };
