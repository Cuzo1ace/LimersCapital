// ─────────────────────────────────────────────────────────────
// Limer's Capital — Centralized Format Utilities
// Single source of truth. Import from here, never define local
// fmt() functions in pages.
// ─────────────────────────────────────────────────────────────

/**
 * Format a USD price with adaptive precision.
 * ≥$1000: $1,234.56 | ≥$1: $1.23 | ≥$0.01: $0.1234
 * ≥$0.0001: $0.123456 | else: 4 sig-fig scientific
 */
export function fmtUSD(n) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (!isFinite(v)) return '—';
  if (v === 0) return '$0.00';
  if (v >= 1000) return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1)    return '$' + v.toFixed(2);
  if (v >= 0.01) return '$' + v.toFixed(4);
  if (v >= 0.0001) return '$' + v.toFixed(6);
  return '$' + v.toPrecision(4);
}

/**
 * Format a Trinidad & Tobago Dollar amount.
 */
export function fmtTTD(n) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (!isFinite(v)) return '—';
  return 'TT$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Compact notation for large numbers: $1.2M, $3.4B.
 * Used for market cap, TVL, volume.
 */
export function fmtCompact(n) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (!isFinite(v)) return '—';
  if (Math.abs(v) >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
  if (Math.abs(v) >= 1e9)  return '$' + (v / 1e9).toFixed(2) + 'B';
  if (Math.abs(v) >= 1e6)  return '$' + (v / 1e6).toFixed(2) + 'M';
  if (Math.abs(v) >= 1e3)  return '$' + (v / 1e3).toFixed(1) + 'K';
  return '$' + v.toFixed(2);
}

/**
 * Format a percentage change with sign prefix.
 */
export function fmtPct(n, decimals = 2) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (!isFinite(v)) return '—';
  const sign = v > 0 ? '+' : '';
  return sign + v.toFixed(decimals) + '%';
}

/**
 * Format an integer or decimal with locale commas, no currency symbol.
 */
export function fmtNum(n, decimals = 0) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (!isFinite(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Relative time from a Unix timestamp (seconds): "2h ago", "3d ago".
 */
export function fmtRelTime(unixSec) {
  if (!unixSec) return '';
  const delta = Math.floor(Date.now() / 1000) - unixSec;
  if (delta < 60)    return 'just now';
  if (delta < 3600)  return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

/**
 * Format a date string or timestamp to a short locale date.
 */
export function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
