import { useEffect, useRef, memo } from 'react';

/**
 * TradingView Ticker Tape Widget (Free)
 *
 * Professional scrolling price ticker with mini sparkline charts.
 * Replaces the custom CSS ticker with TradingView's live data feed.
 *
 * @param {Array} symbols     – Array of { proName, title } objects
 * @param {boolean} showChart – Show mini sparkline charts in ticker
 * @param {string} mode       – "all-tickers" or "adaptive" display mode
 */

const DEFAULT_SYMBOLS = [
  { proName: 'BINANCE:SOLUSDT',    title: 'SOL/USD' },
  { proName: 'BINANCE:BTCUSDT',    title: 'BTC/USD' },
  { proName: 'BINANCE:ETHUSDT',    title: 'ETH/USD' },
  { proName: 'BINANCE:JUPUSDT',    title: 'JUP/USD' },
  { proName: 'BINANCE:BONKUSDT',   title: 'BONK/USD' },
  { proName: 'BINANCE:RENDERUSDT', title: 'RENDER/USD' },
  { proName: 'BYBIT:ONDOUSDT',     title: 'ONDO/USD' },
  { proName: 'RAYDIUM:RAYUSDT',    title: 'RAY/USD' },
  { proName: 'BYBIT:PYTHUSDT',     title: 'PYTH/USD' },
  { proName: 'BYBIT:HNTUSDT',      title: 'HNT/USD' },
];

function TradingViewTicker({
  symbols = DEFAULT_SYMBOLS,
  showChart = true,
  mode = 'adaptive',
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: mode,
      colorTheme: 'dark',
      locale: 'en',
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container" ref={containerRef}
      style={{ background: 'rgba(13, 14, 16, 0.92)', borderBottom: '1px solid rgba(0,255,163,0.08)' }}
    />
  );
}

export default memo(TradingViewTicker);
