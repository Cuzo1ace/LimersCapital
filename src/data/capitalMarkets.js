/**
 * Caribbean Capital Markets Data
 * ─────────────────────────────
 * Single source of truth for PE ratios, exchange profiles,
 * undervaluation data, and the 3-layer capital markets thesis.
 *
 * Sources: Simply Wall St, Siblis Research, GuruFocus, TTSE, JSE, IFC Review
 * Last verified: April 10, 2026
 */

// ── Exchange-level PE comparison ──────────────────────────────────
export const PE_COMPARISON = [
  { id: 'ttse',   name: 'TTSE (Trinidad)',     pe: 9.9,  avg3yr: 12.0, marketCap: '~US$21.4B', flag: '🇹🇹', color: '#FF4D6D' },
  { id: 'jse',    name: 'JSE (Jamaica)',        pe: 13.4, avg3yr: 11.5, marketCap: '~US$12.2B', flag: '🇯🇲', color: '#00C8B4' },
  { id: 'bse',    name: 'BSE (Barbados)',       pe: null, avg3yr: null, marketCap: '~US$2.75B', flag: '🇧🇧', color: '#003DA5' },
  { id: 'em',     name: 'Emerging Markets',     pe: 17.0, avg3yr: 15.0, marketCap: null,        flag: '🌍', color: '#FFCA3A' },
  { id: 'us',     name: 'S&P 500 (US)',         pe: 21.0, avg3yr: 20.0, marketCap: null,        flag: '🇺🇸', color: '#627EEA' },
];

// ── TTSE discount calculations ──────────────────────────────────
export const TTSE_DISCOUNTS = {
  vsJSE:     { label: 'vs Jamaica (JSE)',       discount: 26,  target: 13.4 },
  vsEM:      { label: 'vs Emerging Markets',    discount: 42,  target: 17.0 },
  vsDM:      { label: 'vs Developed Markets',   discount: 53,  target: 21.0 },
  vsOwnAvg:  { label: 'vs Own 3-Year Average',  discount: 18,  target: 12.0 },
};

// ── Structural causes of undervaluation ──────────────────────────
export const UNDERVALUATION_CAUSES = [
  {
    id: 'liquidity',
    cause: 'Illiquidity Discount',
    impact: '20-30%',
    detail: 'Many TTSE stocks trade only a few times per month. Damodaran (NYU) estimates 30-50% discounts for thinly traded assets.',
    solution: '24/7 global trading on Solana DEXs with instant settlement and fractional ownership.',
    icon: '💧',
  },
  {
    id: 'fragmentation',
    cause: 'Market Fragmentation',
    impact: '5-10%',
    detail: '5 separate Caribbean exchanges. Cross-listed stocks show 5% price differentials between markets. No arbitrage mechanism.',
    solution: 'Single unified order book on Solana for all Caribbean equities.',
    icon: '🧩',
  },
  {
    id: 'conglomerate',
    cause: 'Conglomerate Discount',
    impact: '10-15%',
    detail: 'ANSA McAL and Massy span brewing, banking, retail, construction. Investors can\'t pick individual divisions.',
    solution: 'Tokenize subsidiaries individually for sum-of-parts investing.',
    icon: '🏢',
  },
  {
    id: 'information',
    cause: 'Information Asymmetry',
    impact: '5-10%',
    detail: 'Zero major investment bank coverage. No Bloomberg terminals. No analyst estimates or price targets.',
    solution: 'On-chain analytics + AI-powered equity research via Agent Squeeze.',
    icon: '🔍',
  },
  {
    id: 'access',
    cause: 'No Institutional Access',
    impact: '5-10%',
    detail: 'No ETFs, no ADRs, capital controls on TTD. Global funds literally cannot buy these stocks.',
    solution: 'Any Solana wallet holder worldwide can access Caribbean equities.',
    icon: '🔒',
  },
];

// ── Featured undervalued companies ────────────────────────────────
export const UNDERVALUED_COMPANIES = [
  {
    symbol: 'AMCL',
    name: 'ANSA McAL',
    pe: 10,
    gfValue: 63.53,
    price: 46.00,
    priceToValue: 0.72,
    revenue: 'US$892M',
    sectors: 'Manufacturing, Banking, Brewing, Automotive, Media',
    assessment: '28% undervalued',
    flag: '🇹🇹',
  },
  {
    symbol: 'MASSY',
    name: 'Massy Holdings',
    pe: 10.02,
    gfValue: null,
    price: null,
    priceToValue: null,
    revenue: 'US$1.7B',
    sectors: 'Retail, Gas, Automotive, Financial, Industrial',
    assessment: 'Flat PE despite revenue growth',
    flag: '🇹🇹',
  },
  {
    symbol: 'RBL',
    name: 'Republic Bank',
    pe: 8.5,
    gfValue: null,
    price: null,
    priceToValue: null,
    revenue: null,
    sectors: 'Banking, Financial Services',
    assessment: 'Below regional banking peers',
    flag: '🇹🇹',
  },
];

// ── Global vs Local comparison pairs ─────────────────────────────
export const GLOBAL_LOCAL_COMPARISONS = [
  {
    global: { name: 'Apple (AAPL)',           pe: 28,   divYield: 0.5,  label: 'US Tech Giant' },
    local:  { name: 'ANSA McAL (AMCL)',       pe: 10,   divYield: 3.2,  label: 'Caribbean Conglomerate' },
    insight: 'Same quality management, 64% lower PE, 6× higher dividend yield.',
  },
  {
    global: { name: 'JPMorgan (JPM)',         pe: 12,   divYield: 2.3,  label: 'US Bank' },
    local:  { name: 'Republic Bank (RBL)',    pe: 8.5,  divYield: 4.5,  label: 'Caribbean Bank' },
    insight: 'Regional banking leader at a 29% discount to the world\'s largest bank.',
  },
  {
    global: { name: 'Walmart (WMT)',          pe: 35,   divYield: 1.1,  label: 'US Retail' },
    local:  { name: 'Massy Holdings (MASSY)', pe: 10,   divYield: 2.8,  label: 'Caribbean Retail/Industrial' },
    insight: 'Caribbean retail giant at 71% lower PE than its US equivalent.',
  },
  {
    global: { name: 'S&P 500 Index',          pe: 21,   divYield: 1.3,  label: 'US Market Average' },
    local:  { name: 'TTSE Composite',         pe: 9.9,  divYield: 3.5,  label: 'Caribbean Market Average' },
    insight: 'An entire market trading at half the US valuation — structural, not fundamental.',
  },
];

// ── Three-layer architecture ─────────────────────────────────────
export const CAPITAL_MARKET_LAYERS = [
  {
    id: 'local',
    num: '01',
    title: 'Local',
    tagline: 'Your home exchange, on-chain.',
    exchanges: ['TTSE'],
    stocks: '30+ stocks',
    status: 'Live (paper trading)',
    color: '#FF4D6D',
    features: [
      'Trinidad & Tobago Stock Exchange — 30 stocks, 5 indices',
      'TTD balance display with real-time conversion',
      'Wam VASP fiat on-ramp for TTD ↔ crypto',
      'TTSEC regulatory compliance mapping',
    ],
  },
  {
    id: 'regional',
    num: '02',
    title: 'Regional',
    tagline: "The Caribbean's unified capital market.",
    exchanges: ['TTSE', 'JSE', 'BSE', 'ECSE'],
    stocks: '100+ stocks',
    status: 'Expanding (12-18 months)',
    color: '#00FFA3',
    features: [
      'Jamaica Stock Exchange — 45+ companies',
      'Barbados Stock Exchange — 20 companies',
      'Eastern Caribbean Securities Exchange — 8 nations',
      'Cross-border settlement eliminating 5% price differentials',
    ],
  },
  {
    id: 'global',
    num: '03',
    title: 'Global',
    tagline: 'Access every market through one wallet.',
    exchanges: ['Ondo', 'Jupiter', 'Solana DeFi'],
    stocks: '200+ US equities + all Solana tokens',
    status: 'Via Solana ecosystem',
    color: '#BF81FF',
    features: [
      'Ondo Finance: 200+ tokenized US stocks & ETFs on Solana',
      'Jupiter Aggregator: real on-chain swaps across all Solana tokens',
      'Diaspora corridor: Brooklyn ↔ Port of Spain investment flow',
      'CBDC interoperability: Sand Dollar, JAM-DEX, DCash',
    ],
  },
];

// ── Solana RWA ecosystem stats ────────────────────────────────────
export const SOLANA_RWA_STATS = {
  totalRWA:       '$873M',
  ondoStocks:     '200+',
  blackrockBUILD: '$255M',
  galaxyTarget:   '$2B by end 2026',
  mckinseyTarget: '$2T by 2030',
  solTPS:         '~4,000',
  solTxCost:      '~$0.00025',
};

// ── Key stats for the value unlock narrative ──────────────────────
export const VALUE_UNLOCK = {
  combinedCaribMktCap: '$37B',
  ttseCurrentPE:  9.9,
  realisticTarget: 14,
  upsidePercent:  41,
  valueCreation:  '$8.9B',
  remittanceCorridor: '$20.4B/yr',
  remittanceCostCurrent: '7.1%',
  remittanceCostTarget:  '1.5%',
  annualFeeSavings: '$1.1B',
};
