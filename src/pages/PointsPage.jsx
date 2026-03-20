import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { getTier } from '../data/gamification';
import { LP_ACTIONS, generateLeaderboard, AIRDROP_POOL, SIMULATED_TOTAL_LP } from '../data/lp';

const fmtNum = n => n.toLocaleString('en-US');

export default function PointsPage() {
  const { limerPoints, lpHistory, lpMultiplier, xp, referralCode, generateReferralCode, setActiveTab } = useStore();
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (!referralCode) generateReferralCode(); }, []);
  const tier = getTier(xp);
  const leaderboard = generateLeaderboard(limerPoints);
  const userRank = leaderboard.find(u => u.isUser)?.rank || '—';
  const projectedAirdrop = (limerPoints / (SIMULATED_TOTAL_LP + limerPoints)) * AIRDROP_POOL;

  const refLink = `https://limerscapital.com/ref/${referralCode || '...'}`;

  function copyLink() {
    const code = referralCode || generateReferralCode();
    const link = `https://limerscapital.com/ref/${code}`;
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function shareOnX() {
    const code = referralCode || generateReferralCode();
    const text = encodeURIComponent(
      `Join me on Limer's Capital — the Caribbean crypto + investment platform on Solana 🌴🍋\nEarn LP points → $LIMER airdrop. Use my link:\nhttps://limerscapital.com/ref/${code}\n#Solana #Caribbean #DeFi`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-7">
        <StatCard icon="🍋" label="Limer Points" value={fmtNum(limerPoints)} color="#2D9B56" />
        <StatCard icon="🏆" label="Your Rank" value={`#${userRank}`} sub={`of ${leaderboard.length}`} color="#FFCA3A" />
        <StatCard icon={tier.icon} label="LP Multiplier" value={`${lpMultiplier}x`} sub={tier.name} color={tier.color} />
        <StatCard icon="🪂" label="Projected Airdrop" value={`${fmtNum(Math.floor(projectedAirdrop))} $LIMER`} sub="Based on current LP" color="#00C8B4" />
      </div>

      {/* LP vs XP */}
      <div className="rounded-2xl border border-border p-6 mb-7 grid grid-cols-1 md:grid-cols-2 gap-6" style={{ background: 'var(--color-card)' }}>
        <div>
          <h3 className="font-sans font-bold text-[.88rem] text-sea mb-2">⚡ XP — Learning Progress</h3>
          <p className="text-[.76rem] text-txt-2 leading-relaxed">XP tracks your educational journey. It unlocks tiers, badges, and platform features. XP is capped by the tier system (max: Limer Legend at 3,500 XP).</p>
        </div>
        <div>
          <h3 className="font-sans font-bold text-[.88rem] text-[#2D9B56] mb-2">🍋 LP — Economic Value</h3>
          <p className="text-[.76rem] text-txt-2 leading-relaxed">Limer Points measure your total platform contribution. LP is uncapped and maps 1:1 to your future $LIMER airdrop allocation. More LP = more tokens.</p>
        </div>
      </div>

      {/* How to Earn */}
      <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">How to Earn LP</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-7">
        {LP_ACTIONS.map(a => (
          <div key={a.action} className="rounded-xl border border-border p-4 flex items-start gap-3" style={{ background: 'var(--color-card)' }}>
            <span className="text-lg">{a.icon}</span>
            <div className="flex-1">
              <div className="text-[.78rem] text-txt font-bold">{a.action}</div>
              <div className="text-[.7rem] text-[#2D9B56] font-bold">+{a.lp} LP {a.multiplied && <span className="text-muted font-normal">× {lpMultiplier}x</span>}</div>
              {a.note && <div className="text-[.6rem] text-muted mt-0.5">{a.note}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Referral */}
      <div className="rounded-2xl border border-sea/20 p-6 mb-7 flex items-center gap-5 flex-wrap"
        style={{ background: 'linear-gradient(135deg, rgba(0,200,180,.04), rgba(45,155,86,.04))' }}>
        <div className="text-3xl">🤝</div>
        <div className="flex-1 min-w-[200px]">
          <div className="font-sans font-bold text-[.92rem] text-txt mb-1">Refer Friends — Earn 200 LP Each</div>
          <div className="text-[.75rem] text-txt-2">Share your referral code. When someone connects their wallet, you both earn 200 LP.</div>
        </div>
        <div className="flex flex-col gap-2 min-w-[240px]">
          <div className="bg-black/30 border border-border rounded-lg px-3 py-2 font-mono text-[.72rem] text-sea truncate">
            {refLink}
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink}
              className="flex-1 px-3 py-2 rounded-lg text-[.73rem] font-mono cursor-pointer border border-sea/30 bg-sea/8 text-sea transition-all hover:bg-sea/15">
              {copied ? '✓ Copied!' : '⎘ Copy Link'}
            </button>
            <button onClick={shareOnX}
              className="flex-1 px-3 py-2 rounded-lg text-[.73rem] font-mono font-bold cursor-pointer border-none transition-all hover:opacity-90"
              style={{ background: '#00C8B4', color: '#0A1628' }}>
              𝕏 Share
            </button>
          </div>
        </div>
      </div>

      {/* LP History */}
      <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Recent LP Activity</h2>
      <div className="rounded-2xl border border-border overflow-hidden mb-7" style={{ background: 'var(--color-card)' }}>
        {lpHistory.length === 0 ? (
          <div className="p-8 text-center text-muted text-[.82rem]">
            No LP earned yet. <button onClick={() => setActiveTab('learn')} className="text-sea underline bg-transparent border-none cursor-pointer font-mono">Start learning</button> to earn your first points!
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {lpHistory.slice(0, 50).map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-2.5 border-b border-border last:border-b-0 text-[.76rem]">
                <span className="text-txt-2">{entry.reason}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#2D9B56] font-bold">+{entry.amount} LP</span>
                  <span className="text-muted text-[.65rem]">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Community Leaderboard</h2>
      <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'var(--color-card)' }}>
        <div className="grid grid-cols-[50px_1fr_100px] px-5 py-2 border-b border-border text-[.65rem] text-muted uppercase tracking-widest">
          <span>Rank</span><span>User</span><span className="text-right">LP</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {leaderboard.slice(0, 25).map(u => (
            <div key={u.name}
              className={`grid grid-cols-[50px_1fr_100px] px-5 py-2.5 border-b border-border last:border-b-0 text-[.78rem]
                ${u.isUser ? 'bg-sea/8 border-l-2 border-l-sea' : ''}`}>
              <span className={`font-bold ${u.rank <= 3 ? 'text-sun' : 'text-muted'}`}>
                {u.rank <= 3 ? ['🥇','🥈','🥉'][u.rank-1] : `#${u.rank}`}
              </span>
              <span className={u.isUser ? 'text-sea font-bold' : 'text-txt'}>{u.name} {u.isUser && '(You)'}</span>
              <span className="text-right text-[#2D9B56] font-bold">{fmtNum(u.lp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="rounded-[14px] p-5 border border-border" style={{ background: 'var(--color-card)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[.66rem] text-muted uppercase tracking-widest">{label}</span>
      </div>
      <div className="font-serif text-[1.4rem] font-black" style={{ color }}>{value}</div>
      {sub && <div className="text-[.68rem] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
