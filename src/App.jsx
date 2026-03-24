import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/layout/Header';
import PriceTicker from './components/PriceTicker';
import ErrorBoundary from './components/ErrorBoundary';
import RewardToast from './components/gamification/RewardToast';
import DashboardPage from './pages/DashboardPage';
import MarketPage from './pages/MarketPage';
import TTSEPage from './pages/TTSEPage';
import RegulationPage from './pages/RegulationPage';
import TradePage from './pages/TradePage';
import PortfolioPage from './pages/PortfolioPage';
import LearnPage from './pages/LearnPage';
import InsightsPage from './pages/InsightsPage';
import PointsPage from './pages/PointsPage';
import TokenomicsPage from './pages/TokenomicsPage';
import RevenuePage from './pages/RevenuePage';
import CommunityPage from './pages/CommunityPage';
import ListingPage from './pages/ListingPage';
import AgentSqueezePage from './pages/AgentSqueezePage';
import FlywheelPage from './pages/FlywheelPage';
import useStore from './store/useStore';
import LimerBridge from './components/solana/LimerBridge';
import PriceAlertChecker from './components/PriceAlertChecker';
import OnboardingTour from './components/OnboardingTour';
import NetworkStatus from './components/NetworkStatus';
import { initAnalytics, track } from './analytics/track';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function TabContent() {
  const activeTab = useStore(s => s.activeTab);

  // Fire page_viewed analytics on every tab change
  useEffect(() => {
    track('page_viewed', { tab: activeTab });
  }, [activeTab]);

  switch (activeTab) {
    case 'dashboard': return <DashboardPage />;
    case 'market': return <MarketPage />;
    case 'ttse': return <TTSEPage />;
    case 'regulation': return <RegulationPage />;
    case 'trade': return <TradePage />;
    case 'portfolio': return <PortfolioPage />;
    case 'learn': return <LearnPage />;
    case 'insights': return <InsightsPage />;
    case 'points': return <PointsPage />;
    case 'tokenomics': return <TokenomicsPage />;
    case 'revenue': return <RevenuePage />;
    case 'community': return <CommunityPage />;
    case 'listing': return <ListingPage />;
    case 'squeeze': return <AgentSqueezePage />;
    case 'flywheel': return <FlywheelPage />;
    default: return <DashboardPage />;
  }
}

function StreakCheck() {
  const checkDailyStreak = useStore(s => s.checkDailyStreak);
  const migrateToLP      = useStore(s => s._migrateToLP);
  const incrementSession = useStore(s => s.incrementSession);
  useEffect(() => {
    initAnalytics();                         // PostHog CDN load if VITE_POSTHOG_KEY set
    try { checkDailyStreak(); } catch {}
    try { migrateToLP(); } catch {}
    try { incrementSession(); } catch {}
  }, []);
  return null;
}

function ReferralHandler() {
  const applyReferral = useStore(s => s.applyReferral);
  const setActiveTab  = useStore(s => s.setActiveTab);
  useEffect(() => {
    const match = window.location.pathname.match(/^\/ref\/([A-Za-z0-9_-]+)/);
    if (!match) return;
    const code = match[1].toUpperCase();
    applyReferral(code);
    setActiveTab('market');
    window.history.replaceState({}, '', '/');
  }, []);
  return null;
}

function ThemeSync() {
  const theme = useStore(s => s.theme);
  const prev = useRef(theme);
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'light') document.documentElement.classList.add('light');
    prev.current = theme;
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkStatus />
      <StreakCheck />
      <ReferralHandler />
      <ThemeSync />
      <LimerBridge />
      <PriceAlertChecker />
      <OnboardingTour />
      <Header />
      <PriceTicker />
      <main className="relative z-[1] px-3 py-4 md:p-7 max-w-[1440px] mx-auto">
        <ErrorBoundary>
          <TabContent />
        </ErrorBoundary>
      </main>
      <RewardToast />
    </QueryClientProvider>
  );
}
