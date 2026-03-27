import useStore from '../store/useStore';
import { TOKEN, DISTRIBUTION, STAKING_TIERS, REVENUE_STREAMS, REVENUE_DISTRIBUTION, PREMIUM_BENEFITS, GOVERNANCE_ROADMAP, VALUE_PROPS } from '../data/tokenomics';

const fmtNum = n => n.toLocaleString('en-US');

export default function TokenomicsPage() {
  const setActiveTab = useStore(s => s.setActiveTab);
  const allBreakdown = [...DISTRIBUTION.community.breakdown, ...DISTRIBUTION.platform.breakdown];

  return (
    <div>
      {/* Hero */}
      <div className="rounded-xl p-9 mb-7 border border-sea/20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.06), rgba(45,155,86,.03))' }}>
        <div className="absolute right-4 bottom-[-20px] text-[120px] opacity-10 pointer-events-none select-none">🍋</div>
        <div className="inline-block bg-sea/12 border border-sea/30 rounded-full text-[.68rem] text-sea px-3 py-0.5 tracking-widest uppercase mb-3">
          Token Economics
        </div>
        <h1 className="font-headline text-[2.6rem] font-black leading-[1.05] text-txt mb-3">
          <span className="text-[#2D9B56]">{TOKEN.symbol}</span> — The Caribbean DeFi Token
        </h1>
        <p className="font-body text-txt-2 text-[.82rem] leading-relaxed max-w-2xl">
          {TOKEN.symbol} powers Limer's Capital. Holders earn 50% of all platform revenue, get trading fee discounts, and govern the protocol. Built on {TOKEN.chain}.
        </p>
        <div className="flex gap-4 mt-5 flex-wrap">
          <Stat label="Total Supply" value={fmtNum(TOKEN.totalSupply)} />
          <Stat label="Chain" value={TOKEN.chain} />
          <Stat label="Community Share" value="50%" color="#00ffa3" />
          <Stat label="Current Phase" value="LP Accumulation" color="#FFCA3A" />
        </div>
      </div>

      {/* 50/50 Distribution */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Token Distribution — 50/50 Split</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
        {[DISTRIBUTION.community, DISTRIBUTION.platform].map(side => (
          <div key={side.label} className="rounded-xl border border-border p-6" style={{ background: 'var(--color-card)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: side.color }} />
              <h3 className="font-body font-bold text-[1rem]" style={{ color: side.color }}>{side.label} — {side.pct}%</h3>
            </div>
            {/* Bar */}
            <div className="flex rounded-lg overflow-hidden h-6 mb-4">
              {side.breakdown.map(b => (
                <div key={b.label} style={{ width: `${(b.pct / side.pct) * 100}%`, background: b.color, minWidth: '4px' }}
                  title={`${b.label}: ${b.pct}%`} />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {side.breakdown.map(b => (
                <div key={b.label} className="flex items-center justify-between text-[.78rem]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                    <span className="text-txt">{b.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted">{fmtNum(b.tokens)} tokens</span>
                    <span className="font-bold text-txt">{b.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Streams */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Revenue Streams — Real Yield Model</h2>
      <p className="text-[.78rem] text-txt-2 mb-4 leading-relaxed max-w-3xl">All protocol revenue is collected in <span className="text-sea font-bold">USDC</span> and <span className="text-[#9945FF] font-bold">SOL</span> — never in $LIMER. This eliminates sell pressure and ensures holders earn real purchasing power.</p>
      <div className="rounded-xl border border-border p-6 mb-5" style={{ background: 'var(--color-card)' }}>
        <div className="flex flex-col gap-3.5">
          {REVENUE_STREAMS.map(r => (
            <div key={r.source}>
              <div className="flex items-center gap-3">
                <span className="text-lg w-8 text-center">{r.icon}</span>
                <span className="flex-1 text-[.82rem] text-txt">{r.source}</span>
                <span className="text-[.62rem] text-muted px-2 py-0.5 rounded border border-border">{r.collected}</span>
                <div className="w-36 h-2.5 bg-night-3 rounded-full overflow-hidden">
                  <div className="h-full bg-sea rounded-full transition-all" style={{ width: `${r.pct * 3.3}%` }} />
                </div>
                <span className="text-[.82rem] font-bold text-sea w-10 text-right">{r.pct}%</span>
              </div>
              <div className="ml-11 text-[.66rem] text-muted mt-0.5">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Distribution Flow */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Revenue Distribution — dNFT Yield Engine</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {[REVENUE_DISTRIBUTION.community, REVENUE_DISTRIBUTION.platform].map(side => (
          <div key={side.label} className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ background: side.color }} />
              <span className="font-body font-bold text-[.92rem]" style={{ color: side.color }}>{side.pct}% — {side.label}</span>
            </div>
            <div className="text-[.74rem] text-txt-2 leading-relaxed mb-3">{side.desc}</div>
            <div className="flex items-center gap-2">
              <span className="text-[.62rem] text-muted">Paid in:</span>
              <span className="text-[.68rem] font-mono font-bold text-sea">{side.distributed}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-sea/20 p-5 mb-7" style={{ background: 'rgba(0,255,163,.03)' }}>
        <div className="text-[.68rem] text-muted uppercase tracking-widest mb-2">Why Stablecoins + SOL?</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[.76rem]">
          <div><span className="text-sea font-bold">USDC (70%)</span><span className="text-txt-2"> — Real yield with actual purchasing power. No circular token emissions. Sustainable income.</span></div>
          <div><span className="text-[#9945FF] font-bold">SOL (30%)</span><span className="text-txt-2"> — Aligns holders with Solana. Independent value, gas utility, and ecosystem staking.</span></div>
          <div><span className="text-[#FF4D6D] font-bold">Never $LIMER</span><span className="text-txt-2"> — Distributing in your own token creates sell pressure and inflation. $LIMER appreciates from demand, not printing.</span></div>
        </div>
      </div>

      {/* Premium Tier Benefits */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Premium Tier — Wam + ViFi + More</h2>
      <p className="text-[.78rem] text-txt-2 mb-4 leading-relaxed max-w-3xl">Premium holders unlock access to partner ecosystems and exclusive yield sources. As the platform grows, so do the benefits — this is <span className="text-sea font-bold">Universal Basic Ownership</span> in action.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-7">
        {PREMIUM_BENEFITS.map(b => (
          <div key={b.title} className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
            <div className="text-2xl mb-2">{b.icon}</div>
            <div className="font-body font-bold text-[.84rem] text-txt mb-1">{b.title}</div>
            <div className="text-[.72rem] text-txt-2 leading-relaxed">{b.desc}</div>
          </div>
        ))}
      </div>

      {/* Staking Tiers */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Staking Tiers</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-7">
        {STAKING_TIERS.map(t => (
          <div key={t.name} className="rounded-xl border border-border p-5 text-center" style={{ background: 'var(--color-card)' }}>
            <div className="text-3xl mb-2">{t.icon}</div>
            <div className="font-body font-bold text-[1rem] mb-1" style={{ color: t.color }}>{t.name}</div>
            <div className="text-[.7rem] text-muted mb-3">Min: {fmtNum(t.min)} $LIMER</div>
            <div className="text-[.78rem] text-txt mb-1">Fee Discount: <span className="text-up font-bold">{t.feeDiscount}%</span></div>
            <div className="text-[.78rem] text-txt mb-1">APY: <span className="text-sea font-bold">{t.apyRange}</span></div>
            <div className="text-[.68rem] text-muted">{t.governance ? '🗳️ Governance' : 'No governance'}</div>
          </div>
        ))}
      </div>

      {/* Governance Roadmap */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Governance Roadmap</h2>
      <div className="flex flex-col gap-3 mb-7">
        {GOVERNANCE_ROADMAP.map((g, i) => (
          <div key={g.phase} className={`rounded-xl border p-5 flex items-start gap-4
            ${g.status === 'active' ? 'border-sea/40 bg-sea/5' : 'border-border'}`}
            style={g.status !== 'active' ? { background: 'var(--color-card)' } : undefined}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[.75rem] font-bold flex-shrink-0
              ${g.status === 'active' ? 'bg-sea text-night' : g.status === 'upcoming' ? 'bg-sun/20 text-sun' : 'bg-night-3 text-muted'}`}>
              {i + 1}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-body font-bold text-[.88rem] text-txt">{g.title}</span>
                <span className={`text-[.6rem] px-2 py-0.5 rounded-full
                  ${g.status === 'active' ? 'bg-sea/15 text-sea' : g.status === 'upcoming' ? 'bg-sun/15 text-sun' : 'bg-muted/10 text-muted'}`}>
                  {g.status}
                </span>
              </div>
              <p className="text-[.76rem] text-txt-2 leading-relaxed">{g.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Value Props */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Why Hold {TOKEN.symbol}?</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-7">
        {VALUE_PROPS.map(v => (
          <div key={v.title} className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
            <div className="text-2xl mb-2">{v.icon}</div>
            <div className="font-body font-bold text-[.84rem] text-txt mb-1">{v.title}</div>
            <div className="text-[.72rem] text-txt-2 leading-relaxed">{v.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-sea/30 p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.06), rgba(45,155,86,.03))' }}>
        <div className="text-3xl mb-3">🍋</div>
        <h3 className="font-body font-bold text-[1.2rem] text-txt mb-2">Start Earning Limer Points Today</h3>
        <p className="text-[.82rem] text-txt-2 mb-5 max-w-lg mx-auto">Every lesson you complete, every trade you make, and every friend you refer earns LP — which maps directly to your future {TOKEN.symbol} airdrop allocation.</p>
        <button onClick={() => setActiveTab('learn')}
          className="px-6 py-3 rounded-xl bg-sea text-night font-body font-bold text-[.88rem] cursor-pointer border-none transition-all hover:brightness-90">
          Start Learning → Earn LP
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-black/20 border border-border rounded-xl px-4 py-2.5">
      <div className="text-[.6rem] text-muted uppercase tracking-widest">{label}</div>
      <div className="font-body font-bold text-[1.1rem]" style={{ color: color || 'var(--color-txt)' }}>{value}</div>
    </div>
  );
}
