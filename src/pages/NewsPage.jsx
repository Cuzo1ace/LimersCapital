import { useEffect } from 'react';
import useStore from '../store/useStore';
import { useNewsFeed } from '../hooks/useNewsFeed';
import BentoNewsGrid from '../components/news/BentoNewsGrid';
import EventsStrip from '../components/news/EventsStrip';
import FilterChips from '../components/news/FilterChips';
import MorningBrief from '../components/news/MorningBrief';

export default function NewsPage() {
  const filter = useStore(s => s.newsFilterChip);
  const setFilter = useStore(s => s.setNewsFilterChip);
  const openNewsTab = useStore(s => s.openNewsTab);

  // Mark tab seen + increment daily streak on mount (idempotent per day).
  useEffect(() => {
    openNewsTab();
  }, [openNewsTab]);

  const { items, isLoading, isFallback, source } = useNewsFeed();

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Page header */}
      <header className="mb-4">
        <h1 className="text-[1.4rem] md:text-[1.7rem] font-headline font-black text-txt leading-tight">
          📰 News &amp; Feed
        </h1>
        <p className="text-[.8rem] text-txt-2 mt-0.5">
          Caribbean crypto, Solana, and TTSE — everything you need to stay current without leaving.
        </p>
        {isFallback && (
          <div className="mt-2 text-[.66rem] text-muted inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB347]" />
            Showing {source === 'cache' ? 'cached' : 'offline'} items — latest will load when connection returns.
          </div>
        )}
      </header>

      {/* Morning Brief — once-per-UTC-day personalized 3-bullet summary */}
      <MorningBrief />

      {/* Filters */}
      <FilterChips value={filter} onChange={setFilter} />

      {/* Events strip (always visible when we have any upcoming events) */}
      <div className="mt-4">
        <EventsStrip />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-10 text-center text-muted text-[.8rem]">Loading feed…</div>
      )}

      {/* Bento grid (replaces old NewsHero + 3-col grid).
          - Top-priority item naturally lands as the 2×2 hero tile.
          - Text-only rows fall back to branded gradients per source.
          - Drag is playful & non-persistent. */}
      {!isLoading && (
        items.length === 0 ? (
          <div className="py-10 text-center text-muted text-[.8rem]">
            No items match this filter. Try{' '}
            <button onClick={() => setFilter('all')} className="text-sea underline underline-offset-2">All</button>.
          </div>
        ) : (
          <BentoNewsGrid items={items} />
        )
      )}

      {/* Footer disclaimer (appears once, low-key) */}
      <p className="mt-8 text-[.64rem] text-muted text-center leading-relaxed">
        Items aggregated from public sources and curated by Limer&apos;s editorial. Not financial advice — always verify before acting.
      </p>
    </div>
  );
}
