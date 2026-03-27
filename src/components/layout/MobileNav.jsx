/**
 * MobileNav — bottom-sheet navigation drawer for mobile devices.
 * Slides up from the bottom of the screen when the hamburger is tapped.
 * Closes on tab select, backdrop tap, or the ✕ button.
 */
import useStore from '../../store/useStore';
import { getTier, getNextTier } from '../../data/gamification';
import { useCluster } from '../../solana/provider';

const WAM_LINK = 'https://wam.money/';
const SOLFLARE_LINK = 'https://www.solflare.com/?af_qr=true&shortlink=carribean&c=Carribean&pid=Solana%20Carribean&af_xp=qr&source_caller=ui';

const MAIN_TABS = [
  { id: 'regulation', label: 'Regulation', icon: '🗺️' },
  { id: 'learn',      label: 'Learn',      icon: '📚' },
  { id: 'ttse',       label: 'TTSE',       icon: '🇹🇹', ttse: true },
  { id: 'insights',   label: 'Insights',   icon: '🌐' },
  { id: 'market',     label: 'Solana',     icon: '📊' },
  { id: 'trade',      label: 'Trade',      icon: '💹' },
  { id: 'portfolio',  label: 'Portfolio',  icon: '🎒' },
];

const LIMER_TABS = [
  { id: 'about',      label: 'About',      icon: '📖' },
  { id: 'points',     label: 'Points',     icon: '🍋' },
  { id: 'tokenomics', label: 'Tokenomics', icon: '📊' },
  { id: 'revenue',    label: 'Revenue',    icon: '💰' },
  { id: 'community',  label: 'Community',  icon: '🌴' },
  { id: 'listing',    label: 'Listing',    icon: '🏛️' },
  { id: 'legal',      label: 'Legal',      icon: '📜' },
];

export default function MobileNav({ open, onClose, isConnected, displayAddress, onWalletClick }) {
  const activeTab = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);
  const xp = useStore(s => s.xp);
  const limerPoints = useStore(s => s.limerPoints);
  const currentStreak = useStore(s => s.currentStreak);

  const { cluster, setCluster, label: clusterLabel } = useCluster();
  const tier = getTier(xp);
  const next = getNextTier(xp);
  const progress = next ? ((xp - tier.xp) / (next.xp - tier.xp)) * 100 : 100;

  function navigate(tabId) {
    setActiveTab(tabId);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer — slides up from bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl border-t border-border overflow-hidden"
        style={{
          background: 'rgba(13,14,16,.98)',
          maxHeight: '88vh',
          boxShadow: '0 -8px 40px rgba(0,0,0,.6)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(88vh - 20px)' }}>
          <div className="px-5 pb-8">

            {/* ── XP / LP summary ─────────────────────────── */}
            <div className="flex items-center gap-3 py-4 border-b border-border mb-4">
              {/* Tier + progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{tier.icon}</span>
                  <span className="text-[.78rem] font-bold" style={{ color: tier.color }}>{tier.name}</span>
                  {currentStreak > 0 && (
                    <span className="text-[.7rem] text-coral ml-auto">🔥 {currentStreak}d</span>
                  )}
                </div>
                <div className="h-1.5 bg-night-3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: tier.color }} />
                </div>
                <div className="flex justify-between text-[.58rem] text-muted mt-1">
                  <span>{xp.toLocaleString()} XP</span>
                  {next && <span>{(next.xp - xp).toLocaleString()} to {next.icon}</span>}
                </div>
              </div>

              {/* LP badge */}
              <div className="flex items-center gap-1.5 bg-[rgba(45,155,86,.08)] border border-[rgba(45,155,86,.25)] rounded-full px-3 py-1.5 text-[.72rem] text-[#2D9B56] font-bold flex-shrink-0">
                🍋 {limerPoints.toLocaleString()} LP
              </div>
            </div>

            {/* ── Main nav tabs ────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {MAIN_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-[.8rem] font-headline uppercase tracking-wide border-none cursor-pointer transition-all text-left
                    ${activeTab === tab.id
                      ? tab.ttse
                        ? 'text-[#FF4D6D] bg-[rgba(200,16,46,.12)]'
                        : 'text-sea bg-sea/12'
                      : 'text-txt-2 bg-white/4 hover:bg-white/8'
                    }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── $LIMER section ───────────────────────────── */}
            <div className="text-[.6rem] text-muted uppercase tracking-widest px-1 mb-2">$LIMER</div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {LIMER_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-[.78rem] font-headline uppercase tracking-wide border-none cursor-pointer transition-all text-left
                    ${activeTab === tab.id
                      ? 'text-[#2D9B56] bg-[rgba(45,155,86,.12)]'
                      : 'text-txt-2 bg-white/4 hover:bg-white/8'
                    }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── Bottom strip — Network + Wallet + Wam ────── */}
            <div className="border-t border-border pt-4 flex flex-col gap-3">
              {/* Network + Wam on one row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCluster(cluster === 'devnet' ? 'mainnet-beta' : 'devnet')}
                  className={`flex-1 py-2.5 rounded-xl text-[.72rem] uppercase tracking-widest font-headline cursor-pointer border transition-all
                    ${cluster === 'devnet'
                      ? 'text-[#FFB347] bg-[rgba(255,179,71,.08)] border-[rgba(255,179,71,.25)]'
                      : 'text-up bg-up/8 border-up/25'
                    }`}
                >
                  {clusterLabel}
                </button>
                <a href={WAM_LINK} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[rgba(255,215,0,.08)] border border-[rgba(255,215,0,.28)]
                    rounded-xl px-4 py-2.5 text-[.72rem] font-body font-bold text-[#FFD700]
                    transition-all hover:bg-[rgba(255,215,0,.14)] no-underline cursor-pointer">
                  <span className="w-4 h-4 rounded bg-[#FFD700] flex items-center justify-center text-[.5rem] font-black text-night flex-shrink-0">W</span>
                  Wam
                </a>
              </div>

              {/* Wallet button */}
              <button
                onClick={() => { onWalletClick(); onClose(); }}
                className={`w-full py-3 rounded-xl text-[.82rem] font-body font-bold transition-all border-none cursor-pointer
                  ${isConnected
                    ? 'bg-[linear-gradient(135deg,rgba(0,255,163,.18),rgba(0,255,163,.09))] border border-up/40 text-up neon-glow-primary'
                    : 'bg-[linear-gradient(135deg,#FC5C3E,#FF8C42)] text-white'
                  }`}
                style={isConnected
                  ? { boxShadow: '0 0 12px rgba(0,255,163,.2)' }
                  : { boxShadow: '0 0 20px rgba(252,92,62,.3)' }
                }
              >
                {isConnected ? `${displayAddress?.slice(0,4)}...${displayAddress?.slice(-4)} · Connected` : 'Connect Solana Wallet'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
