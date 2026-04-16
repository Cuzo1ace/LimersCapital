import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '../../store/useStore';
import { useNavigationDirection } from './PageTransition';
import { useSelectedWalletAccount } from '@solana/react';
import { useWallets, useConnect, useDisconnect } from '@wallet-standard/react';
import { useCluster } from '../../solana/provider';
import { getAccountExplorerUrl } from '../../solana/config';
import { isValidSolanaAddress } from '../../solana/validation';
import XPBar from '../gamification/XPBar';
import LPBar from '../gamification/LPBar';
import MobileNav from './MobileNav';
import UnreadDot from '../news/UnreadDot';
import { useHasUnreadNews } from '../../hooks/useNewsFeed';

const SOLFLARE_LINK = 'https://www.solflare.com/?af_qr=true&shortlink=carribean&c=Carribean&pid=Solana%20Carribean&af_xp=qr&source_caller=ui';
const WAM_LINK = 'https://wam.money/';

const LANGS = [
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
];

const TABS = [
  { id: 'regulation', labelKey: 'nav.regulation', icon: '\u{1F5FA}\uFE0F' },
  { id: 'faq',        label: 'New to Digital Assets?', icon: '\u{1F195}' },
  { id: 'learn',      labelKey: 'nav.learn',      icon: '\u{1F4DA}' },
  { id: 'news',       labelKey: 'nav.news',       icon: '\u{1F4F0}' },
  { id: 'trade',      labelKey: 'nav.trade',      icon: '\u{1F4B9}' },
  { id: 'ttse',       labelKey: 'nav.ttse',       icon: '\u{1F1F9}\u{1F1F9}', ttse: true },
  { id: 'insights',   labelKey: 'nav.insights',   icon: '\u{1F310}' },
  { id: 'market',     labelKey: 'nav.market',     icon: '\u{1F4CA}' },
  { id: 'portfolio',  labelKey: 'nav.portfolio',  icon: '\u{1F392}' },
];

function shortenAddress(addr) {
  if (!addr || !isValidSolanaAddress(addr)) return '???';
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const { activeTab, setActiveTab, connectWallet, disconnectWallet, theme, setTheme } = useStore();
  const { setTabIndex } = useNavigationDirection();
  const hasUnreadNews = useHasUnreadNews();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showLimeMenu, setShowLimeMenu] = useState(false);

  const handleTabNav = (tabId) => {
    const idx = TABS.findIndex(t => t.id === tabId);
    if (idx >= 0) setTabIndex(idx);
    setActiveTab(tabId);
  };
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const currentLang = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  // Wallet standard hooks (called at top level — never inside callbacks)
  const wallets = useWallets();
  const [selectedAccount, setSelectedAccount] = useSelectedWalletAccount();

  // Network toggle
  const { cluster, setCluster, label: clusterLabel } = useCluster();

  const LIME_TABS = [
    { id: 'about', label: 'About', icon: '📖' },
    { id: 'competition', label: 'Competition', icon: '🏆' },
    { id: 'points', label: 'Points', icon: '🍋' },
    { id: 'tokenomics', label: 'Tokenomics', icon: '📊' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'community', label: 'Community', icon: '🌴' },
    { id: 'listing', label: 'List Your Company', icon: '🏛️' },
    { id: 'flywheel', label: 'LP Flywheel', icon: '🔄' },
    { id: 'squeeze', label: 'Agent Squeeze', icon: '🤖' },
  ];
  const isLimeTab = LIME_TABS.some(t => t.id === activeTab);

  // Connection state derived from wallet-standard only
  const isConnected = !!selectedAccount;
  const displayAddress = selectedAccount?.address || null;
  const safeDisplayAddress = displayAddress && isValidSolanaAddress(displayAddress) ? displayAddress : null;

  function handleWalletClick() {
    if (isConnected) {
      setShowWalletMenu(!showWalletMenu);
      return;
    }
    if (wallets.length > 0) {
      setShowWalletPicker(true);
    } else {
      window.open(SOLFLARE_LINK, '_blank', 'noopener');
    }
  }

  function handleWalletConnected(account) {
    if (account?.address && isValidSolanaAddress(account.address)) {
      setSelectedAccount(account);
      connectWallet(account.address);
    }
    setShowWalletPicker(false);
    setShowWalletMenu(false);
  }

  function handleDisconnect() {
    setSelectedAccount(undefined);
    disconnectWallet();
    setShowWalletMenu(false);
  }

  const explorerUrl = safeDisplayAddress ? getAccountExplorerUrl(safeDisplayAddress, cluster) : null;

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border"
        style={{ background: 'rgba(13,14,16,.93)' }}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-7 h-14 md:h-16 flex items-center gap-3 md:gap-4">

          {/* Logo — click to go to Dashboard */}
          <div onClick={() => handleTabNav('dashboard')}
            className="font-headline text-[1.2rem] md:text-[1.45rem] font-black italic tracking-tight whitespace-nowrap text-txt select-none cursor-pointer hover:opacity-80 transition-opacity">
            Limer's&nbsp;<span className="text-gold">Capital</span>
          </div>

          {/* ── Desktop nav ── hidden on mobile */}
          <nav className="hidden md:flex gap-1 flex-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabNav(tab.id)}
                className={`
                  px-3.5 py-1.5 rounded-md text-[.72rem] uppercase tracking-widest
                  font-headline transition-all cursor-pointer border-none
                  ${activeTab === tab.id
                    ? tab.ttse ? 'text-[#FF4D6D] bg-[rgba(200,16,46,.1)]' : 'text-sea bg-sea/12'
                    : 'text-muted bg-transparent hover:text-txt hover:bg-sea/8'
                  }
                `}
              >
                {tab.icon} {tab.label || t(tab.labelKey)}
                {tab.id === 'news' && hasUnreadNews && activeTab !== 'news' && (
                  <UnreadDot size={6} className="ml-1.5" />
                )}
              </button>
            ))}
          </nav>

          {/* ── Desktop $LIMER dropdown ── hidden on mobile */}
          <div className="relative hidden md:block">
            <button onClick={() => setShowLimeMenu(!showLimeMenu)}
              className={`px-3 py-1.5 rounded-md text-[.72rem] uppercase tracking-widest font-headline transition-all cursor-pointer border-none
                ${isLimeTab ? 'text-[#2D9B56] bg-[rgba(45,155,86,.12)]' : 'text-[#2D9B56] bg-transparent hover:bg-[rgba(45,155,86,.08)]'}`}>
              🍋 $LIMER ▾
            </button>
            {showLimeMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border p-1.5 z-50"
                style={{ background: 'var(--color-night-2)', boxShadow: '0 8px 28px rgba(0,0,0,.5)' }}>
                {LIME_TABS.map(t => (
                  <button key={t.id}
                    onClick={() => { handleTabNav(t.id); setShowLimeMenu(false); }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-[.75rem] font-headline cursor-pointer border-none transition-all
                      ${activeTab === t.id ? 'text-[#2D9B56] bg-[rgba(45,155,86,.12)]' : 'text-txt-2 bg-transparent hover:text-txt hover:bg-white/5'}`}>
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Desktop right side ── hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <XPBar />
            <LPBar />

            {/* Divider */}
            <div className="w-px h-7 bg-white/10 flex-shrink-0" />

            {/* Network toggle */}
            <button
              onClick={() => setCluster(cluster === 'devnet' ? 'mainnet-beta' : 'devnet')}
              aria-label={`Switch to ${cluster === 'devnet' ? 'mainnet' : 'devnet'} — currently on ${clusterLabel}`}
              title={`Switch to ${cluster === 'devnet' ? 'mainnet' : 'devnet'}`}
              className={`px-2.5 py-1 rounded-md text-[.65rem] uppercase tracking-widest font-headline cursor-pointer border transition-all
                ${cluster === 'devnet'
                  ? 'text-[#FFB347] bg-[rgba(255,179,71,.08)] border-[rgba(255,179,71,.25)] hover:bg-[rgba(255,179,71,.15)]'
                  : 'text-up bg-up/8 border-up/25 hover:bg-up/15'
                }`}
            >
              {clusterLabel}
            </button>

            {/* Wam — TTD Top-up */}
            <a href={WAM_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[rgba(255,215,0,.08)] border border-[rgba(255,215,0,.28)]
                rounded-lg px-3 py-1.5 text-[.72rem] font-body font-bold text-[#FFD700]
                transition-all hover:bg-[rgba(255,215,0,.14)] hover:border-[rgba(255,215,0,.45)]
                hover:-translate-y-px no-underline cursor-pointer"
              style={{ boxShadow: '0 0 10px rgba(255,215,0,.08)' }}>
              <span className="w-4 h-4 rounded bg-[#FFD700] flex items-center justify-center text-[.5rem] font-black text-night flex-shrink-0">W</span>
              <span>Wam</span>
            </a>

            {/* Desktop wallet button */}
            <div className="relative">
              <button onClick={handleWalletClick}
                className={`flex items-center gap-2 border-none cursor-pointer font-body font-extrabold text-[.8rem]
                  px-4 py-2 rounded-[10px] transition-all
                  ${isConnected
                    ? 'bg-[linear-gradient(135deg,rgba(0,255,163,.18),rgba(0,255,163,.09))] border border-up/40 text-up hover:bg-up/20 neon-glow-primary'
                    : 'bg-[linear-gradient(135deg,#FC5C3E,#FF8C42)] text-white hover:-translate-y-0.5'
                  }`}
                style={isConnected
                  ? { boxShadow: '0 0 12px rgba(0,255,163,.2)' }
                  : { boxShadow: '0 0 20px rgba(252,92,62,.3), 0 2px 8px rgba(0,0,0,.3)' }
                }>
                {isConnected ? (
                  <span className="flex flex-col leading-tight">
                    <span>{shortenAddress(safeDisplayAddress)}</span>
                    <span className="text-[.58rem] font-normal opacity-75">Connected</span>
                  </span>
                ) : (
                  <span className="flex flex-col leading-tight">
                    <span>{wallets.length > 0 ? t('nav.connect') : 'Get Wallet'}</span>
                    <span className="text-[.58rem] font-normal opacity-75">
                      {wallets.length > 0 ? `${wallets.length} wallet${wallets.length > 1 ? 's' : ''} detected` : 'Solana Wallet'}
                    </span>
                  </span>
                )}
              </button>

              {/* Wallet picker dropdown */}
              {showWalletPicker && !isConnected && (
                <div className="absolute right-0 top-full mt-2 rounded-xl border border-border p-2 z-50"
                  style={{ background: 'var(--color-night-2)', boxShadow: '0 8px 28px rgba(0,0,0,.5)', width: 'min(14rem, calc(100vw - 1.5rem))' }}>
                  <div className="text-[.68rem] text-muted mb-2 px-2">Select a wallet</div>
                  {wallets
                    .filter(w => w.features.includes('standard:connect'))
                    .map((wallet) => (
                      <WalletOption key={wallet.name} wallet={wallet} onConnected={handleWalletConnected} />
                    ))
                  }
                  {wallets.filter(w => w.features.includes('standard:connect')).length === 0 && (
                    <div className="text-[.66rem] text-muted text-center py-3">No compatible wallets detected</div>
                  )}
                  <div className="border-t border-border mt-1 pt-1">
                    <a href={SOLFLARE_LINK} target="_blank" rel="noopener noreferrer"
                      className="block text-[.68rem] text-muted hover:text-txt no-underline px-2 py-1.5 transition-colors">
                      Don't have a wallet? Get Solflare
                    </a>
                  </div>
                </div>
              )}

              {/* Connected wallet dropdown */}
              {isConnected && showWalletMenu && (
                <div className="absolute right-0 top-full mt-2 rounded-xl border border-border p-3 z-50"
                  style={{ background: 'var(--color-night-2)', boxShadow: '0 8px 28px rgba(0,0,0,.5)', width: 'min(13rem, calc(100vw - 1.5rem))' }}>
                  <div className="text-[.68rem] text-muted mb-1">Connected Wallet</div>
                  <div className="text-[.76rem] text-txt font-mono break-all mb-1">{safeDisplayAddress}</div>
                  <div className="text-[.6rem] text-muted mb-3">
                    {cluster === 'devnet' ? 'Devnet — no real funds' : 'Mainnet'}
                  </div>
                  {explorerUrl && (
                    <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                      className="block text-[.72rem] text-sea hover:text-txt no-underline mb-2 transition-colors">
                      View on Solscan ↗
                    </a>
                  )}
                  <a href={WAM_LINK} target="_blank" rel="noopener noreferrer"
                    className="block text-[.72rem] text-[#FFD700] hover:text-txt no-underline mb-3 transition-colors">
                    Top up with Wam ↗
                  </a>
                  <button onClick={handleDisconnect}
                    className="w-full text-[.72rem] text-down bg-down/10 border border-down/25
                      rounded-lg py-1.5 cursor-pointer font-headline hover:bg-down hover:text-white transition-all">
                    {t('nav.disconnect')}
                  </button>
                </div>
              )}
            </div>

            {/* Language picker */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-[.72rem] font-headline cursor-pointer bg-transparent text-muted hover:text-txt hover:border-white/20 transition-all"
                aria-label={t('common.language')}
                title={t('common.language')}
              >
                <span>{currentLang.flag}</span>
                <span className="text-[.6rem] uppercase tracking-widest">{currentLang.label}</span>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-1 rounded-xl border border-border p-1 z-50"
                  style={{ background: 'var(--color-night-2)', boxShadow: '0 8px 28px rgba(0,0,0,.5)', minWidth: '7rem' }}>
                  {LANGS.map(lang => (
                    <button key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code); setShowLangMenu(false); }}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-[.75rem] font-headline cursor-pointer border-none transition-all
                        ${i18n.language === lang.code ? 'text-sea bg-sea/12' : 'text-txt-2 bg-transparent hover:text-txt hover:bg-white/5'}`}>
                      <span>{lang.flag}</span> {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted hover:text-txt hover:border-white/20 transition-all cursor-pointer bg-transparent text-[.88rem]"
            >
              <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 bg-sea/10 border border-border rounded-full px-3 py-1.5 text-[.7rem] text-sea">
              <span className="w-1.5 h-1.5 rounded-full bg-up" style={{ boxShadow: '0 0 6px var(--color-up)' }} />
              Live
            </div>
          </div>

          {/* ── Mobile right side ── hidden on desktop */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            {/* Compact wallet button */}
            <button
              onClick={handleWalletClick}
              className={`flex items-center gap-1.5 border-none cursor-pointer font-body font-bold text-[.72rem]
                px-3 py-1.5 rounded-lg transition-all
                ${isConnected
                  ? 'bg-[rgba(0,255,163,.15)] text-up border border-up/35 neon-glow-primary'
                  : 'bg-[linear-gradient(135deg,#FC5C3E,#FF8C42)] text-white'
                }`}
              style={isConnected ? { boxShadow: '0 0 8px rgba(0,255,163,.15)' } : {}}
            >
              {isConnected ? shortenAddress(safeDisplayAddress) : 'Connect'}
            </button>

            {/* More menu (dots) */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-border cursor-pointer press-scale"
              aria-label="Open navigation menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-txt">
                <circle cx="3" cy="8" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="13" cy="8" r="1.5" />
              </svg>
            </button>
          </div>

        </div>

        {/* Close menus when clicking outside */}
        {(showWalletMenu || showLimeMenu || showWalletPicker || showLangMenu) && (
          <div className="fixed inset-0 z-40" onClick={() => { setShowWalletMenu(false); setShowLimeMenu(false); setShowWalletPicker(false); setShowLangMenu(false); }} />
        )}
      </header>

      {/* Mobile nav drawer */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        isConnected={isConnected}
        displayAddress={safeDisplayAddress}
        onWalletClick={handleWalletClick}
      />

      {/* Mobile wallet picker (appears above drawer if triggered from mobile) */}
      {showWalletPicker && !isConnected && (
        <div className="fixed inset-x-4 bottom-4 z-[80] rounded-xl border border-border p-3"
          style={{ background: 'var(--color-night-2)', boxShadow: '0 8px 28px rgba(0,0,0,.6)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[.72rem] text-muted">Select a wallet</div>
            <button onClick={() => setShowWalletPicker(false)} className="text-muted text-sm cursor-pointer border-none bg-transparent">✕</button>
          </div>
          {wallets
            .filter(w => w.features.includes('standard:connect'))
            .map((wallet) => (
              <WalletOption key={wallet.name} wallet={wallet} onConnected={handleWalletConnected} />
            ))
          }
          {wallets.filter(w => w.features.includes('standard:connect')).length === 0 && (
            <div className="text-[.66rem] text-muted text-center py-3">No compatible wallets detected</div>
          )}
          <div className="border-t border-border mt-1 pt-1">
            <a href={SOLFLARE_LINK} target="_blank" rel="noopener noreferrer"
              className="block text-[.68rem] text-muted hover:text-txt no-underline px-2 py-1.5 transition-colors">
              Don't have a wallet? Get Solflare
            </a>
          </div>
        </div>
      )}
    </>
  );
}

// Each wallet gets its own component so useConnect is called at top level (Rules of Hooks)
function WalletOption({ wallet, onConnected }) {
  const [isConnecting, connect] = useConnect(wallet);

  async function handleClick() {
    try {
      const accounts = await connect();
      if (accounts.length > 0) {
        onConnected(accounts[0]);
      }
    } catch (err) {
      // User rejected or wallet incompatible — log for debugging
      if (err?.message && !err.message.includes('rejected')) {
        console.warn('[Wallet] Connection failed:', err.message);
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className="w-full text-left flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-[.76rem] font-headline
        cursor-pointer border-none text-txt bg-transparent hover:bg-white/5 transition-all disabled:opacity-50"
    >
      {wallet.icon && (
        <img src={wallet.icon} alt="" className="w-5 h-5 rounded flex-shrink-0" />
      )}
      <span>{wallet.name}</span>
      {isConnecting && <span className="text-[.6rem] text-muted ml-auto">Connecting...</span>}
    </button>
  );
}
