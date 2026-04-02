import { useEffect, useRef, memo } from 'react';

/**
 * TradingView Mini Chart Widget (Free)
 *
 * Compact chart showing price + change for a single symbol.
 * Great for Dashboard top movers or Portfolio asset cards.
 *
 * @param {string} symbol    – TradingView symbol (e.g. "BINANCE:SOLUSDT")
 * @param {string} dateRange – Range ("1D", "1M", "3M", "12M", "60M", "ALL")
 * @param {number} width     – Widget width in px (default 350)
 * @param {number} height    – Widget height in px (default 220)
 * @param {boolean} autosize – Auto-size to container
 */

function TradingViewMiniChart({
  symbol = 'BINANCE:SOLUSDT',
  dateRange = '1M',
  width = 350,
  height = 220,
  autosize = false,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: autosize ? '100%' : width,
      height: autosize ? '100%' : height,
      locale: 'en',
      dateRange,
      colorTheme: 'dark',
      isTransparent: true,
      autosize,
      largeChartUrl: '',
      noTimeScale: false,
      chartOnly: false,
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, dateRange, width, height, autosize]);

  return (
    <div className="tradingview-widget-container rounded-xl overflow-hidden"
      ref={containerRef}
      style={{
        width: autosize ? '100%' : `${width}px`,
        height: autosize ? '100%' : `${height}px`,
      }}
    />
  );
}

export default memo(TradingViewMiniChart);
