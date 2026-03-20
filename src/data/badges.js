export const BADGES = [
  // Milestone
  { id: 'first_lesson', title: 'First Tide', desc: 'Complete your first lesson', icon: '🌊', cat: 'milestone', check: s => Object.keys(s.lessonsRead).length >= 1 },
  { id: 'all_lessons', title: 'Scholar of the Islands', desc: 'Complete all 14 lessons', icon: '🎓', cat: 'milestone', check: s => Object.keys(s.lessonsRead).length >= 14 },
  { id: 'first_trade', title: 'Market Dip', desc: 'Execute your first paper trade', icon: '📉', cat: 'milestone', check: s => s.trades.length >= 1 },
  { id: 'ten_trades', title: 'Seasoned Trader', desc: 'Execute 10 paper trades', icon: '📊', cat: 'milestone', check: s => s.trades.length >= 10 },
  { id: 'fifty_trades', title: 'Whale Watcher', desc: 'Execute 50 paper trades', icon: '🐋', cat: 'milestone', check: s => s.trades.length >= 50 },
  { id: 'first_profit', title: 'Green Tide', desc: 'Close a position with profit', icon: '💚', cat: 'milestone', check: s => s.trades.some(t => t.side === 'sell' && t.total > 0) },
  { id: 'portfolio_10k', title: 'Rising Tide', desc: 'Portfolio gains exceed $10,000', icon: '🚀', cat: 'milestone', check: () => false }, // checked manually via P&L

  // Skill
  { id: 'perfect_quiz', title: 'Sharp Mind', desc: 'Score 100% on any quiz', icon: '🧠', cat: 'skill', check: s => Object.values(s.quizResults).some(r => r.perfect) },
  { id: 'all_quizzes_perfect', title: 'Island Genius', desc: 'Score 100% on all quizzes', icon: '💎', cat: 'skill', check: s => { const r = s.quizResults; return ['quiz-1','quiz-2','quiz-3','quiz-4'].every(q => r[q]?.perfect); } },
  { id: 'ttse_trader', title: 'Trini Trader', desc: 'Execute 5 TTSE trades', icon: '🇹🇹', cat: 'skill', check: s => s.trades.filter(t => t.market === 'ttse').length >= 5 },
  { id: 'diversified', title: 'Coral Portfolio', desc: 'Hold positions in both Solana and TTSE', icon: '🪸', cat: 'skill', check: s => s.holdings.some(h => h.market === 'solana') && s.holdings.some(h => h.market === 'ttse') },
  { id: 'glossary_master', title: 'Walking Dictionary', desc: 'View all glossary terms', icon: '📖', cat: 'skill', check: s => (s.viewedGlossaryTerms || []).length >= 10 },

  // Special
  { id: 'streak_7', title: 'Trade Wind Streak', desc: '7-day login streak', icon: '🔥', cat: 'special', check: s => s.longestStreak >= 7 },
  { id: 'hat_trick', title: 'Hat Trick', desc: 'Pass 3 quizzes in a row without wrong answers', icon: '🎩', cat: 'special', check: s => s.quizStreak >= 3 },

  // LP (Phase 2)
  { id: 'lp_100', title: 'First Harvest', desc: 'Earn 100 Limer Points', icon: '🌱', cat: 'special', check: s => (s.limerPoints || 0) >= 100 },
  { id: 'lp_1000', title: 'Community Builder', desc: 'Earn 1,000 Limer Points', icon: '🏗️', cat: 'special', check: s => (s.limerPoints || 0) >= 1000 },
  { id: 'lp_5000', title: 'Protocol Pioneer', desc: 'Earn 5,000 Limer Points', icon: '🚀', cat: 'special', check: s => (s.limerPoints || 0) >= 5000 },
  { id: 'referrer', title: 'Network Effect', desc: 'Get your first referral', icon: '🤝', cat: 'special', check: s => (s.lpReferrals || []).length >= 1 },
];
