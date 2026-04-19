import ReactApexChart from 'react-apexcharts';
import { mockQuote, mockDaily, mockOverview } from '../../api/marketDataMock';
import { usePythPrice } from '../../api/usePythPrice';
import { PYTH_FEED_IDS } from '../../api/pyth-ws';

/**
 * Compact self-referential preview of a Terminal ticker.
 *
 * Renders a live Pyth price (when the ticker has a feed), a 30-day
 * spark chart, sector, and key valuation metrics. Meant to live
 * inside a <HoverPeek> so users hovering a ticker in the overlap
 * table see a preview without clicking into Research.
 *
 * Zero external API dependency — we use the same mock baseline +
 * Pyth stream the Research panel uses, so this renders identically.
 */
export default function TickerPreview({ symbol }) {
  if (!symbol || symbol === 'CASH/OTHER' || symbol === 'Others') {
    return (
      <div className="p-4 text-[.7rem] font-mono text-muted">
        Unresolved residual — cash, non-listed holdings, or ETF slice weight
        we couldn't flatten.
      </div>
    );
  }

  const base     = mockQuote(symbol);
  const overview = mockOverview(symbol);
  const daily    = mockDaily(symbol, 30);
  const hasPyth  = Object.prototype.hasOwnProperty.call(PYTH_FEED_IDS, symbol);
  const pyth     = usePythPrice(hasPyth ? symbol : null);
  const live     = pyth?.price ?? null;
  const price    = live ?? base?.price ?? null;
  const change   = base?.change ?? 0;
  const pct      = base?.changePct ?? 0;
  const streaming = pyth?.isStreaming === true;
  const up       = pct >= 0;

  if (!base) {
    return (
      <div className="p-4 text-[.7rem] font-mono text-muted">
        <span className="text-txt">{symbol}</span> — no catalog entry.
        Fallback exposure is correct but no ticker metadata available.
      </div>
    );
  }

  const chartOptions = {
    chart: { type: 'area', sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false } },
    stroke: { width: 1.5, curve: 'smooth', colors: [up ? '#00ffa3' : '#ff716c'] },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0 } },
    tooltip: { enabled: false },
  };

  return (
    <div className="p-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[.55rem] uppercase tracking-[.3em] text-muted font-mono leading-none">
            {base.sector}
          </div>
          <div className="text-txt font-headline font-black text-base leading-tight mt-0.5">
            {symbol}
          </div>
        </div>
        <div className="text-right">
          <div className="text-txt font-headline font-black text-base flex items-center gap-1.5 justify-end leading-tight">
            ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            {streaming && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sea animate-pulse" title="Live Pyth feed" />
            )}
          </div>
          <div className={`text-[.65rem] font-mono leading-tight ${up ? 'text-sea' : 'text-down'}`}>
            {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({pct.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Spark */}
      <div className="mb-2 h-12">
        <ReactApexChart
          options={chartOptions}
          series={[{ name: symbol, data: daily.map(d => d.close) }]}
          type="area"
          height={48}
        />
      </div>

      {/* Stats strip */}
      {overview && (
        <div className="grid grid-cols-4 gap-1.5 text-[.55rem] font-mono">
          <div className="text-center">
            <div className="text-muted uppercase tracking-wider">P/E</div>
            <div className="text-txt">{overview.peRatio?.toFixed(1) ?? '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-muted uppercase tracking-wider">P/S</div>
            <div className="text-txt">{overview.psRatio?.toFixed(1) ?? '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-muted uppercase tracking-wider">Yield</div>
            <div className="text-txt">{overview.dividendYield != null ? `${overview.dividendYield.toFixed(2)}%` : '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-muted uppercase tracking-wider">Feed</div>
            <div className={hasPyth ? 'text-sea' : 'text-muted'}>
              {hasPyth ? 'Pyth' : 'mock'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
