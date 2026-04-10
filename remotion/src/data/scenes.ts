// Scene durations in frames @ 30fps
export const FPS = 30;
const sec = (s: number) => Math.round(s * FPS);

// Full walkthrough scene list (~2:30)
export const WALKTHROUGH_SCENES = {
  coldOpen:    sec(4),    // Black → logo reveal
  hook:        sec(8),    // "The Caribbean's first DeFi platform on Solana"
  hero:        sec(12),   // HeroSection reveal
  problem:     sec(14),   // 30+ nations, 0 DeFi platforms, $billions remittances
  learn:       sec(16),   // Module card → quiz → LP reward
  trade:       sec(18),   // Chart → order form → buy confirmation
  market:      sec(14),   // Token price rows cascade
  portfolio:   sec(16),   // Pie chart growing, holdings, PnL
  earn:        sec(14),   // LP counter, coin shower, tier upgrade
  bottomNav:   sec(10),   // 5 tabs spotlighting
  cta:         sec(8),    // Closing CTA
} as const;

export const TOTAL_WALKTHROUGH_FRAMES = Object.values(WALKTHROUGH_SCENES).reduce((a, b) => a + b, 0);

// Colosseum pitch (~75s) — trimmed version
export const COLOSSEUM_SCENES = {
  coldOpen:    sec(3),
  hook:        sec(6),
  hero:        sec(8),
  problem:     sec(10),
  learn:       sec(10),
  trade:       sec(12),
  portfolio:   sec(10),
  earn:        sec(8),
  cta:         sec(8),
} as const;

export const TOTAL_COLOSSEUM_FRAMES = Object.values(COLOSSEUM_SCENES).reduce((a, b) => a + b, 0);

// Landing loop (~45s) — seamless loop
export const LANDING_SCENES = {
  hero:        sec(10),
  market:      sec(8),
  trade:       sec(8),
  portfolio:   sec(8),
  earn:        sec(6),
  loopBack:    sec(5),   // fades back into hero
} as const;

export const TOTAL_LANDING_FRAMES = Object.values(LANDING_SCENES).reduce((a, b) => a + b, 0);

// Social teaser (~20s) — vertical 9:16
export const SOCIAL_SCENES = {
  hook:        sec(3),
  hero:        sec(5),
  highlight:   sec(6),   // fast cuts: learn → trade → earn
  cta:         sec(6),
} as const;

export const TOTAL_SOCIAL_FRAMES = Object.values(SOCIAL_SCENES).reduce((a, b) => a + b, 0);
