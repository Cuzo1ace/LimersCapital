/**
 * TradingView Widget Components
 *
 * All widgets are free to use with TradingView branding attribution.
 * They load from TradingView's CDN via script injection — no npm package needed.
 *
 * Widgets:
 *   TradingViewChart             — Full advanced chart with indicators + drawing tools
 *   TradingViewTicker            — Scrolling price ticker tape with sparklines
 *   TradingViewTechnicalAnalysis — Buy/sell/neutral signal gauges
 *   TradingViewScreener          — Crypto market screener table
 *   TradingViewMiniChart         — Compact single-symbol chart
 */

export { default as TradingViewChart, TV_SYMBOL_MAP } from './TradingViewChart';
export { default as TradingViewTicker } from './TradingViewTicker';
export { default as TradingViewTechnicalAnalysis } from './TradingViewTechnicalAnalysis';
export { default as TradingViewScreener } from './TradingViewScreener';
export { default as TradingViewMiniChart } from './TradingViewMiniChart';
