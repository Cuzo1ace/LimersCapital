import { useQuery } from '@tanstack/react-query';
import { fetchTTSEData, getTTSEMarketStatus, SECTOR_META, TTD_RATE } from '../api/ttse';
import useStore from '../store/useStore';

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
      <div className="rounded-2xl p-9 mb-7 grid grid-cols-1 md:grid-cols-2 gap-9 items-center overflow-hidden relative border border-[rgba(200,16,46,.22)]"
        style={{ background: 'linear-gradient(135deg, rgba(200,16,46,.08) 0%, rgba(10,22,40,1) 60%)' }}>
        <div className="absolute right-0 bottom-[-10px] text-[130px] leading-none opacity-10 pointer-events-none select-none">{'\u{1F1F9}\u{1F1F9}'}</div>
        <div>
          <div className="inline-block bg-[rgba(200,16,46,.12)] border border-[rgba(200,16,46,.3)] rounded-full text-[.68rem] text-[#FF4D6D] px-3 py-0.5 tracking-widest uppercase mb-3.5">
            Trinidad & Tobago Stock Exchange
          </div>
          <h1 className="font-serif text-[2.4rem] font-black leading-[1.1] text-txt mb-3.5">
            Your Local<br /><em className="italic text-[#FF4D6D]">Capital Market</em>
          </h1>
          <p className="font-mono text-txt-2 text-[.82rem] leading-relaxed">
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
              <div key={idx.key} className="border border-[rgba(200,16,46,.22)] rounded-xl p-4" style={{ background: 'rgba(200,16,46,.06)' }}>
                <div className="text-[.68rem] text-muted uppercase tracking-widest mb-1.5">{idx.label}</div>
                <div className="font-sans text-[1.45rem] font-extrabold text-txt">{d.val?.toFixed(2) || '—'}</div>
                <div className={`text-[.72rem] mt-1 ${c > 0 ? 'text-up' : c < 0 ? 'text-down' : 'text-muted'}`}>
                  {c >= 0 ? '+' : ''}{c.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bridge card */}
      <div className="rounded-2xl p-7 mb-6 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center border border-border"
        style={{ background: 'linear-gradient(135deg, rgba(200,16,46,.07), rgba(0,200,180,.07))' }}>
        <div>
          <div className="text-[.68rem] text-muted uppercase tracking-widest">Traditional Market</div>
          <div className="font-serif text-[1.3rem] font-black text-[#FF4D6D]">TTSE Stock</div>
          <div className="text-[.75rem] text-txt-2 leading-relaxed">Regulated by TTSEC. Trades Mon–Fri. Settlement in TTD.</div>
        </div>
        <div className="text-2xl text-muted text-center">⟷</div>
        <div>
          <div className="text-[.68rem] text-muted uppercase tracking-widest">Tokenized / DeFi Version</div>
          <div className="font-serif text-[1.3rem] font-black text-sea">Solana RWA Token</div>
          <div className="text-[.75rem] text-txt-2 leading-relaxed">On-chain 24/7. No broker needed. Fractional ownership.</div>
        </div>
      </div>

      {/* Data source label */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt">Ordinary Shares — Today's Market</h2>
        <span className="text-[.68rem] text-muted px-2.5 py-0.5 border border-white/8 rounded-full">
          {isLive ? '✅ Live from stockex.co.tt' : '📦 Cached data — 17 Mar 2026'}
        </span>
      </div>

      {/* Table header */}
      <div className="grid gap-3.5 items-center px-4 py-1 text-[.68rem] text-muted uppercase tracking-widest"
        style={{ gridTemplateColumns: '44px 2fr 1fr 1fr .9fr 1fr 1.1fr 100px' }}>
        <span /><span>Company</span><span>Open (TTD)</span><span>Close (TTD)</span>
        <span>Change</span><span>Volume</span><span>Sector</span><span />
      </div>

      {/* Loading / Error / Data */}
      {ttseQ.isLoading && (
        <div className="flex flex-col items-center gap-3.5 py-12 text-muted text-sm">
          <div className="w-7 h-7 border-[3px] border-[rgba(200,16,46,.22)] border-t-[#FF4D6D] rounded-full animate-spin" />
          Fetching TTSE data...
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {stocks.map(s => {
          const isUp = s.chg > 0, isDn = s.chg < 0;
          const chgPct = s.open > 0 ? ((s.chg / s.open) * 100).toFixed(2) : '0.00';
          const cls = isUp ? 'text-up bg-up/10' : isDn ? 'text-down bg-down/10' : 'text-muted bg-muted/10';
          const sec = SECTOR_META[s.sector] || SECTOR_META.congl;
          return (
            <div key={s.sym}
              className="grid gap-3.5 items-center rounded-xl px-4 py-3 border border-[rgba(200,16,46,.15)] cursor-pointer transition-all hover:border-[rgba(200,16,46,.4)] hover:translate-x-[3px]"
              style={{ gridTemplateColumns: '44px 2fr 1fr 1fr .9fr 1fr 1.1fr 100px', background: 'var(--color-card)' }}
              onClick={() => openTrade(s.sym)}>
              <div className="w-9 h-9 rounded-full flex items-center justify-content-center text-[.68rem] font-extrabold"
                style={{ background: 'rgba(200,16,46,.15)', color: '#FF4D6D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.sym.slice(0, 4)}
              </div>
              <div>
                <div className="font-sans font-bold text-[.88rem]">{s.sym}</div>
                <div className="text-[.68rem] text-muted truncate max-w-[200px]">{s.name}</div>
              </div>
              <div className="font-sans font-bold text-[.84rem]">{fmtTTD(s.open)}</div>
              <div className="font-sans font-bold text-[.84rem]">{fmtTTD(s.close)}</div>
              <div>
                <span className={`text-[.78rem] px-2 py-0.5 rounded-md inline-block ${cls}`}>
                  {isUp ? '+' : ''}{s.chg.toFixed(2)}
                </span>
                <div className="text-[.65rem] text-muted mt-0.5">{isUp ? '+' : ''}{chgPct}%</div>
              </div>
              <div className="text-[.8rem] text-txt-2">{s.vol > 0 ? s.vol.toLocaleString() : '—'}</div>
              <span className={`text-[.65rem] px-2 py-0.5 rounded-full border text-center whitespace-nowrap ${sec.cls}`}>
                {sec.icon} {sec.label}
              </span>
              <button className="bg-[rgba(200,16,46,.1)] border border-[rgba(200,16,46,.22)] text-[#FF4D6D] rounded-lg px-3 py-1.5 text-[.7rem] font-mono cursor-pointer transition-all hover:bg-[#C8102E] hover:text-white"
                onClick={e => { e.stopPropagation(); openTrade(s.sym); }}>
                Trade TTD
              </button>
            </div>
          );
        })}
      </div>

      {/* Movers */}
      <div className="mt-7">
        <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Today's Movers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <MoverCard title="Top Gainers" color="var(--color-up)" items={gainers} renderVal={s => (
            <><span className="font-sans font-bold text-up">+{s.chg.toFixed(2)}</span><div className="text-[.68rem] text-muted">{fmtTTD(s.close)}</div></>
          )} />
          <MoverCard title="Top Decliners" color="var(--color-down)" items={decliners} renderVal={s => (
            <><span className="font-sans font-bold text-down">{s.chg.toFixed(2)}</span><div className="text-[.68rem] text-muted">{fmtTTD(s.close)}</div></>
          )} />
          <MoverCard title="Most Traded" color="var(--color-sea)" items={topVol} renderVal={s => (
            <><span className="font-sans font-bold text-sea">{s.vol.toLocaleString()}</span><div className="text-[.68rem] text-muted">shares</div></>
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
            <span className="font-sans font-bold text-[.82rem]">{s.sym}</span>
            <div className="text-[.68rem] text-muted">{s.name.slice(0, 22)}</div>
          </div>
          <div className="text-right">{renderVal(s)}</div>
        </div>
      ))}
    </div>
  );
}
