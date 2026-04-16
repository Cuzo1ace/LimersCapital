import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchSolanaTVL, fetchFMPCryptoList, fmtSupply, TOKEN_INFO } from '../api/prices';
import useScrollReveal from '../hooks/useScrollReveal';
import {
  fetchSolanaProtocols, fetchCryptoMarket, fetchRWATokens, fetchL1Tokens,
  fetchDeFiMarket, fetchTrending, fetchGlobalMarket,
  fetchJupiterQuote, fetchCaribFXRates, fetchCaribbeanGDP, fetchCryptoNews,
  fetchMarketBrief,
} from '../api/insights';
import { SkeletonRows, SkeletonCard } from '../components/ui/Skeleton';
import RemittanceCalculator from '../components/RemittanceCalculator';
import Tooltip from '../components/ui/Tooltip';
import ContextualHelp from '../components/ContextualHelp';
import {
  fetchEconomicCalendar, fetchEarningsCalendar,
  fetchMarketNews, fetchCongressionalTrading,
} from '../api/finnhub';

function fmt(n, dec = 2) {
  if (n == null) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(dec) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(dec) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(dec) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(dec) + 'K';
  return '$' + n.toFixed(dec);
}

function fmtAmt(n) {
  if (n == null) return '?';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

function fmtRelTime(unix) {
  const s = Math.floor(Date.now() / 1000) - unix;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
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
  const briefQ    = useQuery({ queryKey: ['ai-brief'],   queryFn: fetchMarketBrief,    staleTime: 3600000, retry: 1 });
  const fmpQ      = useQuery({ queryKey: ['fmp-crypto'], queryFn: fetchFMPCryptoList, staleTime: 300000, retry: 1 });

  // Finnhub financial intelligence
  const econCalQ   = useQuery({ queryKey: ['fh-econ-cal'],  queryFn: fetchEconomicCalendar,            staleTime: 600000, retry: 1 });
  const earningsQ  = useQuery({ queryKey: ['fh-earnings'],  queryFn: fetchEarningsCalendar,            staleTime: 600000, retry: 1 });
  const fhNewsQ    = useQuery({ queryKey: ['fh-news'],      queryFn: () => fetchMarketNews('general'), staleTime: 300000, retry: 1 });
  const congressQ  = useQuery({ queryKey: ['fh-congress'],  queryFn: () => fetchCongressionalTrading(), staleTime: 600000, retry: 1 });

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

  // ── UX polish: scroll-reveal for Insights sections ──
  const { childVariants: _iHeroCV, ...heroReveal } = useScrollReveal({ distance: 30 });
  const { childVariants: _iSectionCV, ...sectionReveal } = useScrollReveal({ stagger: 0.06, delay: 0.1 });

  return (
    <div>
      {/* Hero with Global Stats — scroll-reveal */}
      <motion.div {...heroReveal} className="rounded-xl p-9 mb-7 grid grid-cols-1 md:grid-cols-2 gap-9 items-center border border-border"
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
          <HeroStat label="Total Mkt Cap" value={g ? fmt(g.totalMarketCap) : '—'} sub={g && <Chg value={g.marketCapChange24h} />}
            info="Market Cap = Price x Supply. This is the total value of ALL cryptocurrencies combined — like measuring the size of the entire crypto market." />
          <HeroStat label="BTC Dominance" value={g ? `${g.btcDominance.toFixed(1)}%` : '—'} sub={g ? `ETH ${g.ethDominance.toFixed(1)}%` : ''}
            info="What percentage of the total crypto market is Bitcoin. When BTC dominance is high, money is concentrated in Bitcoin. When low, money is flowing into smaller coins." />
          <HeroStat label="Solana TVL" value={tvlQ.data ? fmt(tvlQ.data) : '—'} sub="DeFiLlama"
            info="Total Value Locked — the total amount of money deposited in Solana's DeFi apps. Higher TVL means more people trust and use Solana's financial tools." />
          <HeroStat label="24h Volume" value={g ? fmt(g.totalVolume) : '—'} sub={g ? `${g.activeCryptos.toLocaleString()} assets` : ''}
            info="How much crypto was traded in the last 24 hours across all exchanges. High volume means lots of buying and selling activity." />
        </div>
      </motion.div>

      <div className="flex justify-end mb-5">
        <button onClick={refetchAll}
          className="bg-transparent border border-border text-sea cursor-pointer rounded-lg px-5 py-2 text-[.75rem] font-mono transition-all hover:bg-sea/10">
          ↻ Refresh All
        </button>
      </div>

      {/* ── Tokens.xyz — Solana Token Discovery ─────────────────── */}
      <div className="rounded-[14px] p-5 mb-4 border border-[rgba(139,92,246,.2)] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,.06) 0%, var(--color-card) 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(139,92,246,.08)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[rgba(139,92,246,.15)] flex items-center justify-center text-lg">🪙</div>
          <div className="flex-1">
            <div className="text-[.78rem] font-body font-bold text-txt">Solana Token Discovery</div>
            <div className="text-[.62rem] text-muted">Real-world assets & crypto on Solana — powered by tokens.xyz</div>
          </div>
          <a href="https://www.tokens.xyz/" target="_blank" rel="noopener noreferrer"
            className="text-[.7rem] font-body font-bold px-3 py-1.5 rounded-lg bg-[rgba(139,92,246,.12)] border border-[rgba(139,92,246,.3)] text-[#8B5CF6] no-underline hover:bg-[rgba(139,92,246,.2)] transition-all">
            Explore →
          </a>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Stocks',      count: 219, icon: '📈', path: 'AAPL' },
            { label: 'ETFs',        count: 24,  icon: '🏦', path: 'SPY' },
            { label: 'Treasuries',  count: 15,  icon: '🏛️', path: 'TBILL' },
            { label: 'Currencies',  count: 14,  icon: '💱', path: 'EUR' },
            { label: 'Crypto',      count: 13,  icon: '₿',  path: 'SOL' },
            { label: 'Metals',      count: 4,   icon: '🥇', path: 'XAU' },
          ].map(cat => (
            <a key={cat.label} href={`https://www.tokens.xyz/${cat.path}`} target="_blank" rel="noopener noreferrer"
              className="rounded-xl border border-border bg-white/[.03] hover:bg-white/[.07] p-3 text-center no-underline transition-all cursor-pointer group">
              <div className="text-lg mb-1">{cat.icon}</div>
              <div className="text-[.92rem] font-headline font-black text-txt group-hover:text-[#8B5CF6] transition-colors">{cat.count}</div>
              <div className="text-[.58rem] text-muted uppercase tracking-wider">{cat.label}</div>
            </a>
          ))}
        </div>
        <div className="mt-3 text-[.6rem] text-muted">
          Trade tokenised real-world assets on Solana — stocks, ETFs, treasuries & more. No API integration yet — visit tokens.xyz directly.
        </div>
      </div>

      {/* ── AI Market Intelligence ──────────────────────────────── */}
      {briefQ.data && (
        <div className="mb-4">
          <div className="rounded-[14px] p-5 border border-sea/20 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(56,189,248,.06) 0%, var(--color-card) 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-sea/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-sea/15 flex items-center justify-center text-lg">🤖</div>
              <div className="flex-1">
                <div className="text-[.66rem] uppercase tracking-widest text-sea flex items-center gap-2">
                  AI Market Intelligence
                  <span className="text-[.55rem] bg-sea/10 border border-sea/20 rounded-full px-2 py-0.5 normal-case tracking-normal text-sea/70">
                    Powered by Claude
                  </span>
                </div>
                <div className="text-[.6rem] text-muted">
                  {(briefQ.data.brief || briefQ.data.fallback)?.date || 'Today'}
                  {briefQ.data.cached && ' · Cached'}
                </div>
              </div>
              {(briefQ.data.brief || briefQ.data.fallback)?.sentiment && (
                <span className={`text-[.65rem] font-bold px-2.5 py-1 rounded-full border
                  ${(briefQ.data.brief || briefQ.data.fallback).sentiment === 'bullish' ? 'bg-up/10 border-up/30 text-up' :
                    (briefQ.data.brief || briefQ.data.fallback).sentiment === 'bearish' ? 'bg-down/10 border-down/30 text-down' :
                    'bg-sun/10 border-sun/30 text-sun'}`}>
                  {(briefQ.data.brief || briefQ.data.fallback).sentiment === 'bullish' ? '📈 Bullish' :
                   (briefQ.data.brief || briefQ.data.fallback).sentiment === 'bearish' ? '📉 Bearish' : '➡️ Neutral'}
                </span>
              )}
            </div>

            {(() => {
              const b = briefQ.data.brief || briefQ.data.fallback;
              if (!b) return null;
              return (
                <>
                  {b.title && (
                    <h3 className="font-headline text-[.95rem] font-bold text-txt mb-3">{b.title}</h3>
                  )}
                  <ul className="flex flex-col gap-1.5 mb-3 list-none p-0 m-0">
                    {b.bullets?.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-[.78rem] text-txt-2 leading-relaxed">
                        <span className="text-sea mt-0.5 flex-shrink-0">▸</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {b.caribbeanInsight && (
                      <div className="rounded-lg p-3 border border-palm/20 bg-palm/5">
                        <div className="text-[.58rem] text-palm uppercase tracking-widest mb-1">🌴 Caribbean Insight</div>
                        <div className="text-[.74rem] text-txt-2 leading-relaxed">{b.caribbeanInsight}</div>
                      </div>
                    )}
                    {b.tradingNote && (
                      <div className="rounded-lg p-3 border border-sun/20 bg-sun/5">
                        <div className="text-[.58rem] text-sun uppercase tracking-widest mb-1">💡 Trading Note</div>
                        <div className="text-[.74rem] text-txt-2 leading-relaxed">{b.tradingNote}</div>
                      </div>
                    )}
                  </div>
                  {b.disclaimer && (
                    <div className="text-[.58rem] text-muted mt-3 italic">{b.disclaimer}</div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
      {briefQ.isLoading && (
        <div className="mb-4">
          <Card title="🤖 AI Market Intelligence" color="var(--color-sea)" source="Loading...">
            <SkeletonRows count={5} cols={1} />
          </Card>
        </div>
      )}

      {/* ── Finnhub: Economic Calendar + Earnings ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card title="📅 Economic Calendar" color="#FF6B6B" source="Finnhub · next 7 days">
          <div className="text-[.62rem] text-muted mb-3 leading-relaxed italic border-l-2 border-[#FF6B6B]/30 pl-2">
            Major economic events (Fed rates, CPI, GDP, jobs data) drive market-wide volatility. Watch high-impact events closely.
          </div>
          {econCalQ.isLoading && <SkeletonRows count={6} cols={3} />}
          {econCalQ.isError && <Err msg="Economic calendar unavailable" retry={econCalQ.refetch} />}
          {econCalQ.data && econCalQ.data.length === 0 && (
            <div className="text-[.76rem] text-muted text-center py-4">No upcoming high-impact events</div>
          )}
          {econCalQ.data?.map((e, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-b border-white/5 last:border-b-0 text-[.74rem]">
              <span className={`flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[.55rem] font-bold uppercase
                ${e.impact === 'high' ? 'bg-down/15 text-down' : 'bg-sun/15 text-sun'}`}>
                {e.impact === 'high' ? '🔴 High' : '🟡 Med'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-body font-bold text-txt truncate">{e.event}</div>
                <div className="flex gap-3 text-[.65rem] text-muted mt-0.5">
                  <span>{e.country}</span>
                  {e.time && <span>{e.time}</span>}
                  {e.estimate != null && <span>Est: <span className="text-txt-2">{e.estimate}{e.unit}</span></span>}
                  {e.prev != null && <span>Prev: <span className="text-txt-2">{e.prev}{e.unit}</span></span>}
                  {e.actual != null && <span>Actual: <span className="text-up font-bold">{e.actual}{e.unit}</span></span>}
                </div>
              </div>
            </div>
          ))}
        </Card>

        <Card title="💰 Earnings Calendar" color="#00D4FF" source="Finnhub · next 14 days">
          <div className="text-[.62rem] text-muted mb-3 leading-relaxed italic border-l-2 border-[#00D4FF]/30 pl-2">
            Companies report quarterly earnings. When EPS beats estimates, stock often rises; a miss often drops it. BMO = before market, AMC = after close.
          </div>
          {earningsQ.isLoading && <SkeletonRows count={6} cols={3} />}
          {earningsQ.isError && <Err msg="Earnings calendar unavailable" retry={earningsQ.refetch} />}
          {earningsQ.data && earningsQ.data.length === 0 && (
            <div className="text-[.76rem] text-muted text-center py-4">No upcoming earnings reports</div>
          )}
          {earningsQ.data?.map((e, i) => {
            const beat = e.epsActual != null && e.epsEstimate != null ? e.epsActual > e.epsEstimate : null;
            return (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-b-0 text-[.74rem]">
                <span className="font-body font-bold text-txt w-16 flex-shrink-0">{e.symbol}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[.65rem] text-muted">{e.date}</div>
                </div>
                {e.hour && (
                  <span className="text-[.55rem] px-1.5 py-0.5 rounded bg-white/5 text-muted uppercase font-mono">
                    {e.hour === 'bmo' ? 'BMO' : e.hour === 'amc' ? 'AMC' : e.hour}
                  </span>
                )}
                <div className="text-right flex-shrink-0">
                  {e.epsEstimate != null && (
                    <div className="text-[.65rem] text-muted">Est: <span className="text-txt-2">${e.epsEstimate.toFixed(2)}</span></div>
                  )}
                  {e.epsActual != null && (
                    <div className="text-[.65rem]">
                      Actual: <span className={beat ? 'text-up font-bold' : 'text-down font-bold'}>${e.epsActual.toFixed(2)}</span>
                      {beat != null && <span className="ml-1">{beat ? '✅' : '❌'}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      {/* ── Finnhub: Congressional Trading + Market News ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card title="🏛️ Congressional Trading" color="#B088F9" source="Finnhub · STOCK Act">
          <div className="text-[.62rem] text-muted mb-3 leading-relaxed italic border-l-2 border-[#B088F9]/30 pl-2">
            Under the STOCK Act, US politicians must disclose stock trades. Tracking "smart money" reveals information asymmetry in markets.
          </div>
          {congressQ.isLoading && <SkeletonRows count={6} cols={3} />}
          {congressQ.isError && <Err msg="Congressional data unavailable" retry={congressQ.refetch} />}
          {congressQ.data && congressQ.data.length === 0 && (
            <div className="text-[.76rem] text-muted text-center py-4">No recent congressional trades</div>
          )}
          {congressQ.data?.map((t, i) => {
            const isBuy = /purchase/i.test(t.transactionType);
            return (
              <div key={i} className="flex items-start gap-2 py-2 border-b border-white/5 last:border-b-0 text-[.74rem]">
                <span className={`flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[.55rem] font-bold uppercase
                  ${isBuy ? 'bg-up/15 text-up' : 'bg-down/15 text-down'}`}>
                  {isBuy ? 'Buy' : 'Sell'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-bold text-txt truncate">{t.name}</div>
                  <div className="flex gap-2 text-[.65rem] text-muted mt-0.5">
                    <span className="font-mono text-sea">{t.symbol}</span>
                    <span>{t.transactionDate}</span>
                    {t.amountFrom != null && t.amountTo != null && (
                      <span className="text-txt-2">${fmtAmt(t.amountFrom)}–${fmtAmt(t.amountTo)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        <Card title="📰 Market News" color="var(--color-sea)" source="Finnhub · latest">
          {fhNewsQ.isLoading && <SkeletonRows count={6} cols={2} />}
          {fhNewsQ.isError && <Err msg="Market news unavailable" retry={fhNewsQ.refetch} />}
          {fhNewsQ.data?.map(n => {
            const ago = fmtRelTime(n.datetime);
            return (
              <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2.5 py-2 border-b border-white/5 last:border-b-0 no-underline hover:bg-sea/5 transition-all rounded px-1 -mx-1">
                {n.image && (
                  <img src={n.image} alt="" loading="lazy"
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 opacity-80" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[.74rem] text-txt leading-snug line-clamp-2 font-body">{n.headline}</div>
                  <div className="flex gap-2 mt-1 text-[.6rem]">
                    <span className="text-sea bg-sea/10 rounded px-1.5 py-0.5 font-mono font-bold truncate max-w-[80px]">{n.source}</span>
                    <span className="text-muted">{ago}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </Card>
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

      {/* ── Row 5: Remittance Calculator ─────────────────────── */}
      <div className="mb-4">
        <RemittanceCalculator />
      </div>

      {/* ── Row 5b: Token Supply Metrics (FMP) ─────────────────── */}
      <div className="mb-4">
        <Card title="📊 Token Supply Metrics" color="var(--color-coral)" source="Financial Modeling Prep">
          {fmpQ.isLoading && <SkeletonRows count={8} cols={4} />}
          {fmpQ.isError && <Err msg="Supply data unavailable" retry={fmpQ.refetch} />}
          {fmpQ.data && (() => {
            // Build rows for our tracked tokens
            const rows = Object.entries(TOKEN_INFO)
              .map(([sym, info]) => {
                const f = fmpQ.data[sym];
                if (!f?.circulatingSupply) return null;
                const pct = f.totalSupply ? (f.circulatingSupply / f.totalSupply * 100) : null;
                return { sym, name: info.name, cat: info.cat, col: info.col, ...f, pct };
              })
              .filter(Boolean)
              .sort((a, b) => (b.circulatingSupply || 0) - (a.circulatingSupply || 0));

            return (
              <div>
                {/* Header */}
                <div className="grid items-center gap-2 px-2 py-1.5 text-[.58rem] text-muted uppercase tracking-widest border-b border-white/8 mb-1"
                  style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr .8fr' }}>
                  <span>Token</span>
                  <span>Circulating</span>
                  <span>Total Supply</span>
                  <span className="hidden md:block">% Circulating</span>
                  <span className="hidden md:block">ICO Date</span>
                </div>
                {rows.map(r => (
                  <div key={r.sym}
                    className="grid items-center gap-2 px-2 py-2 border-b border-white/4 last:border-b-0 text-[.74rem]"
                    style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr .8fr' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[.5rem] font-bold text-white"
                        style={{ background: r.col || '#555' }}>{r.sym.slice(0, 2)}</div>
                      <div className="min-w-0">
                        <span className="font-body font-bold text-txt">{r.sym}</span>
                        <span className="text-muted text-[.58rem] ml-1 hidden sm:inline">{r.name}</span>
                      </div>
                    </div>
                    <span className="font-mono text-txt-2">{fmtSupply(r.circulatingSupply)}</span>
                    <span className="font-mono text-muted">{fmtSupply(r.totalSupply)}</span>
                    <div className="hidden md:flex items-center gap-2">
                      {r.pct != null ? (
                        <>
                          <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                            <div className="h-full rounded-full bg-sea" style={{ width: `${Math.min(r.pct, 100)}%` }} />
                          </div>
                          <span className="text-[.65rem] text-sea font-mono">{r.pct.toFixed(0)}%</span>
                        </>
                      ) : <span className="text-muted">—</span>}
                    </div>
                    <span className="text-[.65rem] text-muted font-mono hidden md:block">
                      {r.icoDate ? new Date(r.icoDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                ))}
                <div className="text-[.6rem] text-muted mt-2 text-right">
                  {rows.length} tokens with supply data · Updates every 5 min
                </div>
              </div>
            );
          })()}
        </Card>
      </div>

      {/* ── Row 6: Crypto News Feed ────────────────────────────── */}
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
        {['CoinGecko', 'DeFiLlama', 'Jupiter', 'ExchangeRate-API', 'World Bank', 'FMP', 'Finnhub'].map(s => (
          <span key={s} className="text-[.65rem] text-txt-2 bg-white/4 border border-white/7 rounded px-2 py-0.5">{s}</span>
        ))}
        <span className="text-[.63rem] text-muted ml-auto">All free-tier · No API keys required</span>
      </div>

      {/* Contextual Help */}
      <ContextualHelp pageTitle="Market Insights" items={[
        { title: 'What is Market Cap?', content: 'Market capitalization (Market Cap) = Price x Circulating Supply. It measures how much a crypto project is worth in total. A higher market cap generally means a more established project.' },
        { title: 'What is TVL?', content: 'Total Value Locked (TVL) is the amount of money deposited in DeFi protocols. Think of it like total deposits at a bank — more deposits usually means more trust and activity.' },
        { title: 'What are RWA tokens?', content: 'Real-World Assets (RWAs) are blockchain tokens that represent physical assets — like bonds, real estate, or gold. They let you invest in traditional assets using crypto technology.' },
        { title: 'What is DeFi?', content: 'Decentralized Finance (DeFi) refers to financial services built on blockchain — lending, borrowing, trading — without traditional banks. Smart contracts handle everything automatically.' },
        { title: 'What is BTC Dominance?', content: 'BTC Dominance shows what percentage of the total crypto market is Bitcoin. When it goes up, money is flowing into Bitcoin. When it drops, money is moving into alternative coins (altcoins).' },
        { title: 'Caribbean FX Rates', content: 'These show how local Caribbean currencies (TTD, JMD, BBD, etc.) compare to the US Dollar. Important for understanding the real cost of crypto in your local currency.' },
      ]} />
    </div>
  );
}

function HeroStat({ label, value, sub, info }) {
  return (
    <div className="bg-sea/6 border border-border rounded-xl p-4">
      <div className="text-[.68rem] text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        {label}
        {info && <Tooltip term={label} def={info} inline={false} />}
      </div>
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
