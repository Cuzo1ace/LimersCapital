import { useQuery } from '@tanstack/react-query';
import useStore from '../store/useStore';
import { getTier, getNextTier, TIERS } from '../data/gamification';
import { BADGES } from '../data/badges';
import { fetchTradePrices } from '../api/prices';
import { fmtUSD, fmtNum, fmtPct } from '../utils/format';
import GlowCard from '../components/ui/GlowCard';
import AchievementBadge from '../components/gamification/AchievementBadge';
import LiquidMetalButton from '../components/ui/LiquidMetalButton';
import GradientDots from '../components/ui/GradientDots';

export default function DashboardPage() {
  const {
    xp, limerPoints, currentStreak, longestStreak, trades, holdings,
    earnedBadges, modulesCompleted, walletConnected, walletAddress,
    lpHistory, setActiveTab, sessionCount, firstSessionDate,
    balanceUSD, balanceTTD, lpMultiplier, streakShields,
  } = useStore();

  const tier     = getTier(xp);
  const nextTier = getNextTier(xp);
  const xpProgress = nextTier
    ? Math.min(((xp - tier.xp) / (nextTier.xp - tier.xp)) * 100, 100)
    : 100;

  // LP earned this week
  const weekAgo = Date.now() - 7 * 86400000;
  const lpThisWeek = lpHistory
    .filter(e => new Date(e.timestamp).getTime() > weekAgo)
    .reduce((sum, e) => sum + e.amount, 0);

  // Market data
  const pricesQ = useQuery({
    queryKey: ['trade-prices'],
    queryFn: fetchTradePrices,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Top 4 movers by abs 24h change
  const topMovers = (pricesQ.data || [])
    .filter(t => t.change24h != null)
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 4);

  // Three most recently earned badges
  const recentBadgeData = earnedBadges
    .slice(-3)
    .map(id => BADGES.find(b => b.id === id))
    .filter(Boolean)
    .reverse();

  // Paper portfolio PnL estimate
  const paperPnL = holdings.reduce((sum, h) => {
    const current = pricesQ.data?.find(t => t.symbol === h.symbol);
    if (!current || h.market !== 'solana') return sum;
    return sum + (current.price - h.avgPrice) * h.qty;
  }, 0);

  // Next suggested action
  const nextAction = (() => {
    if (!walletConnected)
      return { icon: '🔗', title: 'Connect Your Wallet', desc: 'Unlock on-chain features and earn +50 LP.', cta: 'Connect', tab: null };
    if (modulesCompleted.length === 0)
      return { icon: '📚', title: 'Complete Module 1', desc: 'Finish Solana Basics to unlock trading features and earn 200 XP.', cta: 'Go Learn', tab: 'learn' };
    if (trades.length === 0)
      return { icon: '💹', title: 'Make Your First Trade', desc: 'Paper trade any Solana token risk-free. Earn your First Trade badge.', cta: 'Start Trading', tab: 'trade' };
    if (earnedBadges.length < 5)
      return { icon: '🎖️', title: 'Collect More Badges', desc: `You've earned ${earnedBadges.length}/25 badges. Keep learning and trading.`, cta: 'View Badges', tab: 'learn' };
    return { icon: '🏆', title: 'Check Your LP Rank', desc: `${fmtNum(limerPoints)} LP accumulated → $LIMER airdrop allocation.`, cta: 'View Points', tab: 'points' };
  })();

  return (
    <div>
      {/* ── Welcome Header ── */}
      <div className="rounded-xl p-6 md:p-8 mb-6 border border-border relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-night-2) 0%, rgba(0,255,163,.06) 100%)' }}>
        {/* Animated dot-grid background */}
        <GradientDots
          dotSize={6}
          spacing={14}
          duration={40}
          colorCycleDuration={10}
          backgroundColor="transparent"
          className="opacity-15 pointer-events-none rounded-xl"
        />
        {/* Decorative tier icon */}
        <div className="absolute right-6 top-4 text-[4rem] opacity-10 select-none pointer-events-none" aria-hidden="true">
          {tier.icon}
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <div className="text-[.66rem] text-muted uppercase tracking-widest mb-1 font-headline">Your Status</div>
            <h1 className="font-headline text-[2rem] font-black leading-tight" style={{ color: tier.color }}>
              {tier.icon} {tier.name}
            </h1>
            <div className="text-[.73rem] text-txt-2 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              {currentStreak > 0 && <span>🔥 {currentStreak}-day streak</span>}
              {streakShields > 0 && <span>🛡️ {streakShields} shield{streakShields > 1 ? 's' : ''}</span>}
              {sessionCount > 0 && <span className="text-muted">· {sessionCount} sessions</span>}
              {firstSessionDate && <span className="text-muted">· since {firstSessionDate}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-headline text-[1.9rem] font-black" style={{ color: '#2D9B56' }}>
              {fmtNum(limerPoints)}
              <span className="text-[.88rem] ml-1 font-body font-bold text-muted">LP</span>
            </div>
            <div className="text-[.7rem] text-muted">+{fmtNum(lpThisWeek)} this week</div>
            {lpMultiplier > 1 && (
              <div className="text-[.66rem] text-sea mt-0.5">{lpMultiplier}x multiplier active</div>
            )}
          </div>
        </div>

        {/* XP Progress Bar */}
        <div>
          <div className="flex justify-between text-[.64rem] text-muted mb-1.5 font-headline">
            <span>{xp} XP</span>
            {nextTier
              ? <span>{nextTier.icon} {nextTier.name} in {nextTier.xp - xp} XP</span>
              : <span>👑 Max Tier Reached</span>}
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpProgress}%`, background: `linear-gradient(90deg, ${tier.color}, ${nextTier?.color || tier.color})` }}
              role="progressbar"
              aria-valuenow={xp}
              aria-valuemin={tier.xp}
              aria-valuemax={nextTier?.xp || tier.xp}
              aria-label={`XP progress: ${xp} of ${nextTier?.xp || xp}`}
            />
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <QuickStat icon="💹" label="Trades" value={fmtNum(trades.length)} color="#00ffa3" onClick={() => setActiveTab('trade')} />
        <QuickStat icon="🎖️" label="Badges" value={`${earnedBadges.length}/25`} color="#FFCA3A" onClick={() => setActiveTab('learn')} />
        <QuickStat icon="📚" label="Modules" value={`${modulesCompleted.length}/4`} color="#2D9B56" onClick={() => setActiveTab('learn')} />
        <QuickStat icon="💰" label="USD Balance" value={fmtUSD(balanceUSD)} color="#9945FF" onClick={() => setActiveTab('portfolio')} />
      </div>

      {/* ── Two-column grid: Market Pulse + Next Action ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

        {/* Market Pulse */}
        <GlowCard className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }} proximity={100}>
          <div className="text-[.66rem] text-muted uppercase tracking-widest mb-4 font-headline">📊 Market Pulse — Top Movers</div>
          {pricesQ.isLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-7 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,.05)' }} />
              ))}
            </div>
          ) : topMovers.length === 0 ? (
            <div className="text-muted text-[.78rem]">No price data available</div>
          ) : (
            <div>
              {topMovers.map(t => (
                <div key={t.symbol}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <span className="font-mono text-[.8rem] text-txt font-bold">{t.symbol}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[.78rem] text-txt-2 font-mono">{fmtUSD(t.price)}</span>
                    <span className={`text-[.72rem] font-mono font-bold px-1.5 py-0.5 rounded
                      ${t.change24h >= 0 ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>
                      {fmtPct(t.change24h)}
                    </span>
                  </div>
                </div>
              ))}
              <button onClick={() => setActiveTab('market')}
                className="mt-3 w-full text-[.72rem] text-sea font-headline bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity text-left">
                View full market →
              </button>
            </div>
          )}
        </GlowCard>

        {/* Next Action */}
        <GlowCard className="rounded-xl border border-sea/25 p-5 flex flex-col gap-4" proximity={100}
          style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.07), rgba(0,255,163,.02))' }}>
          <div className="text-[.66rem] text-sea uppercase tracking-widest font-headline">🎯 Your Next Move</div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="text-[1.4rem] mb-2">{nextAction.icon}</div>
              <div className="font-body font-bold text-[.95rem] text-txt mb-2">{nextAction.title}</div>
              <div className="text-[.75rem] text-txt-2 leading-relaxed">{nextAction.desc}</div>
            </div>
            {nextAction.tab && (
              <div className="mt-4 flex justify-center">
                <LiquidMetalButton
                  label={`${nextAction.cta} →`}
                  onClick={() => setActiveTab(nextAction.tab)}
                  width={200}
                />
              </div>
            )}
          </div>

          {/* Tier progression dots */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-sea/15">
            {TIERS.map((t, i) => (
              <div key={t.level} className="flex-1 h-1.5 rounded-full transition-all"
                title={t.name}
                style={{ background: xp >= t.xp ? t.color : 'rgba(255,255,255,.1)' }} />
            ))}
            <span className="text-[.6rem] text-muted ml-1 font-headline">{tier.level}/6</span>
          </div>
        </GlowCard>
      </div>

      {/* ── Recent Trades ── */}
      {trades.length > 0 && (
        <div className="rounded-xl border border-border p-5 mb-5" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[.66rem] text-muted uppercase tracking-widest font-headline">⏱ Recent Trades</div>
            {holdings.length > 0 && (
              <div className={`text-[.72rem] font-mono font-bold px-2 py-0.5 rounded ${paperPnL >= 0 ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>
                P&L {paperPnL >= 0 ? '+' : ''}{fmtUSD(paperPnL)}
              </div>
            )}
          </div>
          <div>
            {trades.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 text-[.76rem]">
                <div className="flex items-center gap-2.5">
                  <span className={`font-bold text-[.65rem] px-1.5 py-0.5 rounded font-mono
                    ${t.side === 'buy' ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>
                    {t.side.toUpperCase()}
                  </span>
                  <span className="text-txt font-mono font-bold">{t.symbol}</span>
                  <span className="text-muted">×{t.qty}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-txt-2 font-mono">{fmtUSD(t.total)}</span>
                  <span className="text-muted text-[.64rem]">{new Date(t.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setActiveTab('portfolio')}
            className="mt-3 w-full text-[.72rem] text-sea font-headline bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity text-left">
            Full portfolio & analytics →
          </button>
        </div>
      )}

      {/* ── Recent Badges ── */}
      {recentBadgeData.length > 0 && (
        <div className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[.66rem] text-muted uppercase tracking-widest font-headline">🎖 Recently Earned</div>
            <button onClick={() => setActiveTab('learn')}
              className="text-[.68rem] text-sea font-headline bg-transparent border-none cursor-pointer hover:opacity-70">
              All badges →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {recentBadgeData.map(b => (
              <AchievementBadge
                key={b.id}
                icon={b.icon}
                title={b.title}
                desc={b.desc}
                cat={b.cat}
                earned={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state for brand-new users */}
      {trades.length === 0 && earnedBadges.length === 0 && (
        <div className="rounded-xl border border-border p-8 text-center" style={{ background: 'var(--color-card)' }}>
          <div className="text-[3rem] mb-3">🌴</div>
          <div className="font-body font-bold text-[1rem] text-txt mb-2">Welcome to Limer's Capital</div>
          <div className="text-[.78rem] text-txt-2 mb-5 max-w-sm mx-auto leading-relaxed">
            The Caribbean's Solana-native investment platform. Learn, paper trade, earn LP points, and get
            ready for the $LIMER token airdrop.
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <LiquidMetalButton
              label="Start Learning"
              icon="📚"
              onClick={() => setActiveTab('learn')}
              width={180}
            />
            <LiquidMetalButton
              label="View Markets"
              icon="📊"
              onClick={() => setActiveTab('market')}
              width={180}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function QuickStat({ icon, label, value, color, onClick }) {
  return (
    <GlowCard
      as="button"
      onClick={onClick}
      className="rounded-[14px] p-4 border border-border text-left w-full cursor-pointer transition-all hover:-translate-y-0.5 bg-transparent"
      style={{ background: 'var(--color-card)' }}
      proximity={80}
      spread={40}
      blur={0}
      aria-label={`${label}: ${value}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base" aria-hidden="true">{icon}</span>
        <span className="text-[.62rem] text-muted uppercase tracking-widest font-headline">{label}</span>
      </div>
      <div className="font-headline text-[1.35rem] font-black" style={{ color }}>{value}</div>
    </GlowCard>
  );
}
