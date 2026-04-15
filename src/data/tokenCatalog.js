/**
 * Token catalog — single source of truth for every tradeable asset in the app.
 *
 * Adding a token here makes it automatically:
 *   - Appear in the Market page category filter
 *   - Available in the Trade page swap picker
 *   - Priced via Jupiter Price v3 (primary) + DexScreener (secondary)
 *   - Discovered by the Helius DAS logo fetcher if `logoUrl` is null
 *
 * `SOL_TOKENS`, `TOKEN_INFO`, `HELIUS_LOGO_MINTS`, and `JUPITER_ONLY_MINTS` are
 * GENERATED from TOKEN_CATALOG — never edit those by hand. All consumer code
 * still imports those names from `src/api/prices.js` so this refactor is
 * transparent to existing pages.
 *
 * Issuer notes:
 *   - `xstock`    — Backed Finance, Swiss-regulated, 1:1 custodied at Clearstream,
 *                   permissionless on Solana, mint prefix `Xs...`
 *   - `ondo-gm`   — Ondo Global Markets, mint suffix `...ondo` (vanity address)
 *   - `prestock`  — Dinari PreStocks, pre-IPO exposure, mint prefix `Pre...`
 *   - `native`    — native Solana tokens (SOL, JUP, RAY, BONK, etc.)
 *   - `wrapped`   — wrapped via a bridge (Wormhole, Portal, etc.)
 *   - `stablecoin`— fiat-backed, regulated issuer
 *   - `rwa`       — real-world-asset, other (Gold, Bitcoin, Ether tokenized)
 *   - `treasury`  — US Treasury / short-term government debt
 *   - `fiat`      — tokenized foreign fiat currency
 */

// ── Categories shown in the Market page filter (ordered) ─────────────────
export const CATEGORIES = {
  all:      { label: 'All',        color: '#fdfbfe', description: 'All tokens' },
  stock:    { label: 'Stocks',     color: '#A6A6A6', description: 'Tokenized equities — Backed, Ondo, Dinari' },
  etf:      { label: 'ETFs',       color: '#6DBF4A', description: 'Tokenized exchange-traded funds' },
  yield:    { label: 'Yield',      color: '#FFD700', description: 'Tokenized treasuries and short-duration funds' },
  l1:       { label: 'L1s',        color: '#9945FF', description: 'Layer-1 blockchains and wrapped L1 tokens' },
  defi:     { label: 'DeFi',       color: '#00C8B4', description: 'Solana DeFi protocol tokens' },
  stable:   { label: 'Stables',    color: '#2D9B56', description: 'USD-pegged stablecoins' },
  currency: { label: 'Currencies', color: '#627EEA', description: 'Tokenized foreign fiat currencies' },
  metal:    { label: 'Metals',     color: '#FFD700', description: 'Tokenized precious metals' },
  rwa:      { label: 'RWA',        color: '#FFCA3A', description: 'Real-world assets — other tokenized RWAs' },
  infra:    { label: 'Infra',      color: '#FF5C4D', description: 'Physical + digital infrastructure tokens' },
  meme:     { label: 'Meme',       color: '#FFCA3A', description: 'Community / meme tokens' },
};

// Legacy category labels (TitleCase) used by MarketPage CAT_CLS map.
// Maps the structured lowercase category keys to the TitleCase strings the UI expects.
export const LEGACY_CAT_LABEL = {
  l1: 'L1',
  stable: 'Stable',
  rwa: 'RWA',
  defi: 'DeFi',
  meme: 'Meme',
  infra: 'Infra',
  stock: 'Stock',
  etf: 'ETF',
  yield: 'Yield',
  metal: 'Metal',
  currency: 'Currency',
};

// Logo CDN helpers
const CG = (id, file) => `https://assets.coingecko.com/coins/images/${id}/small/${file}`;
const SL = (mint)     => `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`;

// ── The canonical token catalog ─────────────────────────────────────────────
// Every tradeable token in the app is listed here. Keep alphabetical within each category
// when possible to make diffs readable.
export const TOKEN_CATALOG = [
  // ── L1 ─────────────────────────────────────────────────────────────────
  {
    symbol: 'SOL',
    mint: 'So11111111111111111111111111111111111111112',
    name: 'Solana',
    category: 'l1',
    subcategory: 'native',
    issuer: 'Solana',
    color: '#9945FF',
    decimals: 9,
    tags: ['l1', 'native', 'blue-chip'],
    logoUrl: CG('4128', 'solana.png'),
  },
  {
    symbol: 'WETH',
    mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    name: 'Ether (Portal)',
    category: 'l1',
    subcategory: 'wrapped',
    issuer: 'Portal / Wormhole',
    underlying: 'ETH (Ethereum mainnet)',
    color: '#627EEA',
    decimals: 8,
    tags: ['l1', 'wrapped', 'bridge:portal'],
    disclaimer: 'Wrapped ETH via Portal/Wormhole — counterparty risk on the bridge custodian.',
    logoUrl: SL('7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs'),
  },

  // ── Stables ────────────────────────────────────────────────────────────
  {
    symbol: 'USDC',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD Coin',
    category: 'stable',
    subcategory: 'stablecoin',
    issuer: 'Circle',
    color: '#2D9B56',
    decimals: 6,
    tags: ['stable', 'usd', 'blue-chip'],
    logoUrl: CG('6319', 'usdc.png'),
  },

  // ── DeFi ───────────────────────────────────────────────────────────────
  {
    symbol: 'JUP',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    name: 'Jupiter',
    category: 'defi',
    subcategory: 'native',
    issuer: 'Jupiter',
    color: '#00C8B4',
    decimals: 6,
    tags: ['defi', 'dex-aggregator'],
    logoUrl: CG('34188', 'jup.png'),
  },
  {
    symbol: 'RAY',
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    name: 'Raydium',
    category: 'defi',
    subcategory: 'native',
    issuer: 'Raydium',
    color: '#FF5C4D',
    decimals: 6,
    tags: ['defi', 'amm'],
    logoUrl: CG('13928', 'PSigc4ie_400x400.jpg'),
  },
  {
    symbol: 'BILL',
    mint: '98sMhvDwXj1RQi5c5Mndm3vPe9cBqPrbLaufMXFNMh5g',
    name: 'HYPE',
    category: 'defi',
    subcategory: 'native',
    issuer: 'HYPE',
    color: '#00C8B4',
    decimals: 9,
    tags: ['defi'],
    logoUrl: 'https://arweave.net/QBRdRop8wI4PpScSRTKyibv-fQuYBua-WOvC7tuJyJo',
    jupiterOnly: true,
  },
  {
    symbol: 'PERP',
    mint: '7C56WnJ94iEP7YeH2iKiYpvsS5zkcpP9rJBBEBoUGdzj',
    name: 'Silver rStock',
    category: 'defi',
    subcategory: 'native',
    issuer: 'rStock',
    color: '#C0C0C0',
    decimals: 9,
    tags: ['defi'],
    logoUrl: null,          // Helius DAS fallback
    jupiterOnly: true,
  },

  // ── Infra ──────────────────────────────────────────────────────────────
  {
    symbol: 'RENDER',
    mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
    name: 'Render',
    category: 'infra',
    subcategory: 'native',
    issuer: 'Render Network',
    color: '#FF5C4D',
    decimals: 8,
    tags: ['infra', 'depin'],
    logoUrl: CG('11636', 'rndr.png'),
  },
  {
    symbol: 'HNT',
    mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
    name: 'Helium',
    category: 'infra',
    subcategory: 'native',
    issuer: 'Helium',
    color: '#00C8B4',
    decimals: 8,
    tags: ['infra', 'depin'],
    logoUrl: CG('4284', 'Helium_HNT.png'),
  },

  // ── Meme ───────────────────────────────────────────────────────────────
  {
    symbol: 'BONK',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'Bonk',
    category: 'meme',
    subcategory: 'native',
    issuer: 'Bonk',
    color: '#FFCA3A',
    decimals: 5,
    tags: ['meme'],
    logoUrl: CG('28600', 'bonk.jpg'),
  },

  // ── RWA (miscellaneous) ────────────────────────────────────────────────
  {
    symbol: 'ONDO',
    mint: 'FoNprxYzYmwnYzhM964CxEHchhj17YWvSvwUafXvQFKo',
    name: 'Ondo Finance',
    category: 'rwa',
    subcategory: 'native',
    issuer: 'Ondo Finance',
    color: '#FFCA3A',
    decimals: 8,
    tags: ['rwa', 'governance'],
    logoUrl: CG('26580', 'ONDO.png'),
  },
  {
    symbol: 'GOLD',
    mint: 'GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A',
    name: 'Gold (Tokenized)',
    category: 'rwa',
    subcategory: 'rwa',
    issuer: 'PAX Gold',
    underlying: 'Physical Gold',
    color: '#FFD700',
    decimals: 8,
    tags: ['rwa', 'metal', 'precious'],
    logoUrl: CG('9519', 'paxgold.png'),
    jupiterOnly: true,
  },
  {
    symbol: 'zBTC',
    mint: 'zBTCug3er3tLyffELcvDNrKkCymbPWysGcWihESYfLg',
    name: 'Zeus Bitcoin',
    category: 'rwa',
    subcategory: 'rwa',
    issuer: 'Zeus Network',
    underlying: 'BTC (Bitcoin mainnet)',
    color: '#F7931A',
    decimals: 8,
    tags: ['rwa', 'bitcoin', 'wrapped'],
    logoUrl: CG('1', 'bitcoin.png'),
    jupiterOnly: true,
  },

  // ── Stocks (Backed xStocks) ────────────────────────────────────────────
  {
    symbol: 'AAPLX',
    mint: 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp',
    name: 'Apple xStock',
    category: 'stock',
    subcategory: 'xstock',
    issuer: 'Backed Finance',
    underlying: 'AAPL',
    underlyingExchange: 'NASDAQ',
    color: '#A6A6A6',
    decimals: 8,
    tags: ['xstock', 'equity', 'us-market', 'big-tech'],
    disclaimer: 'Backed 1:1 by Apple shares custodied at Clearstream. Swiss-regulated.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'AMZNX',
    mint: 'Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg',
    name: 'Amazon xStock',
    category: 'stock',
    subcategory: 'xstock',
    issuer: 'Backed Finance',
    underlying: 'AMZN',
    underlyingExchange: 'NASDAQ',
    color: '#FF9900',
    decimals: 8,
    tags: ['xstock', 'equity', 'us-market', 'big-tech'],
    disclaimer: 'Backed 1:1 by Amazon shares custodied at Clearstream. Swiss-regulated.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'TSLAX',
    mint: 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB',
    name: 'Tesla xStock',
    category: 'stock',
    subcategory: 'xstock',
    issuer: 'Backed Finance',
    underlying: 'TSLA',
    underlyingExchange: 'NASDAQ',
    color: '#CC0000',
    decimals: 8,
    tags: ['xstock', 'equity', 'us-market'],
    disclaimer: 'Backed 1:1 by Tesla shares custodied at Clearstream. Swiss-regulated.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'NVDAX',
    mint: 'Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh',
    name: 'NVIDIA xStock',
    category: 'stock',
    subcategory: 'xstock',
    issuer: 'Backed Finance',
    underlying: 'NVDA',
    underlyingExchange: 'NASDAQ',
    color: '#76B900',
    decimals: 8,
    tags: ['xstock', 'equity', 'us-market', 'ai'],
    disclaimer: 'Backed 1:1 by NVIDIA shares custodied at Clearstream. Swiss-regulated.',
    logoUrl: 'https://xstocks-metadata.backed.fi/logos/tokens/NVDAx.png',
    jupiterOnly: true,
  },

  // ── Stocks (Ondo Global Markets) ───────────────────────────────────────
  {
    symbol: 'MSFTX',
    mint: 'FRmH6iRkMr33DLG6zVLR7EM4LojBFAuq6NtFzG6ondo',
    name: 'Microsoft (Ondo)',
    category: 'stock',
    subcategory: 'ondo-gm',
    issuer: 'Ondo Global Markets',
    underlying: 'MSFT',
    underlyingExchange: 'NASDAQ',
    color: '#00A4EF',
    decimals: 8,
    tags: ['ondo-gm', 'equity', 'us-market', 'big-tech'],
    disclaimer: 'Issued by Ondo Global Markets on Solana.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'GOOGLX',
    mint: 'bbahNA5vT9WJeYft8tALrH1LXWffjwqVoUbqYa1ondo',
    name: 'Alphabet (Ondo)',
    category: 'stock',
    subcategory: 'ondo-gm',
    issuer: 'Ondo Global Markets',
    underlying: 'GOOGL',
    underlyingExchange: 'NASDAQ',
    color: '#4285F4',
    decimals: 8,
    tags: ['ondo-gm', 'equity', 'us-market', 'big-tech'],
    disclaimer: 'Issued by Ondo Global Markets on Solana.',
    logoUrl: null,
    jupiterOnly: true,
  },

  // ── Stocks (Dinari PreStocks — pre-IPO exposure) ───────────────────────
  {
    symbol: 'PREN',
    mint: 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw',
    name: 'Anthropic (PreStock)',
    category: 'stock',
    subcategory: 'prestock',
    issuer: 'Dinari PreStocks',
    underlying: 'Anthropic (pre-IPO)',
    color: '#D97706',
    decimals: 8,
    tags: ['prestock', 'pre-ipo', 'ai'],
    disclaimer: 'Pre-IPO exposure via Dinari PreStocks — illiquid, not redeemable against a listed share.',
    logoUrl: 'https://prestocks.com/logos/anthropic.png',
    jupiterOnly: true,
  },
  {
    symbol: 'OPENAIX',
    mint: 'PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF',
    name: 'OpenAI (PreStock)',
    category: 'stock',
    subcategory: 'prestock',
    issuer: 'Dinari PreStocks',
    underlying: 'OpenAI (pre-IPO)',
    color: '#10A37F',
    decimals: 8,
    tags: ['prestock', 'pre-ipo', 'ai'],
    disclaimer: 'Pre-IPO exposure via Dinari PreStocks — illiquid, not redeemable against a listed share.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'SPACEXX',
    mint: 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh',
    name: 'SpaceX (PreStock)',
    category: 'stock',
    subcategory: 'prestock',
    issuer: 'Dinari PreStocks',
    underlying: 'SpaceX (pre-IPO)',
    color: '#005288',
    decimals: 8,
    tags: ['prestock', 'pre-ipo', 'space'],
    disclaimer: 'Pre-IPO exposure via Dinari PreStocks — illiquid, not redeemable against a listed share.',
    logoUrl: null,
    jupiterOnly: true,
  },

  // ── ETFs (Ondo Global Markets) ─────────────────────────────────────────
  {
    symbol: 'SPYX',
    mint: 'k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo',
    name: 'SPDR S&P 500 (Ondo)',
    category: 'etf',
    subcategory: 'ondo-gm',
    issuer: 'Ondo Global Markets',
    underlying: 'SPY',
    underlyingExchange: 'NYSE',
    color: '#E31837',
    decimals: 8,
    tags: ['etf', 'sp500', 'us-market', 'broad-market'],
    disclaimer: 'Tokenized S&P 500 exposure via Ondo Global Markets.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'QQQX',
    mint: 'HrYNm6jTQ71LoFphjVKBTdAE4uja7WsmLG8VxB8ondo',
    name: 'Invesco QQQ (Ondo)',
    category: 'etf',
    subcategory: 'ondo-gm',
    issuer: 'Ondo Global Markets',
    underlying: 'QQQ',
    underlyingExchange: 'NASDAQ',
    color: '#003B71',
    decimals: 8,
    tags: ['etf', 'nasdaq100', 'us-market', 'tech'],
    disclaimer: 'Tokenized Nasdaq-100 exposure via Ondo Global Markets.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'VTIX',
    mint: 'jCCU4GwukjNxAXJowG2S4KCrr5g6YyUB61WHYvGondo',
    name: 'Vanguard Total Stock Market (Ondo)',
    category: 'etf',
    subcategory: 'ondo-gm',
    issuer: 'Ondo Global Markets',
    underlying: 'VTI',
    underlyingExchange: 'NYSE',
    color: '#96171C',
    decimals: 8,
    tags: ['etf', 'broad-market', 'us-market'],
    disclaimer: 'Tokenized Total US Stock Market exposure via Ondo Global Markets.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'IWMX',
    mint: 'dvj2kKFSyjpnyYSYppgFdAEVfgjMEoQGi9VaV23ondo',
    name: 'iShares Russell 2000 (Ondo)',
    category: 'etf',
    subcategory: 'ondo-gm',
    issuer: 'Ondo Global Markets',
    underlying: 'IWM',
    underlyingExchange: 'NYSE',
    color: '#000000',
    decimals: 8,
    tags: ['etf', 'small-cap', 'us-market'],
    disclaimer: 'Tokenized US small-cap exposure via Ondo Global Markets.',
    logoUrl: null,
    jupiterOnly: true,
  },

  // ── Yield (Tokenized Treasuries + short-duration funds) ─────────────────
  {
    symbol: 'OUSG',
    mint: 'i7u4r16TcsJTgq1kAG8opmVZyVnAKBwLKu6ZPMwzxNc',
    name: 'Ondo Short-Term US Gov Bond',
    category: 'yield',
    subcategory: 'treasury',
    issuer: 'Ondo Finance',
    underlying: 'OUSG',
    color: '#FFD700',
    decimals: 6,
    tags: ['yield', 'treasury', 'institutional'],
    disclaimer: 'KYC-gated. Tokenized exposure to short-term US Government bonds via Ondo.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'USTB',
    mint: 'CCz3SGVziFeLYk2xfEstkiqJfYkjaSWb2GCABYsVcjo2',
    name: 'Superstate Short-Duration US Gov',
    category: 'yield',
    subcategory: 'treasury',
    issuer: 'Superstate',
    underlying: 'USTB',
    color: '#FFD700',
    decimals: 6,
    tags: ['yield', 'treasury', 'institutional'],
    disclaimer: 'KYC-gated. Tokenized exposure to short-duration US Government securities via Superstate.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'TBILL',
    mint: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6',
    name: 'OpenEden T-Bills',
    category: 'yield',
    subcategory: 'treasury',
    issuer: 'OpenEden',
    underlying: 'TBILL',
    color: '#FFD700',
    decimals: 6,
    tags: ['yield', 'treasury', 'institutional'],
    disclaimer: 'Tokenized T-Bills via OpenEden. Daily-accrued yield paid in additional TBILL tokens.',
    logoUrl: null,
    jupiterOnly: true,
  },

  // ── Metals ─────────────────────────────────────────────────────────────
  {
    symbol: 'XAG',
    mint: 'iy11ytbSGcUnrjE6Lfv78TFqxKyUESfku1FugS9ondo',
    name: 'Silver (Ondo)',
    category: 'metal',
    subcategory: 'metal',
    issuer: 'Ondo Global Markets',
    underlying: 'XAG',
    color: '#C0C0C0',
    decimals: 8,
    tags: ['metal', 'silver', 'precious'],
    disclaimer: 'Tokenized silver exposure via Ondo Global Markets.',
    logoUrl: null,
    jupiterOnly: true,
  },

  // ── Currencies (tokenized foreign fiat) ────────────────────────────────
  {
    symbol: 'EURX',
    mint: 'HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr',
    name: 'Euro (Tokenized)',
    category: 'currency',
    subcategory: 'fiat',
    issuer: 'Unknown',
    underlying: 'EUR',
    color: '#003399',
    decimals: 6,
    tags: ['currency', 'fiat', 'eu'],
    disclaimer: 'Tokenized euro — verify issuer KYC model before use.',
    logoUrl: null,
    jupiterOnly: true,
  },
  {
    symbol: 'GBPX',
    mint: '5H4voZhzySsVvwVYDAKku8MZGuYBC7cXaBKDPW4YHWW1',
    name: 'British Pound (VNX)',
    category: 'currency',
    subcategory: 'fiat',
    issuer: 'VNX',
    underlying: 'GBP',
    color: '#012169',
    decimals: 6,
    tags: ['currency', 'fiat', 'uk'],
    disclaimer: 'Tokenized GBP issued by VNX.',
    logoUrl: null,
    jupiterOnly: true,
  },
];

// ── Generated consumers (never edit by hand) ────────────────────────────────

/**
 * `SOL_TOKENS` — { [symbol]: mintAddress }
 * Flat map consumed by src/api/prices.js, TradePage, and anywhere else that
 * needs mint-address lookup by symbol. Shape preserved from the pre-refactor
 * version so existing code works unchanged.
 */
export const SOL_TOKENS = Object.freeze(
  Object.fromEntries(TOKEN_CATALOG.map(t => [t.symbol, t.mint])),
);

/**
 * `TOKEN_INFO` — { [symbol]: { name, cat, col, img } }
 * UI-facing subset. `cat` is the TitleCase legacy label (L1, Stable, Stock,
 * ETF, Yield, Metal, Currency, etc.) to keep MarketPage's CAT_CLS styling
 * working without changes.
 */
export const TOKEN_INFO = Object.freeze(
  Object.fromEntries(
    TOKEN_CATALOG.map(t => [
      t.symbol,
      {
        name: t.name,
        cat: LEGACY_CAT_LABEL[t.category] || t.category,
        col: t.color,
        img: t.logoUrl || null,
        // Extended fields (new code can opt in; old code ignores them)
        category: t.category,
        subcategory: t.subcategory,
        issuer: t.issuer,
        underlying: t.underlying,
        underlyingExchange: t.underlyingExchange,
        disclaimer: t.disclaimer,
        tags: t.tags,
        mint: t.mint,
      },
    ]),
  ),
);

/**
 * Mints whose logo should be fetched at runtime via Helius DAS `getAssetBatch`.
 * Any token with `logoUrl === null` (or undefined) is included.
 */
export const HELIUS_LOGO_MINTS = Object.freeze(
  TOKEN_CATALOG.filter(t => !t.logoUrl).map(t => t.mint),
);

/**
 * Mints that should fall back to DexScreener / Jupiter for prices because
 * they aren't on CoinGecko. Any token flagged `jupiterOnly: true`.
 */
export const JUPITER_ONLY_MINTS = Object.freeze(
  TOKEN_CATALOG.filter(t => t.jupiterOnly).map(t => t.mint),
);

// ── Lookup helpers ─────────────────────────────────────────────────────────

/**
 * Return all tokens in a given category key ('stock', 'etf', 'yield', etc.)
 * or all tokens if `key === 'all'`.
 */
export function getTokensByCategory(key) {
  if (!key || key === 'all') return TOKEN_CATALOG.slice();
  return TOKEN_CATALOG.filter(t => t.category === key);
}

/**
 * Return the full token record for a given symbol, or null if not found.
 */
export function getTokenBySymbol(symbol) {
  if (!symbol) return null;
  const up = symbol.toUpperCase();
  return TOKEN_CATALOG.find(t => t.symbol.toUpperCase() === up) || null;
}

/**
 * Return the full token record for a given mint address, or null if not found.
 */
export function getTokenByMint(mint) {
  if (!mint) return null;
  return TOKEN_CATALOG.find(t => t.mint === mint) || null;
}

/**
 * Symbols that are stocks, ETFs, or any category that has a NASDAQ/NYSE
 * underlying ticker suitable for basis-spread comparison. Used by the
 * basis-spread widget in commit (c).
 */
export function getTokensWithUnderlyingExchange() {
  return TOKEN_CATALOG.filter(t => t.underlyingExchange && t.underlying);
}
