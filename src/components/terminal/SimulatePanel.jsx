import { useEffect, useRef, useState } from 'react';
import useStore from '../../store/useStore';
import GlassCard from '../ui/GlassCard';
import MonteCarloCanvas from './MonteCarloCanvas';
import { mockQuote, TICKER_UNIVERSE } from '../../api/marketDataMock';
import ConfidentialBadge from '../ui/ConfidentialBadge';

// Realistic annualized (μ, σ) by sector. Chosen so σ² < 2μ — otherwise
// volatility drag makes the GBM median decline over time, which reads
// like "losses in every scenario" to retail users. Power users can
// override the values in the Advanced panel.
const SECTOR_DEFAULTS = {
  'Technology':                { mu: 0.14, sigma: 0.28 },
  'Communication Services':    { mu: 0.10, sigma: 0.25 },
  'Consumer Discretionary':    { mu: 0.11, sigma: 0.30 },
  'Financial Services':        { mu: 0.09, sigma: 0.24 },
  'Crypto':                    { mu: 0.28, sigma: 0.65 },
  'ETF':                       { mu: 0.08, sigma: 0.16 },
  'Caribbean Financials':      { mu: 0.09, sigma: 0.18 },
  'Caribbean Consumer':        { mu: 0.07, sigma: 0.15 },
  'Caribbean Conglomerate':    { mu: 0.07, sigma: 0.16 },
  'Caribbean Industrial':      { mu: 0.06, sigma: 0.18 },
  'Caribbean ETF':             { mu: 0.07, sigma: 0.14 },
};

function defaultStats(sector) {
  return SECTOR_DEFAULTS[sector] || { mu: 0.08, sigma: 0.22 };
}

export default function SimulatePanel() {
  const params    = useStore(s => s.mcSimParams);
  const setParams = useStore(s => s.setMcSimParams);
  const [result, setResult]   = useState(null);
  const [running, setRunning] = useState(false);
  const [error,   setError]   = useState(null);
  const [manualMu,    setManualMu]    = useState(null);
  const [manualSigma, setManualSigma] = useState(null);
  const workerRef = useRef(null);

  // Lazy-init worker.
  function getWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../../workers/monteCarlo.worker.js', import.meta.url),
        { type: 'module' }
      );
    }
    return workerRef.current;
  }

  useEffect(() => () => { workerRef.current?.terminate(); workerRef.current = null; }, []);

  // Reset manual overrides when symbol changes so we re-pick sector defaults.
  useEffect(() => { setManualMu(null); setManualSigma(null); }, [params.symbol]);

  function run() {
    setError(null);
    setRunning(true);
    const quote = mockQuote(params.symbol);
    if (!quote) {
      setError(`Unknown ticker: ${params.symbol}`);
      setRunning(false);
      return;
    }
    const def = defaultStats(quote.sector);
    const mu    = manualMu    != null ? manualMu    : def.mu;
    const sigma = manualSigma != null ? manualSigma : def.sigma;
    const w = getWorker();
    const t0 = Date.now();
    w.onmessage = (e) => {
      const d = e.data;
      if (!d.ok) { setError(d.error); setRunning(false); return; }
      setResult({
        ...d,
        meta: { elapsedMs: Date.now() - t0, mu, sigma, startPrice: quote.price, symbol: params.symbol },
      });
      setRunning(false);
    };
    w.postMessage({
      symbol:      params.symbol,
      startPrice:  quote.price,
      mu,
      sigma,
      horizonDays: params.horizonDays,
      numPaths:    params.numPaths,
    });
  }

  // Kick off a first run when the panel mounts.
  useEffect(() => {
    if (!result && !running) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Parameters */}
      <GlassCard className="lg:col-span-3 p-5 min-h-[520px]">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono">
            Parameters
          </div>
          {/* Monte Carlo paths run client-side today, but the math is the
             same kind of aggregate (no individual path leaked) that an
             Arcis MXE circuit would expose. Surface that promise here. */}
          <ConfidentialBadge />
        </div>

        <label className="block mb-3">
          <span className="text-[.6rem] uppercase tracking-widest text-txt-2 font-mono">Ticker</span>
          <select
            value={params.symbol}
            onChange={(e) => setParams({ symbol: e.target.value })}
            className="mt-1 w-full bg-[rgba(255,255,255,0.04)] border border-border rounded-md px-2 py-1.5 text-sm font-mono text-txt focus:outline-none focus:border-sea/50"
          >
            {TICKER_UNIVERSE.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label className="block mb-3">
          <span className="text-[.6rem] uppercase tracking-widest text-txt-2 font-mono">Horizon · days</span>
          <input
            type="number" min={5} max={1260}
            value={params.horizonDays}
            onChange={(e) => setParams({ horizonDays: Math.max(5, Math.min(1260, +e.target.value)) })}
            className="mt-1 w-full bg-[rgba(255,255,255,0.04)] border border-border rounded-md px-2 py-1.5 text-sm font-mono text-txt focus:outline-none focus:border-sea/50"
          />
        </label>

        <label className="block mb-3">
          <span className="text-[.6rem] uppercase tracking-widest text-txt-2 font-mono">Paths</span>
          <input
            type="number" min={50} max={5000} step={50}
            value={params.numPaths}
            onChange={(e) => setParams({ numPaths: Math.max(50, Math.min(5000, +e.target.value)) })}
            className="mt-1 w-full bg-[rgba(255,255,255,0.04)] border border-border rounded-md px-2 py-1.5 text-sm font-mono text-txt focus:outline-none focus:border-sea/50"
          />
        </label>

        <div className="mt-4 pt-4 border-t border-border/60">
          <div className="text-[.55rem] uppercase tracking-[.25em] text-muted font-mono mb-2">
            Advanced · override
          </div>
          <label className="block mb-2">
            <span className="text-[.6rem] uppercase tracking-widest text-txt-2 font-mono">μ annualized (drift)</span>
            <input
              type="number" step={0.01} min={-0.5} max={1.0}
              placeholder={`default · ${((defaultStats(mockQuote(params.symbol)?.sector).mu) * 100).toFixed(0)}%`}
              value={manualMu ?? ''}
              onChange={(e) => setManualMu(e.target.value === '' ? null : Math.max(-0.5, Math.min(1.0, +e.target.value)))}
              className="mt-1 w-full bg-[rgba(255,255,255,0.04)] border border-border rounded-md px-2 py-1.5 text-sm font-mono text-txt focus:outline-none focus:border-sea/50"
            />
          </label>
          <label className="block mb-3">
            <span className="text-[.6rem] uppercase tracking-widest text-txt-2 font-mono">σ annualized (vol)</span>
            <input
              type="number" step={0.01} min={0.01} max={2.0}
              placeholder={`default · ${((defaultStats(mockQuote(params.symbol)?.sector).sigma) * 100).toFixed(0)}%`}
              value={manualSigma ?? ''}
              onChange={(e) => setManualSigma(e.target.value === '' ? null : Math.max(0.01, Math.min(2.0, +e.target.value)))}
              className="mt-1 w-full bg-[rgba(255,255,255,0.04)] border border-border rounded-md px-2 py-1.5 text-sm font-mono text-txt focus:outline-none focus:border-sea/50"
            />
          </label>
          <div className="text-[.58rem] font-mono text-muted leading-relaxed">
            If σ² &gt; 2μ, volatility drag pulls the median below start price — the
            classic &quot;everything goes down&quot; fan. Defaults satisfy σ² &lt; 2μ so
            medians rise under positive drift.
          </div>
        </div>

        <button
          onClick={run}
          disabled={running}
          className="mt-3 w-full px-3 py-2 rounded-md text-[.72rem] uppercase tracking-widest font-headline font-bold bg-sea text-night disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {running ? 'Running…' : '▸ Run simulation'}
        </button>

        {error && (
          <div className="mt-3 text-[.7rem] text-down font-mono">⚠ {error}</div>
        )}

        {result && (
          <div className="mt-5 text-[.65rem] font-mono space-y-1.5">
            <div className="flex justify-between"><span className="text-txt-2">σ annualized</span><span className="text-txt">{(result.meta.sigma * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span className="text-txt-2">μ annualized</span><span className="text-txt">{(result.meta.mu * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span className="text-txt-2">start</span><span className="text-txt">${result.meta.startPrice.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-txt-2">elapsed</span><span className="text-txt">{result.meta.elapsedMs}ms</span></div>
          </div>
        )}
      </GlassCard>

      {/* Paths + distribution */}
      <GlassCard className="lg:col-span-9 p-5 min-h-[520px]">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono">
              Monte Carlo paths · {params.symbol}
            </div>
            {result && (
              <div className="text-[.6rem] text-txt-2 font-mono mt-1">
                {result.numPaths.toLocaleString()} paths · {result.steps} days · GBM
              </div>
            )}
          </div>
          {result && (
            <div className="flex gap-4 text-xs font-mono">
              <div><span className="text-muted">P5</span> <span className="text-down">${result.summary.p5.toFixed(2)}</span></div>
              <div><span className="text-muted">P50</span> <span className="text-gold">${result.summary.p50.toFixed(2)}</span></div>
              <div><span className="text-muted">P95</span> <span className="text-sea">${result.summary.p95.toFixed(2)}</span></div>
            </div>
          )}
        </div>

        <div className="w-full h-[420px] rounded-lg bg-[rgba(0,0,0,0.35)] border border-border/60 overflow-hidden">
          {result
            ? <MonteCarloCanvas result={result} />
            : <div className="h-full flex items-center justify-center text-muted text-sm font-mono">
                {running ? 'computing paths…' : 'idle — press Run'}
              </div>}
        </div>

        {result && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-white/[0.02] border border-border/60">
              <div className="text-[.55rem] uppercase tracking-widest text-muted">Expected return</div>
              <div className="text-txt text-sm">
                {(((result.summary.mean / result.meta.startPrice) - 1) * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-2.5 rounded bg-white/[0.02] border border-border/60">
              <div className="text-[.55rem] uppercase tracking-widest text-muted">5th pct loss</div>
              <div className="text-down text-sm">
                {(((result.summary.p5 / result.meta.startPrice) - 1) * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-2.5 rounded bg-white/[0.02] border border-border/60">
              <div className="text-[.55rem] uppercase tracking-widest text-muted">95th pct gain</div>
              <div className="text-sea text-sm">
                {(((result.summary.p95 / result.meta.startPrice) - 1) * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-2.5 rounded bg-white/[0.02] border border-border/60">
              <div className="text-[.55rem] uppercase tracking-widest text-muted">Worst path</div>
              <div className="text-down text-sm">
                {(((result.summary.min / result.meta.startPrice) - 1) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
