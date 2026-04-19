import { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import GlassCard from '../ui/GlassCard';
import {
  mockQuote,
  mockOverview,
  mockDaily,
  TICKER_UNIVERSE,
} from '../../api/marketDataMock';
import { usePythPrice } from '../../api/usePythPrice';
import { PYTH_FEED_IDS } from '../../api/pyth-ws';
import BlockworksResearchHub from './BlockworksResearchHub';

function fmtMoney(v) {
  if (v == null) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function Stat({ label, value, sub, up }) {
  return (
    <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-border/60">
      <div className="text-[.55rem] uppercase tracking-[.25em] text-muted font-mono mb-1">
        {label}
      </div>
      <div className={`font-headline font-black text-lg ${up === true ? 'text-sea' : up === false ? 'text-down' : 'text-txt'}`}>
        {value}
      </div>
      {sub && <div className="text-[.6rem] text-txt-2 mt-0.5 font-mono">{sub}</div>}
    </div>
  );
}

export default function ResearchPanel() {
  const [symbol, setSymbol] = useState('AAPL');

  // Live Pyth stream for tickers with known feed IDs — mock baseline
  // stays as the canonical snapshot (for change %, dayLow/dayHigh, etc.).
  // When Pyth emits a tick we substitute the `.price` field so users see
  // sub-second updates; all other overview data remains from the catalog.
  const mockBase  = useMemo(() => mockQuote(symbol),    [symbol]);
  const hasPyth   = Object.prototype.hasOwnProperty.call(PYTH_FEED_IDS, symbol);
  const pyth      = usePythPrice(hasPyth ? symbol : null);
  const livePrice = pyth?.price ?? null;
  const quote     = useMemo(() => {
    if (!mockBase) return null;
    if (livePrice != null) {
      const change = livePrice - (mockBase.price - mockBase.change);
      return {
        ...mockBase,
        price:     livePrice,
        change,
        changePct: ((livePrice - (mockBase.price - mockBase.change)) / (mockBase.price - mockBase.change)) * 100,
        live:      true,
        streaming: pyth?.isStreaming === true,
      };
    }
    return { ...mockBase, live: false, streaming: false };
  }, [mockBase, livePrice, pyth?.isStreaming]);

  const overview = useMemo(() => mockOverview(symbol), [symbol]);
  const daily    = useMemo(() => mockDaily(symbol, 90), [symbol]);

  const chartOptions = {
    chart: { type: 'area', background: 'transparent', fontFamily: 'Inter, sans-serif', toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false } },
    theme: { mode: 'dark' },
    stroke: { width: 2, curve: 'smooth', colors: [(quote?.changePct || 0) >= 0 ? '#00ffa3' : '#ff716c'] },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark', type: 'vertical', opacityFrom: 0.35, opacityTo: 0.02,
        colorStops: [
          { offset: 0, color: (quote?.changePct || 0) >= 0 ? '#00ffa3' : '#ff716c', opacity: 0.35 },
          { offset: 100, color: '#0d0e10', opacity: 0 },
        ],
      },
    },
    grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 3 },
    xaxis: {
      type: 'datetime',
      categories: daily.map(d => d.date),
      labels: { style: { colors: '#7d7e82', fontSize: '10px', fontFamily: 'DM Mono' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: '#7d7e82', fontSize: '10px', fontFamily: 'DM Mono' }, formatter: (v) => `$${Number(v).toFixed(2)}` },
    },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark', x: { format: 'MMM d, yyyy' }, y: { formatter: (v) => `$${Number(v).toFixed(2)}` } },
  };

  const chartSeries = [{ name: symbol, data: daily.map(d => d.close) }];

  // Simple comp: peers in same sector
  const peers = TICKER_UNIVERSE.filter(s => s !== symbol && mockOverview(s)?.sector === overview?.sector).slice(0, 5);

  return (
    <div>
      {/* Blockworks Research Hub — the Pro tier's institutional-context
         header. Sits above the ticker drill-down so users who land on
         Terminal → Research get editorial signal first, data second. */}
      <BlockworksResearchHub />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Main ticker panel */}
      <GlassCard className="lg:col-span-8 p-5">
        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <div className="text-[.6rem] uppercase tracking-[.3em] text-muted font-mono">Ticker</div>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-[rgba(255,255,255,0.04)] border border-border rounded-md px-2 py-1 text-sm font-mono text-txt focus:outline-none focus:border-sea/50"
          >
            {TICKER_UNIVERSE.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {quote && (
            <div className="ml-auto flex items-baseline gap-3">
              <div className="flex flex-col items-end">
                <div className="font-headline text-2xl font-black text-txt flex items-center gap-2">
                  ${quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  {quote.streaming && (
                    <span
                      title="Live Pyth Hermes feed"
                      className="inline-block w-2 h-2 rounded-full bg-sea animate-pulse"
                    />
                  )}
                </div>
                {hasPyth && (
                  <div className="text-[.55rem] uppercase tracking-[.2em] font-mono text-muted mt-0.5">
                    {quote.streaming ? 'Pyth · live' : quote.live ? 'Pyth · cached' : 'feed pending'}
                  </div>
                )}
              </div>
              <div className={`text-sm font-mono ${quote.changePct >= 0 ? 'text-sea' : 'text-down'}`}>
                {quote.changePct >= 0 ? '▲' : '▼'} {Math.abs(quote.change).toFixed(2)} ({quote.changePct.toFixed(2)}%)
              </div>
            </div>
          )}
        </div>

        {quote && (
          <div className="text-[.65rem] text-txt-2 mb-3 font-mono">
            {quote.name} · <span className="text-muted">{quote.sector}</span>
          </div>
        )}

        <div className="min-h-[260px]">
          <ReactApexChart options={chartOptions} series={chartSeries} type="area" height={260} />
        </div>

        {/* Valuation row */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Stat label="P/E" value={overview.peRatio?.toFixed(1) ?? '—'} />
            <Stat label="P/S" value={overview.psRatio?.toFixed(1) ?? '—'} />
            <Stat label="Market Cap" value={fmtMoney(overview.marketCap)} />
            <Stat label="Div Yield" value={overview.dividendYield != null ? `${overview.dividendYield.toFixed(2)}%` : '—'} />
          </div>
        )}
      </GlassCard>

      {/* Right rail: peers + activity */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <GlassCard className="p-5">
          <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono mb-3">
            Sector comps
          </div>
          <div className="text-xs font-mono">
            {peers.length === 0 && <div className="text-muted">No peers in catalog</div>}
            {peers.map(p => {
              const q = mockQuote(p);
              return (
                <button
                  key={p}
                  onClick={() => setSymbol(p)}
                  className="w-full flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 hover:bg-white/[0.03] rounded px-2 cursor-pointer"
                >
                  <span className="text-txt">{p}</span>
                  <span className="text-txt-2">${q?.price?.toFixed(2)}</span>
                  <span className={q?.changePct >= 0 ? 'text-sea text-[.65rem]' : 'text-down text-[.65rem]'}>
                    {q?.changePct >= 0 ? '+' : ''}{q?.changePct?.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono mb-3">
            Insider &amp; institutional activity
          </div>
          <div className="text-xs font-mono space-y-2">
            <div className="flex justify-between"><span className="text-txt-2">Insider buys (30d)</span><span className="text-sea">3</span></div>
            <div className="flex justify-between"><span className="text-txt-2">Insider sells (30d)</span><span className="text-down">12</span></div>
            <div className="flex justify-between"><span className="text-txt-2">13F holders (last Q)</span><span className="text-txt">+184</span></div>
            <div className="flex justify-between"><span className="text-txt-2">Short interest</span><span className="text-txt">2.4%</span></div>
            <div className="text-[.58rem] text-muted mt-2 italic">
              Activity feed is a demo placeholder — wire Finnhub insider + SEC 13F once live.
            </div>
          </div>
        </GlassCard>
      </div>
      </div>
    </div>
  );
}
