/**
 * React hook for subscribing to Pyth WebSocket price streaming.
 *
 * Uses useSyncExternalStore for tear-free, concurrent-safe subscriptions.
 * Falls back gracefully to REST polling when WebSocket is unavailable.
 *
 * Usage:
 *   const { price, confidence, isStreaming } = usePythPrice('SOL');
 *   const { price } = usePythPrice('0xef0d8b...'); // by feed ID
 */

import { useSyncExternalStore, useCallback, useRef, useMemo } from 'react';
import { getPythStream, getFeedIdForSymbol, PYTH_FEED_IDS, PYTH_SYMBOL_ALIASES } from './pyth-ws';

const EMPTY_SNAPSHOT = Object.freeze({
  price: null,
  confidence: null,
  timestamp: null,
  symbol: null,
  feedId: null,
  isStreaming: false,
});

/**
 * Subscribe to real-time Pyth price for a token.
 *
 * @param {string|null} symbolOrFeedId  Token symbol ('SOL', 'BTC', 'ETH', 'GOLD')
 *                                       or Pyth feed ID (hex string). null = disabled.
 * @returns {{ price: number|null, confidence: number|null, timestamp: number|null,
 *             symbol: string|null, isStreaming: boolean }}
 */
export function usePythPrice(symbolOrFeedId) {
  // Resolve to feed ID
  const feedId = symbolOrFeedId
    ? (symbolOrFeedId.startsWith('0x') ? symbolOrFeedId : getFeedIdForSymbol(symbolOrFeedId))
    : null;

  // Ref to hold the latest snapshot (avoids unnecessary re-renders)
  const snapshotRef = useRef(EMPTY_SNAPSHOT);

  const subscribe = useCallback(
    (onStoreChange) => {
      if (!feedId) return () => {};

      const stream = getPythStream();

      // Initialize from cache
      const cached = stream.getLatest(feedId);
      if (cached) {
        snapshotRef.current = cached;
      }

      const unsubscribe = stream.onPrice(feedId, (entry) => {
        // Only trigger re-render if price actually changed
        const prev = snapshotRef.current;
        if (prev.price !== entry.price || prev.isStreaming !== entry.isStreaming) {
          snapshotRef.current = entry;
          onStoreChange();
        }
      });

      return unsubscribe;
    },
    [feedId]
  );

  const getSnapshot = useCallback(() => {
    if (!feedId) return EMPTY_SNAPSHOT;
    return snapshotRef.current;
  }, [feedId]);

  // Server snapshot (SSR) — always return empty
  const getServerSnapshot = useCallback(() => EMPTY_SNAPSHOT, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Subscribe to multiple Pyth prices at once.
 * Returns a map of symbol → price data.
 *
 * @param {string[]} symbols  Array of token symbols ['SOL', 'BTC', 'ETH']
 * @returns {Object.<string, { price: number|null, confidence: number|null, isStreaming: boolean }>}
 */
export function usePythPrices(symbols) {
  const results = {};
  // This calls usePythPrice in a loop, which is fine because
  // the array length is static (never changes between renders)
  for (const sym of symbols) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[sym] = usePythPrice(sym);
  }
  return results;
}

/**
 * Check if Pyth WebSocket streaming is active.
 */
const STREAM_STATUS_OFFLINE = Object.freeze({ isStreaming: false, isFallback: false });

export function usePythStreamStatus() {
  const snapshotRef = useRef(STREAM_STATUS_OFFLINE);

  const subscribe = useCallback((onStoreChange) => {
    // Poll the stream status every second
    const interval = setInterval(() => {
      const stream = getPythStream();
      const prev = snapshotRef.current;
      if (prev.isStreaming !== stream.isStreaming || prev.isFallback !== stream.isFallback) {
        snapshotRef.current = { isStreaming: stream.isStreaming, isFallback: stream.isFallback };
        onStoreChange();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getSnapshot = useCallback(() => snapshotRef.current, []);
  const getServerSnapshot = useCallback(() => STREAM_STATUS_OFFLINE, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
