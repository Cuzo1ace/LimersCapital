/**
 * Practice Challenges — Guided exercises that teach specific trading skills.
 *
 * Each challenge has a `check(state)` function that evaluates whether
 * the user has completed the objective. The check follows the same
 * pattern as BADGES in badges.js.
 */

const PRACTICE_CHALLENGES = [
  {
    id: 'first_trade',
    title: 'The First Step',
    objective: 'Execute your first paper trade on any market.',
    hint: 'Go to the Trade tab and buy any Solana token.',
    difficulty: 'beginner',
    xpReward: 20,
    lpReward: 5,
    relatedLessonId: '1-1',
    check: (state) => (state.trades || []).length >= 1,
  },
  {
    id: 'caribbean_trader',
    title: 'Caribbean Roots',
    objective: 'Buy a TTSE-listed stock.',
    hint: 'Switch to the Caribbean Stocks tab and trade any TTSE stock.',
    difficulty: 'beginner',
    xpReward: 25,
    lpReward: 10,
    relatedLessonId: '2-1',
    check: (state) => (state.trades || []).some(t => t.market === 'ttse'),
  },
  {
    id: 'diversifier',
    title: 'Caribbean Diversifier',
    objective: 'Hold positions in both Solana tokens AND TTSE stocks.',
    hint: 'Buy at least one Solana token and one TTSE stock to diversify.',
    difficulty: 'intermediate',
    xpReward: 30,
    lpReward: 15,
    relatedLessonId: '4-2',
    check: (state) => {
      const h = state.holdings || [];
      return h.some(p => p.market === 'solana') && h.some(p => p.market === 'ttse');
    },
  },
  {
    id: 'perp_opener',
    title: 'Leverage Unlocked',
    objective: 'Open your first perpetual futures position.',
    hint: 'Navigate to the Perpetuals tab and open a long or short position.',
    difficulty: 'intermediate',
    xpReward: 30,
    lpReward: 10,
    relatedLessonId: '3-1',
    check: (state) => (state.perpTradeCount || 0) >= 1,
  },
  {
    id: 'the_hedge',
    title: 'The Hedge',
    objective: 'Hold both a LONG and a SHORT perp position simultaneously.',
    hint: 'Open a long on one asset and a short on another in Perpetuals.',
    difficulty: 'advanced',
    xpReward: 40,
    lpReward: 20,
    relatedLessonId: '4-1',
    check: (state) => {
      const pos = (state.perpPositions || []).filter(p => p.status === 'open');
      return pos.some(p => p.side === 'long') && pos.some(p => p.side === 'short');
    },
  },
  {
    id: 'trail_blazer',
    title: 'Trail Blazer',
    objective: 'Set a trailing stop on any perpetual position.',
    hint: 'When opening a perp position, set a trailing stop percentage.',
    difficulty: 'intermediate',
    xpReward: 25,
    lpReward: 10,
    relatedLessonId: '4-2',
    check: (state) => {
      const pos = state.perpPositions || [];
      return pos.some(p => p.trailingStop && p.trailingStop > 0);
    },
  },
  {
    id: 'profit_protector',
    title: 'Profit Protector',
    objective: 'Set both a stop-loss AND take-profit on a perp position.',
    hint: 'Use the SL/TP fields when opening a new perp position.',
    difficulty: 'intermediate',
    xpReward: 30,
    lpReward: 15,
    relatedLessonId: '4-2',
    check: (state) => {
      const pos = state.perpPositions || [];
      return pos.some(p => p.stopLoss && p.takeProfit);
    },
  },
  {
    id: 'size_wisely',
    title: 'Size Wisely',
    objective: 'Make a trade using less than 5% of your portfolio.',
    hint: 'Practice proper position sizing — don\'t risk too much on one trade.',
    difficulty: 'beginner',
    xpReward: 20,
    lpReward: 5,
    relatedLessonId: '4-2',
    check: (state) => {
      const trades = state.trades || [];
      const bal = state.balanceUSD || 100000;
      return trades.some(t => t.total < bal * 0.05);
    },
  },
  {
    id: 'five_trades',
    title: 'Getting Warmed Up',
    objective: 'Complete 5 paper trades.',
    hint: 'Keep trading across any market to build experience.',
    difficulty: 'beginner',
    xpReward: 25,
    lpReward: 10,
    relatedLessonId: '4-2',
    check: (state) => (state.trades || []).length >= 5,
  },
  {
    id: 'dca_master',
    title: 'DCA Discipline',
    objective: 'Buy the same token at least 3 times (dollar-cost averaging).',
    hint: 'Pick a token and buy it multiple times to average your entry price.',
    difficulty: 'intermediate',
    xpReward: 30,
    lpReward: 15,
    relatedLessonId: '4-2',
    check: (state) => {
      const buys = (state.trades || []).filter(t => t.side === 'buy');
      const counts = {};
      buys.forEach(t => { counts[t.symbol] = (counts[t.symbol] || 0) + 1; });
      return Object.values(counts).some(c => c >= 3);
    },
  },
  {
    id: 'journal_starter',
    title: 'The Reflective Trader',
    objective: 'Write 3 trading journal entries.',
    hint: 'After each trade, use the journal prompt to record your thinking.',
    difficulty: 'beginner',
    xpReward: 25,
    lpReward: 10,
    relatedLessonId: '4-2',
    check: (state) => Object.keys(state.tradeJournal || {}).length >= 3,
  },
  {
    id: 'low_leverage',
    title: 'Measured Risk',
    objective: 'Open a perp position with 2x or 3x leverage (not higher).',
    hint: 'Professional traders use low leverage. Try 2x or 3x on your next perp.',
    difficulty: 'intermediate',
    xpReward: 25,
    lpReward: 10,
    relatedLessonId: '4-1',
    check: (state) => {
      const pos = state.perpPositions || [];
      return pos.some(p => p.leverage >= 2 && p.leverage <= 3);
    },
  },
];

/**
 * Check which challenges have been completed.
 * Returns array of newly completed challenge IDs.
 */
export function checkChallenges(state) {
  const completed = state.completedPracticeChallenges || [];
  const newlyCompleted = [];

  for (const challenge of PRACTICE_CHALLENGES) {
    if (completed.includes(challenge.id)) continue;
    if (challenge.check(state)) {
      newlyCompleted.push(challenge.id);
    }
  }

  return newlyCompleted;
}

export { PRACTICE_CHALLENGES };
