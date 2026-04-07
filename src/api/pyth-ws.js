/**
 * Pyth WebSocket Price Streaming Service
 *
 * Manages a persistent WebSocket connection to Pyth Hermes for
 * sub-second price updates. Replaces 2-12s REST polling with
 * real-time streaming for SOL, BTC, ETH, and GOLD.
 *
 * Architecture:
 *   Singleton PythPriceStream → wss://hermes.pyth.network/ws
 *   React hooks subscribe via onPrice(feedId, callback)
 *   Graceful fallback to REST polling on WebSocket failure
 *
 * @see https://docs.pyth.network/price-feeds
 */

const HERMES_WS_URL = 'wss://hermes.pyth.network/ws';

// Feed IDs (same as src/api/prices.js PYTH_FEEDS)
export const PYTH_FEED_IDS = {
  SOL:  '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  BTC:  '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH:  '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  GOLD: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
};

// Also map zBTC/WETH aliases (used in prices.js)
export const PYTH_SYMBOL_ALIASES = {
  zBTC: 'BTC',
  WETH: 'ETH',
};

// Reverse map: feedId (no 0x) → symbol
const FEED_ID_TO_SYMBOL = {};
for (const [sym, id] of Object.entries(PYTH_FEED_IDS)) {
  FEED_ID_TO_SYMBOL[id.replace('0x', '')] = sym;
}

/**
 * Singleton Pyth WebSocket price stream manager.
 */
class PythPriceStream {
  constructor() {
    this._ws = null;
    this._listeners = new Map(); // feedId → Set<callback>
    this._cache = new Map();     // feedId → { price, confidence, expo, timestamp }
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 5;
    this._reconnectTimer = null;
    this._connected = false;
    this._fallbackToRest = false;
    this._subscribedFeeds = new Set();
    this._visibilityHandler = null;
  }

  /**
   * Subscribe to price updates for a feed.
   * Returns an unsubscribe function.
   */
  onPrice(feedId, callback) {
    const normalizedId = feedId.startsWith('0x') ? feedId : `0x${feedId}`;

    if (!this._listeners.has(normalizedId)) {
      this._listeners.set(normalizedId, new Set());
    }
    this._listeners.get(normalizedId).add(callback);

    // Start connection if not already connected
    if (!this._ws && !this._fallbackToRest) {
      this._connect();
    }

    // Send cached value immediately if available
    const cached = this._cache.get(normalizedId);
    if (cached) {
      try { callback(cached); } catch {}
    }

    // Ensure this feed is subscribed on the WebSocket
    if (!this._subscribedFeeds.has(normalizedId) && this._connected) {
      this._subscribeFeeds([normalizedId]);
    }

    // Return unsubscribe function
    return () => {
      const set = this._listeners.get(normalizedId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this._listeners.delete(normalizedId);
        }
      }

      // Disconnect if no more listeners
      if (this._listeners.size === 0) {
        this._scheduleDisconnect();
      }
    };
  }

  /**
   * Get the latest cached price for a feed.
   */
  getLatest(feedId) {
    const normalizedId = feedId.startsWith('0x') ? feedId : `0x${feedId}`;
    return this._cache.get(normalizedId) || null;
  }

  /**
   * Get the latest price by symbol (SOL, BTC, ETH, GOLD).
   */
  getLatestBySymbol(symbol) {
    const resolvedSymbol = PYTH_SYMBOL_ALIASES[symbol] || symbol;
    const feedId = PYTH_FEED_IDS[resolvedSymbol];
    if (!feedId) return null;
    return this.getLatest(feedId);
  }

  /** Whether the WebSocket is currently connected and streaming */
  get isStreaming() {
    return this._connected && !this._fallbackToRest;
  }

  /** Whether we've fallen back to REST due to WebSocket failures */
  get isFallback() {
    return this._fallbackToRest;
  }

  // ── Internal ─────────────────────────────────────────────

  _connect() {
    if (this._ws) return;

    try {
      this._ws = new WebSocket(HERMES_WS_URL);
    } catch (e) {
      console.warn('[Pyth WS] Failed to create WebSocket:', e.message);
      this._handleReconnect();
      return;
    }

    this._ws.onopen = () => {
      console.log('[Pyth WS] Connected');
      this._connected = true;
      this._reconnectAttempts = 0;
      this._fallbackToRest = false;

      // Subscribe to all feeds that have listeners
      const feedIds = [...this._listeners.keys()];
      if (feedIds.length > 0) {
        this._subscribeFeeds(feedIds);
      } else {
        // Subscribe to all known feeds by default
        this._subscribeFeeds(Object.values(PYTH_FEED_IDS));
      }

      // Set up visibility handler to save bandwidth
      this._setupVisibilityHandler();
    };

    this._ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this._handleMessage(data);
      } catch {}
    };

    this._ws.onclose = (event) => {
      console.log('[Pyth WS] Disconnected:', event.code, event.reason);
      this._connected = false;
      this._ws = null;
      this._subscribedFeeds.clear();

      // Only reconnect if we still have listeners
      if (this._listeners.size > 0) {
        this._handleReconnect();
      }
    };

    this._ws.onerror = () => {
      // onclose will fire after onerror
    };
  }

  _handleMessage(data) {
    // Hermes sends price updates in the `parsed` array
    if (data.type === 'price_update' && data.price_feed) {
      this._processPriceFeed(data.price_feed);
    }

    // Batch response format
    if (data.parsed && Array.isArray(data.parsed)) {
      for (const feed of data.parsed) {
        this._processPriceFeed(feed);
      }
    }
  }

  _processPriceFeed(feed) {
    if (!feed?.id || !feed?.price) return;

    const feedId = feed.id.startsWith('0x') ? feed.id : `0x${feed.id}`;
    const rawPrice = Number(feed.price.price);
    const expo = Number(feed.price.expo);
    const rawConf = Number(feed.price.conf);
    const scale = Math.pow(10, expo);
    const price = rawPrice * scale;
    const confidence = rawConf * scale;
    const timestamp = Number(feed.price.publish_time) * 1000; // to ms

    if (price <= 0 || !Number.isFinite(price)) return;

    const symbol = FEED_ID_TO_SYMBOL[feed.id.replace('0x', '')] || null;

    const entry = { price, confidence, expo, timestamp, symbol, feedId, isStreaming: true };
    this._cache.set(feedId, entry);

    // Notify listeners
    const listeners = this._listeners.get(feedId);
    if (listeners) {
      for (const cb of listeners) {
        try { cb(entry); } catch {}
      }
    }
  }

  _subscribeFeeds(feedIds) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;

    const newFeeds = feedIds.filter(id => !this._subscribedFeeds.has(id));
    if (newFeeds.length === 0) return;

    // Hermes WebSocket subscription message
    const msg = JSON.stringify({
      type: 'subscribe',
      ids: newFeeds.map(id => id.replace('0x', '')),
    });

    this._ws.send(msg);
    for (const id of newFeeds) {
      this._subscribedFeeds.add(id);
    }
    console.log('[Pyth WS] Subscribed to', newFeeds.length, 'feeds');
  }

  _handleReconnect() {
    this._reconnectAttempts++;

    if (this._reconnectAttempts > this._maxReconnectAttempts) {
      console.warn('[Pyth WS] Max reconnect attempts reached — falling back to REST');
      this._fallbackToRest = true;
      // Notify listeners of fallback state
      for (const [feedId, cached] of this._cache) {
        if (cached) {
          cached.isStreaming = false;
          const listeners = this._listeners.get(feedId);
          if (listeners) {
            for (const cb of listeners) {
              try { cb(cached); } catch {}
            }
          }
        }
      }
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts - 1), 30000);
    console.log(`[Pyth WS] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts})`);

    clearTimeout(this._reconnectTimer);
    this._reconnectTimer = setTimeout(() => {
      this._connect();
    }, delay);
  }

  _setupVisibilityHandler() {
    if (this._visibilityHandler) return;

    this._visibilityHandler = () => {
      if (document.hidden) {
        // Tab hidden — disconnect to save bandwidth
        if (this._ws) {
          this._ws.close(1000, 'Tab hidden');
          this._ws = null;
          this._connected = false;
          this._subscribedFeeds.clear();
        }
      } else {
        // Tab visible — reconnect
        if (!this._ws && this._listeners.size > 0 && !this._fallbackToRest) {
          this._reconnectAttempts = 0; // Reset on manual visibility restore
          this._connect();
        }
      }
    };

    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  _scheduleDisconnect() {
    // Grace period before disconnecting (in case new subscribers come)
    setTimeout(() => {
      if (this._listeners.size === 0 && this._ws) {
        this._ws.close(1000, 'No subscribers');
        this._ws = null;
        this._connected = false;
        this._subscribedFeeds.clear();
        console.log('[Pyth WS] Disconnected — no subscribers');
      }
    }, 5000);
  }

  /**
   * Force disconnect and cleanup. Called on app unmount.
   */
  disconnect() {
    clearTimeout(this._reconnectTimer);
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
    if (this._ws) {
      this._ws.close(1000, 'Cleanup');
      this._ws = null;
    }
    this._connected = false;
    this._listeners.clear();
    this._cache.clear();
    this._subscribedFeeds.clear();
  }
}

// ── Singleton Instance ─────────────────────────────────────

let _instance = null;

export function getPythStream() {
  if (!_instance) {
    _instance = new PythPriceStream();
  }
  return _instance;
}

/**
 * Get a feed ID for a token symbol.
 * Handles aliases: zBTC → BTC, WETH → ETH
 */
export function getFeedIdForSymbol(symbol) {
  const resolved = PYTH_SYMBOL_ALIASES[symbol] || symbol;
  return PYTH_FEED_IDS[resolved] || null;
}
