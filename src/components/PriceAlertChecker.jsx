import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTradePrices } from '../api/prices';
import useStore from '../store/useStore';
import { useNewsFeed } from '../hooks/useNewsFeed';

export default function PriceAlertChecker() {
  const { priceAlerts, markAlertTriggered } = useStore();
  const permissionAsked = useRef(false);
  // Track which news items have already fired a notification (in-memory only).
  // We don't persist this because users don't want yesterday's headlines
  // re-firing after a page refresh.
  const notifiedNewsIds = useRef(new Set());

  // Piggybacks on the shared cache — no extra network call
  const { data: tokens } = useQuery({
    queryKey: ['trade-prices'],
    queryFn: fetchTradePrices,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!permissionAsked.current && 'Notification' in window && Notification.permission === 'default') {
      permissionAsked.current = true;
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!tokens?.length) return;
    const activeAlerts = priceAlerts.filter(a => !a.triggered);
    if (!activeAlerts.length) return;

    const priceMap = {};
    tokens.forEach(t => { priceMap[t.symbol.toUpperCase()] = t.current_price; });

    activeAlerts.forEach(alert => {
      const current = priceMap[alert.symbol];
      if (current == null) return;

      const hit =
        (alert.condition === 'above' && current >= alert.targetPrice) ||
        (alert.condition === 'below' && current <= alert.targetPrice);

      if (!hit) return;
      markAlertTriggered(alert.id);

      const body = `${alert.symbol} is $${current.toLocaleString('en-US', { maximumFractionDigits: 4 })} — target: ${alert.condition} $${alert.targetPrice.toLocaleString()}`;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🔔 Price Alert — ${alert.symbol}`, { body, icon: '/favicon.ico' });
      }
    });
  }, [tokens, priceAlerts]);

  // ── News-keyword alerts ───────────────────────────────────
  // Fires a browser notification when a freshly-ingested news item
  // mentions a ticker the user holds or has an open price alert on.
  // Dedup'd per-item-per-session via notifiedNewsIds.
  const holdings = useStore(s => s.holdings);
  const watchlist = useStore(s => s.watchlist);
  const interestedTickers = useStore(s => s.interestedTickers);
  const { items: newsItems } = useNewsFeed();

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!newsItems?.length) return;

    // Build the set of tickers we care about.
    // Priority: holdings + open price alerts + watchlist + interestedTickers
    const tickerSet = new Set();
    (holdings || []).forEach(h => h?.symbol && tickerSet.add(String(h.symbol).toUpperCase()));
    (priceAlerts || []).filter(a => !a.triggered).forEach(a => a?.symbol && tickerSet.add(String(a.symbol).toUpperCase()));
    (watchlist || []).forEach(s => s && tickerSet.add(String(s).toUpperCase()));
    (interestedTickers || []).forEach(s => s && tickerSet.add(String(s).toUpperCase()));
    if (!tickerSet.size) return;

    // Only consider items fresh enough to act on (last 12h).
    const recentCutoff = Date.now() - 12 * 3600_000;

    for (const item of newsItems) {
      if (notifiedNewsIds.current.has(item.id)) continue;
      const ts = new Date(item.published_at).getTime();
      if (ts < recentCutoff) continue;

      // Match 1: structured ticker list on the item
      const structuredHit = (item.tickers || []).find(t => tickerSet.has(String(t).toUpperCase()));
      // Match 2: $TICKER / #TICKER mention in the title (fallback when item.tickers is empty)
      const titleText = String(item.title || '');
      const keywordHit = structuredHit || [...tickerSet].find(t => {
        const re = new RegExp(`[$#]?\\b${t}\\b`, 'i');
        return re.test(titleText);
      });
      if (!keywordHit) continue;

      notifiedNewsIds.current.add(item.id);
      try {
        const n = new Notification(`📰 ${keywordHit} — news alert`, {
          body: item.title.slice(0, 140),
          icon: '/favicon.ico',
          tag: `news-${item.id}`,
        });
        n.onclick = () => {
          try { window.focus(); } catch {}
          if (item.source_url) window.open(item.source_url, '_blank', 'noopener,noreferrer');
          n.close();
        };
      } catch {}
    }
  }, [newsItems, holdings, priceAlerts, watchlist, interestedTickers]);

  return null;
}
