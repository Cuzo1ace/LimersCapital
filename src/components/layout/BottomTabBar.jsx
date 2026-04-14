import { motion } from 'framer-motion';
import useStore from '../../store/useStore';
import useScrollDirection from '../../hooks/useScrollDirection';

const TABS = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 3l9 9" />
        <path d="M5 10v9a1 1 0 001 1h3v-5a1 1 0 011-1h4a1 1 0 011 1v5h3a1 1 0 001-1v-9" />
        {active && <path d="M5 10v9a1 1 0 001 1h3v-5a1 1 0 011-1h4a1 1 0 011 1v5h3a1 1 0 001-1v-9" fill="currentColor" opacity="0.2" />}
      </svg>
    ),
  },
  {
    id: 'learn',
    label: 'Learn',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" />
        {active && <>
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3z" fill="currentColor" opacity="0.2" />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" fill="currentColor" opacity="0.2" />
        </>}
      </svg>
    ),
  },
  {
    id: 'trade',
    label: 'Trade',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 10l5-6 5 6" />
        <path d="M7 14l5 6 5-6" />
        {active && <>
          <path d="M7 10l5-6 5 6z" fill="currentColor" opacity="0.2" />
          <path d="M7 14l5 6 5-6z" fill="currentColor" opacity="0.2" />
        </>}
      </svg>
    ),
  },
  {
    id: 'market',
    label: 'Market',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
        <polyline points="16,7 22,7 22,13" />
        {active && <path d="M2 17l6.5-6.5 5 5L22 7v6H16z" fill="currentColor" opacity="0.15" />}
      </svg>
    ),
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 14h4" />
        {active && <rect x="2" y="6" width="20" height="14" rx="2" fill="currentColor" opacity="0.15" />}
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const activeTab = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);
  const { direction, isAtTop } = useScrollDirection();

  const isVisible = direction !== 'down' || isAtTop;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around
        backdrop-blur-xl border-t border-border transition-transform duration-300"
      style={{
        height: 56,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(13,14,16,0.93)',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      }}
      aria-label="Main navigation"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-12 bg-transparent border-none cursor-pointer"
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Spotlight glow behind active tab */}
            {isActive && (
              <motion.div
                layoutId="tab-spotlight"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'rgba(0,255,163,0.08)',
                  boxShadow: '0 0 20px rgba(0,255,163,0.12)',
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}

            <motion.span
              className={`relative z-10 ${isActive ? 'text-sea' : 'text-muted'}`}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {tab.icon(isActive)}
            </motion.span>

            {isActive && (
              <motion.span
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 text-[.58rem] font-headline font-semibold text-sea"
              >
                {tab.label}
              </motion.span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
