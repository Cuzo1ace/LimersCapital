import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/layout/Header';
import ErrorBoundary from './components/ErrorBoundary';
import RewardToast from './components/gamification/RewardToast';
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
import useStore from './store/useStore';
import LimerBridge from './components/solana/LimerBridge';

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

  switch (activeTab) {
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
    default: return <MarketPage />;
  }
}

function StreakCheck() {
  const checkDailyStreak = useStore(s => s.checkDailyStreak);
  const migrateToLP = useStore(s => s._migrateToLP);
  useEffect(() => {
    try { checkDailyStreak(); } catch {}
    try { migrateToLP(); } catch {}
  }, []);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StreakCheck />
      <LimerBridge />
      <Header />
      <main className="relative z-[1] p-7 max-w-[1440px] mx-auto">
        <ErrorBoundary>
          <TabContent />
        </ErrorBoundary>
      </main>
      <RewardToast />
    </QueryClientProvider>
  );
}
