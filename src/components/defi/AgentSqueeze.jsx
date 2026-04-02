import { useState, useCallback } from 'react';
import useStore from '../../store/useStore';
import { analyzePoolsForSqueeze, squeezeScore as calcSqueezeScore, estimateImpermanentLoss } from '../../api/lp-pools';

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
  const { recordAgentSqueezeUse, openLPPosition, perpPositions, balanceUSD, setActiveTab, competitionRegistered } = useStore();

  const [pair, setPair] = useState('SOL/USDC');
  const [strategy, setStrategy] = useState('wide');
  const [risk, setRisk] = useState(1); // 0-2 index
  const [amount, setAmount] = useState('1000');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Perp exposure analysis
  const openPerps = perpPositions.filter(p => p.status === 'open');
  const perpExposure = openPerps.reduce((acc, p) => {
    const token = p.symbol;
    if (!acc[token]) acc[token] = { long: 0, short: 0 };
    if (p.side === 'long') acc[token].long += p.size;
    else acc[token].short += p.size;
    return acc;
  }, {});

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

  // Determine if current pair has perp exposure
  const pairBase = pair.split('/')[0];
  const hasPerpExposure = perpExposure[pairBase];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline text-xl font-bold text-txt flex items-center gap-2">
          🤖 Agent Squeeze
        </h1>
        <p className="text-[.78rem] text-txt-2 mt-1">
          Deterministic LP opportunity analyzer — scores real Meteora pools and recommends strategies
        </p>
      </div>

      {/* Perp Exposure Alert */}
      {hasPerpExposure && (
        <div className="rounded-xl border border-sun/30 bg-sun/5 p-4 mb-5 flex items-start gap-3">
          <span className="text-xl">⚡</span>
          <div>
            <div className="font-body font-bold text-[.82rem] text-sun">Active {pairBase} Perp Exposure Detected</div>
            <div className="text-[.72rem] text-txt-2 mt-0.5 leading-relaxed">
              You have {hasPerpExposure.long > 0 ? `$${(hasPerpExposure.long / 1000).toFixed(1)}K long` : ''}
              {hasPerpExposure.long > 0 && hasPerpExposure.short > 0 ? ' + ' : ''}
              {hasPerpExposure.short > 0 ? `$${(hasPerpExposure.short / 1000).toFixed(1)}K short` : ''} in {pairBase} perps.
              {' '}LP in {pair} creates correlated exposure — consider this in your risk management.
              {hasPerpExposure.long > 0 && hasPerpExposure.short <= 0 && strategy === 'one-sided' && (
                <span className="text-up ml-1">One-sided LP on the ask side can hedge your long exposure.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Competition Badge */}
      {competitionRegistered && (
        <div className="rounded-xl border border-up/20 bg-up/5 p-3 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🏆</span>
            <span className="text-[.75rem] text-txt-2">
              <strong className="text-up">Competition Active</strong> — LP positions earn bonus LP points for your ranking
            </span>
          </div>
          <button onClick={() => setActiveTab('competition')}
            className="text-[.68rem] text-up bg-transparent border border-up/30 rounded px-2.5 py-1 cursor-pointer hover:bg-up/10 transition-all">
            View Standings
          </button>
        </div>
      )}

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
            <div className="text-[.6rem] text-muted mt-1 font-mono">
              Balance: ${balanceUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Advanced Toggle */}
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-3 text-[.68rem] text-muted hover:text-txt cursor-pointer bg-transparent border-none font-mono transition-colors">
          {showAdvanced ? '▼' : '▶'} Advanced Analysis Settings
        </button>

        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[.72rem]">
              <div className="rounded-lg bg-black/20 border border-border p-3">
                <div className="font-mono text-muted text-[.62rem] uppercase mb-1">IL Scenario</div>
                <div className="text-txt">
                  {strategy === 'spot' ? '±10% price move' : strategy === 'wide' ? '±20% price move' : '±15% price move'}
                </div>
                <div className="text-muted mt-1">
                  Est. IL: <span className="text-coral font-mono">
                    {(estimateImpermanentLoss(strategy === 'spot' ? 1.1 : strategy === 'wide' ? 1.2 : 1.15, strategy === 'spot' ? 3 : 1) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-black/20 border border-border p-3">
                <div className="font-mono text-muted text-[.62rem] uppercase mb-1">Strategy Notes</div>
                <div className="text-txt-2 leading-relaxed">
                  {STRATEGIES.find(s => s.id === strategy)?.desc}
                </div>
              </div>
              <div className="rounded-lg bg-black/20 border border-border p-3">
                <div className="font-mono text-muted text-[.62rem] uppercase mb-1">Portfolio Context</div>
                <div className="text-txt-2 leading-relaxed">
                  {openPerps.length > 0
                    ? `${openPerps.length} open perp position${openPerps.length > 1 ? 's' : ''} — consider correlation risk`
                    : 'No open perp positions — LP-only strategy'}
                </div>
              </div>
            </div>
          </div>
        )}

        <button onClick={runAnalysis} disabled={loading}
          className={`mt-4 w-full md:w-auto px-6 py-3 rounded-lg font-mono text-[.82rem] font-bold cursor-pointer transition-all
            ${loading ? 'bg-sea/20 text-sea/50' : 'bg-sea/15 text-sea hover:bg-sea/25 border border-sea/30'}`}>
          {loading ? '⏳ Analyzing pools...' : '🔍 Run Squeeze Analysis'}
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
            <PoolCard key={pool.address || i} pool={pool} rank={i + 1} amount={amount}
              onSimulate={() => handleSimulate(pool)} perpExposure={perpExposure} />
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
          <div className="text-3xl mb-3">🔍</div>
          <div className="font-body font-bold text-txt mb-1">No pools found for {pair}</div>
          <div className="text-[.75rem] text-muted">Try a different token pair or check back later</div>
        </div>
      )}

      {/* Simulated Positions */}
      <SimulatedPositions />

      {/* Educational Footer */}
      <div className="mt-8 rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
        <h3 className="font-body font-bold text-[.88rem] text-txt mb-3">How Agent Squeeze Scores Pools</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Fee APR', weight: '40%', desc: 'Higher fee yield = higher score', color: '#00ffa3' },
            { label: 'TVL Stability', weight: '20%', desc: 'Larger pools are more stable', color: '#FFCA3A' },
            { label: 'Volume/TVL', weight: '25%', desc: 'Active pools generate more fees', color: '#9945FF' },
            { label: 'IL Risk', weight: '15%', desc: 'Narrower bins = more IL per bin', color: '#FF6B6B' },
          ].map(w => (
            <div key={w.label} className="text-center">
              <div className="text-xl font-mono font-bold mb-1" style={{ color: w.color }}>{w.weight}</div>
              <div className="text-[.74rem] font-bold text-txt">{w.label}</div>
              <div className="text-[.6rem] text-muted mt-0.5">{w.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Pool Card ────────────────────────────────────────────── */
function PoolCard({ pool, rank, amount, onSimulate, perpExposure }) {
  const baseToken = pool.name?.split('/')[0];
  const hasPerpForPool = perpExposure[baseToken];

  return (
    <div className="rounded-xl border border-border p-5 transition-all hover:border-sea/20"
      style={{ background: 'var(--color-card)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[.68rem] text-muted">#{rank}</span>
            <span className="font-body font-bold text-[.95rem] text-txt">{pool.name}</span>
            <span className={`text-[.62rem] px-2 py-0.5 rounded-full font-mono
              ${pool.squeezeScore >= 70 ? 'bg-up/10 text-up' : pool.squeezeScore >= 40 ? 'bg-sun/10 text-sun' : 'bg-coral/10 text-coral'}`}>
              Score: {pool.squeezeScore}/100
            </span>
            {hasPerpForPool && (
              <span className="text-[.58rem] px-1.5 py-0.5 rounded bg-sun/10 text-sun font-mono">
                PERP EXPOSURE
              </span>
            )}
          </div>
          <div className="text-[.68rem] text-muted font-mono mt-0.5">
            {pool.address ? `${pool.address.slice(0, 8)}...${pool.address.slice(-4)}` : 'Pool'} &middot; Bin Step: {pool.binStep || '?'} bps
          </div>
        </div>
        <div className="text-right">
          <div className="text-[.95rem] font-mono font-bold text-up">
            {pool.apr ? `${(pool.apr).toFixed(1)}%` : '—'} <span className="text-[.6rem] text-muted">APR</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown Bar */}
      <div className="mb-3">
        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
          <div className="bg-up/60 transition-all" style={{ width: `${Math.min(pool.squeezeScore * 0.4, 40)}%` }} title="Fee APR" />
          <div className="bg-sun/60 transition-all" style={{ width: `${Math.min(pool.squeezeScore * 0.2, 20)}%` }} title="TVL" />
          <div className="bg-[#9945FF]/60 transition-all" style={{ width: `${Math.min(pool.squeezeScore * 0.25, 25)}%` }} title="Volume" />
          <div className="bg-coral/40 transition-all" style={{ width: `${Math.min(pool.squeezeScore * 0.15, 15)}%` }} title="IL Risk" />
        </div>
        <div className="flex justify-between text-[.52rem] text-muted mt-0.5 font-mono">
          <span>Fees</span><span>TVL</span><span>Volume</span><span>IL</span>
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
          <div className="text-[.78rem] font-mono text-txt">{pool.tvl > 0 ? (pool.volume24h / pool.tvl).toFixed(2) : '—'}x</div>
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
          <div className="mt-2 flex gap-4 text-[.68rem] text-muted">
            <span>Est. daily fees with ${amount}: <span className="text-up font-mono">${pool.estimatedDailyFees.toFixed(2)}</span></span>
            <span>Est. IL (30d): <span className="text-coral font-mono">{(pool.estimatedIL30d * 100).toFixed(1)}%</span></span>
            {pool.estimatedDailyFees > 0 && (
              <span>Breakeven: <span className="text-txt font-mono">
                {pool.estimatedIL30d > 0 ? `${Math.ceil((pool.estimatedIL30d * parseFloat(amount || 1000)) / pool.estimatedDailyFees)}d` : '—'}
              </span></span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onSimulate}
          className="px-4 py-2 rounded-lg bg-sea/10 border border-sea/30 text-sea text-[.74rem] font-mono cursor-pointer hover:bg-sea/20 transition-all">
          🎮 Simulate This Position
        </button>
        <a href={`https://app.meteora.ag/dlmm/${pool.address}`} target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg bg-black/30 border border-border text-muted text-[.74rem] font-mono cursor-pointer hover:border-sea/30 hover:text-txt transition-all inline-flex items-center">
          ↗ View on Meteora
        </a>
      </div>
    </div>
  );
}

/* ── Simulated Positions ──────────────────────────────────── */
function SimulatedPositions() {
  const { lpSimPositions, closeLPPosition } = useStore();
  const openPositions = lpSimPositions.filter(p => p.status === 'open');

  if (openPositions.length === 0) return null;

  return (
    <div className="mt-7">
      <h2 className="font-headline text-[.88rem] font-bold text-txt mb-3">
        📊 Your Simulated Positions ({openPositions.length})
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
