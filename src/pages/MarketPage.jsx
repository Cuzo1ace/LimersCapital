import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchSolanaMarketData, fetchSolPrice, fetchSolanaTVL, fetchFMPCryptoList, fmtSupply, fetchUnderlyingStockPrices } from '../api/prices';
import { fetchSolanaProtocols, fetchSolanaDexVolume, fetchSolanaStablecoins, fetchSolanaYields } from '../api/insights';
import { CATEGORIES, LEGACY_CAT_LABEL, TOKEN_CATALOG, getTokensWithUnderlyingExchange } from '../data/tokenCatalog';
import { SkeletonRows } from '../components/ui/Skeleton';
import GlowCard from '../components/ui/GlowCard';
import GradientDots from '../components/ui/GradientDots';
import FinancialTable, { PerfPill, Sparkline, fmtCurrency } from '../components/ui/FinancialTable';
import BasisSpreadBadge from '../components/BasisSpreadBadge';
import TokenDetailModal from '../components/market/TokenDetailModal';
import { TradingViewScreener } from '../components/charts';
import useScrollReveal from '../hooks/useScrollReveal';
import ParallaxCard from '../components/ui/ParallaxCard';
import AttributionChip from '../components/ui/AttributionChip';
import {
  ChartIcon,
  ExchangeIcon,
  TrendUpIcon,
  WalletIcon,
} from '../components/icons';

function fmt(n, decimals = 2) {
  if (n == null) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(decimals)}K`;
  return `$${n.toFixed(decimals)}`;
}

function ChgPill({ value }) {
  if (value == null) return <span className="text-muted text-xs">—</span>;
  const cls = value > 0 ? 'text-up bg-up/10' : value < 0 ? 'text-down bg-down/10' : 'text-muted bg-muted/10';
  return (
    <span className={`text-[.78rem] px-2 py-0.5 rounded-md inline-block ${cls}`}>
      {value > 0 ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

// Category → token-class mapping. Every accent comes from the brand palette.
// Consolidations:
//   Stock / ETF → palm (equity-adjacent green)
//   Yield       → sun  (gold = yield)
//   Metal       → muted (silver)
//   Currency    → ink  (partner violet, close to the old ETH-blue)
const CAT_CLS = {
  L1:       'text-sea border-border bg-sea/7',
  Stable:   'text-palm border-palm/30 bg-palm/7',
  RWA:      'text-sun border-sun/30 bg-sun/7',
  DeFi:     'text-sea border-border bg-sea/7',
  Meme:     'text-coral border-coral/30 bg-coral/7',
  Infra:    'text-coral border-coral/30 bg-coral/7',
  Stock:    'text-palm border-palm/30 bg-palm/7',
  ETF:      'text-sea border-sea/30 bg-sea/7',
  Yield:    'text-sun border-sun/30 bg-sun/7',
  Metal:    'text-muted border-muted/30 bg-muted/7',
  Currency: 'text-ink border-ink/30 bg-ink/7',
};

// Map a market-table row to the canonical category key used by the filter bar.
// CoinGecko rows carry their symbol via TOKEN_META; catalog-added rows carry
// `_cat` directly as the TitleCase legacy label.
function getRowCategory(row) {
  const meta = TOKEN_META[row.id];
  return meta?.cat || row._cat || null;
}

const TOKEN_META = {
  solana: { sym: 'SOL', cat: 'L1' },
  'usd-coin': { sym: 'USDC', cat: 'Stable' },
  'ondo-finance': { sym: 'ONDO', cat: 'RWA' },
  'jupiter-exchange-solana': { sym: 'JUP', cat: 'DeFi' },
  raydium: { sym: 'RAY', cat: 'DeFi' },
  bonk: { sym: 'BONK', cat: 'Meme' },
  'render-token': { sym: 'RENDER', cat: 'Infra' },
  helium: { sym: 'HNT', cat: 'Infra' },
  // Jupiter-only tokens (new CAs)
  gold:  { sym: 'GOLD',  cat: 'RWA' },
  zbtc:  { sym: 'zBTC',  cat: 'RWA' },
  weth:  { sym: 'WETH',  cat: 'L1' },
  bill:  { sym: 'BILL',  cat: 'RWA' },
  perp:  { sym: 'PERP',  cat: 'DeFi' },
  pren:  { sym: 'PREN',  cat: 'DeFi' },
  nvdax: { sym: 'NVDAX', cat: 'Stock' },
};

export default function MarketPage() {
  const solQ = useQuery({ queryKey: ['sol-price'], queryFn: fetchSolPrice, refetchInterval: 30000 });
  const marketQ = useQuery({ queryKey: ['sol-market'], queryFn: fetchSolanaMarketData, refetchInterval: 60000 });
  const tvlQ = useQuery({ queryKey: ['sol-tvl'], queryFn: fetchSolanaTVL, staleTime: 300000 });
  const fmpQ = useQuery({ queryKey: ['fmp-crypto'], queryFn: fetchFMPCryptoList, staleTime: 300000, retry: 1 });
  const fmp = fmpQ.data || {};
  const protocolsQ = useQuery({ queryKey: ['sol-protocols'], queryFn: fetchSolanaProtocols, staleTime: 300000 });
  const dexQ = useQuery({ queryKey: ['sol-dex-vol'], queryFn: fetchSolanaDexVolume, staleTime: 300000 });
  const stableQ = useQuery({ queryKey: ['sol-stables'], queryFn: fetchSolanaStablecoins, staleTime: 300000 });
  const yieldsQ = useQuery({ queryKey: ['sol-yields'], queryFn: fetchSolanaYields, staleTime: 300000 });
  const [birdeyeToken, setBirdeyeToken] = useState('So11111111111111111111111111111111111111112');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRow, setActiveRow] = useState(null);

  // Tickers whose underlying we fetch from FMP for the basis-spread widget.
  // Driven by the catalog — adding a stock/ETF there automatically picks it up.
  const underlyingTickers = useMemo(() => {
    const set = new Set();
    for (const t of getTokensWithUnderlyingExchange()) {
      if (t.underlying) set.add(t.underlying);
    }
    return [...set];
  }, []);

  // Fetch real NASDAQ/NYSE prices for every xStock / ETF underlying.
  // 60s staleTime + worker-level 60s cache = FMP gets hit at most once per
  // ticker per minute, keeping us well inside the 250 req/day free-tier limit.
  // Gracefully returns {} on failure — basis badges simply hide.
  const underlyingQ = useQuery({
    queryKey: ['underlying-stock-prices', underlyingTickers.join(',')],
    queryFn: () => fetchUnderlyingStockPrices(underlyingTickers),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
    enabled: underlyingTickers.length > 0,
  });

  // Index by symbol for fast per-row lookup
  const underlyingByTicker = underlyingQ.data || {};
  // Map on-chain symbol → underlying ticker for the table's render function
  const symbolToUnderlying = useMemo(() => {
    const map = {};
    for (const t of TOKEN_CATALOG) {
      if (t.underlying) map[t.symbol] = { underlying: t.underlying, exchange: t.underlyingExchange };
    }
    return map;
  }, []);

  // Filter the market-table rows by category. The CoinGecko rows carry their
  // category via TOKEN_META; catalog-added rows carry `_cat` directly.
  const filteredMarketData = useMemo(() => {
    const rows = marketQ.data || [];
    if (activeCategory === 'all') return rows;
    const legacyLabel = LEGACY_CAT_LABEL[activeCategory];
    if (!legacyLabel) return rows;
    return rows.filter(r => getRowCategory(r) === legacyLabel);
  }, [marketQ.data, activeCategory]);

  // Count per category for the tab badges (so users can see at-a-glance
  // how much each category has without clicking).
  const categoryCounts = useMemo(() => {
    const rows = marketQ.data || [];
    const counts = { all: rows.length };
    for (const row of rows) {
      const cat = getRowCategory(row);
      if (!cat) continue;
      // Find the lowercase key for this TitleCase label
      const key = Object.keys(LEGACY_CAT_LABEL).find(k => LEGACY_CAT_LABEL[k] === cat);
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [marketQ.data]);

  const BIRDEYE_TOKENS = [
    { addr: 'So11111111111111111111111111111111111111112', sym: 'SOL' },
    { addr: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', sym: 'USDC' },
    { addr: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', sym: 'JUP' },
    { addr: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', sym: 'RAY' },
  ];

  // Helper: get FMP data for a token row
  const getFmp = (token) => {
    const meta = TOKEN_META[token.id];
    const sym = meta?.sym || token.symbol?.toUpperCase();
    return fmp[sym] || null;
  };

  // ── UX polish: scroll-reveal for Market sections ──
  const { childVariants: _heroCV, ...heroReveal } = useScrollReveal({ distance: 30 });
  const { childVariants: statsChildV, ...statsReveal } = useScrollReveal({ stagger: 0.1, delay: 0.1 });
  const { childVariants: _analyticsCV, ...analyticsReveal } = useScrollReveal({ stagger: 0.08, delay: 0.15 });
  const { childVariants: _tableCV, ...tableReveal } = useScrollReveal({ distance: 25, delay: 0.05 });

  return (
    <div>
      {/* Hero — scroll-reveal entrance */}
      <motion.div
        {...heroReveal}
        className="rounded-xl p-9 mb-7 grid grid-cols-1 md:grid-cols-2 gap-9 items-center overflow-hidden relative border border-border"
        style={{
          background: 'linear-gradient(135deg, var(--color-night-2) 0%, color-mix(in srgb, var(--color-sea) 5%, transparent) 100%)',
        }}
      >
        <GradientDots
          dotSize={6}
          spacing={14}
          duration={35}
          colorCycleDuration={8}
          backgroundColor="transparent"
          className="opacity-12 pointer-events-none rounded-xl"
        />
        <div>
          <div className="inline-block bg-sea/12 border border-sea/30 rounded-full text-[.68rem] text-sea px-3 py-0.5 tracking-widest uppercase mb-3.5">
            Limer's Capital — Solana × RWA Markets
          </div>
          <h1 className="font-headline text-[2.6rem] font-black leading-[1.05] text-txt mb-3.5">
            The Future is<br /><em className="italic text-sea">On-Chain</em>
          </h1>
          <p className="font-body text-txt-2 text-[.82rem] leading-relaxed">
            Trade tokenized real-world assets — bonds, funds, stablecoins — 24/7 on Solana.
            No broker, no minimum. Start paper trading today.
          </p>
        </div>
        <motion.div className="grid grid-cols-2 gap-3.5" {...statsReveal}>
          <motion.div variants={statsChildV}><ParallaxCard depth={0.025}>
            <StatCard label="Solana TVL" value={tvlQ.data ? fmt(tvlQ.data) : '—'} sub={tvlQ.isLoading ? 'Loading...' : null} up />
          </ParallaxCard></motion.div>
          <motion.div variants={statsChildV}><ParallaxCard depth={0.025}>
            <StatCard label="SOL Price" value={solQ.data ? fmt(solQ.data.price) : '—'} change={solQ.data?.change24h} />
          </ParallaxCard></motion.div>
          <motion.div variants={statsChildV}><ParallaxCard depth={0.025}>
            <StatCard label="RWA Tokens" value="345+" sub="Active on-chain" up />
          </ParallaxCard></motion.div>
          <motion.div variants={statsChildV}><ParallaxCard depth={0.025}>
            <StatCard label="30D Volume" value="$2.27B" sub="+43%" up />
          </ParallaxCard></motion.div>
        </motion.div>
      </motion.div>

      {/* ── Solana DeFi Analytics (native cards) ─────────────────────── */}
      <SectionHead title="Solana DeFi Analytics" label="DeFiLlama · Live" />

      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7" {...analyticsReveal}>

        {/* Protocol Leaderboard */}
        <div className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-body font-bold text-[.88rem] text-txt inline-flex items-center gap-2">
                <ExchangeIcon size={14} className="text-coral" />
                Top Protocols by TVL
              </div>
              <div className="text-[.6rem] text-muted">Where the money is locked on Solana</div>
            </div>
            <a
              href="https://defillama.com/chain/solana"
              target="_blank"
              rel="noopener"
              className="text-[.58rem] text-sea no-underline hover:underline transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
            >
              DeFiLlama ↗
            </a>
          </div>
          {protocolsQ.isLoading ? (
            <div className="flex flex-col gap-2">{[1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg animate-pulse bg-txt/4" />)}</div>
          ) : protocolsQ.isError ? (
            <div className="text-down text-[.75rem] text-center py-4">
              Failed to load{' '}
              <button
                onClick={() => protocolsQ.refetch()}
                className="text-sea underline bg-transparent border-none cursor-pointer focus-visible:outline-none"
              >
                Retry
              </button>
            </div>
          ) : (
            <div>
              {(protocolsQ.data || []).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[.62rem] text-muted w-4 text-right font-mono">{i + 1}</span>
                    <span className="font-body font-bold text-[.82rem] text-txt">{p.name}</span>
                    <span className="text-[.58rem] text-muted border border-border rounded-full px-1.5 py-0.5">{p.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[.78rem] text-txt-2">{fmt(p.tvl)}</span>
                    {p.change_1d != null && <ChgPill value={p.change_1d} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DEX Volume */}
        <div className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-body font-bold text-[.88rem] text-txt inline-flex items-center gap-2">
                <ChartIcon size={14} className="text-sea" />
                DEX Trading Volume
              </div>
              <div className="text-[.6rem] text-muted">24h trading across Solana DEXs</div>
            </div>
            {dexQ.data && (
              <div className="text-right">
                <div className="font-mono font-bold text-[1.1rem] text-txt">{fmt(dexQ.data.total24h)}</div>
                {dexQ.data.change24h != null && <ChgPill value={dexQ.data.change24h} />}
              </div>
            )}
          </div>
          {dexQ.isLoading ? (
            <div className="flex flex-col gap-2">{[1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg animate-pulse bg-txt/4" />)}</div>
          ) : dexQ.isError ? (
            <div className="text-down text-[.75rem] text-center py-4">
              Failed to load{' '}
              <button onClick={() => dexQ.refetch()} className="text-sea underline bg-transparent border-none cursor-pointer focus-visible:outline-none">
                Retry
              </button>
            </div>
          ) : (
            <div>
              {(dexQ.data?.protocols || []).map((p) => {
                const maxVol = dexQ.data.protocols[0]?.volume24h || 1;
                const pct = ((p.volume24h || 0) / maxVol) * 100;
                return (
                  <div key={p.name} className="py-2 border-b border-border last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body font-bold text-[.78rem] text-txt">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[.75rem] text-txt-2">{fmt(p.volume24h)}</span>
                        {p.change != null && <ChgPill value={p.change} />}
                      </div>
                    </div>
                    <div className="h-1 bg-txt/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-sea/40 transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stablecoin Tracker */}
        <div className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-body font-bold text-[.88rem] text-txt inline-flex items-center gap-2">
                <WalletIcon size={14} className="text-palm" />
                Top Stablecoins
              </div>
              <div className="text-[.6rem] text-muted">USD-pegged tokens by market cap — key for remittances & trading</div>
            </div>
          </div>
          {stableQ.isLoading ? (
            <div className="flex flex-col gap-2">{[1,2,3].map(i => <div key={i} className="h-8 rounded-lg animate-pulse bg-txt/4" />)}</div>
          ) : stableQ.isError ? (
            <div className="text-down text-[.75rem] text-center py-4">
              Failed to load{' '}
              <button onClick={() => stableQ.refetch()} className="text-sea underline bg-transparent border-none cursor-pointer focus-visible:outline-none">
                Retry
              </button>
            </div>
          ) : (
            <div>
              {(stableQ.data || []).map((s) => {
                const maxCirc = stableQ.data[0]?.circulating || 1;
                const pct = (s.circulating / maxCirc) * 100;
                return (
                  <div key={s.symbol} className="py-2.5 border-b border-border last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-body font-bold text-[.82rem] text-txt">{s.symbol}</span>
                        <span className="text-[.62rem] text-muted">{s.name}</span>
                      </div>
                      <span className="font-mono font-bold text-[.8rem] text-txt">{fmt(s.circulating)}</span>
                    </div>
                    <div className="h-1.5 bg-txt/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, var(--color-palm), var(--color-sea))',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="mt-3 text-[.6rem] text-muted">
                Top stablecoins total market cap: {fmt((stableQ.data || []).reduce((s, c) => s + c.circulating, 0))}
              </div>
            </div>
          )}
        </div>

        {/* Best Yields */}
        <div className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-body font-bold text-[.88rem] text-txt inline-flex items-center gap-2">
                <TrendUpIcon size={14} className="text-sun" />
                Top Yield Opportunities
              </div>
              <div className="text-[.6rem] text-muted">Highest-TVL pools on Solana with APY</div>
            </div>
          </div>
          {yieldsQ.isLoading ? (
            <div className="flex flex-col gap-2">{[1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg animate-pulse bg-txt/4" />)}</div>
          ) : yieldsQ.isError ? (
            <div className="text-down text-[.75rem] text-center py-4">
              Failed to load{' '}
              <button onClick={() => yieldsQ.refetch()} className="text-sea underline bg-transparent border-none cursor-pointer focus-visible:outline-none">
                Retry
              </button>
            </div>
          ) : (
            <div>
              {(yieldsQ.data || []).slice(0, 8).map(p => (
                <div key={p.pool} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-body font-bold text-[.78rem] text-txt truncate">{p.symbol}</div>
                    <div className="text-[.58rem] text-muted capitalize">{p.project}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-[.72rem] text-txt-2">{fmt(p.tvl)}</span>
                    <span className="font-mono font-bold text-[.78rem] text-up bg-up/10 px-2 py-0.5 rounded-md">
                      {p.apy.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              <div className="mt-3 text-[.58rem] text-muted">
                APY = Annual Percentage Yield. Yields are variable and not guaranteed. DYOR before depositing.
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Birdeye Price Chart ─────────────────────────────────────── */}
      <div className="mb-7">
        <SectionHead title="Live Price Chart" label="Birdeye · TradingView" />
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            {BIRDEYE_TOKENS.map(t => (
              <button
                key={t.addr}
                onClick={() => setBirdeyeToken(t.addr)}
                className={`px-3 py-1.5 rounded-lg text-[.72rem] font-mono font-bold cursor-pointer border transition-colors duration-150
                  ${birdeyeToken === t.addr
                    ? 'text-sea bg-sea/12 border-sea/30'
                    : 'text-muted bg-transparent border-border hover:text-txt hover:border-txt/15'
                  }
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea/40`}
              >
                {t.sym}
              </button>
            ))}
          </div>
          <div className="relative w-full h-[350px] md:h-[480px]">
            <iframe
              key={birdeyeToken}
              src={`https://birdeye.so/tv-widget/${birdeyeToken}?chain=solana&viewMode=pair&chartInterval=1D&chartType=CANDLE&chartTimezone=America%2FPort_of_Spain&chartLeftToolbar=show&theme=dark`}
              loading="lazy"
              className="absolute inset-0 w-full h-full border-none"
              title="Birdeye Price Chart"
              sandbox="allow-scripts allow-same-origin"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>
      </div>

      {/* Token Table — scroll-reveal */}
      <motion.div {...tableReveal}>
      <SectionHead
        title="Global Capital Markets on Solana"
        label="CoinGecko · Jupiter · DexScreener"
        action={
          <div className="flex items-center gap-3">
            <AttributionChip compact />
            <button
              onClick={() => marketQ.refetch()}
              className={`bg-transparent border border-border text-sea cursor-pointer rounded-lg px-3 py-1 text-[.7rem] font-mono transition-colors duration-150 hover:bg-sea/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea/40 ${marketQ.isFetching ? 'animate-spin' : ''}`}
            >
              ↻ Refresh
            </button>
          </div>
        }
      />

      {/* ── Category filter bar ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 no-scrollbar">
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const isActive = activeCategory === key;
          const count = categoryCounts[key] || 0;
          // Hide categories with zero rows (prevents empty tabs cluttering the UI)
          if (key !== 'all' && count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              title={cat.description}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[.72rem] font-headline uppercase tracking-widest cursor-pointer border transition-colors duration-150
                ${isActive
                  ? 'text-sea bg-sea/12 border-sea/40'
                  : 'text-muted bg-transparent border-border hover:text-txt hover:border-txt/20'
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea/40`}
            >
              <span>{cat.label}</span>
              <span className={`font-mono text-[.6rem] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-sea/20 text-sea' : 'bg-txt/5 text-muted'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {marketQ.isLoading && (
        <div className="flex flex-col gap-0.5 px-1">
          <SkeletonRows count={12} cols={4} />
        </div>
      )}
      {marketQ.isError && (
        <div className="text-coral text-sm text-center py-9">
          Failed to load: {marketQ.error.message}. <button onClick={() => marketQ.refetch()} className="text-sea underline cursor-pointer bg-transparent border-none font-mono">Retry</button>
        </div>
      )}
      {marketQ.data && filteredMarketData.length === 0 && (
        <div className="text-muted text-[.82rem] text-center py-9 border border-border rounded-xl">
          No tokens in <span className="text-txt font-bold">{CATEGORIES[activeCategory]?.label || activeCategory}</span> yet.
          <div className="text-[.65rem] mt-1 opacity-70">Try another category or check back after the next deploy.</div>
        </div>
      )}
      {marketQ.data && filteredMarketData.length > 0 && (
        <FinancialTable
          title="Token"
          getRowId={(r) => r.id}
          onRowClick={(row) => setActiveRow(row)}
          rows={filteredMarketData}
          columns={[
            {
              key: 'token',
              label: 'Token',
              width: '2.6fr',
              render: (token) => {
                const meta = TOKEN_META[token.id] || { sym: token.symbol.toUpperCase(), cat: token._cat || '—' };
                // Fallback logo color when the catalog didn't provide one. Hex values
                // here come from token catalog data, not UI code, so they're allowed.
                const col = token._col; // may be undefined
                // Basis-spread info (only for tokens with an `underlying` field)
                const sym = meta.sym.toUpperCase();
                const underlyingRef = symbolToUnderlying[sym];
                const underlyingData = underlyingRef ? underlyingByTicker[underlyingRef.underlying] : null;
                const fallbackStyle = col
                  ? { background: col + '22', color: col }
                  : { background: 'var(--color-night-3)', color: 'var(--color-txt-2)' };
                return (
                  <div className="flex items-center gap-3 min-w-0">
                    {token.image
                      ? <img src={token.image} alt={meta.sym} className="w-8 h-8 rounded-full flex-shrink-0" />
                      : <div
                          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[.6rem] font-extrabold"
                          style={fallbackStyle}
                        >
                          {meta.sym.slice(0, 3)}
                        </div>
                    }
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body font-bold text-[.85rem] text-txt">{meta.sym}</span>
                        {underlyingData && (
                          <BasisSpreadBadge
                            onChainPrice={token.current_price}
                            underlyingPrice={underlyingData.price}
                            underlyingTicker={underlyingRef.underlying}
                            exchange={underlyingRef.exchange}
                            size="xs"
                          />
                        )}
                      </div>
                      <div className="text-[.65rem] text-muted truncate">{token.name}</div>
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'price',
              label: 'Price',
              width: '1fr',
              render: (token) => (
                <span className="font-mono font-bold text-[.82rem] text-txt">
                  {fmt(token.current_price, token.current_price < 0.01 ? 6 : 2)}
                </span>
              ),
            },
            {
              key: 'change24h',
              label: '24h',
              width: '.9fr',
              render: (token) => <PerfPill value={token.price_change_percentage_24h} />,
            },
            {
              key: 'sparkline',
              label: '7d',
              width: '80px',
              hideOnMobile: true,
              render: (token) => {
                const data = token.sparkline_in_7d?.price;
                if (data && data.length > 10) {
                  const sampled = data.filter((_, i) => i % Math.ceil(data.length / 20) === 0);
                  return <Sparkline data={sampled} width={64} height={22} />;
                }
                return <Sparkline data={null} width={64} height={22} />;
              },
            },
            {
              key: 'market_cap',
              label: 'Market Cap',
              width: '1fr',
              hideOnMobile: true,
              render: (token) => (
                <span className="text-[.78rem] text-txt-2 font-mono">
                  {token.market_cap ? fmtCurrency(token.market_cap) : '—'}
                </span>
              ),
            },
            {
              key: 'volume',
              label: 'Volume',
              width: '1fr',
              hideOnMobile: true,
              render: (token) => (
                <span className="text-[.78rem] text-txt-2 font-mono">
                  {token.total_volume ? fmtCurrency(token.total_volume) : '—'}
                </span>
              ),
            },
            {
              key: 'supply',
              label: 'Circ. Supply',
              width: '1.1fr',
              hideOnMobile: true,
              render: (token) => {
                const f = getFmp(token);
                if (!f?.circulatingSupply) return <span className="text-[.78rem] text-muted font-mono">—</span>;
                const pct = f.totalSupply ? ((f.circulatingSupply / f.totalSupply) * 100).toFixed(0) : null;
                return (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[.78rem] text-txt-2 font-mono">{fmtSupply(f.circulatingSupply)}</span>
                    {pct && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-sea" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-[.55rem] text-muted">{pct}%</span>
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              key: 'icoDate',
              label: 'ICO Date',
              width: '.9fr',
              hideOnMobile: true,
              render: (token) => {
                const f = getFmp(token);
                if (!f?.icoDate) return <span className="text-[.78rem] text-muted font-mono">—</span>;
                const d = new Date(f.icoDate);
                return (
                  <span className="text-[.72rem] text-txt-2 font-mono">
                    {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                );
              },
            },
            {
              key: 'category',
              label: 'Category',
              width: '.8fr',
              hideOnMobile: true,
              render: (token) => {
                const meta = TOKEN_META[token.id] || { sym: token.symbol.toUpperCase(), cat: token._cat || '—' };
                const catCls = CAT_CLS[meta.cat] || 'text-muted border-muted/20 bg-muted/7';
                return (
                  <span className={`text-[.62rem] px-2 py-0.5 rounded-full border whitespace-nowrap ${catCls}`}>
                    {meta.cat}
                  </span>
                );
              },
            },
          ]}
        />
      )}

      </motion.div>

      {/* TradingView Crypto Screener */}
      <div className="mt-8">
        <SectionHead title="Live Crypto Screener" label="Powered by TradingView" />
        <TradingViewScreener height={500} defaultColumn="overview" />
      </div>

      <TokenDetailModal
        coinId={activeRow?.id || null}
        fallback={activeRow}
        onClose={() => setActiveRow(null)}
      />
    </div>
  );
}

function StatCard({ label, value, change, sub, up }) {
  return (
    <GlowCard className="bg-sea/6 border border-border rounded-xl p-4" proximity={80} spread={40}>
      <div className="text-[.68rem] text-muted uppercase tracking-widest mb-1.5">{label}</div>
      <div className="font-body text-[1.45rem] font-extrabold text-txt">{value}</div>
      {change != null && <ChgPill value={change} />}
      {sub && <div className={`text-[.72rem] mt-1 ${up ? 'text-up' : 'text-muted'}`}>{up ? '▲ ' : ''}{sub}</div>}
    </GlowCard>
  );
}

function SectionHead({ title, label, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt">{title}</h2>
      <div className="flex gap-2 items-center">
        {label && <span className="text-[.68rem] text-muted px-2.5 py-0.5 border border-border rounded-full">{label}</span>}
        {action}
      </div>
    </div>
  );
}
