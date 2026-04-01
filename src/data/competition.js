/**
 * Trading Competition — Configuration & Scoring Engine
 *
 * Rust-portable:
 *   pub struct Competition { pub id: String, pub start: i64, pub end: i64, pub status: Status }
 *   pub fn calc_competition_score(pnl: i64, trades: u32, win_rate: f64, max_drawdown: f64) -> u64
 */

// ── Competition Config ──────────────────────────────────────

export const COMPETITION = {
  id: 'season-1',
  name: 'Season 1 — Caribbean Trading Cup',
  tagline: 'Prove your edge. Trade smart. Win $LIMER.',
  startDate: '2026-04-07T00:00:00Z',   // Monday after launch
  endDate: '2026-05-05T00:00:00Z',     // 4-week season
  initialBalance: 100_000,              // $100K paper USD
  rules: [
    'All participants start with $100,000 paper balance',
    'Trade any Solana token — spot or perpetuals',
    'Rankings update every 60 seconds from live prices',
    'Manipulative behavior (wash trading) is auto-flagged',
    'Final rankings locked at season end — no late entries in last 24h',
  ],
};

// ── Prize Tiers ─────────────────────────────────────────────

export const PRIZES = [
  { rank: '1st', prize: '50,000 $LIMER + Gold dNFT', icon: '🥇', color: '#FFD700' },
  { rank: '2nd', prize: '25,000 $LIMER + Silver dNFT', icon: '🥈', color: '#C0C0C0' },
  { rank: '3rd', prize: '10,000 $LIMER + Bronze dNFT', icon: '🥉', color: '#CD7F32' },
  { rank: '4th–10th', prize: '5,000 $LIMER each', icon: '🏅', color: '#00ffa3' },
  { rank: '11th–25th', prize: '1,000 $LIMER each', icon: '🎖️', color: '#00C8B4' },
  { rank: 'All Finishers', prize: '2x LP multiplier for 7 days', icon: '🎯', color: '#9945FF' },
];

// ── Scoring Weights ─────────────────────────────────────────

const WEIGHTS = {
  pnlReturn: 40,      // % return on starting balance (40 pts)
  winRate: 20,         // % of profitable trades (20 pts)
  riskManagement: 20,  // lower max drawdown = higher score (20 pts)
  consistency: 10,     // Sharpe-like: return / volatility (10 pts)
  activity: 10,        // minimum trade count threshold (10 pts)
};

// ── Scoring Functions (Rust-portable) ────────────────────────

/**
 * Calculate competition score from trading metrics.
 *
 * Rust equivalent:
 * ```rust
 * pub fn calc_competition_score(
 *     pnl_return_pct: f64,     // e.g. 15.5 for +15.5%
 *     win_rate: f64,           // e.g. 0.65 for 65%
 *     max_drawdown_pct: f64,   // e.g. 12.0 for -12%
 *     daily_returns: &[f64],   // array of daily return %
 *     trade_count: u32,
 * ) -> u64
 * ```
 */
export function calcCompetitionScore(pnlReturnPct, winRate, maxDrawdownPct, dailyReturns = [], tradeCount = 0) {
  let score = 0;

  // 1. PnL Return (40 pts) — capped at 100% return for max score
  const pnlScore = Math.min(Math.max(pnlReturnPct, -50), 100) / 100 * WEIGHTS.pnlReturn;
  score += Math.max(pnlScore, 0);

  // 2. Win Rate (20 pts) — 50% = 0 pts, 80%+ = max
  const wrScore = Math.min(Math.max((winRate - 0.5) / 0.3, 0), 1) * WEIGHTS.winRate;
  score += wrScore;

  // 3. Risk Management (20 pts) — 0% drawdown = max, 50%+ = 0
  const riskScore = Math.max(1 - maxDrawdownPct / 50, 0) * WEIGHTS.riskManagement;
  score += riskScore;

  // 4. Consistency (10 pts) — Sharpe ratio proxy
  if (dailyReturns.length >= 3) {
    const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance) || 0.01;
    const sharpe = mean / stdDev;
    score += Math.min(Math.max(sharpe, 0), 3) / 3 * WEIGHTS.consistency;
  }

  // 5. Activity (10 pts) — need at least 10 trades for full score
  const activityScore = Math.min(tradeCount / 10, 1) * WEIGHTS.activity;
  score += activityScore;

  return Math.round(Math.min(score, 100));
}

/**
 * Get competition status from dates.
 */
export function getCompetitionStatus(now = new Date()) {
  const start = new Date(COMPETITION.startDate);
  const end = new Date(COMPETITION.endDate);

  if (now < start) {
    const diff = start - now;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return { status: 'upcoming', label: 'Starts In', countdown: `${days}d ${hours}h`, daysLeft: days };
  }

  if (now > end) {
    return { status: 'ended', label: 'Season Ended', countdown: 'Final', daysLeft: 0 };
  }

  const diff = end - now;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const totalDuration = end - start;
  const elapsed = now - start;
  const progress = Math.min(elapsed / totalDuration, 1);

  return { status: 'live', label: 'Time Left', countdown: `${days}d ${hours}h`, daysLeft: days, progress };
}

/**
 * Generate competition leaderboard from user data.
 * Mixes real user with simulated competitors.
 *
 * @param {Object} userStats - { pnl, pnlPct, trades, wins, maxDrawdown, dailyReturns }
 */
export function generateCompetitionLeaderboard(userStats) {
  // Simulated competitors with realistic trading profiles
  const COMPETITORS = [
    { name: 'TriniTrader', pnlPct: 28.4, winRate: 0.72, maxDD: 8.5, trades: 87, style: 'Momentum' },
    { name: 'IslandWhale', pnlPct: 22.1, winRate: 0.58, maxDD: 15.2, trades: 142, style: 'Scalper' },
    { name: 'SolSurfer.sol', pnlPct: 19.7, winRate: 0.65, maxDD: 11.0, trades: 63, style: 'Swing' },
    { name: 'BajaCrypto', pnlPct: 17.3, winRate: 0.60, maxDD: 18.7, trades: 95, style: 'Aggressive' },
    { name: 'CaribbeanDAO', pnlPct: 15.8, winRate: 0.70, maxDD: 6.2, trades: 45, style: 'Conservative' },
    { name: 'LimeStaker42', pnlPct: 14.2, winRate: 0.55, maxDD: 22.0, trades: 110, style: 'High Freq' },
    { name: 'ReefRunner', pnlPct: 12.5, winRate: 0.63, maxDD: 9.8, trades: 78, style: 'Balanced' },
    { name: 'JupiterJam', pnlPct: 10.1, winRate: 0.57, maxDD: 14.5, trades: 56, style: 'DeFi Native' },
    { name: 'CoralCapital', pnlPct: 8.9, winRate: 0.68, maxDD: 5.1, trades: 34, style: 'Low Risk' },
    { name: 'PalmTreeFi', pnlPct: 7.2, winRate: 0.52, maxDD: 19.0, trades: 125, style: 'Degen' },
    { name: 'TradeWinds_TT', pnlPct: 5.5, winRate: 0.61, maxDD: 10.3, trades: 42, style: 'Technical' },
    { name: 'RWARebelTT', pnlPct: 4.1, winRate: 0.59, maxDD: 7.8, trades: 28, style: 'RWA Focus' },
    { name: 'GuyanaGold', pnlPct: 2.8, winRate: 0.48, maxDD: 25.0, trades: 88, style: 'Volatile' },
    { name: 'NFTCaribbe', pnlPct: 1.2, winRate: 0.45, maxDD: 30.0, trades: 67, style: 'NFT Degen' },
    { name: 'JamaicaJup', pnlPct: -1.5, winRate: 0.42, maxDD: 18.0, trades: 50, style: 'Learning' },
    { name: 'StKittsStake', pnlPct: -3.2, winRate: 0.38, maxDD: 22.5, trades: 35, style: 'Beginner' },
    { name: 'DominicaDAO', pnlPct: -5.8, winRate: 0.35, maxDD: 28.0, trades: 23, style: 'Cautious' },
    { name: 'HaitiHODL', pnlPct: -8.4, winRate: 0.32, maxDD: 35.0, trades: 18, style: 'HODL Only' },
    { name: 'BelizeDeFi', pnlPct: -12.0, winRate: 0.30, maxDD: 40.0, trades: 12, style: 'Reckless' },
    { name: 'CubaChain', pnlPct: -15.5, winRate: 0.25, maxDD: 45.0, trades: 8, style: 'Gambler' },
  ];

  const entries = COMPETITORS.map(c => ({
    name: c.name,
    pnlPct: c.pnlPct,
    trades: c.trades,
    winRate: c.winRate,
    maxDrawdown: c.maxDD,
    style: c.style,
    score: calcCompetitionScore(c.pnlPct, c.winRate, c.maxDD, [], c.trades),
    isUser: false,
  }));

  // Add real user
  const userWinRate = userStats.trades > 0 ? userStats.wins / userStats.trades : 0;
  const userScore = calcCompetitionScore(
    userStats.pnlPct || 0,
    userWinRate,
    userStats.maxDrawdown || 0,
    userStats.dailyReturns || [],
    userStats.trades || 0,
  );

  entries.push({
    name: 'You',
    pnlPct: userStats.pnlPct || 0,
    trades: userStats.trades || 0,
    winRate: userWinRate,
    maxDrawdown: userStats.maxDrawdown || 0,
    style: 'Your Strategy',
    score: userScore,
    isUser: true,
  });

  entries.sort((a, b) => b.score - a.score);
  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}
