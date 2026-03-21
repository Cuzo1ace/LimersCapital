export const TIERS = [
  { level: 1, xp: 0,    name: 'Sand Walker',       color: '#C2A878', icon: '👣' },
  { level: 2, xp: 200,  name: 'Reef Spotter',      color: '#00ffa3', icon: '🪸' },
  { level: 3, xp: 500,  name: 'Trade Wind',        color: '#2D9B56', icon: '🌴' },
  { level: 4, xp: 1000, name: 'Island Navigator',  color: '#FFCA3A', icon: '🧭' },
  { level: 5, xp: 2000, name: 'Caribbean Captain',color: '#bf81ff', icon: '⚓' },
  { level: 6, xp: 3500, name: 'Limer Legend',      color: '#00ffa3', icon: '👑' },
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
};

export const FEATURE_KEYS = {
  ttsec_spot: 'ttsec_spot',
  ttse_trading: 'ttse_trading',
  limit_orders: 'limit_orders',
  portfolio_analytics: 'portfolio_analytics',
  pro_trader: 'pro_trader',
};
