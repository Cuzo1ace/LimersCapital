/**
 * Weekly Challenges — rotate 3 challenges per week.
 * Each challenge awards 200 XP + 50 LP on completion.
 * Deterministic rotation based on ISO week number.
 */

export const WEEKLY_CHALLENGES = [
  {
    id: 'diversify',
    title: 'Diversify',
    description: 'Hold 5 or more different tokens',
    icon: '🌐',
    check: (state) => state.holdings.length >= 5,
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'Complete 3 lessons this week',
    icon: '📚',
    check: (state, weekData) => (weekData?.lessonsThisWeek ?? 0) >= 3,
  },
  {
    id: 'volume_king',
    title: 'Volume King',
    description: 'Trade $10,000+ total volume this week',
    icon: '📊',
    check: (state, weekData) => (weekData?.volumeThisWeek ?? 0) >= 10000,
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Maintain a 7-day login streak',
    icon: '🔥',
    check: (state) => state.currentStreak >= 7,
  },
  {
    id: 'ttse_explorer',
    title: 'TTSE Explorer',
    description: 'Execute 3 TTSE stock trades',
    icon: '🏝️',
    check: (state, weekData) => (weekData?.ttseTradesThisWeek ?? 0) >= 3,
  },
  {
    id: 'quiz_ace',
    title: 'Quiz Ace',
    description: 'Pass any quiz with a perfect score',
    icon: '⭐',
    check: (state) => Object.values(state.quizResults).some(r => r.perfect),
  },
  {
    id: 'watchlist_builder',
    title: 'Watchlist Builder',
    description: 'Add 5 tokens to your watchlist',
    icon: '👀',
    check: (state) => (state.watchlist?.length ?? 0) >= 5,
  },
  {
    id: 'alert_setter',
    title: 'Alert Setter',
    description: 'Set up 3 price alerts',
    icon: '🔔',
    check: (state) => (state.priceAlerts?.length ?? 0) >= 3,
  },
  {
    id: 'glossary_guru',
    title: 'Glossary Guru',
    description: 'Learn 10 glossary terms',
    icon: '📖',
    check: (state) => (state.viewedGlossaryTerms?.length ?? 0) >= 10,
  },
  {
    id: 'diamond_hold',
    title: 'Diamond Hold',
    description: 'Hold a position for 7+ days',
    icon: '💎',
    check: (state) => {
      const weekAgo = Date.now() - 7 * 86400000;
      return state.holdings.some(h => h.timestamp && new Date(h.timestamp).getTime() < weekAgo);
    },
  },
  {
    id: 'limit_strategist',
    title: 'Limit Strategist',
    description: 'Place 2 limit orders',
    icon: '📋',
    check: (state) => (state.limitOrders?.filter(o => o.status === 'open' || o.status === 'triggered').length ?? 0) >= 2,
  },
  {
    id: 'balanced_trader',
    title: 'Balanced Trader',
    description: 'Execute both a buy and a sell trade',
    icon: '⚖️',
    check: (state, weekData) => (weekData?.buysThisWeek ?? 0) >= 1 && (weekData?.sellsThisWeek ?? 0) >= 1,
  },
];

/**
 * Get the ISO week number for a given date.
 */
function getISOWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Get 3 active challenges for the current week.
 * Deterministic rotation based on ISO week number.
 */
export function getWeeklyChallenges(date = new Date()) {
  const week = getISOWeek(date);
  const total = WEEKLY_CHALLENGES.length;

  // Pick 3 challenges using week number as seed
  const indices = [];
  let seed = week * 7919; // prime-based deterministic seed
  for (let i = 0; i < 3; i++) {
    seed = (seed * 31 + 17) % total;
    // Avoid duplicates
    while (indices.includes(seed % total)) {
      seed = (seed + 1) % total;
    }
    indices.push(seed % total);
  }

  return indices.map(i => WEEKLY_CHALLENGES[i]);
}

/**
 * Get the week identifier string (for tracking completions).
 */
export function getWeekId(date = new Date()) {
  return `${date.getFullYear()}-W${getISOWeek(date).toString().padStart(2, '0')}`;
}
