export const TIERS = [
  { level: 1, xp: 0,    name: 'Sand Walker',       color: '#C2A878', icon: '👣' },
  { level: 2, xp: 200,  name: 'Reef Spotter',      color: '#00ffa3', icon: '🪸' },
  { level: 3, xp: 500,  name: 'Trade Wind',        color: '#2D9B56', icon: '🌴' },
  { level: 4, xp: 1000, name: 'Island Navigator',  color: '#FFCA3A', icon: '🧭' },
  { level: 5, xp: 2000, name: 'Caribbean Captain',color: '#bf81ff', icon: '⚓' },
  { level: 6, xp: 3500, name: 'Limer Legend',      color: '#00ffa3', icon: '👑' },
  { level: 7, xp: 5000, name: 'Diamond Hands',     color: '#00d4ff', icon: '💎' },
  { level: 8, xp: 7500, name: 'Market Maker',      color: '#ff6b6b', icon: '🏛️' },
  { level: 9, xp: 10000, name: 'DeFi Architect',   color: '#ffd700', icon: '🔱' },
  { level: 10, xp: 15000, name: 'Sovereign',        color: '#ff00ff', icon: '🌟' },
];

export function getTier(xp) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].xp) return TIERS[i];
  }
  return TIERS[0];
}

export function getNextTier(xp) {
  for (const t of TIERS) {
    if (xp < t.xp) return t;
  }
  return null; // max tier
}

export const XP_VALUES = {
  lessonRead: 50,
  quizPass: 100,
  quizPerfect: 150,
  moduleComplete: 200,
  firstTrade: 75,
  tenTrades: 50,
  fiftyTrades: 100,
  dailyStreak: 25,
  glossaryTerm: 5,
  weeklyChallenge: 200,
  communityPost: 15,
  priceAlertTriggered: 10,
  portfolioReview: 30,
  shareMilestone: 25,
  ttseTrade: 15,
  firstLimitOrder: 50,
  lpLessonRead: 60,
  lpQuizPass: 120,
  lpQuizPerfect: 180,
  lpModuleComplete: 250,
  lpSimPosition: 100,
  agentSqueezeUse: 30,
  flywheelView: 20,
  lpArmyVisit: 40,
};

export const FEATURE_KEYS = {
  ttsec_spot: 'ttsec_spot',
  ttse_trading: 'ttse_trading',
  limit_orders: 'limit_orders',
  portfolio_analytics: 'portfolio_analytics',
  pro_trader: 'pro_trader',
  meteora_dashboard: 'meteora_dashboard',
  agent_squeeze_basic: 'agent_squeeze_basic',
  agent_squeeze_pro: 'agent_squeeze_pro',
  lp_dashboard: 'lp_dashboard',
};
