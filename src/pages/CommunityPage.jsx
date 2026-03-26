import { useState } from 'react';
import useStore from '../store/useStore';
import { LP_ACTIONS } from '../data/lp';

const SOLFLARE_LINK = 'https://www.solflare.com/?af_qr=true&shortlink=carribean&c=Carribean&pid=Solana%20Carribean&af_xp=qr&source_caller=ui';

const USER_TYPES = [
  {
    icon: '📊', title: 'Retail Traders',
    desc: 'Trade tokenized TTSE stocks and Solana tokens. Earn LP on every trade. Fee discounts with $LIMER staking. Paper trade first, go live with Solflare.',
    cta: 'Start Paper Trading', tab: 'trade',
  },
  {
    icon: '🏛️', title: 'Institutions',
    desc: 'List your TTSE stock on Solana. Reach global investors, enable fractional ownership, get 24/7 liquidity. From free Explorer tier to full Enterprise tokenization.',
    cta: 'List Your Company', tab: 'listing',
  },
  {
    icon: '🛠️', title: 'Developers',
    desc: 'Build on Limer\'s Capital. API access for market data, LP integration, and custom trading interfaces. Community grants available for Caribbean-focused projects.',
    cta: 'Coming Soon', tab: null,
  },
];

const EARNING_FLOW = [
  { step: '1', icon: '📚', title: 'Learn', desc: 'Complete lessons and quizzes to earn XP + LP. Unlock platform features.' },
  { step: '2', icon: '💹', title: 'Trade', desc: 'Execute paper trades. Earn 10 LP per trade + volume bonuses.' },
  { step: '3', icon: '🔗', title: 'Connect', desc: 'Link your Solflare wallet for 50 bonus LP and live trading access.' },
  { step: '4', icon: '🤝', title: 'Refer', desc: 'Share your code. Earn 200 LP per referral who connects a wallet.' },
  { step: '5', icon: '📈', title: 'Stake', desc: 'When $LIMER launches, stake for fee discounts and revenue share.' },
  { step: '6', icon: '🗳️', title: 'Govern', desc: 'Vote on listings, fees, and treasury allocation. Shape the platform.' },
];

export default function CommunityPage() {
  const { setActiveTab, walletConnected, limerPoints, trades, lpReferrals, referralCode, generateReferralCode } = useStore();
  const [copied, setCopied] = useState(false);
  useState(() => { if (!referralCode) generateReferralCode(); });

  function copyCode() {
    const code = referralCode || generateReferralCode();
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div>
      {/* Hero */}
      <div className="rounded-xl p-9 mb-7 border border-sea/20 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.06), rgba(45,155,86,.03))' }}>
        <div className="text-4xl mb-3">🌴</div>
        <h1 className="font-headline text-[2.4rem] font-black text-txt mb-3">
          Everyone Wins at <span className="text-sea">Limer's Capital</span>
        </h1>
        <p className="font-body text-txt-2 text-[.82rem] leading-relaxed max-w-2xl mx-auto">
          50% of all platform revenue flows to the community. Learn, trade, refer, and stake — every action earns you Limer Points that convert to $LIMER tokens.
        </p>
      </div>

      {/* How You Earn Flow */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">How You Earn</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
        {EARNING_FLOW.map(e => (
          <div key={e.step} className="rounded-xl border border-border p-4 text-center" style={{ background: 'var(--color-card)' }}>
            <div className="text-2xl mb-2">{e.icon}</div>
            <div className="font-body font-bold text-[.82rem] text-txt mb-1">{e.title}</div>
            <div className="text-[.68rem] text-txt-2 leading-relaxed">{e.desc}</div>
          </div>
        ))}
      </div>

      {/* User Types */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Built for Everyone</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {USER_TYPES.map(u => (
          <div key={u.title} className="rounded-xl border border-border p-6 flex flex-col" style={{ background: 'var(--color-card)' }}>
            <div className="text-3xl mb-3">{u.icon}</div>
            <h3 className="font-body font-bold text-[1rem] text-txt mb-2">{u.title}</h3>
            <p className="text-[.76rem] text-txt-2 leading-relaxed flex-1 mb-4">{u.desc}</p>
            {u.tab ? (
              <button onClick={() => setActiveTab(u.tab)}
                className="px-4 py-2.5 rounded-xl bg-sea/10 border border-sea/30 text-sea text-[.78rem] font-body font-bold cursor-pointer transition-all hover:bg-sea/20">
                {u.cta}
              </button>
            ) : (
              <span className="px-4 py-2.5 rounded-xl bg-muted/10 border border-border text-muted text-[.78rem] font-body font-bold text-center">
                {u.cta}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Earning Mechanics Table */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Full Earning Table</h2>
      <div className="rounded-xl border border-border overflow-hidden mb-7" style={{ background: 'var(--color-card)' }}>
        <div className="grid grid-cols-[40px_1fr_80px_80px] px-5 py-2 border-b border-border text-[.65rem] text-muted uppercase tracking-widest">
          <span></span><span>Action</span><span className="text-center">LP</span><span className="text-center">Multiplied?</span>
        </div>
        {LP_ACTIONS.map(a => (
          <div key={a.action} className="grid grid-cols-[40px_1fr_80px_80px] px-5 py-2.5 border-b border-border last:border-b-0 text-[.78rem] items-center">
            <span className="text-center">{a.icon}</span>
            <span className="text-txt">{a.action} {a.note && <span className="text-muted text-[.65rem]">({a.note})</span>}</span>
            <span className="text-center text-[#2D9B56] font-bold">+{a.lp}</span>
            <span className="text-center">{a.multiplied ? '✓' : '—'}</span>
          </div>
        ))}
      </div>

      {/* Referral + Your Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
        <div className="rounded-xl border border-sea/20 p-6" style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.04), rgba(45,155,86,.04))' }}>
          <h3 className="font-body font-bold text-[.92rem] text-txt mb-3">🤝 Your Referral Code</h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-black/30 border border-border rounded-lg px-4 py-2.5 font-mono text-[.88rem] text-sea">
              {referralCode || '...'}
            </div>
            <button onClick={copyCode}
              className="px-4 py-2.5 rounded-lg text-[.78rem] font-mono cursor-pointer border border-sea/30 bg-sea/8 text-sea transition-all hover:bg-sea/15">
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="text-[.72rem] text-txt-2">Referrals: <span className="text-sea font-bold">{lpReferrals.length}</span> | LP earned: <span className="text-[#2D9B56] font-bold">{lpReferrals.length * 200}</span></div>
        </div>

        <div className="rounded-xl border border-border p-6" style={{ background: 'var(--color-card)' }}>
          <h3 className="font-body font-bold text-[.92rem] text-txt mb-3">📊 Your Stats</h3>
          <div className="flex flex-col gap-2 text-[.78rem]">
            <div className="flex justify-between"><span className="text-muted">Total LP</span><span className="text-[#2D9B56] font-bold">{limerPoints.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted">Trades</span><span className="text-txt font-bold">{trades.length}</span></div>
            <div className="flex justify-between"><span className="text-muted">Wallet</span><span className={walletConnected ? 'text-up' : 'text-down'}>{walletConnected ? 'Connected ✓' : 'Not connected'}</span></div>
            <div className="flex justify-between"><span className="text-muted">Referrals</span><span className="text-txt font-bold">{lpReferrals.length}</span></div>
          </div>
        </div>
      </div>

      {/* Share as Blink */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Share as Solana Blink</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {[
          { icon: '📚', title: 'Learn', desc: 'Share the learn-to-earn experience', action: 'learn', color: '#00ffa3' },
          { icon: '💹', title: 'Trade', desc: 'Share the trading simulator', action: 'trade', color: '#C46CFF' },
          { icon: '🇹🇹', title: 'TTSE', desc: 'Share Caribbean stock data', action: 'ttse', color: '#FF4D6D' },
        ].map(blink => {
          const blinkUrl = `https://dial.to/?action=solana-action:https://limer-api-proxy.solanacaribbean-team.workers.dev/actions/${blink.action}`;
          const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out Limer's Capital — the Caribbean's Solana-native platform! 🌴`)}&url=${encodeURIComponent(blinkUrl)}`;
          return (
            <div key={blink.action} className="rounded-xl border border-border p-5 flex flex-col gap-3" style={{ background: 'var(--color-card)' }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{blink.icon}</span>
                <span className="font-body font-bold text-[.88rem] text-txt">{blink.title}</span>
              </div>
              <p className="text-[.72rem] text-txt-2">{blink.desc}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(blinkUrl); }}
                  className="flex-1 px-3 py-2 rounded-lg text-[.72rem] font-headline cursor-pointer border transition-all bg-transparent text-muted hover:text-txt"
                  style={{ borderColor: `${blink.color}33` }}>
                  📋 Copy Blink
                </button>
                <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 rounded-lg text-[.72rem] font-headline cursor-pointer border text-center no-underline transition-all hover:opacity-80"
                  style={{ borderColor: `${blink.color}33`, color: blink.color, background: `${blink.color}0a` }}>
                  Share on 𝕏
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      {!walletConnected && (
        <div className="rounded-xl border border-sea/30 p-8 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(252,92,62,.04), rgba(0,255,163,.04))' }}>
          <div className="text-3xl mb-3">🔗</div>
          <h3 className="font-body font-bold text-[1.1rem] text-txt mb-2">Connect Your Wallet — Earn 50 LP Instantly</h3>
          <p className="text-[.82rem] text-txt-2 mb-5 max-w-lg mx-auto">Link your Solflare wallet to unlock live trading and earn your first 50 Limer Points.</p>
          <a href={SOLFLARE_LINK} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-body font-bold text-[.88rem] no-underline transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #FC5C3E, #FF8C42)', boxShadow: '0 0 20px rgba(252,92,62,.3)' }}>
            Get Solflare Wallet
          </a>
        </div>
      )}
    </div>
  );
}
