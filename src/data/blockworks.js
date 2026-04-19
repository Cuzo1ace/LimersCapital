/**
 * Blockworks integration data — curated headlines, deep links, attribution.
 *
 * Until we hold a Blockworks Research API key (partnership pending), the
 * signal surfaces run on a curated list we refresh weekly. Keep entries
 * honest, editorially useful, and linked to the actual article.
 *
 * Tier model:
 *   free   → rotating headlines + link-out to blockworks.com
 *   pro    → full Research Hub on Terminal → Research tab (richer preview,
 *            podcast embeds, and — when the API lands — live asset metadata)
 *
 * Refresh cadence: weekly. If you're re-editing this file, add the new
 * headline to the top of CURATED_HEADLINES and prune anything older than
 * 14 days; link rot is worse than a thin list.
 */

export const BLOCKWORKS_HOME = 'https://blockworks.com';
export const BLOCKWORKS_RESEARCH = 'https://blockworks.com/research';
export const BLOCKWORKS_PRICES = 'https://blockworks.com/prices';
export const BLOCKWORKS_PODCASTS = 'https://blockworks.com/podcast';
export const WEEKEND_MARKETS_URL = 'https://weekendmarkets.xyz/?surface=chart';

/**
 * Curated research headlines — a thin, honest rotation until we hold
 * API credentials. Each entry links to the actual Blockworks surface.
 *
 * @typedef {Object} BlockworksHeadline
 * @property {string} title      — the headline text (<= 85 chars)
 * @property {string} kicker     — short tag (e.g. "RESEARCH", "PODCAST", "MACRO")
 * @property {string} url        — absolute URL on blockworks.com
 * @property {string} [topic]    — optional topic slug for filtering
 */

/** @type {BlockworksHeadline[]} */
export const CURATED_HEADLINES = [
  {
    title: 'Weekend session coverage: US futures, equity-linked risk, and hit rates',
    kicker: 'MACRO',
    url: WEEKEND_MARKETS_URL,
    topic: 'weekend-markets',
  },
  {
    title: 'The institutional playbook for tokenized equities on Solana',
    kicker: 'RESEARCH',
    url: BLOCKWORKS_RESEARCH,
    topic: 'rwa',
  },
  {
    title: 'Stablecoins, DeFi, and credit creation — Blockworks deep dive',
    kicker: 'RESEARCH',
    url: BLOCKWORKS_RESEARCH,
    topic: 'stablecoins',
  },
  {
    title: 'Empire podcast: the state of crypto and emerging-market adoption',
    kicker: 'PODCAST',
    url: BLOCKWORKS_PODCASTS,
    topic: 'emerging-markets',
  },
  {
    title: 'Live prices, liquidations, open interest — market pulse on Blockworks',
    kicker: 'PRICES',
    url: BLOCKWORKS_PRICES,
    topic: 'prices',
  },
];

/**
 * Free-tier weekend-markets teaser data — two honest, anonymized data
 * points shown to unauthenticated visitors. The actual Blockworks
 * weekendmarkets.xyz surface renders the full chart; we deliberately
 * show less to create the tiering pull the user asked for ("free sees
 * the shape, pro sees the surface").
 *
 * These are placeholder values until we have a live feed. The UI labels
 * this clearly as a "sample preview" so we never misrepresent live data.
 */
export const WEEKEND_TEASER_POINTS = [
  { label: 'ES Futures', move: '−0.22%', hint: 'S&P 500 e-mini · weekend session' },
  { label: 'BTC / ETH', move: '+0.41%', hint: 'crypto stays open; correlation signal' },
];

export const ATTRIBUTION_LINE = 'Powered by CoinGecko · Curated by Blockworks';

/**
 * Richer curated research set for the Pro Terminal's Research Hub. Each
 * entry includes a 1-line summary we author, a kicker chip, an accent
 * color for the card gradient, and a dateLabel. Refresh weekly; when
 * the Blockworks Research API key lands, this list is replaced by live
 * /research results keyed by topic relevance to emerging markets +
 * tokenized equities.
 *
 * @typedef {Object} BlockworksResearchEntry
 * @property {string} id            — stable slug; used as React key
 * @property {string} title         — headline (<= 90 chars ideal)
 * @property {string} summary       — one-line editorial summary we write
 * @property {string} kicker        — RESEARCH | PODCAST | MACRO | NEWSLETTER | PRICES
 * @property {string} url           — link-out on blockworks.com
 * @property {string} dateLabel     — human-readable, e.g. "THIS WEEK"
 * @property {string} accent        — hex for the cover gradient
 * @property {string} [topic]
 */

/** @type {BlockworksResearchEntry[]} */
export const CURATED_RESEARCH = [
  {
    id: 'weekend-markets-coverage',
    title: 'Weekend price discovery · US futures and equity-linked risk',
    summary:
      'Institutional coverage of weekend-open sessions. How hit-rate, coverage and realized vol behave when most desks are dark — a must-check before Monday\'s open.',
    kicker: 'MACRO',
    url: WEEKEND_MARKETS_URL,
    dateLabel: 'LIVE',
    accent: '#FFCA3A',
    topic: 'weekend-markets',
  },
  {
    id: 'tokenized-equities-solana',
    title: 'The institutional playbook for tokenized equities on Solana',
    summary:
      'Framework for how xStocks, Backed, WisdomTree and Ondo are onboarding regulated tokenized equities. Implications for emerging-market exchanges looking to list.',
    kicker: 'RESEARCH',
    url: BLOCKWORKS_RESEARCH,
    dateLabel: 'THIS WEEK',
    accent: '#C46CFF',
    topic: 'rwa',
  },
  {
    id: 'stablecoins-credit-creation',
    title: 'Stablecoins, DeFi, and credit creation',
    summary:
      'How dollar-pegged stablecoins are rewiring credit formation in emerging markets — the macro tailwind behind the TTDC / NGN / ARS corridor.',
    kicker: 'RESEARCH',
    url: BLOCKWORKS_RESEARCH,
    dateLabel: 'THIS WEEK',
    accent: '#00ffa3',
    topic: 'stablecoins',
  },
  {
    id: 'empire-podcast-emerging',
    title: 'Empire · the state of crypto and emerging-market adoption',
    summary:
      'Conversation on retail adoption patterns across Latin America, Africa, and South Asia. Why the next billion users aren\'t coming through US exchanges.',
    kicker: 'PODCAST',
    url: BLOCKWORKS_PODCASTS,
    dateLabel: 'LATEST EP',
    accent: '#00c8ff',
    topic: 'emerging-markets',
  },
  {
    id: 'live-prices-hub',
    title: 'Live prices, liquidations, and open-interest pulse',
    summary:
      'Real-time market data for top-100 crypto assets — spot, perps, liquidations, and cross-venue OI. The desk-terminal view of today\'s tape.',
    kicker: 'PRICES',
    url: BLOCKWORKS_PRICES,
    dateLabel: 'LIVE',
    accent: '#ff716c',
    topic: 'prices',
  },
  {
    id: 'newsletter-morning-brief',
    title: 'Morning brief · what institutional crypto needs to know today',
    summary:
      'Daily editorial digest from the Blockworks newsroom. 5-minute read, landed in our top-tier users\' inboxes by 8am ET.',
    kicker: 'NEWSLETTER',
    url: 'https://blockworks.co/newsletter',
    dateLabel: 'DAILY',
    accent: '#bf81ff',
    topic: 'daily',
  },
];

/**
 * Mock weekend-session signal data for the Pro Macro panel.
 * Illustrative only — labeled as such in the UI. When the Blockworks
 * API lands or a ToS-cleared iframe embed is approved, swap for live.
 *
 * Each entry carries a short 12-point sparkline (relative moves) so we
 * can draw our own SVG without pulling any chart lib into the bundle.
 */
export const WEEKEND_SIGNAL = {
  asOf: 'SAT 16:00 ET',
  tiles: [
    { symbol: 'ES', label: 'S&P 500 E-mini',   move: '−0.22%', direction: 'down', spark: [100, 99.8, 99.6, 99.9, 99.5, 99.3, 99.7, 99.4, 99.6, 99.5, 99.8, 99.78], accent: '#ff716c' },
    { symbol: 'NQ', label: 'Nasdaq E-mini',    move: '−0.41%', direction: 'down', spark: [100, 99.7, 99.4, 99.8, 99.5, 99.2, 99.6, 99.4, 99.6, 99.5, 99.7, 99.59], accent: '#ff716c' },
    { symbol: 'CL', label: 'WTI Crude',        move: '+0.84%', direction: 'up',   spark: [100, 100.2, 100.1, 100.3, 100.5, 100.4, 100.6, 100.7, 100.5, 100.6, 100.8, 100.84], accent: '#FFCA3A' },
    { symbol: 'GC', label: 'Gold',             move: '+0.31%', direction: 'up',   spark: [100, 100.1, 100.2, 100.1, 100.3, 100.2, 100.3, 100.4, 100.3, 100.2, 100.3, 100.31], accent: '#00ffa3' },
    { symbol: 'BTC', label: 'Bitcoin spot',    move: '+0.41%', direction: 'up',   spark: [100, 100.1, 100.3, 100.2, 100.5, 100.3, 100.6, 100.4, 100.3, 100.2, 100.4, 100.41], accent: '#F7931A' },
    { symbol: 'ETH', label: 'Ether spot',      move: '+0.18%', direction: 'up',   spark: [100, 99.9, 100.1, 100.2, 100.1, 100.3, 100.2, 100.1, 100.2, 100.1, 100.2, 100.18], accent: '#627EEA' },
  ],
};
