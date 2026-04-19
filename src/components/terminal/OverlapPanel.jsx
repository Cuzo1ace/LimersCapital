import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import useStore from '../../store/useStore';
import GlassCard from '../ui/GlassCard';
import { computeExposure, etfSymbolsFromPositions, SUPPORTED_ETFS, OTHER_TICKER } from '../../api/etfOverlap';
import { fetchEtfHoldingsBatch } from '../../api/terminal';
import { regionOf } from '../../api/marketDataMock';
import BlinkPreview from './BlinkPreview';

// Resolve the Blink base URL — points to the worker's /actions/exposure
// endpoint. Users share this link; Phantom / Twitter / Dialect render a
// native card from the Action JSON manifest.
const PROXY_BASE = (import.meta.env.VITE_API_PROXY_URL || 'https://limer-api-proxy.workers.dev').replace(/\/$/, '');

const REGION_LABELS = {
  caribbean:    { label: 'Caribbean',     color: '#00ffa3' },
  us_equity:    { label: 'US equity',     color: '#bf81ff' },
  us_etf:       { label: 'US ETF core',   color: '#8b4fcf' },
  crypto:       { label: 'Crypto',        color: '#F7931A' },
  fixed_income: { label: 'Fixed income',  color: '#FFCA3A' },
  other:        { label: 'Cash / other',  color: '#7d7e82' },
};

// Deterministic color assignment so a ticker keeps the same wedge color
// across re-renders. djb2-esque hash → HSL.
function colorFor(ticker) {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) h = (h * 33 + ticker.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 70%, 58%)`;
}

export default function OverlapPanel() {
  const uploaded = useStore(s => s.uploadedPortfolio);
  const [holdingsMap, setHoldingsMap] = useState({});
  const [loading, setLoading]         = useState(false);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const etfSymbols = useMemo(
    () => etfSymbolsFromPositions(uploaded, SUPPORTED_ETFS),
    [uploaded]
  );

  // Refetch whenever the set of ETF symbols changes.
  useEffect(() => {
    if (etfSymbols.length === 0) {
      setHoldingsMap({});
      setFallbackUsed(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const map = await fetchEtfHoldingsBatch(etfSymbols);
      if (cancelled) return;
      setHoldingsMap(map);
      setFallbackUsed(Object.values(map).some(v => v?._fallback));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [etfSymbols.join('|')]);

  const { total, rows } = useMemo(
    () => computeExposure(uploaded, holdingsMap),
    [uploaded, holdingsMap]
  );

  // Aggregate single-name rows into regional buckets for the Caribbean-
  // vs-US-vs-Crypto lens. Unknown tickers default to 'us_equity' — fine
  // for a retail heuristic since that's where the mass sits.
  const regionRows = useMemo(() => {
    const buckets = {};
    for (const r of rows) {
      const region = regionOf(r.ticker);
      buckets[region] = (buckets[region] || 0) + r.value;
    }
    return Object.entries(buckets)
      .map(([region, value]) => ({ region, value, share: total > 0 ? value / total : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [rows, total]);

  const caribbeanShare = regionRows.find(r => r.region === 'caribbean')?.share || 0;

  // Build the Solana Action (Blink) URL for sharing the regional lens.
  // We emit absolute shares as percentages rounded to 2 decimals — all
  // identifying position detail stays off the URL for privacy.
  const blinkUrl = useMemo(() => {
    if (total <= 0) return null;
    const params = new URLSearchParams();
    params.set('total', Math.round(total).toString());
    for (const r of regionRows) {
      params.set(r.region, (r.share * 100).toFixed(2));
    }
    return `${PROXY_BASE}/actions/exposure?${params.toString()}`;
  }, [regionRows, total]);

  const [previewOpen, setPreviewOpen] = useState(false);
  function openBlinkPreview() {
    if (!blinkUrl) return;
    setPreviewOpen(true);
  }

  if (uploaded.length === 0) {
    return (
      <GlassCard className="p-5 min-h-[420px] flex flex-col items-center justify-center text-center">
        <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono mb-3">
          True exposure · look-through
        </div>
        <div className="text-txt-2 text-sm max-w-md">
          Upload holdings to reveal your actual single-name exposure across
          SPY, QQQ, ARKK, iShares, and ARK funds.
        </div>
      </GlassCard>
    );
  }

  const topRows = rows.slice(0, 14);
  const restVal = rows.slice(14).reduce((s, r) => s + r.value, 0);
  const seriesRows = restVal > 0
    ? [...topRows, { ticker: 'Others', value: restVal, share: restVal / total }]
    : topRows;

  const chartOptions = {
    chart: { type: 'donut', background: 'transparent', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
    theme: { mode: 'dark' },
    labels: seriesRows.map(r => r.ticker),
    colors: seriesRows.map(r => colorFor(r.ticker)),
    dataLabels: { enabled: false },
    legend: {
      position: 'right',
      labels: { colors: '#c3c3c4' },
      fontSize: '11px',
      itemMargin: { vertical: 2 },
    },
    stroke: { width: 1, colors: ['rgba(13,14,16,0.8)'] },
    plotOptions: {
      pie: {
        donut: {
          size: '62%',
          labels: {
            show: true,
            name: { color: '#7d7e82', fontSize: '11px', fontFamily: 'DM Mono' },
            value: {
              color: '#00ffa3',
              fontSize: '20px',
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              formatter: (v) => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'TRUE EXPOSURE',
              color: '#7d7e82',
              fontSize: '10px',
              fontFamily: 'DM Mono',
              formatter: () => `$${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            },
          },
        },
      },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (v, opts) => {
          const pct = total > 0 ? ((v / total) * 100).toFixed(2) : '0';
          return `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })} · ${pct}%`;
        },
      },
    },
  };
  const chartSeries = seriesRows.map(r => r.value);

  return (
    <GlassCard className="p-5 min-h-[420px]">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono">
            True exposure · look-through
          </div>
          <div className="text-[.58rem] text-txt-2 font-mono mt-0.5">
            Caribbean share{' '}
            <span className={caribbeanShare > 0.25 ? 'text-sea' : caribbeanShare > 0 ? 'text-gold' : 'text-down'}>
              {(caribbeanShare * 100).toFixed(1)}%
            </span>
            {' · '}
            {caribbeanShare > 0.25 ? 'regionally anchored' : caribbeanShare > 0 ? 'US-tilted with Caribbean sleeve' : 'no Caribbean allocation'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <div className="text-[.6rem] text-sea font-mono animate-pulse">
              resolving ETF weights…
            </div>
          )}
          {blinkUrl && (
            <button
              onClick={openBlinkPreview}
              title="Preview your regional-exposure Blink — see exactly how Phantom / Twitter / Dialect will render the card before you share"
              className="text-[.6rem] uppercase tracking-widest font-headline font-bold px-2.5 py-1 rounded-md border border-sea/40 text-sea hover:bg-sea/10 transition-colors"
            >
              ▸ share as blink
            </button>
          )}
        </div>
      </div>

      {/* Regional exposure strip — the headline Caribbean-vs-rest lens. */}
      <div className="mb-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
          {regionRows.map(r => (
            <div
              key={r.region}
              title={`${REGION_LABELS[r.region]?.label || r.region} · ${(r.share * 100).toFixed(1)}%`}
              style={{ width: `${r.share * 100}%`, background: REGION_LABELS[r.region]?.color || '#666' }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[.6rem] font-mono">
          {regionRows.map(r => (
            <div key={r.region} className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: REGION_LABELS[r.region]?.color }} />
              <span className="text-txt-2">{REGION_LABELS[r.region]?.label || r.region}</span>
              <span className="text-txt">{(r.share * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {etfSymbols.length > 0 && (
        <div className="text-[.65rem] text-txt-2 mb-3 font-mono">
          Flattened {etfSymbols.length} fund{etfSymbols.length === 1 ? '' : 's'}:{' '}
          <span className="text-sea">{etfSymbols.join(' · ')}</span>
          {fallbackUsed && (
            <span className="ml-2 text-gold">· using cached weights</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
        <div className="min-h-[260px]">
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type="donut"
            height={280}
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto text-xs font-mono">
          <div className="flex text-[.55rem] uppercase tracking-widest text-muted border-b border-border pb-1 mb-1">
            <span className="flex-1">Ticker</span>
            <span className="w-24 text-right">Dollars</span>
            <span className="w-14 text-right">%</span>
          </div>
          {rows.map(r => (
            <div key={r.ticker}
                 className="flex items-center py-1 border-b border-border/40 last:border-0">
              <span
                className="inline-block w-2 h-2 rounded-sm mr-2 flex-shrink-0"
                style={{ background: colorFor(r.ticker) }}
              />
              <span className={`flex-1 truncate ${r.ticker === OTHER_TICKER ? 'text-muted italic' : 'text-txt'}`}>
                {r.ticker}
              </span>
              <span className="w-24 text-right text-txt-2">
                ${r.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="w-14 text-right text-sea">
                {(r.share * 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {previewOpen && (
        <BlinkPreview url={blinkUrl} onClose={() => setPreviewOpen(false)} />
      )}
    </GlassCard>
  );
}
