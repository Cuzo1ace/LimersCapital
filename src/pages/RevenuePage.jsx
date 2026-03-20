import { useState } from 'react';
import useStore from '../store/useStore';
import { REVENUE_STREAMS } from '../data/tokenomics';
import { SIMULATED_TOTAL_LP } from '../data/lp';

const fmtUSD = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RevenuePage() {
  const { simulatedRevenue, limerPoints, setActiveTab } = useStore();
  const [dauSlider, setDauSlider] = useState(1000);

  const userShare = limerPoints / (SIMULATED_TOTAL_LP + limerPoints);
  const userRevenue = simulatedRevenue.communityPool * userShare;

  // Growth projections: avg $5 per trade, 3 trades per DAU, 0.3% fee
  const projectedDailyTrades = dauSlider * 3;
  const avgTradeSize = 500;
  const dailyVolume = projectedDailyTrades * avgTradeSize;
  const dailyFees = dailyVolume * 0.003;
  const annualFees = dailyFees * 365;
  const communityAnnual = annualFees / 2;

  return (
    <div>
      {/* Hero */}
      <div className="rounded-2xl p-9 mb-7 border border-sea/20"
        style={{ background: 'linear-gradient(135deg, rgba(0,200,180,.06), rgba(45,155,86,.03))' }}>
        <div className="inline-block bg-up/12 border border-up/30 rounded-full text-[.68rem] text-up px-3 py-0.5 tracking-widest uppercase mb-3">
          50/50 Revenue Split
        </div>
        <h1 className="font-serif text-[2.4rem] font-black text-txt mb-3">
          Community Earns <span className="text-up">Half</span> of Everything
        </h1>
        <p className="font-mono text-txt-2 text-[.82rem] leading-relaxed max-w-2xl">
          Every trade on Limer's Capital generates a 0.3% fee. Half goes to the platform for development. Half goes directly to the community pool — shared among $LIMER holders.
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-7">
        <StatCard label="Total Revenue" value={fmtUSD(simulatedRevenue.totalPlatformRevenue)} color="var(--color-txt)" />
        <StatCard label="Community Pool (50%)" value={fmtUSD(simulatedRevenue.communityPool)} color="#1DCC8A" />
        <StatCard label="Platform Pool (50%)" value={fmtUSD(simulatedRevenue.platformPool)} color="#FF5C4D" />
        <StatCard label="Your Share" value={fmtUSD(userRevenue)} sub={`${(userShare * 100).toFixed(4)}% of community pool`} color="#00C8B4" />
      </div>

      {/* 50/50 Visualization */}
      <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Revenue Flow</h2>
      <div className="rounded-2xl border border-border p-6 mb-7" style={{ background: 'var(--color-card)' }}>
        <div className="flex items-center gap-4 mb-4 text-[.82rem]">
          <span className="text-txt font-bold">Every trade → 0.3% fee →</span>
        </div>
        <div className="flex rounded-xl overflow-hidden h-12 mb-4">
          <div className="flex-1 flex items-center justify-center text-[.82rem] font-bold text-night"
            style={{ background: '#1DCC8A' }}>
            🍋 Community — 50%
          </div>
          <div className="flex-1 flex items-center justify-center text-[.82rem] font-bold text-white"
            style={{ background: '#FF5C4D' }}>
            🏗️ Platform — 50%
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-[.76rem]">
          <div>
            <div className="text-up font-bold mb-1">Community Pool receives:</div>
            <ul className="text-txt-2 list-none flex flex-col gap-1">
              <li>→ Distributed to $LIMER stakers</li>
              <li>→ Proportional to your LP / total LP</li>
              <li>→ Claimable on-chain (Phase 3)</li>
            </ul>
          </div>
          <div>
            <div className="text-coral font-bold mb-1">Platform Pool funds:</div>
            <ul className="text-txt-2 list-none flex flex-col gap-1">
              <li>→ Development & engineering</li>
              <li>→ Regulatory compliance</li>
              <li>→ Marketing & partnerships</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Revenue by Source */}
      <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Revenue by Source</h2>
      <div className="rounded-2xl border border-border p-6 mb-7" style={{ background: 'var(--color-card)' }}>
        {REVENUE_STREAMS.map(r => (
          <div key={r.source} className="flex items-center gap-3 mb-3 last:mb-0">
            <span className="text-lg w-8 text-center">{r.icon}</span>
            <span className="flex-1 text-[.82rem] text-txt">{r.source}</span>
            <div className="w-40 h-2.5 bg-night-3 rounded-full overflow-hidden">
              <div className="h-full bg-sea rounded-full" style={{ width: `${r.pct}%` }} />
            </div>
            <span className="text-[.82rem] font-bold text-sea w-10 text-right">{r.pct}%</span>
          </div>
        ))}
      </div>

      {/* Growth Simulator */}
      <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Growth Simulator</h2>
      <div className="rounded-2xl border border-border p-6 mb-7" style={{ background: 'var(--color-card)' }}>
        <div className="mb-4">
          <div className="flex justify-between text-[.78rem] mb-2">
            <span className="text-muted">Daily Active Users</span>
            <span className="text-sea font-bold">{dauSlider.toLocaleString()} DAU</span>
          </div>
          <input type="range" min={100} max={50000} step={100} value={dauSlider}
            onChange={e => setDauSlider(Number(e.target.value))}
            className="w-full accent-[#00C8B4]" />
          <div className="flex justify-between text-[.6rem] text-muted mt-1">
            <span>100</span><span>10K</span><span>25K</span><span>50K</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Daily Trades" value={projectedDailyTrades.toLocaleString()} />
          <MiniStat label="Daily Volume" value={fmtUSD(dailyVolume)} />
          <MiniStat label="Annual Fees" value={fmtUSD(annualFees)} />
          <MiniStat label="Community Annual" value={fmtUSD(communityAnnual)} color="#1DCC8A" />
        </div>

        <div className="mt-4 p-4 rounded-xl bg-up/5 border border-up/20 text-[.78rem]">
          <span className="text-up font-bold">Your projected annual yield: </span>
          <span className="text-txt">{fmtUSD(communityAnnual * userShare)}</span>
          <span className="text-muted"> (based on your {(userShare * 100).toFixed(4)}% share of community pool)</span>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-sea/30 p-8 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(0,200,180,.04), rgba(45,155,86,.04))' }}>
        <h3 className="font-sans font-bold text-[1.1rem] text-txt mb-2">Grow Your Share</h3>
        <p className="text-[.82rem] text-txt-2 mb-5 max-w-lg mx-auto">The more LP you earn now, the larger your share of the community pool. Trade, learn, and refer to maximize your allocation.</p>
        <button onClick={() => setActiveTab('points')}
          className="px-6 py-3 rounded-xl bg-sea text-night font-sans font-bold text-[.88rem] cursor-pointer border-none transition-all hover:brightness-90">
          View Your LP Dashboard
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="rounded-[14px] p-5 border border-border" style={{ background: 'var(--color-card)' }}>
      <div className="text-[.66rem] text-muted uppercase tracking-widest mb-2">{label}</div>
      <div className="font-serif text-[1.5rem] font-black" style={{ color }}>{value}</div>
      {sub && <div className="text-[.65rem] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="bg-black/20 rounded-xl p-3 text-center">
      <div className="text-[.6rem] text-muted uppercase tracking-widest">{label}</div>
      <div className="font-sans font-bold text-[1rem]" style={{ color: color || 'var(--color-txt)' }}>{value}</div>
    </div>
  );
}
