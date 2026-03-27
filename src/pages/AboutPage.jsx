import useStore from '../store/useStore';

const SOLFLARE_LINK = 'https://www.solflare.com/?af_qr=true&shortlink=carribean&c=Carribean&pid=Solana%20Carribean&af_xp=qr&source_caller=ui';

const ROADMAP = [
  {
    phase: 'Phase 1', icon: '🏟️', title: 'Colosseum Hackathon — MVP',
    status: 'complete', statusLabel: 'Complete',
    desc: 'Built the core platform at Solana Colosseum. Interactive learning modules, paper trading engine, TTSE tokenized stocks, Solana wallet integration, and the Limer Points system — shipped as a working product, not a prototype.',
    milestones: ['Learn-to-Earn engine', 'Paper trading (Solana + TTSE)', 'Wallet-standard integration', 'Gamification system', 'Caribbean regulation map'],
  },
  {
    phase: 'Phase 2', icon: '⚡', title: 'Platform Expansion',
    status: 'active', statusLabel: 'In Progress',
    desc: 'Expanding from hackathon MVP to full-featured platform. Real on-chain swaps via Solflare, perpetual futures, live market data, Universal Basic Ownership model, and the dNFT yield engine architecture.',
    milestones: ['Real swaps (Solflare + Jupiter)', 'Perpetual futures (15 tokens)', 'Live candlestick charts', 'Revenue model (USDC/SOL)', 'UBO Learn module', 'About & narrative page', 'Solflare/Seeker boost allocation'],
  },
  {
    phase: 'Phase 3', icon: '🚀', title: '$LIMER Token Launch',
    status: 'next', statusLabel: 'Next',
    desc: 'Token Generation Event on Solana. Airdrop to LP holders based on accumulated Limer Points. DEX liquidity pools on Raydium/Meteora. Platform dNFTs minted for team, treasury, dev fund, and partner allocations.',
    milestones: ['$LIMER TGE', 'LP holder airdrop', 'Solflare 2% boost distribution', 'Seeker 1% boost distribution', 'dNFT minting (Metaplex Core)', 'DEX liquidity pools'],
  },
  {
    phase: 'Phase 4', icon: '💎', title: 'Staking & Real Yield',
    status: 'planned', statusLabel: 'Planned',
    desc: 'Staking program goes live. $LIMER stakers receive weekly revenue distributions in USDC and SOL. Fee discount tiers activate. Premium tier launches with Wam and ViFi yield integration.',
    milestones: ['Staking program', 'Weekly USDC/SOL distributions', 'Fee discount tiers', 'Premium tier (Wam + ViFi)', 'dNFT revenue accrual', 'On-chain yield dashboards'],
  },
  {
    phase: 'Phase 5', icon: '🗳️', title: 'Full Governance & Scale',
    status: 'planned', statusLabel: 'Planned',
    desc: 'On-chain governance via Realms. Token holders vote on treasury deployment, new listings, fee structures, and partnership decisions. Caribbean-wide expansion with multi-country TTSE support.',
    milestones: ['Realms DAO governance', 'Treasury management votes', 'Multi-country TTSE expansion', 'Institutional API launch', 'Cross-chain bridge', 'Mobile dApp store listing'],
  },
];

const PILLARS = [
  {
    icon: '🎓',
    title: 'Financial Literacy',
    desc: 'Interactive modules that take users from zero to confident — covering blockchain fundamentals, DeFi mechanics, risk management, and Caribbean market dynamics. Learning earns ownership.',
    color: '#00ffa3',
  },
  {
    icon: '🌍',
    title: 'Universal Basic Ownership',
    desc: 'Every user who learns, trades, or contributes becomes an owner. $LIMER tokens and dynamic NFTs distribute real protocol revenue — not promises — back to the people who build the ecosystem.',
    color: '#E8AC41',
  },
  {
    icon: '🏛️',
    title: 'Global Meets Local Capital Markets',
    desc: 'Bridging the Trinidad & Tobago Stock Exchange, Caribbean regulation, and global DeFi into one interface. Tokenized local equities alongside Solana\'s global liquidity — accessible from anywhere.',
    color: '#FF4D6D',
  },
  {
    icon: '🔗',
    title: 'Blockchain × Financial Instruments',
    desc: 'Navigating the convergence of traditional finance and blockchain technology. Real-World Assets, perpetual futures, on-chain swaps, and tokenized securities — all in one platform designed for clarity.',
    color: '#9945FF',
  },
  {
    icon: '🤝',
    title: 'Financial Inclusion',
    desc: 'Anyone with a phone can access global capital markets, earn yield, and own a share of the infrastructure they use. No minimum investment. No foreign brokerage. No barriers.',
    color: '#00C8B4',
  },
];

const WHY_SOLANA = [
  { icon: '⚡', title: 'Sub-Second Finality', desc: 'Transactions confirm in under 400 milliseconds. Trading, swapping, and staking feel instant — the way financial tools should.' },
  { icon: '💸', title: '$0.00025 Per Transaction', desc: 'Gas fees so low they\'re functionally free. A user can make 4,000 trades for $1. This makes micro-ownership and financial inclusion actually viable.' },
  { icon: '🏗️', title: 'Best-in-Class DeFi Infrastructure', desc: 'Jupiter aggregator, Meteora DLMM, Raydium, Orca — Solana has the deepest DEX liquidity and most advanced AMM technology in crypto.' },
  { icon: '📱', title: 'Mobile-First with Solana Mobile', desc: 'Saga and Seeker devices put a full crypto wallet in your pocket. Solana Mobile\'s dApp store bypasses the gatekeepers that block financial innovation.' },
  { icon: '☀️', title: 'Solflare — Our Wallet Partner', desc: 'Solflare is the most Solana-native wallet. Built-in staking, swaps, and dApp browsing. Our users get an exclusive 2% token boost for connecting with Solflare.' },
  { icon: '🌐', title: 'Real-World Asset Leadership', desc: 'Ondo Finance, BlackRock\'s BUIDL, USDY — Solana is where institutional RWAs are going on-chain. This is where Caribbean markets meet global capital.' },
  { icon: '🔧', title: 'Developer Ecosystem', desc: 'Anchor framework, Metaplex for NFTs, SPL Token-2022 for advanced tokenomics. Every tool we need to build dNFT yield engines and programmable ownership exists on Solana.' },
  { icon: '🌴', title: 'Caribbean Alignment', desc: 'Solana Foundation\'s global inclusion mission aligns with Caribbean financial empowerment. Low fees, mobile access, and real-world asset infrastructure serve underbanked populations.' },
];

export default function AboutPage() {
  const setActiveTab = useStore(s => s.setActiveTab);

  return (
    <div>
      {/* Hero */}
      <div className="rounded-xl p-9 mb-7 border border-sea/20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.06), rgba(45,155,86,.03))' }}>
        <div className="absolute right-6 bottom-[-30px] text-[140px] opacity-[.07] pointer-events-none select-none">🍋</div>
        <div className="inline-block bg-sea/12 border border-sea/30 rounded-full text-[.68rem] text-sea px-3 py-0.5 tracking-widest uppercase mb-3">
          About Limer's Capital
        </div>
        <h1 className="font-headline text-[2.4rem] font-black leading-[1.08] text-txt mb-4 max-w-3xl">
          Where Financial Literacy Meets <span className="text-sea">Universal Ownership</span>
        </h1>
        <p className="font-body text-txt-2 text-[.88rem] leading-relaxed max-w-2xl mb-4">
          Limer's Capital is a learning-first platform piloting a new model: Universal Basic Ownership. We sit at the intersection of global capital markets and local Caribbean economies — built on Solana to make financial inclusion real, not theoretical.
        </p>
        <p className="font-body text-txt-2 text-[.82rem] leading-relaxed max-w-2xl">
          This is not just a trading app. It's an instrument for navigating the convergence of blockchain technology, traditional financial instruments, and FinTech — designed to bring financial literacy and ownership to the forefront.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="rounded-xl border border-border p-7 mb-7" style={{ background: 'var(--color-card)' }}>
        <div className="text-[.62rem] text-muted uppercase tracking-widest mb-2">Our Mission</div>
        <p className="font-body text-[1.05rem] text-txt leading-relaxed font-medium max-w-3xl">
          To build the first platform where every user — regardless of geography, income, or experience — can learn about global finance, access real markets, and own a share of the infrastructure they use.
        </p>
      </div>

      {/* Five Pillars */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">The Five Pillars</h2>
      <div className="flex flex-col gap-4 mb-7">
        {PILLARS.map((p, i) => (
          <div key={p.title} className="rounded-xl border border-border p-6 flex gap-5 items-start" style={{ background: 'var(--color-card)' }}>
            <div className="text-3xl shrink-0">{p.icon}</div>
            <div>
              <h3 className="font-body font-bold text-[.94rem] mb-1" style={{ color: p.color }}>{p.title}</h3>
              <p className="text-[.78rem] text-txt-2 leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* The Platform */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">What We Built</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
        <Feature icon="📚" title="Learn-to-Earn" desc="7+ interactive modules covering blockchain, Caribbean markets, Solana DeFi, LP strategies, and Universal Basic Ownership. Every lesson completed earns Limer Points that convert to $LIMER tokens." />
        <Feature icon="💹" title="Paper & Real Trading" desc="Practice with paper trading on Solana tokens and TTSE stocks. When ready, execute real on-chain swaps through Solflare. Perpetual futures with up to 20x leverage for advanced users." />
        <Feature icon="🖼️" title="dNFT Yield Engine" desc="Platform revenue distributed in USDC and SOL — never in our own token. Dynamic NFTs make vesting transparent and verifiable. Real yield, not circular emissions." />
        <Feature icon="🗺️" title="Caribbean Regulation Map" desc="Jurisdiction-by-jurisdiction breakdown of crypto regulation across the Caribbean. From the Bahamas' DARE Act to Jamaica's BOJ sandbox — understand the legal landscape." />
        <Feature icon="📊" title="Market Intelligence" desc="Real-time token prices, economic calendars, congressional trading data, and TTSE stock feeds. Insights that bridge local and global markets." />
        <Feature icon="🎮" title="Gamified Progression" desc="XP, badges, streaks, and tier unlocks. Complete modules to unlock new features. The more you learn, the more you can do — and the more you own." />
      </div>

      {/* Why Solana */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-2">Why We Chose Solana</h2>
      <p className="text-[.78rem] text-txt-2 mb-5 leading-relaxed max-w-3xl">
        Every blockchain makes promises. We chose Solana because its infrastructure actually delivers what financial inclusion requires: transactions that cost fractions of a cent, settle in under a second, and scale to millions of users without compromise.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-7">
        {WHY_SOLANA.map(s => (
          <div key={s.title} className="rounded-xl border border-border p-5 flex gap-4 items-start" style={{ background: 'var(--color-card)' }}>
            <span className="text-2xl shrink-0">{s.icon}</span>
            <div>
              <div className="font-body font-bold text-[.84rem] text-txt mb-0.5">{s.title}</div>
              <div className="text-[.72rem] text-txt-2 leading-relaxed">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Roadmap — Colosseum */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-2">Roadmap — Built at Colosseum</h2>
      <p className="text-[.78rem] text-txt-2 mb-5 leading-relaxed max-w-3xl">
        Limer's Capital was born at the <span className="text-[#9945FF] font-bold">Solana Colosseum Hackathon</span> — where builders ship real products, not slide decks. Our roadmap tracks from hackathon MVP to full protocol, with each phase unlocking more ownership for users.
      </p>
      <div className="flex flex-col gap-0 mb-7 relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border hidden md:block" />
        {ROADMAP.map((r, i) => (
          <div key={r.phase} className="flex gap-5 items-start relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[.8rem] font-bold shrink-0 z-10
              ${r.status === 'complete' ? 'bg-sea text-night' : r.status === 'active' ? 'bg-[#FFA500] text-night ring-2 ring-[#FFA500]/40' : r.status === 'next' ? 'bg-[#9945FF]/20 text-[#9945FF] border border-[#9945FF]/40' : 'bg-night-3 text-muted border border-border'}`}>
              {r.status === 'complete' ? '✓' : i + 1}
            </div>
            <div className={`flex-1 rounded-xl border p-5 mb-3 ${r.status === 'active' ? 'border-[#FFA500]/40' : 'border-border'}`}
              style={{ background: r.status === 'active' ? 'rgba(255,165,0,.04)' : 'var(--color-card)' }}>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[.62rem] text-muted uppercase tracking-widest">{r.phase}</span>
                <span className="text-lg">{r.icon}</span>
                <span className="font-body font-bold text-[.92rem] text-txt">{r.title}</span>
                <span className={`text-[.58rem] px-2 py-0.5 rounded-full ml-auto
                  ${r.status === 'complete' ? 'bg-sea/15 text-sea' : r.status === 'active' ? 'bg-[#FFA500]/15 text-[#FFA500]' : r.status === 'next' ? 'bg-[#9945FF]/15 text-[#9945FF]' : 'bg-muted/10 text-muted'}`}>
                  {r.statusLabel}
                </span>
              </div>
              <p className="text-[.76rem] text-txt-2 leading-relaxed mb-2">{r.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {r.milestones.map(m => (
                  <span key={m} className="text-[.6rem] px-2 py-0.5 rounded border border-border bg-black/20 text-muted">{m}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* The Convergence */}
      <div className="rounded-xl border border-[#9945FF]/30 p-7 mb-7" style={{ background: 'rgba(153,69,255,.04)' }}>
        <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-3">The Convergence</h2>
        <p className="text-[.82rem] text-txt-2 leading-relaxed mb-4 max-w-3xl">
          We are at an inflection point. Blockchain technology is merging with traditional financial instruments — tokenized bonds, on-chain equities, programmable money. FinTech is reshaping how people access, understand, and interact with capital markets.
        </p>
        <p className="text-[.82rem] text-txt-2 leading-relaxed mb-4 max-w-3xl">
          But most of the world has been left out of this conversation. The Caribbean has $50B+ in pension assets, growing stock exchanges, and a young, tech-forward population — yet access to global DeFi, RWA markets, and blockchain infrastructure remains fragmented.
        </p>
        <p className="text-[.82rem] text-txt leading-relaxed max-w-3xl font-medium">
          Limer's Capital exists to close that gap. Not just by giving people access to markets, but by making them owners of the platform that provides that access. This is the 4th front of financial inclusion: <span className="text-sea">literacy + access + ownership + infrastructure</span>.
        </p>
      </div>

      {/* CTA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        <button onClick={() => setActiveTab('learn')}
          className="rounded-xl border border-sea/30 p-6 text-center cursor-pointer transition-all hover:bg-sea/5 bg-transparent"
          style={{ background: 'rgba(0,255,163,.03)' }}>
          <div className="text-2xl mb-2">📚</div>
          <div className="font-body font-bold text-[.88rem] text-sea mb-1">Start Learning</div>
          <div className="text-[.72rem] text-txt-2">Complete modules, earn LP, unlock features</div>
        </button>
        <button onClick={() => setActiveTab('trade')}
          className="rounded-xl border border-[#FFA500]/30 p-6 text-center cursor-pointer transition-all hover:bg-[#FFA500]/5 bg-transparent"
          style={{ background: 'rgba(255,165,0,.03)' }}>
          <div className="text-2xl mb-2">💹</div>
          <div className="font-body font-bold text-[.88rem] text-[#FFA500] mb-1">Start Trading</div>
          <div className="text-[.72rem] text-txt-2">Paper trade or swap real tokens on-chain</div>
        </button>
        <a href={SOLFLARE_LINK} target="_blank" rel="noopener noreferrer"
          className="rounded-xl border border-[#E8AC41]/30 p-6 text-center cursor-pointer transition-all hover:bg-[#E8AC41]/5 no-underline"
          style={{ background: 'rgba(232,172,65,.03)' }}>
          <div className="text-2xl mb-2">☀️</div>
          <div className="font-body font-bold text-[.88rem] text-[#E8AC41] mb-1">Get Solflare</div>
          <div className="text-[.72rem] text-txt-2">The recommended Solana wallet for Limer's Capital</div>
        </a>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="rounded-xl border border-border p-5 flex gap-4 items-start" style={{ background: 'var(--color-card)' }}>
      <span className="text-2xl shrink-0">{icon}</span>
      <div>
        <div className="font-body font-bold text-[.84rem] text-txt mb-0.5">{title}</div>
        <div className="text-[.72rem] text-txt-2 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}
