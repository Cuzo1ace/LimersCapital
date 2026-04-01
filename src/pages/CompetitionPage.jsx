import { useState, useMemo, useEffect } from 'react';
import useStore from '../store/useStore';
import { COMPETITION, PRIZES, calcCompetitionScore, getCompetitionStatus, generateCompetitionLeaderboard } from '../data/competition';

const fmtNum = n => n.toLocaleString('en-US');
const fmtPct = n => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
const fmtUSD = n => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function CompetitionPage() {
  const {
    competitionRegistered, registerForCompetition, competitionStats,
    trades, perpPositions, perpTotalPnl, balanceUSD, setActiveTab,
  } = useStore();
  const [tab, setTab] = useState('leaderboard');
  const [now, setNow] = useState(new Date());

  // Tick the countdown every second
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const status = getCompetitionStatus(now);

  // Derive user stats for leaderboard
  const userStats = useMemo(() => {
    const cs = competitionStats;
    return {
      pnlPct: cs.pnlPct,
      trades: cs.trades,
      wins: cs.wins,
      maxDrawdown: cs.maxDrawdown,
      dailyReturns: cs.dailyReturns,
    };
  }, [competitionStats]);

  const leaderboard = useMemo(() => generateCompetitionLeaderboard(userStats), [userStats]);
  const userEntry = leaderboard.find(e => e.isUser);
  const userScore = userEntry?.score || 0;
  const userRank = userEntry?.rank || '—';

  const TABS = [
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'prizes', label: 'Prizes', icon: '🎁' },
    { id: 'rules', label: 'Rules', icon: '📋' },
    { id: 'stats', label: 'Your Stats', icon: '📊' },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <div className="rounded-xl border border-border overflow-hidden mb-5"
        style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.06) 0%, rgba(153,69,255,.06) 100%)' }}>
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏆</span>
                <h1 className="font-headline text-xl md:text-2xl font-bold text-txt">{COMPETITION.name}</h1>
              </div>
              <p className="text-[.82rem] text-txt-2 max-w-xl">{COMPETITION.tagline}</p>
              <div className="flex items-center gap-3 mt-3 text-[.7rem] font-mono text-muted">
                <span>{new Date(COMPETITION.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(COMPETITION.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="h-3 w-px bg-border" />
                <span>Paper Trading · ${fmtNum(COMPETITION.initialBalance)} Start</span>
              </div>
            </div>

            {/* Status Badge + Countdown */}
            <div className="text-right">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[.72rem] font-bold font-mono
                ${status.status === 'live' ? 'bg-up/15 text-up' : status.status === 'upcoming' ? 'bg-sun/15 text-sun' : 'bg-muted/15 text-muted'}`}>
                {status.status === 'live' && <span className="w-2 h-2 rounded-full bg-up animate-pulse" />}
                {status.label}
              </div>
              <div className="text-2xl md:text-3xl font-mono font-bold text-txt mt-2">{status.countdown}</div>
              {status.progress != null && (
                <div className="w-full max-w-[200px] h-1.5 bg-border rounded-full mt-2 overflow-hidden ml-auto">
                  <div className="h-full bg-up rounded-full transition-all" style={{ width: `${status.progress * 100}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          <CompStatCard label="Your Rank" value={competitionRegistered ? `#${userRank}` : '—'} sub={`of ${leaderboard.length}`} color="#FFD700" />
          <CompStatCard label="Score" value={competitionRegistered ? userScore : '—'} sub="of 100" color="#00ffa3" />
          <CompStatCard label="P&L" value={competitionRegistered ? fmtPct(userStats.pnlPct) : '—'} sub="return" color={userStats.pnlPct >= 0 ? '#00ffa3' : '#FF6B6B'} />
          <CompStatCard label="Trades" value={competitionRegistered ? userStats.trades : '—'} sub={`${userStats.wins} wins`} color="#9945FF" />
        </div>
      </div>

      {/* Register CTA */}
      {!competitionRegistered && (
        <div className="rounded-xl border border-sea/30 bg-sea/5 p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="font-body font-bold text-[.92rem] text-txt">Ready to compete?</div>
            <div className="text-[.75rem] text-txt-2 mt-0.5">Register to join Season 1. Your paper trades and perp positions will count toward your score.</div>
          </div>
          <button onClick={registerForCompetition}
            className="px-6 py-3 rounded-lg bg-up text-night font-bold text-[.82rem] cursor-pointer hover:brightness-110 transition-all border-none">
            Register for Season 1
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[.76rem] font-mono font-bold cursor-pointer transition-all border-b-2 bg-transparent
              ${tab === t.id ? 'border-up text-txt' : 'border-transparent text-muted hover:text-txt'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'leaderboard' && <LeaderboardTab leaderboard={leaderboard} />}
      {tab === 'prizes' && <PrizesTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'stats' && <StatsTab stats={competitionStats} registered={competitionRegistered} setActiveTab={setActiveTab} />}
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────── */
function CompStatCard({ label, value, sub, color }) {
  return (
    <div className="p-4" style={{ background: 'var(--color-card)' }}>
      <div className="text-[.62rem] text-muted uppercase font-mono tracking-wider mb-1">{label}</div>
      <div className="text-lg font-mono font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[.62rem] text-muted">{sub}</div>}
    </div>
  );
}

/* ── Leaderboard ───────────────────────────────────────────── */
function LeaderboardTab({ leaderboard }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-card)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-[.74rem]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-mono text-muted font-normal">#</th>
              <th className="px-4 py-3 font-mono text-muted font-normal">Trader</th>
              <th className="px-4 py-3 font-mono text-muted font-normal text-right">P&L %</th>
              <th className="px-4 py-3 font-mono text-muted font-normal text-right hidden md:table-cell">Win Rate</th>
              <th className="px-4 py-3 font-mono text-muted font-normal text-right hidden md:table-cell">Max DD</th>
              <th className="px-4 py-3 font-mono text-muted font-normal text-right hidden sm:table-cell">Trades</th>
              <th className="px-4 py-3 font-mono text-muted font-normal text-right">Score</th>
              <th className="px-4 py-3 font-mono text-muted font-normal hidden lg:table-cell">Style</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map(entry => (
              <tr key={entry.name}
                className={`border-b border-border/50 transition-colors
                  ${entry.isUser ? 'bg-up/5' : 'hover:bg-white/[.02]'}
                  ${entry.rank <= 3 ? 'font-bold' : ''}`}>
                <td className="px-4 py-3 font-mono">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-body font-bold ${entry.isUser ? 'text-up' : 'text-txt'}`}>
                    {entry.name}
                  </span>
                  {entry.isUser && <span className="ml-1.5 text-[.58rem] px-1.5 py-0.5 rounded bg-up/15 text-up font-mono">YOU</span>}
                </td>
                <td className={`px-4 py-3 font-mono text-right ${entry.pnlPct >= 0 ? 'text-up' : 'text-coral'}`}>
                  {fmtPct(entry.pnlPct)}
                </td>
                <td className="px-4 py-3 font-mono text-right text-txt hidden md:table-cell">
                  {(entry.winRate * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 font-mono text-right text-coral hidden md:table-cell">
                  -{entry.maxDrawdown.toFixed(1)}%
                </td>
                <td className="px-4 py-3 font-mono text-right text-txt hidden sm:table-cell">
                  {entry.trades}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[.7rem]
                    ${entry.score >= 70 ? 'bg-up/10 text-up' : entry.score >= 40 ? 'bg-sun/10 text-sun' : 'bg-coral/10 text-coral'}`}>
                    {entry.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-[.65rem] text-muted hidden lg:table-cell">{entry.style}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Prizes ────────────────────────────────────────────────── */
function PrizesTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {PRIZES.map((p, i) => (
        <div key={i} className="rounded-xl border border-border p-5 transition-all hover:border-[var(--prize-color)]/30"
          style={{ background: 'var(--color-card)', '--prize-color': p.color }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{p.icon}</span>
            <div>
              <div className="font-body font-bold text-[.92rem]" style={{ color: p.color }}>{p.rank}</div>
              <div className="text-[.76rem] text-txt">{p.prize}</div>
            </div>
          </div>
          {i < 3 && (
            <div className="text-[.65rem] text-muted leading-relaxed">
              Includes a dynamic NFT (dNFT) that evolves based on your trading stats — a permanent on-chain trophy.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Rules ─────────────────────────────────────────────────── */
function RulesTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="rounded-xl border border-border p-6" style={{ background: 'var(--color-card)' }}>
        <h3 className="font-body font-bold text-[.92rem] text-txt mb-4">Competition Rules</h3>
        <ul className="space-y-3">
          {COMPETITION.rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[.76rem] text-txt-2">
              <span className="text-up font-mono text-[.68rem] mt-0.5">{String(i + 1).padStart(2, '0')}</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border p-6" style={{ background: 'var(--color-card)' }}>
        <h3 className="font-body font-bold text-[.92rem] text-txt mb-4">Scoring Breakdown</h3>
        <div className="space-y-3">
          {[
            { label: 'P&L Return', pct: 40, desc: '% return on starting $100K balance', color: '#00ffa3' },
            { label: 'Win Rate', pct: 20, desc: 'Profitable trades out of total', color: '#FFCA3A' },
            { label: 'Risk Management', pct: 20, desc: 'Lower max drawdown = higher score', color: '#FF6B6B' },
            { label: 'Consistency', pct: 10, desc: 'Sharpe-like: return / volatility', color: '#9945FF' },
            { label: 'Activity', pct: 10, desc: 'Minimum 10 trades for full score', color: '#00C8B4' },
          ].map(w => (
            <div key={w.label} className="flex items-center gap-3">
              <div className="w-10 text-right font-mono font-bold text-[.78rem]" style={{ color: w.color }}>{w.pct}</div>
              <div className="flex-1">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${w.pct}%`, background: w.color }} />
                </div>
              </div>
              <div className="w-36">
                <div className="text-[.74rem] font-bold text-txt">{w.label}</div>
                <div className="text-[.6rem] text-muted">{w.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Your Stats ────────────────────────────────────────────── */
function StatsTab({ stats, registered, setActiveTab }) {
  if (!registered) {
    return (
      <div className="rounded-xl border border-border p-10 text-center" style={{ background: 'var(--color-card)' }}>
        <div className="text-4xl mb-3">📊</div>
        <div className="font-body font-bold text-txt mb-1">Register to see your stats</div>
        <div className="text-[.75rem] text-muted">Your trading performance will be tracked once you join the competition.</div>
      </div>
    );
  }

  const metrics = [
    { label: 'Starting Balance', value: fmtUSD(COMPETITION.initialBalance), color: '#9945FF' },
    { label: 'Current P&L', value: fmtPct(stats.pnlPct), color: stats.pnlPct >= 0 ? '#00ffa3' : '#FF6B6B' },
    { label: 'Total Trades', value: stats.trades, color: '#00C8B4' },
    { label: 'Winning Trades', value: stats.wins, color: '#00ffa3' },
    { label: 'Win Rate', value: stats.trades > 0 ? `${((stats.wins / stats.trades) * 100).toFixed(1)}%` : '—', color: '#FFCA3A' },
    { label: 'Max Drawdown', value: stats.maxDrawdown > 0 ? `-${stats.maxDrawdown.toFixed(1)}%` : '0%', color: '#FF6B6B' },
    { label: 'Competition Score', value: calcCompetitionScore(stats.pnlPct, stats.trades > 0 ? stats.wins / stats.trades : 0, stats.maxDrawdown, stats.dailyReturns, stats.trades), color: '#FFD700' },
    { label: 'Daily Returns Logged', value: stats.dailyReturns.length, color: '#9945FF' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {metrics.map(m => (
          <div key={m.label} className="rounded-xl border border-border p-4" style={{ background: 'var(--color-card)' }}>
            <div className="text-[.62rem] text-muted uppercase font-mono tracking-wider mb-1">{m.label}</div>
            <div className="text-lg font-mono font-bold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
        <h3 className="font-body font-bold text-[.88rem] text-txt mb-3">How to Improve Your Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[.76rem] text-txt-2">
          <div className="flex items-start gap-2">
            <span className="text-up">1.</span>
            <div><strong className="text-txt">Trade more</strong> — You need at least 10 trades for full Activity points.
              <button onClick={() => setActiveTab('trade')} className="text-sea ml-1 cursor-pointer bg-transparent border-none text-[.76rem] underline">Go to Trade</button>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-up">2.</span>
            <div><strong className="text-txt">Manage risk</strong> — Keep your max drawdown below 10% for top Risk Management score.</div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-up">3.</span>
            <div><strong className="text-txt">Be consistent</strong> — Steady daily gains beat one lucky trade. Consistency is 10% of your score.</div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-up">4.</span>
            <div><strong className="text-txt">Use perps wisely</strong> — Leveraged positions amplify returns but watch your liquidation price.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
