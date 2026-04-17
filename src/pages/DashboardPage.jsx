import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';
import { getTier, getNextTier, TIERS } from '../data/gamification';
import { BADGES } from '../data/badges';
import { fetchTradePrices } from '../api/prices';
import { fmtUSD, fmtNum, fmtPct } from '../utils/format';
import GlowCard from '../components/ui/GlowCard';
import AchievementBadge from '../components/gamification/AchievementBadge';
import LiquidMetalButton from '../components/ui/LiquidMetalButton';
import GradientDots from '../components/ui/GradientDots';
import HeroSection from '../components/dashboard/HeroSection';
import GlassCard from '../components/ui/GlassCard';
import { PE_COMPARISON, VALUE_UNLOCK } from '../data/capitalMarkets';
import CommunityFeed from '../components/CommunityFeed';
import TokensPanel from '../components/TokensPanel';
import SwapPanel from '../components/SwapPanel';
import Tooltip from '../components/ui/Tooltip';
import DailyKnowledgeCard from '../components/DailyKnowledgeCard';
import SkillMap from '../components/gamification/SkillMap';
import SocialProofBar from '../components/SocialProofBar';
import WaitlistModal from '../components/WaitlistModal';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import useScrollReveal from '../hooks/useScrollReveal';

export default function DashboardPage() {
  const { t } = useTranslation();
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
    .filter(t => t.price_change_percentage_24h != null)
    .sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))
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

  const [showWaitlist, setShowWaitlist] = useState(false);

  // ── UX polish: scroll-reveal for Dashboard sections ──
  const { childVariants: statsChildV, ...statsReveal } = useScrollReveal({ stagger: 0.08 });
  const { childVariants: _tierCV, ...tierReveal } = useScrollReveal({ delay: 0.05 });
  const { childVariants: moversChildV, ...moversReveal } = useScrollReveal({ stagger: 0.06, delay: 0.1 });

  return (
    <div>
      {/* Social Proof */}
      <SocialProofBar />

      {/* Start Here banner — guides new users to their first action */}
      {trades.length === 0 && modulesCompleted.length === 0 && (
        <div className="rounded-xl border border-sea/25 p-6 mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.08) 0%, rgba(0,255,163,.02) 100%)' }}>
          <div className="flex items-start gap-5 flex-wrap">
            <div className="text-[2.5rem]">🎯</div>
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-headline text-[1.2rem] font-black text-txt mb-1">Welcome! Start Here</h2>
              <p className="text-[.8rem] text-txt-2 leading-relaxed mb-4">
                Complete the <strong>Foundations</strong> course (3 short lessons, ~10 minutes) to understand
                the basics and earn your first 150 <Tooltip term="XP" def="Experience Points — earned by learning and trading. XP unlocks new tiers and features." inline>XP</Tooltip>.
                Then try a risk-free paper trade with your virtual $100K.
              </p>
              <div className="flex gap-3 flex-wrap">
                <LiquidMetalButton
                  label="Start Foundations Course"
                  icon="📚"
                  onClick={() => setActiveTab('learn')}
                  width={260}
                />
                <button onClick={() => setActiveTab('faq')}
                  className="px-4 py-2 rounded-xl text-[.78rem] font-bold
                    bg-transparent border border-border text-muted cursor-pointer
                    hover:text-txt hover:border-white/20 transition-colors">
                  New to Digital Assets? Read the FAQ
                </button>
              </div>
            </div>
            <div className="hidden md:flex flex-col gap-1 text-[.68rem] text-muted">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full text-[.55rem] flex items-center justify-center
                  ${modulesCompleted.length > 0 ? 'bg-up/20 text-up' : 'bg-white/8 text-muted'}`}>
                  {modulesCompleted.length > 0 ? '✓' : '1'}
                </span> Learn basics
              </div>
              <div className="w-px h-3 bg-white/10 ml-2.5" />
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full text-[.55rem] flex items-center justify-center
                  ${trades.length > 0 ? 'bg-up/20 text-up' : 'bg-white/8 text-muted'}`}>
                  {trades.length > 0 ? '✓' : '2'}
                </span> Paper trade
              </div>
              <div className="w-px h-3 bg-white/10 ml-2.5" />
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full text-[.55rem] flex items-center justify-center bg-white/8 text-muted">3</span> Earn badges
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Knowledge — show after at least 1 lesson completed */}
      {modulesCompleted.length > 0 && <DailyKnowledgeCard />}

      {/* ── Hero Section ── */}
      <HeroSection />

      {/* ── Tier & Progress Card — parallax for premium feel ── */}
      <GlassCard variant="elevated" parallax parallaxDepth={0.02} className="p-5 md:p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="text-[.66rem] text-muted uppercase tracking-widest mb-1 font-headline">{t('dashboard.yourStatus')}</div>
            <h2 className="font-headline text-[1.6rem] font-black leading-tight" style={{ color: tier.color }}>
              {tier.icon} {tier.name}
            </h2>
            <div className="text-[.73rem] text-txt-2 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              {currentStreak > 0 && <span>🔥 {t('dashboard.streak', { count: currentStreak })}</span>}
              {streakShields > 0 && <span>🛡️ {t('dashboard.shield', { count: streakShields })}</span>}
              {sessionCount > 0 && <span className="text-muted">· {t('dashboard.sessions', { count: sessionCount })}</span>}
              {firstSessionDate && <span className="text-muted">· {t('dashboard.since', { date: firstSessionDate })}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-headline text-[1.9rem] font-black" style={{ color: '#2D9B56' }}>
              <AnimatedCounter value={limerPoints} format="number" />
              <Tooltip term="LP" def="Limer Points — loyalty points earned from learning, trading, and daily activity. LP will convert to $LIMER tokens during the airdrop." inline>
                <span className="text-[.88rem] ml-1 font-body font-bold text-muted">LP</span>
              </Tooltip>
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
      </GlassCard>

      {/* ── Skill Map (compact) + Quick Stats ── */}
      {trades.length >= 3 && (
        <div className="rounded-xl border border-border p-4 mb-4" style={{ background: 'var(--color-card)' }}>
          <SkillMap compact />
        </div>
      )}

      {/* ── Devnet tokens + AMM swap panels (Phase B5 + Swap UI) ── */}
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <TokensPanel />
        <SwapPanel />
      </div>

      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" {...statsReveal}>
        <motion.div variants={statsChildV}>
          <QuickStat icon="💹" label={t('dashboard.trades')} numericValue={trades.length} color="#00ffa3" onClick={() => setActiveTab('trade')} />
        </motion.div>
        <motion.div variants={statsChildV}>
          <QuickStat icon="🎖️" label={t('dashboard.badges')} value={`${earnedBadges.length}/25`} color="#FFCA3A" onClick={() => setActiveTab('learn')} />
        </motion.div>
        <motion.div variants={statsChildV}>
          <QuickStat icon="📚" label={t('dashboard.modules')} value={`${modulesCompleted.length}/4`} color="#2D9B56" onClick={() => setActiveTab('learn')} />
        </motion.div>
        <motion.div variants={statsChildV}>
          <QuickStat icon="💰" label={t('dashboard.usdBalance')} numericValue={balanceUSD} prefix="$" color="#9945FF" onClick={() => setActiveTab('portfolio')} />
        </motion.div>
      </motion.div>

      {/* ── Invest in Your Region ── */}
      <GlassCard variant="highlight" className="p-5 mb-6 cursor-pointer press-scale" onClick={() => setActiveTab('ttse')}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-[.65rem] text-sea uppercase tracking-widest font-mono font-bold mb-1.5">Caribbean Capital Markets</div>
            <h3 className="font-headline font-bold text-[1.05rem] text-txt mb-1.5">Invest in Your Region</h3>
            <p className="text-[.78rem] text-txt-2 leading-relaxed">
              TTSE stocks trade at <strong className="text-sea">9.9× PE</strong> — 42% below emerging market averages.
              Caribbean companies are structurally undervalued, not fundamentally weak.
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-[2rem] font-headline font-black text-sea leading-none">{VALUE_UNLOCK.combinedCaribMktCap}</div>
            <div className="text-[.65rem] text-muted mt-1">Combined Caribbean equities</div>
            <div className="text-[.72rem] text-sun font-mono font-bold mt-2">+{VALUE_UNLOCK.upsidePercent}% potential upside →</div>
          </div>
        </div>
      </GlassCard>

      {/* ── Two-column grid: Market Pulse + Next Action ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

        {/* Market Pulse */}
        <GlowCard className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }} proximity={100}>
          <div className="text-[.66rem] text-muted uppercase tracking-widest mb-4 font-headline">📊 {t('dashboard.marketPulse')}</div>
          {pricesQ.isLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-7 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,.05)' }} />
              ))}
            </div>
          ) : pricesQ.isError ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="text-down text-[.78rem]">Failed to load market data</div>
              <button onClick={() => pricesQ.refetch()}
                className="bg-transparent border border-down/30 text-down text-[.7rem] px-3 py-1 rounded-lg cursor-pointer hover:bg-down/10 transition-colors font-mono">
                ↻ Retry
              </button>
            </div>
          ) : topMovers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="text-muted text-[.78rem]">{t('dashboard.noPrice')}</div>
              <button onClick={() => pricesQ.refetch()}
                className="bg-transparent border border-border text-muted text-[.7rem] px-3 py-1 rounded-lg cursor-pointer hover:text-txt hover:border-sea/40 transition-colors font-mono">
                ↻ Refresh
              </button>
            </div>
          ) : (
            <div>
              {topMovers.map(t => (
                <div key={t.symbol}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <span className="font-mono text-[.8rem] text-txt font-bold">{t.symbol}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[.78rem] text-txt-2 font-mono">{fmtUSD(t.current_price)}</span>
                    <span className={`text-[.72rem] font-mono font-bold px-1.5 py-0.5 rounded
                      ${t.price_change_percentage_24h >= 0 ? 'text-up bg-up/10' : 'text-down bg-down/10'}`}>
                      {fmtPct(t.price_change_percentage_24h)}
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
          <div className="text-[.66rem] text-sea uppercase tracking-widest font-headline">🎯 {t('dashboard.yourNextMove')}</div>

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
            <div className="text-[.66rem] text-muted uppercase tracking-widest font-headline">⏱ {t('dashboard.recentTrades')}</div>
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
            <div className="text-[.66rem] text-muted uppercase tracking-widest font-headline">🎖 {t('dashboard.recentBadges')}</div>
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
          <div className="font-body font-bold text-[1rem] text-txt mb-2">{t('onboarding.welcome')}</div>
          <div className="text-[.78rem] text-txt-2 mb-5 max-w-sm mx-auto leading-relaxed">
            The Caribbean's Solana-native investment platform. Learn, paper trade, earn <Tooltip term="LP" def="Limer Points — loyalty points earned from all platform activity. LP will convert to $LIMER tokens during the airdrop." inline>LP</Tooltip> points, and get
            ready for the $LIMER token airdrop.
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <LiquidMetalButton
              label={t('onboarding.startLearning')}
              icon="📚"
              onClick={() => setActiveTab('learn')}
              width={180}
            />
            <LiquidMetalButton
              label={t('common.viewAll')}
              icon="📊"
              onClick={() => setActiveTab('market')}
              width={180}
            />
          </div>
        </div>
      )}

      {/* Community Activity Feed */}
      <div className="mt-6">
        <CommunityFeed limit={5} />
      </div>

      {/* Waitlist CTA */}
      <div className="mt-4 rounded-xl border border-sea/20 p-5 flex items-center justify-between flex-wrap gap-3"
        style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.04), rgba(153,69,255,.04))' }}>
        <div>
          <div className="font-body font-bold text-[.88rem] text-txt">Get Early Access to $LIMER</div>
          <div className="text-[.74rem] text-txt-2 mt-0.5">Join the waitlist for token launch, exclusive airdrops, and Caribbean DeFi updates.</div>
        </div>
        <button onClick={() => setShowWaitlist(true)}
          className="px-5 py-2.5 rounded-xl font-body font-bold text-[.82rem] cursor-pointer border-none bg-sea text-night hover:brightness-90 transition-all">
          Join Waitlist
        </button>
      </div>

      {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}
    </div>
  );
}

function QuickStat({ icon, label, value, numericValue, prefix = '', color, onClick }) {
  return (
    <GlowCard
      as="button"
      onClick={onClick}
      className="rounded-[14px] p-4 border border-border text-left w-full cursor-pointer transition-all hover:-translate-y-0.5 bg-transparent gpu-accelerated"
      style={{ background: 'var(--color-card)' }}
      proximity={80}
      spread={40}
      blur={0}
      aria-label={`${label}: ${typeof numericValue === 'number' ? numericValue : value}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base" aria-hidden="true">{icon}</span>
        <span className="text-[.62rem] text-muted uppercase tracking-widest font-headline">{label}</span>
      </div>
      <div className="font-headline text-[1.35rem] font-black" style={{ color }}>
        {typeof numericValue === 'number' ? (
          <AnimatedCounter value={numericValue} prefix={prefix} format="number" />
        ) : (
          value
        )}
      </div>
    </GlowCard>
  );
}
