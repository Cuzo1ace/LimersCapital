import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSolanaTVL } from '../api/prices';
import {
  fetchSolanaProtocols, fetchCryptoMarket, fetchRWATokens, fetchL1Tokens,
  fetchDeFiMarket, fetchTrending, fetchGlobalMarket,
  fetchJupiterQuote, fetchCaribFXRates, fetchCaribbeanGDP, fetchCryptoNews,
} from '../api/insights';
import { SkeletonRows, SkeletonCard } from '../components/ui/Skeleton';

function fmt(n, dec = 2) {
  if (n == null) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(dec) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(dec) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(dec) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(dec) + 'K';
  return '$' + n.toFixed(dec);
}

function Chg({ value }) {
  if (value == null) return <span className="text-muted text-[.7rem]">—</span>;
  const cls = value >= 0 ? 'text-up' : 'text-down';
  return <span className={`font-body font-bold text-[.75rem] ${cls}`}>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</span>;
}

function Card({ title, color, source, children }) {
  return (
    <div className="rounded-[14px] p-5 border border-border" style={{ background: 'var(--color-card)' }}>
      <div className="text-[.66rem] uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color }}>
        {title}
        <span className="text-muted text-[.6rem] font-normal normal-case tracking-normal">{source}</span>
      </div>
      {children}
    </div>
  );
}

function TokenRow({ c, showVol }) {
  return (
    <div className="flex items-center gap-2.5 py-[5px] border-b border-white/5 last:border-b-0">
      <img src={c.image} alt={c.symbol} className="w-5 h-5 rounded-full flex-shrink-0" />
      <span className="text-[.76rem] flex-1 min-w-0">
        <span className="font-body font-bold text-txt">{c.symbol}</span>
        <span className="text-muted ml-1 text-[.62rem] truncate">{c.name}</span>
      </span>
      <span className="font-body font-bold text-[.76rem] text-txt whitespace-nowrap">
        ${c.price < 0.01 ? c.price.toFixed(6) : c.price < 1 ? c.price.toFixed(4) : c.price.toFixed(2)}
      </span>
      <span className="w-[58px] text-right"><Chg value={c.change24h} /></span>
      {showVol && <span className="text-[.65rem] text-muted w-[65px] text-right hidden md:block">{fmt(c.volume, 1)}</span>}
    </div>
  );
}

export default function InsightsPage() {
  // CoinGecko queries — stagger staleTime to avoid hitting rate limit
  const globalQ   = useQuery({ queryKey: ['cg-global'],   queryFn: fetchGlobalMarket,   staleTime: 120000 });
  const rwaQ      = useQuery({ queryKey: ['cg-rwa'],      queryFn: fetchRWATokens,      staleTime: 90000 });
  const l1Q       = useQuery({ queryKey: ['cg-l1'],       queryFn: fetchL1Tokens,        staleTime: 90000 });
  const defiQ     = useQuery({ queryKey: ['cg-defi'],     queryFn: fetchDeFiMarket,      staleTime: 90000 });
  const trendingQ = useQuery({ queryKey: ['cg-trending'], queryFn: fetchTrending,        staleTime: 120000 });
  const protocolsQ = useQuery({ queryKey: ['sol-protocols'], queryFn: fetchSolanaProtocols, staleTime: 300000 });
  const tvlQ      = useQuery({ queryKey: ['sol-tvl'],     queryFn: fetchSolanaTVL,       staleTime: 300000 });
  const fxQ       = useQuery({ queryKey: ['fx-rates'],    queryFn: fetchCaribFXRates,    staleTime: 300000 });
  const gdpQ      = useQuery({ queryKey: ['carib-gdp'],   queryFn: fetchCaribbeanGDP,    staleTime: 600000 });
  const newsQ     = useQuery({ queryKey: ['crypto-news'], queryFn: fetchCryptoNews,      staleTime: 300000 });

  const [jupIn, setJupIn] = useState('So11111111111111111111111111111111111111112');
  const [jupOut, setJupOut] = useState('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const [jupAmt, setJupAmt] = useState('1');
  const [jupResult, setJupResult] = useState(null);
  const [jupLoading, setJupLoading] = useState(false);

  async function doQuote() {
    setJupLoading(true);
    try { setJupResult(await fetchJupiterQuote(jupIn, jupOut, parseFloat(jupAmt) || 1)); }
    catch (e) { setJupResult({ error: e.message }); }
    setJupLoading(false);
  }

  function refetchAll() {
    [globalQ, rwaQ, l1Q, defiQ, trendingQ, protocolsQ, tvlQ, fxQ, gdpQ, newsQ].forEach(q => q.refetch());
  }

  const g = globalQ.data;
  const SWAP_TOKENS = [
    { mint: 'So11111111111111111111111111111111111111112', label: 'SOL' },
    { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', label: 'USDC' },
    { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', label: 'JUP' },
    { mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', label: 'RAY' },
  ];

  return (
    <div>
      {/* Hero with Global Stats */}
      <div className="rounded-xl p-9 mb-7 grid grid-cols-1 md:grid-cols-2 gap-9 items-center border border-border"
        style={{ background: 'linear-gradient(135deg, var(--color-night-2) 0%, rgba(0,255,163,.05) 100%)' }}>
        <div>
          <div className="inline-block bg-sea/12 border border-sea/30 rounded-full text-[.68rem] text-sea px-3 py-0.5 tracking-widest uppercase mb-3.5">
            L1 · DeFi · RWA Intelligence
          </div>
          <h1 className="font-headline text-[2.6rem] font-black leading-[1.05] text-txt mb-3.5">
            Market<br /><em className="italic text-sea">Insights</em>
          </h1>
          <p className="font-body text-txt-2 text-[.82rem] leading-relaxed">
            Live data powered by CoinGecko, DeFiLlama, and Jupiter. Layer 1 chains, DeFi protocols, RWA tokens, and Caribbean macro — all free-tier APIs.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <HeroStat label="Total Mkt Cap" value={g ? fmt(g.totalMarketCap) : '—'} sub={g && <Chg value={g.marketCapChange24h} />} />
          <HeroStat label="BTC Dominance" value={g ? `${g.btcDominance.toFixed(1)}%` : '—'} sub={g ? `ETH ${g.ethDominance.toFixed(1)}%` : ''} />
          <HeroStat label="Solana TVL" value={tvlQ.data ? fmt(tvlQ.data) : '—'} sub="DeFiLlama" />
          <HeroStat label="24h Volume" value={g ? fmt(g.totalVolume) : '—'} sub={g ? `${g.activeCryptos.toLocaleString()} assets` : ''} />
        </div>
      </div>

      <div className="flex justify-end mb-5">
        <button onClick={refetchAll}
          className="bg-transparent border border-border text-sea cursor-pointer rounded-lg px-5 py-2 text-[.75rem] font-mono transition-all hover:bg-sea/10">
          ↻ Refresh All
        </button>
      </div>

      {/* ── Row 1: RWA Tokens + L1 Chains ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card title="🏦 RWA Tokens" color="var(--color-sun)" source="CoinGecko · real-world-assets">
          {rwaQ.isLoading && <SkeletonRows count={6} cols={4} />}
          {rwaQ.data?.map(c => <TokenRow key={c.id} c={c} showVol />)}
          {rwaQ.isError && <Err msg={rwaQ.error.message} retry={rwaQ.refetch} />}
        </Card>

        <Card title="⛓️ Layer 1 Chains" color="var(--color-coral)" source="CoinGecko · layer-1">
          {l1Q.isLoading && <SkeletonRows count={6} cols={4} />}
          {l1Q.data?.map(c => <TokenRow key={c.id} c={c} showVol />)}
          {l1Q.isError && <Err msg={l1Q.error.message} retry={l1Q.refetch} />}
        </Card>
      </div>

      {/* ── Row 2: DeFi + Solana Protocols ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card title="💎 DeFi Tokens" color="var(--color-sea)" source="CoinGecko · defi">
          {defiQ.isLoading && <SkeletonRows count={6} cols={4} />}
          {defiQ.data?.map(c => <TokenRow key={c.id} c={c} showVol />)}
          {defiQ.isError && <Err msg={defiQ.error.message} retry={defiQ.refetch} />}
        </Card>

        <Card title="🔒 Solana DeFi TVL" color="var(--color-up)" source="DeFiLlama">
          {protocolsQ.isLoading && <SkeletonRows count={6} cols={3} />}
          {protocolsQ.data?.map(p => (
            <div key={p.name} className="flex justify-between items-center py-[5px] border-b border-white/5 last:border-b-0 text-[.76rem]">
              <span className="text-txt-2">{p.name} <span className="text-muted text-[.6rem]">{p.category}</span></span>
              <div className="text-right">
                <span className="font-body font-bold text-sea">{fmt(p.tvl)}</span>
                {p.change_1d != null && <span className="ml-2"><Chg value={p.change_1d} /></span>}
              </div>
            </div>
          ))}
          {protocolsQ.isError && <Err msg={protocolsQ.error.message} retry={protocolsQ.refetch} />}
        </Card>
      </div>

      {/* ── Row 3: Trending + Jupiter Quote ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card title="🔥 Trending" color="var(--color-coral)" source="CoinGecko">
          {trendingQ.isLoading && <SkeletonRows count={8} cols={3} />}
          {trendingQ.data?.coins?.map(c => (
            <div key={c.id} className="flex items-center gap-2.5 py-[5px] border-b border-white/5 last:border-b-0">
              <img src={c.thumb} alt={c.symbol} className="w-5 h-5 rounded-full" />
              <span className="text-[.76rem] flex-1">
                <span className="font-body font-bold text-txt">{c.symbol}</span>
                <span className="text-muted ml-1 text-[.62rem]">{c.name}</span>
              </span>
              {c.price != null && <span className="font-body font-bold text-[.76rem] text-txt">
                ${typeof c.price === 'number' ? (c.price < 0.01 ? c.price.toFixed(6) : c.price < 1 ? c.price.toFixed(4) : c.price.toFixed(2)) : c.price}
              </span>}
              {c.change24h != null && <span className="w-[58px] text-right"><Chg value={c.change24h} /></span>}
            </div>
          ))}
          {trendingQ.data?.categories?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="text-[.6rem] text-muted uppercase tracking-widest mb-1.5">Trending Categories</div>
              {trendingQ.data.categories.map(cat => (
                <div key={cat.id} className="flex justify-between py-1 text-[.74rem]">
                  <span className="text-txt-2">{cat.name}</span>
                  <Chg value={cat.change24h} />
                </div>
              ))}
            </div>
          )}
          {trendingQ.isError && <Err msg={trendingQ.error.message} retry={trendingQ.refetch} />}
        </Card>

        <Card title="⚡ Jupiter Swap Quote" color="var(--color-sea)" source="Jupiter v6">
          <div className="flex gap-1.5 mb-2.5 flex-wrap">
            <select value={jupIn} onChange={e => setJupIn(e.target.value)}
              className="flex-1 min-w-[80px] bg-black/30 border border-border text-txt rounded-lg px-2 py-1 font-mono text-[.7rem] outline-none">
              {SWAP_TOKENS.map(t => <option key={t.mint} value={t.mint}>{t.label}</option>)}
            </select>
            <span className="self-center text-muted text-[.8rem]">→</span>
            <select value={jupOut} onChange={e => setJupOut(e.target.value)}
              className="flex-1 min-w-[80px] bg-black/30 border border-border text-txt rounded-lg px-2 py-1 font-mono text-[.7rem] outline-none">
              {SWAP_TOKENS.map(t => <option key={t.mint} value={t.mint}>{t.label}</option>)}
            </select>
            <input type="number" value={jupAmt} onChange={e => setJupAmt(e.target.value)} min="0.001" step="0.1"
              className="w-[65px] bg-black/30 border border-border text-txt rounded-lg px-2 py-1 font-mono text-[.7rem] outline-none" />
            <button onClick={doQuote}
              className="bg-transparent border border-border text-sea cursor-pointer rounded-lg px-2.5 py-1 text-[.7rem] font-mono hover:bg-sea/10">
              Quote
            </button>
          </div>
          {jupLoading && <SkeletonRows count={4} cols={2} />}
          {jupResult && !jupResult.error && (
            <div className="bg-sea/5 border border-border rounded-xl p-3.5">
              <Row label="You send" value={jupResult.inAmount?.toFixed(4)} cls="text-txt" />
              <Row label="You receive" value={jupResult.outAmount?.toFixed(4)} cls="text-up" />
              <Row label="Price impact" value={`${jupResult.priceImpact?.toFixed(4)}%`} cls="text-muted" />
              <Row label="Route" value={jupResult.routePlan?.join(' → ') || 'Direct'} cls="text-sea" />
            </div>
          )}
          {jupResult?.error && <div className="text-coral text-[.76rem]">{jupResult.error}</div>}
        </Card>
      </div>

      {/* ── Row 4: Caribbean FX + GDP ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card title="💱 Caribbean FX Rates" color="var(--color-sun)" source="ExchangeRate-API">
          {fxQ.isLoading && <SkeletonRows count={6} cols={2} />}
          {fxQ.data?.map(fx => (
            <div key={fx.code} className="flex justify-between items-center py-[5px] border-b border-white/5 last:border-b-0 text-[.76rem]">
              <span className="text-txt-2">USD → {fx.code} <span className="text-muted text-[.6rem]">{fx.name}</span></span>
              <span className="font-body font-bold text-sun">{fx.rate.toFixed(2)}</span>
            </div>
          ))}
          {fxQ.isError && <Err msg={fxQ.error.message} retry={fxQ.refetch} />}
        </Card>

        <Card title="🌍 Caribbean GDP Growth" color="var(--color-palm)" source="World Bank">
          {gdpQ.isLoading && <SkeletonRows count={5} cols={2} />}
          {gdpQ.data?.map(g => (
            <Row key={g.country} label={`${g.country} (${g.year})`}
              value={`${g.growth >= 0 ? '+' : ''}${g.growth.toFixed(1)}%`}
              cls={g.growth >= 0 ? 'text-up' : 'text-down'} />
          ))}
          {gdpQ.isError && <Err msg={gdpQ.error.message} retry={gdpQ.refetch} />}
        </Card>
      </div>

      {/* ── Row 5: Crypto News Feed ────────────────────────────── */}
      <div className="mb-4">
        <Card title="📰 Crypto News" color="var(--color-sea)" source="CoinGecko · latest">
          {newsQ.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {newsQ.isError && <Err msg={newsQ.error.message} retry={newsQ.refetch} />}
          {newsQ.data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {newsQ.data.map(n => (
                <NewsItem key={n.id} item={n} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* API Attribution */}
      <div className="rounded-xl p-4 border border-white/6 flex flex-wrap gap-3 items-center" style={{ background: 'rgba(0,0,0,.2)' }}>
        <span className="text-[.65rem] text-muted">Powered by:</span>
        {['CoinGecko', 'DeFiLlama', 'Jupiter', 'ExchangeRate-API', 'World Bank'].map(s => (
          <span key={s} className="text-[.65rem] text-txt-2 bg-white/4 border border-white/7 rounded px-2 py-0.5">{s}</span>
        ))}
        <span className="text-[.63rem] text-muted ml-auto">All free-tier · No API keys required</span>
      </div>
    </div>
  );
}

function HeroStat({ label, value, sub }) {
  return (
    <div className="bg-sea/6 border border-border rounded-xl p-4">
      <div className="text-[.68rem] text-muted uppercase tracking-widest mb-1.5">{label}</div>
      <div className="font-body text-[1.45rem] font-extrabold text-txt">{value}</div>
      {sub && <div className="text-[.72rem] mt-1">{sub}</div>}
    </div>
  );
}

function Row({ label, value, cls }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-b-0 text-[.76rem]">
      <span className="text-txt-2">{label}</span>
      <span className={`font-body font-bold ${cls || 'text-txt'}`}>{value}</span>
    </div>
  );
}

function Loader() {
  return <div className="text-[.75rem] text-muted py-3 flex items-center gap-2">
    <span className="inline-block w-3 h-3 border-2 border-border border-t-sea rounded-full animate-spin" />
    Loading…
  </div>;
}

function Err({ msg, retry }) {
  return <div className="text-coral text-[.76rem] py-2">
    {msg}. <button onClick={retry} className="text-sea underline cursor-pointer bg-transparent border-none font-mono">Retry</button>
  </div>;
}

function NewsItem({ item }) {
  const ago = (() => {
    const s = Math.floor(Date.now() / 1000) - item.publishedOn;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  })();

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      className="flex flex-col gap-2 p-3 rounded-xl border border-white/6 hover:border-sea/30 hover:bg-sea/5 transition-all no-underline group"
      style={{ background: 'rgba(0,0,0,.15)' }}>
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-[90px] object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
        />
      )}
      <div className="flex items-center gap-1.5">
        <span className="text-[.6rem] text-sea bg-sea/10 rounded px-1.5 py-0.5 font-mono font-bold truncate max-w-[80px]">{item.source}</span>
        <span className="text-[.6rem] text-muted ml-auto flex-shrink-0">{ago}</span>
      </div>
      <p className="text-[.74rem] text-txt-2 leading-snug line-clamp-3 m-0 group-hover:text-txt transition-colors">{item.title}</p>
    </a>
  );
}
