import { useEffect, useRef, memo } from 'react';

/**
 * TradingView Cryptocurrency Screener Widget (Free)
 *
 * Live crypto market screener with sorting, filtering, and real-time data.
 * Can be embedded on the Market or Insights page.
 *
 * @param {number} width          – Widget width (default "100%")
 * @param {number} height         – Widget height in px (default 550)
 * @param {string} defaultColumn  – Default view ("overview", "performance", "oscillators", "moving_averages")
 * @param {string} market         – Market filter ("crypto")
 */

function TradingViewScreener({
  width = '100%',
  height = 550,
  defaultColumn = 'overview',
  market = 'crypto',
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: typeof width === 'number' ? width : '100%',
      height,
      defaultColumn,
      screener_type: market,
      displayCurrency: 'USD',
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
  }, [width, height, defaultColumn, market]);

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

export default memo(TradingViewScreener);
