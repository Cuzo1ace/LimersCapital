import { useEffect, useRef, memo } from 'react';

/**
 * TradingView Advanced Chart Widget (Free)
 *
 * Full-featured interactive candlestick chart with 100+ technical indicators,
 * drawing tools, and real-time data from TradingView's feeds.
 *
 * Used for Solana tokens on the Trade page — replaces the basic ApexCharts
 * candlestick when a TradingView-compatible symbol is available.
 *
 * @param {string} symbol   – TradingView symbol (e.g. "BINANCE:SOLUSDT", "COINBASE:BTCUSD")
 * @param {string} interval – Default interval ("D", "W", "60", "15", "5", "1")
 * @param {number} height   – Chart height in px (default 450)
 * @param {boolean} compact – If true, hides top toolbar and side toolbar
 * @param {string[]} studies – Default technical indicators to show
 */

// Map our token symbols to TradingView symbols
export const TV_SYMBOL_MAP = {
  SOL:    'BINANCE:SOLUSDT',
  BTC:    'BINANCE:BTCUSDT',
  ETH:    'BINANCE:ETHUSDT',
  USDC:   'BINANCE:USDCUSDT',
  JUP:    'BINANCE:JUPUSDT',
  RAY:    'RAYDIUM:RAYUSDT',
  BONK:   'BINANCE:BONKUSDT',
  RENDER: 'BINANCE:RENDERUSDT',
  HNT:    'BYBIT:HNTUSDT',
  ONDO:   'BYBIT:ONDOUSDT',
  PYTH:   'BYBIT:PYTHUSDT',
  W:      'BYBIT:WUSDT',
  JTO:    'BYBIT:JTOUSDT',
  MSOL:   'RAYDIUM:MSOLUSDT',
  JITO:   'BYBIT:JITOUSDT',
};

function TradingViewChart({
  symbol = 'BINANCE:SOLUSDT',
  interval = 'D',
  height = 450,
  compact = false,
  studies = [],
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    // Create the widget container div
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = `${height}px`;
    widgetDiv.style.width = '100%';
    containerRef.current.appendChild(widgetDiv);

    // Create and append the script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height,
      symbol,
      interval,
      timezone: 'America/Port_of_Spain',
      theme: 'dark',
      style: '1',           // Candlestick
      locale: 'en',
      backgroundColor: 'rgba(13, 14, 16, 1)',
      gridColor: 'rgba(0, 255, 163, 0.04)',
      allow_symbol_change: true,
      calendar: false,
      hide_top_toolbar: compact,
      hide_side_toolbar: compact,
      save_image: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      studies: studies.length > 0 ? studies : [
        'STD;Bollinger_Bands',
        'STD;RSI',
      ],
      withdateranges: true,
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, height, compact]);

  return (
    <div className="tradingview-widget-container rounded-xl overflow-hidden border border-border"
      ref={containerRef}
      style={{ height: `${height}px`, background: 'rgba(13, 14, 16, 1)' }}
    />
  );
}

export default memo(TradingViewChart);
