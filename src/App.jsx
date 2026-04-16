import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import PriceTicker from './components/PriceTicker';
import PageTransition, { NavigationDirectionProvider } from './components/layout/PageTransition';
import BackgroundGradient from './components/ui/BackgroundGradient';
import BottomTabBar from './components/layout/BottomTabBar';
import LandingPage from './components/landing/LandingPage';
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
import CompetitionPage from './pages/CompetitionPage';
import FlywheelPage from './pages/FlywheelPage';
import LegalPage from './pages/LegalPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import NewsPage from './pages/NewsPage';
import WeeklyDigestModal from './components/news/WeeklyDigestModal';
import useStore from './store/useStore';
import LimerBridge from './components/solana/LimerBridge';
import PriceAlertChecker from './components/PriceAlertChecker';
import OnboardingTour from './components/OnboardingTour';
import NetworkStatus from './components/NetworkStatus';
import AnnouncementBanner from './components/AnnouncementBanner';
import FeedbackWidget from './components/FeedbackWidget';
import InstallPrompt from './components/pwa/InstallPrompt';
import UpdatePrompt from './components/pwa/UpdatePrompt';
import OfflineIndicator from './components/pwa/OfflineIndicator';
import { initAnalytics, track } from './analytics/track';

// ── React Query defaults ──────────────────────────────────────────────
// Retry hardening after the Jupiter Price API v2 outage (Apr 2026):
// `retry: 2` with aggressive refetchIntervals compounded into a DoS-yourself
// storm when any upstream died. We now retry at most once, with exponential
// backoff capped at 30s, and skip retries entirely on 4xx responses
// (client errors aren't going to fix themselves by retrying).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = error?.status ?? error?.response?.status;
        if (status >= 400 && status < 500) return false; // don't retry client errors
        return failureCount < 1; // at most 1 retry (so 2 attempts total)
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      refetchOnWindowFocus: false,
      staleTime: 10_000,
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
    case 'competition': return <CompetitionPage />;
    case 'squeeze': return <AgentSqueezePage />;
    case 'flywheel': return <FlywheelPage />;
    case 'legal': return <RegulationPage />; // Legal merged into Regulation
    case 'about': return <AboutPage />;
    case 'faq': return <FAQPage />;
    case 'news': return <NewsPage />;
    default: return <DashboardPage />;
  }
}

function StreakCheck() {
  const checkDailyStreak = useStore(s => s.checkDailyStreak);
  const migrateToLP      = useStore(s => s._migrateToLP);
  const syncLessons      = useStore(s => s._syncLessonsFromQuizzes);
  const incrementSession = useStore(s => s.incrementSession);
  useEffect(() => {
    initAnalytics();                         // PostHog CDN load if VITE_POSTHOG_KEY set
    try { checkDailyStreak(); } catch {}
    try { migrateToLP(); } catch {}
    try { syncLessons(); } catch {}
    try { incrementSession(); } catch {}
  }, []);
  return null;
}

function NewUserRedirect() {
  const modulesCompleted = useStore(s => s.modulesCompleted);
  const hasSeenOnboarding = useStore(s => s.hasSeenOnboarding);
  const setActiveTab = useStore(s => s.setActiveTab);
  useEffect(() => {
    if (!hasSeenOnboarding && modulesCompleted.length === 0) {
      setActiveTab('learn');
    }
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
  const activeTab = useStore(s => s.activeTab);
  const landingDismissed = useStore(s => s.landingDismissed);
  const setLandingDismissed = useStore(s => s.setLandingDismissed);
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationDirectionProvider>
      <BackgroundGradient />
      <NetworkStatus />
      <StreakCheck />
      <ReferralHandler />
      <ThemeSync />
      {landingDismissed ? (
        <>
          <NewUserRedirect />
          <LimerBridge />
          <PriceAlertChecker />
          <OnboardingTour />
          <Header />
          <PriceTicker />
          <main className="relative z-[1] px-3 py-4 pb-20 md:p-7 md:pb-7 max-w-[1440px] mx-auto">
            <AnnouncementBanner />
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <PageTransition key={activeTab}>
                  <TabContent />
                </PageTransition>
              </AnimatePresence>
            </ErrorBoundary>
            <div className="text-center pt-6 pb-2">
              <a href="https://docs.limerscapital.com" target="_blank" rel="noopener noreferrer"
                 className="text-[.6rem] text-muted hover:text-sea transition-colors font-mono tracking-wider">
                docs ↗
              </a>
            </div>
          </main>
          <BottomTabBar />
          <FeedbackWidget />
          <InstallPrompt />
          <UpdatePrompt />
          <OfflineIndicator />
          <RewardToast />
          <WeeklyDigestModal />
        </>
      ) : (
        <ErrorBoundary>
          <LandingPage onLaunch={() => setLandingDismissed(true)} />
        </ErrorBoundary>
      )}
    </NavigationDirectionProvider>
    </QueryClientProvider>
  );
}
