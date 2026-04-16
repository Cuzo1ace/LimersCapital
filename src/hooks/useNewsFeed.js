import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchNews, fetchEvents } from '../api/supabase';
import { EVERGREEN_NEWS } from '../data/evergreenNews';
import useStore from '../store/useStore';

const CACHE_KEY = 'news-cache-v1';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}
function writeCache(items) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, savedAt: Date.now() }));
  } catch {}
}

/**
 * Compute a client-side relevance score for a single news item.
 * Higher score = shown earlier in the feed.
 *
 * score = freshness + priority_boost + personalization + kind_weight
 *   freshness       = 100 * exp(-age_hours / 24)
 *   priority_boost  = item.priority (−100..100)
 *   personalization = 30 × ticker_match + 15 × tag_match + 10 × country_match
 *   kind_weight     = event<48h:+40, event<7d:+15, ai_summary:+5
 */
export function scoreItem(item, { tickers = [], tags = [], country = null } = {}) {
  const now = Date.now();
  const ageHours = Math.max(0, (now - new Date(item.published_at).getTime()) / 3600_000);
  const freshness = 100 * Math.exp(-ageHours / 24);
  const priority = Number(item.priority || 0);

  const tickerSet = new Set((tickers || []).map(String));
  const tagSet = new Set((tags || []).map(String));
  const tickerMatch = (item.tickers || []).some(t => tickerSet.has(t)) ? 1 : 0;
  const tagMatch = (item.tags || []).some(t => tagSet.has(t)) ? 1 : 0;
  const countryMatch = country && (item.countries || []).includes(country) ? 1 : 0;
  const personalization = 30 * tickerMatch + 15 * tagMatch + 10 * countryMatch;

  let kindWeight = 0;
  if (item.source_type === 'event' && item.event_at) {
    const hoursUntil = (new Date(item.event_at).getTime() - now) / 3600_000;
    if (hoursUntil > 0 && hoursUntil < 48) kindWeight = 40;
    else if (hoursUntil > 0 && hoursUntil < 24 * 7) kindWeight = 15;
  } else if (item.source_type === 'ai_summary') {
    kindWeight = 5;
  }

  return freshness + priority + personalization + kindWeight;
}

function rankAndFilter(items, { filter, tickers, tags, country }) {
  const filtered = items.filter(it => {
    if (filter === 'all') return true;
    if (filter === 'events') return it.source_type === 'event';
    if (filter === 'solana') return (it.tags || []).includes('solana');
    if (filter === 'ttse') return (it.tags || []).includes('ttse');
    if (filter === 'caribbean') return (it.tags || []).includes('caribbean');
    if (filter === 'learn') return (it.tags || []).includes('education') || (it.tags || []).includes('learn');
    return true;
  });
  return [...filtered]
    .map(it => ({ ...it, _score: scoreItem(it, { tickers, tags, country }) }))
    .sort((a, b) => b._score - a._score);
}

/**
 * Primary news feed hook.
 * Returns: { items, isLoading, isError, isFallback }
 *   - items        — ranked array, longest-first
 *   - isFallback   — true if Supabase returned empty / unreachable and we're
 *                    showing localStorage or evergreen data (badge shown in UI)
 */
export function useNewsFeed() {
  const filter = useStore(s => s.newsFilterChip);
  const tickers = useStore(s => s.interestedTickers);
  const country = useStore(s => s.userCountry);

  const q = useQuery({
    queryKey: ['news', 'feed'],
    queryFn: async () => {
      const rows = await fetchNews({ limit: 60 });
      if (Array.isArray(rows) && rows.length > 0) {
        writeCache(rows);
        return { items: rows, source: 'supabase' };
      }
      const cached = readCache();
      if (cached?.items?.length) return { items: cached.items, source: 'cache' };
      return { items: EVERGREEN_NEWS, source: 'evergreen' };
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
  });

  const ranked = useMemo(() => {
    const items = q.data?.items || EVERGREEN_NEWS;
    return rankAndFilter(items, { filter, tickers, country });
  }, [q.data, filter, tickers, country]);

  return {
    items: ranked,
    isLoading: q.isLoading,
    isError: q.isError,
    isFallback: q.data?.source !== 'supabase',
    source: q.data?.source ?? 'evergreen',
  };
}

/**
 * Upcoming events — simple freshness-sorted list, earliest first.
 */
export function useUpcomingEvents(limit = 5) {
  const q = useQuery({
    queryKey: ['news', 'events', limit],
    queryFn: async () => {
      const rows = await fetchEvents({ limit });
      if (Array.isArray(rows) && rows.length > 0) return rows;
      // Derive from evergreen (no events in evergreen list → empty)
      return EVERGREEN_NEWS.filter(i => i.source_type === 'event').slice(0, limit);
    },
    staleTime: 5 * 60_000,
  });
  return q.data || [];
}

/**
 * Unread indicator — returns true if any news item is newer than
 * the store's `newsLastSeenAt`. Uses the same cached query data to avoid
 * an extra request.
 */
export function useHasUnreadNews() {
  const lastSeen = useStore(s => s.newsLastSeenAt);
  const qc = useQueryClient();
  // Peek the cache without mounting a subscription — no queryFn required,
  // no extra fetches triggered from the header.
  const cached = qc.getQueryData(['news', 'feed']);
  const items = cached?.items || EVERGREEN_NEWS;
  if (!items.length) return false;
  const newest = items.reduce((max, it) => {
    const t = new Date(it.published_at).getTime();
    return t > max ? t : max;
  }, 0);
  if (!lastSeen) return true;
  return newest > new Date(lastSeen).getTime();
}
