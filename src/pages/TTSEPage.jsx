import { useQuery } from '@tanstack/react-query';
import { fetchTTSEData, getTTSEMarketStatus, SECTOR_META, TTD_RATE } from '../api/ttse';
import useStore from '../store/useStore';
import GlowCard from '../components/ui/GlowCard';
import GlassCard from '../components/ui/GlassCard';
import FinancialTable, { PerfPill } from '../components/ui/FinancialTable';
import { PE_COMPARISON, TTSE_DISCOUNTS, UNDERVALUATION_CAUSES, GLOBAL_LOCAL_COMPARISONS } from '../data/capitalMarkets';

function fmtTTD(n) {
  if (n == null) return '—';
  return 'TT$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TTSEPage() {
  const { setActiveTab } = useStore();
  const ttseQ = useQuery({ queryKey: ['ttse-data'], queryFn: fetchTTSEData, staleTime: 120000 });
  const stocks = ttseQ.data?.stocks || [];
  const indices = ttseQ.data?.indices || {};
  const isLive = ttseQ.data?.live;
  const market = getTTSEMarketStatus();
  const usingFallback = !ttseQ.data?.live && stocks.length > 0;
  const fallbackDate = '17 Mar 2026';
  const daysSinceFallback = Math.floor((Date.now() - new Date('2026-03-17').getTime()) / 86400000);

  const gainers = [...stocks].filter(s => s.chg > 0).sort((a, b) => b.chg - a.chg).slice(0, 3);
  const decliners = [...stocks].filter(s => s.chg < 0).sort((a, b) => a.chg - b.chg).slice(0, 3);
  const topVol = [...stocks].sort((a, b) => b.vol - a.vol).slice(0, 3);

  function openTrade(sym) {
    useStore.getState().setActiveTab('trade');
  }

  return (
    <div>
      {/* Hero */}
      <div className="rounded-xl p-9 mb-7 grid grid-cols-1 md:grid-cols-2 gap-9 items-center overflow-hidden relative border border-[rgba(200,16,46,.22)]"
        style={{ background: 'linear-gradient(135deg, rgba(200,16,46,.08) 0%, rgba(13,14,16,1) 60%)' }}>
        <div className="absolute right-0 bottom-[-10px] text-[130px] leading-none opacity-10 pointer-events-none select-none">{'\u{1F1F9}\u{1F1F9}'}</div>
        <div>
          <div className="inline-block bg-[rgba(200,16,46,.12)] border border-[rgba(200,16,46,.3)] rounded-full text-[.68rem] text-[#FF4D6D] px-3 py-0.5 tracking-widest uppercase mb-3.5">
            Trinidad & Tobago Stock Exchange
          </div>
          <h1 className="font-headline text-[2.4rem] font-black leading-[1.1] text-txt mb-3.5">
            Your Local<br /><em className="italic text-[#FF4D6D]">Capital Market</em>
          </h1>
          <p className="font-body text-txt-2 text-[.82rem] leading-relaxed">
            The TTSE is your home market. Learn these companies — RFHL, Massy, NCBFG — before exploring global assets on Solana.
          </p>
          <div className="mt-4 flex gap-2.5 items-center flex-wrap">
            {usingFallback && daysSinceFallback > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[.65rem] bg-sun/10 border border-sun/25 text-sun">
                ⚠️ Cached data ({daysSinceFallback}d old)
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[.7rem] font-semibold border
              ${market.isOpen
                ? 'bg-up/10 border-up/30 text-up'
                : 'bg-down/8 border-down/25 text-down'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${market.isOpen ? 'bg-up' : 'bg-down'}`}
                style={market.isOpen ? { boxShadow: '0 0 5px var(--color-up)' } : {}} />
              {market.isOpen ? 'Market Open' : 'Market Closed'}
            </span>
            <span className="text-[.72rem] text-muted">{market.timeStr}</span>
            <button onClick={() => ttseQ.refetch()}
              className={`bg-transparent border border-[rgba(200,16,46,.22)] text-[#FF4D6D] cursor-pointer rounded-lg px-3 py-1 text-[.7rem] font-mono transition-all hover:bg-[rgba(200,16,46,.1)] ${ttseQ.isFetching ? 'animate-spin' : ''}`}>
              ↻ Live Data
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          {[
            { label: 'COMPOSITE', key: 'composite' },
            { label: 'ALL T&T', key: 'alltt' },
            { label: 'CXNI (Caribbean)', key: 'cxni' },
            { label: 'CROSS-LISTED', key: 'cross' },
          ].map(idx => {
            const d = indices[idx.key] || {};
            const c = d.chg || 0;
            return (
              <GlowCard key={idx.key} className="border border-[rgba(200,16,46,.22)] rounded-xl p-4" proximity={80} spread={40} style={{ background: 'rgba(200,16,46,.06)' }}>
                <div className="text-[.68rem] text-muted uppercase tracking-widest mb-1.5">{idx.label}</div>
                <div className="font-body text-[1.45rem] font-extrabold text-txt">{d.val?.toFixed(2) || '—'}</div>
                <div className={`text-[.72rem] mt-1 ${c > 0 ? 'text-up' : c < 0 ? 'text-down' : 'text-muted'}`}>
                  {c >= 0 ? '+' : ''}{c.toFixed(2)}
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>

      {/* Bridge card */}
      <div className="rounded-xl p-7 mb-6 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center border border-border"
        style={{ background: 'linear-gradient(135deg, rgba(200,16,46,.07), rgba(0,255,163,.07))' }}>
        <div>
          <div className="text-[.68rem] text-muted uppercase tracking-widest">Traditional Market</div>
          <div className="font-headline text-[1.3rem] font-black text-[#FF4D6D]">TTSE Stock</div>
          <div className="text-[.75rem] text-txt-2 leading-relaxed">Regulated by TTSEC. Trades Mon–Fri. Settlement in TTD.</div>
        </div>
        <div className="text-2xl text-muted text-center">⟷</div>
        <div>
          <div className="text-[.68rem] text-muted uppercase tracking-widest">Tokenized / DeFi Version</div>
          <div className="font-headline text-[1.3rem] font-black text-sea">Solana RWA Token</div>
          <div className="text-[.75rem] text-txt-2 leading-relaxed">On-chain 24/7. No broker needed. Fractional ownership.</div>
        </div>
      </div>

      {/* ── Why Are These Stocks Undervalued? ── */}
      <GlassCard variant="elevated" className="p-6 md:p-7 mb-6">
        <div className="flex items-start gap-3 mb-5">
          <span className="text-xl">📊</span>
          <div>
            <h2 className="font-headline text-[1.05rem] font-bold text-txt">Why Are Caribbean Stocks Undervalued?</h2>
            <p className="text-[.78rem] text-txt-2 mt-1 leading-relaxed">
              The TTSE trades at a <strong className="text-sea">9.9× PE</strong> — a{' '}
              <strong className="text-sea">26% discount</strong> to Jamaica,{' '}
              <strong className="text-sun">42% below</strong> emerging markets, and{' '}
              <strong className="text-coral">53% below</strong> the US. This isn't a quality problem — it's a plumbing problem.
            </p>
          </div>
        </div>

        {/* PE Comparison Bar Chart */}
        <div className="space-y-2.5 mb-5">
          {PE_COMPARISON.map((ex) => {
            if (!ex.pe) return null;
            const barWidth = Math.min((ex.pe / 25) * 100, 100);
            return (
              <div key={ex.id} className="flex items-center gap-3">
                <span className="w-6 text-center text-sm">{ex.flag}</span>
                <span className="w-[130px] md:w-[160px] text-[.75rem] text-txt-2 font-body truncate">{ex.name}</span>
                <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barWidth}%`,
                      background: ex.id === 'ttse'
                        ? 'linear-gradient(90deg, #FF4D6D, #FF4D6D)'
                        : `linear-gradient(90deg, ${ex.color}88, ${ex.color})`,
                    }}
                  />
                </div>
                <span className="w-[44px] text-right font-mono text-[.78rem] font-bold" style={{ color: ex.color }}>
                  {ex.pe}×
                </span>
              </div>
            );
          })}
        </div>

        {/* 5 Causes — compact */}
        <div className="flex flex-wrap gap-2">
          {UNDERVALUATION_CAUSES.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 bg-white/4 border border-white/8 rounded-lg px-3 py-1.5">
              <span className="text-sm">{c.icon}</span>
              <span className="text-[.68rem] text-txt font-medium">{c.cause}</span>
              <span className="text-[.6rem] text-muted">({c.impact})</span>
            </div>
          ))}
        </div>

        <p className="text-[.72rem] text-sea italic mt-4">
          Tokenizing these securities on Solana addresses all 5 causes — unlocking 30-70% potential upside.
        </p>
      </GlassCard>

      {/* ── Global vs Local Comparisons ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {GLOBAL_LOCAL_COMPARISONS.slice(0, 2).map((comp, i) => (
          <GlassCard key={i} variant="default" delay={0.1 * i} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[.65rem] text-muted uppercase tracking-wider font-mono">Global vs Local</div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-[.68rem] text-txt-2 mb-0.5">{comp.global.label}</div>
                <div className="font-headline font-bold text-txt text-[.88rem]">{comp.global.name}</div>
                <div className="font-mono text-coral text-[1.3rem] font-bold">{comp.global.pe}× PE</div>
                <div className="text-[.65rem] text-muted">{comp.global.divYield}% dividend</div>
              </div>
              <div>
                <div className="text-[.68rem] text-txt-2 mb-0.5">{comp.local.label}</div>
                <div className="font-headline font-bold text-txt text-[.88rem]">{comp.local.name}</div>
                <div className="font-mono text-sea text-[1.3rem] font-bold">{comp.local.pe}× PE</div>
                <div className="text-[.65rem] text-muted">{comp.local.divYield}% dividend</div>
              </div>
            </div>
            <p className="text-[.72rem] text-sun italic">{comp.insight}</p>
          </GlassCard>
        ))}
      </div>

      {/* Data source label */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt">Ordinary Shares — Today's Market</h2>
        <span className="text-[.68rem] text-muted px-2.5 py-0.5 border border-white/8 rounded-full">
          {isLive ? '✅ Live from stockex.co.tt' : '📦 Cached data — 17 Mar 2026'}
        </span>
      </div>

      {/* Loading */}
      {ttseQ.isLoading && (
        <div className="flex flex-col items-center gap-3.5 py-12 text-muted text-sm">
          <div className="w-7 h-7 border-[3px] border-[rgba(200,16,46,.22)] border-t-[#FF4D6D] rounded-full animate-spin" />
          Fetching TTSE data...
        </div>
      )}

      {stocks.length > 0 && (
        <FinancialTable
          title="Company"
          getRowId={(r) => r.sym}
          rows={stocks}
          onRowClick={(row) => openTrade(row.sym)}
          columns={[
            {
              key: 'company',
              label: 'Company',
              width: '2.2fr',
              render: (s) => {
                const sec = SECTOR_META[s.sector] || SECTOR_META.congl;
                return (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[.65rem] font-extrabold"
                      style={{ background: 'rgba(200,16,46,.15)', color: '#FF4D6D' }}>
                      {s.sym.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-body font-bold text-[.88rem] text-txt">{s.sym}</div>
                      <div className="text-[.65rem] text-muted truncate">{s.name}</div>
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'open',
              label: 'Open (TTD)',
              width: '1fr',
              hideOnMobile: true,
              render: (s) => (
                <span className="font-mono font-bold text-[.82rem] text-txt-2">{fmtTTD(s.open)}</span>
              ),
            },
            {
              key: 'close',
              label: 'Close (TTD)',
              width: '1fr',
              render: (s) => (
                <span className="font-mono font-bold text-[.82rem] text-txt">{fmtTTD(s.close)}</span>
              ),
            },
            {
              key: 'change',
              label: 'Change',
              width: '.9fr',
              render: (s) => {
                const chgPct = s.open > 0 ? (s.chg / s.open) * 100 : 0;
                return <PerfPill value={chgPct} />;
              },
            },
            {
              key: 'volume',
              label: 'Volume',
              width: '1fr',
              hideOnMobile: true,
              render: (s) => (
                <span className="text-[.78rem] text-txt-2 font-mono">
                  {s.vol > 0 ? s.vol.toLocaleString() : '—'}
                </span>
              ),
            },
            {
              key: 'sector',
              label: 'Sector',
              width: '1.1fr',
              hideOnMobile: true,
              render: (s) => {
                const sec = SECTOR_META[s.sector] || SECTOR_META.congl;
                return (
                  <span className={`text-[.62rem] px-2 py-0.5 rounded-full border whitespace-nowrap ${sec.cls}`}>
                    {sec.icon} {sec.label}
                  </span>
                );
              },
            },
            {
              key: 'trade',
              label: '',
              width: '90px',
              render: (s) => (
                <button className="bg-[rgba(200,16,46,.1)] border border-[rgba(200,16,46,.22)] text-[#FF4D6D] rounded-lg px-3 py-1.5 text-[.7rem] font-mono cursor-pointer transition-all hover:bg-[#C8102E] hover:text-white whitespace-nowrap"
                  onClick={e => { e.stopPropagation(); openTrade(s.sym); }}>
                  Trade
                </button>
              ),
            },
          ]}
        />
      )}

      {/* Movers */}
      <div className="mt-7">
        <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Today's Movers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <MoverCard title="Top Gainers" color="var(--color-up)" items={gainers} renderVal={s => (
            <><span className="font-body font-bold text-up">+{s.chg.toFixed(2)}</span><div className="text-[.68rem] text-muted">{fmtTTD(s.close)}</div></>
          )} />
          <MoverCard title="Top Decliners" color="var(--color-down)" items={decliners} renderVal={s => (
            <><span className="font-body font-bold text-down">{s.chg.toFixed(2)}</span><div className="text-[.68rem] text-muted">{fmtTTD(s.close)}</div></>
          )} />
          <MoverCard title="Most Traded" color="var(--color-sea)" items={topVol} renderVal={s => (
            <><span className="font-body font-bold text-sea">{s.vol.toLocaleString()}</span><div className="text-[.68rem] text-muted">shares</div></>
          )} />
        </div>
      </div>
    </div>
  );
}

function MoverCard({ title, color, items, renderVal }) {
  return (
    <div className="rounded-[14px] p-5 border border-border" style={{ background: 'var(--color-card)' }}>
      <div className="text-[.66rem] uppercase tracking-widest mb-3" style={{ color }}>{title}</div>
      {items.length === 0 && <div className="text-muted text-[.76rem]">None today</div>}
      {items.map(s => (
        <div key={s.sym} className="flex justify-between py-1.5 border-b border-border last:border-b-0">
          <div>
            <span className="font-body font-bold text-[.82rem]">{s.sym}</span>
            <div className="text-[.68rem] text-muted">{s.name.slice(0, 22)}</div>
          </div>
          <div className="text-right">{renderVal(s)}</div>
        </div>
      ))}
    </div>
  );
}
