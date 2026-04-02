import { useEffect, useRef, memo } from 'react';

/**
 * TradingView Technical Analysis Widget (Free)
 *
 * Shows buy/sell/neutral signal gauges based on moving averages
 * and oscillators. Great companion to the chart on the Trade page.
 *
 * @param {string} symbol   – TradingView symbol (e.g. "BINANCE:SOLUSDT")
 * @param {string} interval – Time interval ("1m", "5m", "15m", "1h", "4h", "1D", "1W", "1M")
 * @param {number} width    – Widget width in px (default 100%)
 * @param {number} height   – Widget height in px (default 400)
 */

function TradingViewTechnicalAnalysis({
  symbol = 'BINANCE:SOLUSDT',
  interval = '1D',
  width = '100%',
  height = 400,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval,
      width: typeof width === 'number' ? width : '100%',
      height,
      symbol,
      showIntervalTabs: true,
      isTransparent: true,
      colorTheme: 'dark',
      locale: 'en',
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, width, height]);

  return (
    <div className="tradingview-widget-container rounded-xl overflow-hidden border border-border"
      ref={containerRef}
      style={{
        height: `${height}px`,
        background: 'var(--color-card)',
      }}
    />
  );
}

export default memo(TradingViewTechnicalAnalysis);
