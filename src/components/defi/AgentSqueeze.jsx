import { useState, useCallback } from 'react';
import useStore from '../../store/useStore';
import { analyzePoolsForSqueeze } from '../../api/lp-pools';

const PAIRS = [
  'SOL/USDC', 'SOL/USDT', 'JUP/SOL', 'JUP/USDC', 'BONK/SOL',
  'RAY/SOL', 'RAY/USDC', 'HNT/SOL', 'ONDO/USDC', 'RENDER/USDC',
];

const STRATEGIES = [
  { id: 'spot', label: '\uD83C\uDFAF Spot', desc: 'Tight range, max fees, active mgmt' },
  { id: 'wide', label: '\uD83C\uDF0A Wide', desc: 'Set-and-forget, lower IL' },
  { id: 'one-sided', label: '\uD83D\uDCD0 One-Sided', desc: 'Limit orders that earn fees' },
];

const RISK_LEVELS = ['Conservative', 'Moderate', 'Aggressive'];

export default function AgentSqueeze() {
  const { recordAgentSqueezeUse, openLPPosition } = useStore();

  const [pair, setPair] = useState('SOL/USDC');
  const [strategy, setStrategy] = useState('wide');
  const [risk, setRisk] = useState(1); // 0-2 index
  const [amount, setAmount] = useState('1000');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pools = await analyzePoolsForSqueeze({
        pair,
        strategy,
        riskTolerance: RISK_LEVELS[risk].toLowerCase(),
        amount: parseFloat(amount) || 1000,
      });
      setResults(pools);
      recordAgentSqueezeUse();
    } catch (err) {
      setError('Failed to fetch pool data. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pair, strategy, risk, amount, recordAgentSqueezeUse]);

  const handleSimulate = (pool) => {
    openLPPosition({
      pair: pool.name,
      strategy,
      amount: parseFloat(amount) || 1000,
      poolAddress: pool.address,
      binStep: pool.binStep,
      priceRange: `\u00B1${strategy === 'spot' ? '3' : strategy === 'wide' ? '25' : '15'}%`,
      entryPrice: pool.currentPrice,
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline text-xl font-bold text-txt flex items-center gap-2">
          \uD83E\uDD16 Agent Squeeze
        </h1>
        <p className="text-[.78rem] text-txt-2 mt-1">
          Deterministic LP opportunity analyzer — scores real Meteora pools and recommends strategies
        </p>
      </div>

      {/* Input Panel */}
      <div className="rounded-xl border border-border p-5 mb-5" style={{ background: 'var(--color-card)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pair Selector */}
          <div>
            <label className="text-[.68rem] text-muted block mb-1.5 font-mono uppercase tracking-wider">Token Pair</label>
            <select value={pair} onChange={e => setPair(e.target.value)}
              className="w-full rounded-lg bg-black/30 border border-border px-3 py-2.5 text-[.82rem] text-txt font-mono focus:border-sea/50 outline-none">
              {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Strategy */}
          <div>
            <label className="text-[.68rem] text-muted block mb-1.5 font-mono uppercase tracking-wider">Strategy</label>
            <div className="flex gap-1.5">
              {STRATEGIES.map(s => (
                <button key={s.id} onClick={() => setStrategy(s.id)}
                  className={`flex-1 rounded-lg px-2 py-2.5 text-[.7rem] font-mono border cursor-pointer transition-all
                    ${strategy === s.id ? 'border-sea bg-sea/10 text-sea' : 'border-border text-muted hover:border-sea/30'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="text-[.68rem] text-muted block mb-1.5 font-mono uppercase tracking-wider">
              Risk: {RISK_LEVELS[risk]}
            </label>
            <input type="range" min="0" max="2" value={risk} onChange={e => setRisk(Number(e.target.value))}
              className="w-full accent-sea mt-2" />
          </div>

          {/* Amount */}
          <div>
            <label className="text-[.68rem] text-muted block mb-1.5 font-mono uppercase tracking-wider">Amount (USD)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full rounded-lg bg-black/30 border border-border px-3 py-2.5 text-[.82rem] text-txt font-mono focus:border-sea/50 outline-none"
              placeholder="1000" min="10" />
          </div>
        </div>

        <button onClick={runAnalysis} disabled={loading}
          className={`mt-4 w-full md:w-auto px-6 py-3 rounded-lg font-mono text-[.82rem] font-bold cursor-pointer transition-all
            ${loading ? 'bg-sea/20 text-sea/50' : 'bg-sea/15 text-sea hover:bg-sea/25 border border-sea/30'}`}>
          {loading ? '\u23F3 Analyzing pools...' : '\uD83D\uDD0D Run Squeeze Analysis'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-coral/30 bg-coral/5 p-4 mb-5 text-[.78rem] text-coral">
          {error}
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-headline text-[.88rem] font-bold text-txt">
            Top {Math.min(results.length, 3)} Opportunities
          </h2>
          {results.slice(0, 3).map((pool, i) => (
            <div key={pool.address || i} className="rounded-xl border border-border p-5 transition-all hover:border-sea/20"
              style={{ background: 'var(--color-card)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-body font-bold text-[.95rem] text-txt">{pool.name}</span>
                    <span className={`text-[.62rem] px-2 py-0.5 rounded-full font-mono
                      ${pool.squeezeScore >= 70 ? 'bg-up/10 text-up' : pool.squeezeScore >= 40 ? 'bg-sun/10 text-sun' : 'bg-coral/10 text-coral'}`}>
                      Score: {pool.squeezeScore}/100
                    </span>
                  </div>
                  <div className="text-[.68rem] text-muted font-mono mt-0.5">
                    {pool.address ? `${pool.address.slice(0, 8)}...${pool.address.slice(-4)}` : 'Pool'} · Bin Step: {pool.binStep || '?'} bps
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[.95rem] font-mono font-bold text-up">
                    {pool.apr ? `${(pool.apr).toFixed(1)}%` : '\u2014'} <span className="text-[.6rem] text-muted">APR</span>
                  </div>
                </div>
              </div>

              {/* Pool Stats */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <div className="text-[.58rem] text-muted uppercase">TVL</div>
                  <div className="text-[.78rem] font-mono text-txt">${pool.tvl >= 1e6 ? `${(pool.tvl / 1e6).toFixed(2)}M` : pool.tvl >= 1e3 ? `${(pool.tvl / 1e3).toFixed(0)}K` : pool.tvl.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-[.58rem] text-muted uppercase">24h Volume</div>
                  <div className="text-[.78rem] font-mono text-txt">${pool.volume24h >= 1e6 ? `${(pool.volume24h / 1e6).toFixed(2)}M` : pool.volume24h >= 1e3 ? `${(pool.volume24h / 1e3).toFixed(0)}K` : pool.volume24h.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-[.58rem] text-muted uppercase">24h Fees</div>
                  <div className="text-[.78rem] font-mono text-txt">${pool.fees24h >= 1e3 ? `${(pool.fees24h / 1e3).toFixed(1)}K` : pool.fees24h.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-[.58rem] text-muted uppercase">Vol/TVL</div>
                  <div className="text-[.78rem] font-mono text-txt">{pool.tvl > 0 ? (pool.volume24h / pool.tvl).toFixed(2) : '\u2014'}x</div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="rounded-lg bg-black/20 border border-border p-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[.72rem] font-bold text-sea">{pool.recommendation?.label || 'Analysis'}</span>
                  <span className={`text-[.58rem] px-1.5 py-0.5 rounded font-mono
                    ${pool.recommendation?.riskLevel === 'Low' ? 'bg-up/10 text-up' : pool.recommendation?.riskLevel === 'High' ? 'bg-coral/10 text-coral' : 'bg-sun/10 text-sun'}`}>
                    {pool.recommendation?.riskLevel || 'Medium'} Risk
                  </span>
                </div>
                <p className="text-[.7rem] text-txt-2 leading-relaxed">{pool.recommendation?.reasoning}</p>
                {pool.estimatedDailyFees != null && pool.estimatedDailyFees > 0 && (
                  <div className="mt-2 text-[.68rem] text-muted">
                    Est. daily fees with ${amount}: <span className="text-up font-mono">${pool.estimatedDailyFees.toFixed(2)}</span>
                    {' '}&middot; Est. IL (30d): <span className="text-coral font-mono">{(pool.estimatedIL30d * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => handleSimulate(pool)}
                  className="px-4 py-2 rounded-lg bg-sea/10 border border-sea/30 text-sea text-[.74rem] font-mono cursor-pointer hover:bg-sea/20 transition-all">
                  \uD83C\uDFAE Simulate This Position
                </button>
                <a href={`https://app.meteora.ag/dlmm/${pool.address}`} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-black/30 border border-border text-muted text-[.74rem] font-mono cursor-pointer hover:border-sea/30 hover:text-txt transition-all">
                  \u2197 View on Meteora
                </a>
              </div>
            </div>
          ))}

          {/* Show more indicator */}
          {results.length > 3 && (
            <div className="text-center text-[.7rem] text-muted py-2">
              +{results.length - 3} more pools analyzed &middot; Complete Module 7 to unlock extended results
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {results && results.length === 0 && (
        <div className="rounded-xl border border-border p-8 text-center" style={{ background: 'var(--color-card)' }}>
          <div className="text-3xl mb-3">\uD83D\uDD0D</div>
          <div className="font-body font-bold text-txt mb-1">No pools found for {pair}</div>
          <div className="text-[.75rem] text-muted">Try a different token pair or check back later</div>
        </div>
      )}

      {/* Simulated Positions */}
      <SimulatedPositions />
    </div>
  );
}

function SimulatedPositions() {
  const { lpSimPositions, closeLPPosition } = useStore();
  const openPositions = lpSimPositions.filter(p => p.status === 'open');

  if (openPositions.length === 0) return null;

  return (
    <div className="mt-7">
      <h2 className="font-headline text-[.88rem] font-bold text-txt mb-3">
        \uD83D\uDCCA Your Simulated Positions ({openPositions.length})
      </h2>
      <div className="space-y-2">
        {openPositions.map(pos => (
          <div key={pos.id} className="rounded-xl border border-border p-4 flex items-center justify-between"
            style={{ background: 'var(--color-card)' }}>
            <div>
              <div className="font-body font-bold text-[.84rem] text-txt">{pos.pair}</div>
              <div className="text-[.65rem] text-muted font-mono">
                {pos.strategy} &middot; ${pos.amount} &middot; {pos.priceRange} &middot; Opened {new Date(pos.openedAt).toLocaleDateString()}
              </div>
            </div>
            <button onClick={() => closeLPPosition(pos.id)}
              className="px-3 py-1.5 rounded-lg bg-coral/10 border border-coral/20 text-coral text-[.7rem] font-mono cursor-pointer hover:bg-coral/15 transition-all">
              Close
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
