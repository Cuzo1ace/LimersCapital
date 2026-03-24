import { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { estimateImpermanentLoss, calculateFeeAPR } from '../api/lp-pools';
import LPArmyPartnership from '../components/defi/LPArmyPartnership';

export default function FlywheelPage() {
  const { markFlywheelViewed, viewedFlywheel } = useStore();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      markFlywheelViewed();
    }
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="font-headline text-2xl md:text-3xl font-bold text-txt mb-2">
          The Solana LP Flywheel
        </h1>
        <p className="text-[.85rem] text-txt-2 max-w-lg mx-auto">
          How providing liquidity creates a self-sustaining ecosystem — and why Solana is the best chain to do it on
        </p>
      </div>

      {/* Flywheel Diagram */}
      <FlywheelDiagram />

      {/* Why Solana Cards */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4 mt-10">
        Why Solana for LP?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-10">
        <WhyCard icon="⚡" title="Sub-Second Finality" desc="Rebalance LP positions instantly. No waiting for confirmations — your strategy executes in real-time." />
        <WhyCard icon="💸" title="Sub-Cent Fees" desc="$0.00025 per transaction means more volume and more of your yield stays as profit, not gas costs." />
        <WhyCard icon="🔄" title="Jupiter Aggregation" desc="Deep DEX aggregation ensures all liquidity gets utilized. Consistent volume for every pool in the ecosystem." />
        <WhyCard icon="☄️" title="Meteora Innovation" desc="DLMM bins offer zero-slippage trading and flexible strategies. The most capital-efficient LP on any chain." />
      </div>

      {/* IL vs Fees Calculator */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">
        IL vs Fees Calculator
      </h2>
      <ILCalculator />

      {/* Ecosystem Stats */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4 mt-10">
        Live Ecosystem
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-10">
        <StatBox label="Solana TVL" value="$8.2B+" sub="DeFiLlama" />
        <StatBox label="Meteora TVL" value="$1.5B+" sub="DLMM + DAMM" />
        <StatBox label="Daily Volume" value="$2B+" sub="Jupiter routed" />
        <StatBox label="LP Army" value="22K+" sub="Community members" />
      </div>

      {/* LP Army Partnership */}
      <LPArmyPartnership context="flywheel" />
    </div>
  );
}

function FlywheelDiagram() {
  const steps = [
    { icon: '💧', label: 'LPs Provide\nLiquidity', color: '#00d4ff' },
    { icon: '🌊', label: 'Deeper\nPools', color: '#00ffa3' },
    { icon: '📉', label: 'Less\nSlippage', color: '#2D9B56' },
    { icon: '📈', label: 'More\nTraders', color: '#FFCA3A' },
    { icon: '💰', label: 'More\nVolume & Fees', color: '#bf81ff' },
    { icon: '🔄', label: 'Attracts\nMore LPs', color: '#ff6b6b' },
  ];

  return (
    <div className="rounded-xl border border-border p-6 md:p-10 mb-7" style={{ background: 'var(--color-card)' }}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 border-2"
              style={{ borderColor: step.color, background: `${step.color}10` }}>
              {step.icon}
            </div>
            <div className="text-[.72rem] font-body font-bold text-txt whitespace-pre-line">{step.label}</div>
            {i < steps.length - 1 && (
              <div className="hidden lg:block text-muted text-xl mt-1">→</div>
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-5 text-[.75rem] text-sea font-mono">
        ↻ Self-reinforcing cycle — each rotation strengthens the ecosystem
      </div>
    </div>
  );
}

function WhyCard({ icon, title, desc }) {
  return (
    <div className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-body font-bold text-[.84rem] text-txt mb-1">{title}</div>
      <div className="text-[.72rem] text-txt-2 leading-relaxed">{desc}</div>
    </div>
  );
}

function StatBox({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-border p-4 text-center" style={{ background: 'var(--color-card)' }}>
      <div className="text-[.65rem] text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="font-mono font-bold text-lg text-sea">{value}</div>
      <div className="text-[.6rem] text-muted">{sub}</div>
    </div>
  );
}

function ILCalculator() {
  const [deposit, setDeposit] = useState(1000);
  const [apr, setApr] = useState(50);
  const [priceChange, setPriceChange] = useState(20);

  const ratio = 1 + priceChange / 100;
  const il = estimateImpermanentLoss(ratio, 1);

  const calc = (days) => {
    const feesEarned = deposit * (apr / 100) * (days / 365);
    const ilCost = deposit * il;
    return { fees: feesEarned, il: ilCost, net: feesEarned - ilCost };
  };

  const periods = [
    { label: '30 days', ...calc(30) },
    { label: '90 days', ...calc(90) },
    { label: '180 days', ...calc(180) },
  ];

  return (
    <div className="rounded-xl border border-border p-5 mb-7" style={{ background: 'var(--color-card)' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="text-[.68rem] text-muted block mb-1 font-mono">Deposit (USD)</label>
          <input type="number" value={deposit} onChange={e => setDeposit(Number(e.target.value))}
            className="w-full rounded-lg bg-black/30 border border-border px-3 py-2 text-[.82rem] text-txt font-mono focus:border-sea/50 outline-none" />
        </div>
        <div>
          <label className="text-[.68rem] text-muted block mb-1 font-mono">Estimated APR (%)</label>
          <input type="number" value={apr} onChange={e => setApr(Number(e.target.value))}
            className="w-full rounded-lg bg-black/30 border border-border px-3 py-2 text-[.82rem] text-txt font-mono focus:border-sea/50 outline-none" />
        </div>
        <div>
          <label className="text-[.68rem] text-muted block mb-1 font-mono">Price Change (%)</label>
          <input type="number" value={priceChange} onChange={e => setPriceChange(Number(e.target.value))}
            className="w-full rounded-lg bg-black/30 border border-border px-3 py-2 text-[.82rem] text-txt font-mono focus:border-sea/50 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {periods.map(p => (
          <div key={p.label} className="rounded-lg bg-black/20 border border-border p-4 text-center">
            <div className="text-[.65rem] text-muted uppercase mb-2">{p.label}</div>
            <div className="text-[.7rem] text-up font-mono mb-0.5">Fees: +${p.fees.toFixed(0)}</div>
            <div className="text-[.7rem] text-coral font-mono mb-0.5">IL: -${p.il.toFixed(0)}</div>
            <div className={`text-[.85rem] font-mono font-bold ${p.net >= 0 ? 'text-up' : 'text-coral'}`}>
              Net: {p.net >= 0 ? '+' : ''}${p.net.toFixed(0)}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[.6rem] text-muted text-center mt-3">
        * Simplified estimate. Actual returns depend on pool volume, price path, rebalancing frequency, and concentration factor.
      </div>
    </div>
  );
}
