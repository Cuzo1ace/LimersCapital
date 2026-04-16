import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';
import useScrollDirection from '../../hooks/useScrollDirection';
import { useNavigationDirection } from './PageTransition';

const TABS = [
  {
    id: 'dashboard',
    label: 'Home',
    gradientFrom: '#00ffa3',
    gradientTo: '#2D9B56',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 3l9 9" />
        <path d="M5 10v9a1 1 0 001 1h3v-5a1 1 0 011-1h4a1 1 0 011 1v5h3a1 1 0 001-1v-9" />
        {active && <path d="M5 10v9a1 1 0 001 1h3v-5a1 1 0 011-1h4a1 1 0 011 1v5h3a1 1 0 001-1v-9" fill="currentColor" opacity="0.3" />}
      </svg>
    ),
  },
  {
    id: 'learn',
    label: 'Learn',
    gradientFrom: '#bf81ff',
    gradientTo: '#8b4fcf',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" />
        {active && <>
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3z" fill="currentColor" opacity="0.3" />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" fill="currentColor" opacity="0.3" />
        </>}
      </svg>
    ),
  },
  {
    id: 'trade',
    label: 'Trade',
    gradientFrom: '#FFCA3A',
    gradientTo: '#D4AF37',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 10l5-6 5 6" />
        <path d="M7 14l5 6 5-6" />
        {active && <>
          <path d="M7 10l5-6 5 6z" fill="currentColor" opacity="0.3" />
          <path d="M7 14l5 6 5-6z" fill="currentColor" opacity="0.3" />
        </>}
      </svg>
    ),
  },
  {
    id: 'market',
    label: 'Market',
    gradientFrom: '#00ffa3',
    gradientTo: '#00c882',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
        <polyline points="16,7 22,7 22,13" />
        {active && <path d="M2 17l6.5-6.5 5 5L22 7v6H16z" fill="currentColor" opacity="0.2" />}
      </svg>
    ),
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    gradientFrom: '#9945FF',
    gradientTo: '#6B2FBF',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 14h4" />
        {active && <rect x="2" y="6" width="20" height="14" rx="2" fill="currentColor" opacity="0.2" />}
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const activeTab = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);
  const { direction, isAtTop } = useScrollDirection();
  const { setTabIndex } = useNavigationDirection();

  const isVisible = direction !== 'down' || isAtTop;

  const handleTabClick = (tab, index) => {
    setTabIndex(index);
    setActiveTab(tab.id);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around px-3 gap-2
        backdrop-blur-xl border-t border-border transition-transform duration-300"
      style={{
        height: 60,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(13,14,16,0.95)',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      }}
      aria-label="Main navigation"
    >
      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => handleTabClick(tab, index)}
            className="relative flex items-center justify-center bg-transparent border-none cursor-pointer overflow-hidden gpu-accelerated"
            animate={{
              width: isActive ? 110 : 48,
              height: 44,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              borderRadius: 22,
              '--gf': tab.gradientFrom,
              '--gt': tab.gradientTo,
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Gradient background — visible only when active */}
            <motion.span
              className="absolute inset-0 rounded-[22px]"
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: `linear-gradient(135deg, ${tab.gradientFrom}, ${tab.gradientTo})`,
              }}
            />

            {/* Blur glow underneath — active only */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  className="absolute inset-x-1 top-2 h-full rounded-[22px] -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: `linear-gradient(135deg, ${tab.gradientFrom}, ${tab.gradientTo})`,
                    filter: 'blur(12px)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Icon — always visible, color changes */}
            <motion.span
              className="relative z-10 flex items-center justify-center"
              animate={{
                color: isActive ? '#0d0e10' : '#ababad',
                scale: isActive ? 0.9 : 1,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              whileTap={{ scale: 0.75 }}
            >
              {tab.icon(isActive)}
            </motion.span>

            {/* Label — slides in next to icon when active */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, width: 0, x: -4 }}
                  animate={{ opacity: 1, width: 'auto', x: 0 }}
                  exit={{ opacity: 0, width: 0, x: -4 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="relative z-10 text-[.68rem] font-headline font-bold text-night whitespace-nowrap overflow-hidden ml-1.5"
                >
                  {tab.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </nav>
  );
}
