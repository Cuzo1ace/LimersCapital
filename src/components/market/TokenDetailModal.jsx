import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchCoinDetail, fetchCoinMarketChart } from '../../api/coingecko';

// Drill-down modal for market/insights rows. Opens when `coinId` is
// truthy. Closes on backdrop click, Escape, or close button.
//
// Jupiter-only tokens (see src/api/prices.js:423) get synthetic ids
// (`symbol.toLowerCase()`) that don't resolve on CoinGecko — in that
// case the detail query errors and we fall back to the `fallback` prop
// (original row data).
export default function TokenDetailModal({ coinId, fallback = null, onClose }) {
  useEffect(() => {
    if (!coinId) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [coinId, onClose]);

  const detailQ = useQuery({
    queryKey: ['cg-detail', coinId],
    queryFn: () => fetchCoinDetail(coinId),
    enabled: !!coinId,
    staleTime: 300_000,
    retry: 0,
  });

  const chartQ = useQuery({
    queryKey: ['cg-chart', coinId, 7],
    queryFn: () => fetchCoinMarketChart(coinId, 7),
    enabled: !!coinId,
    staleTime: 300_000,
    retry: 0,
  });

  const detail = detailQ.data;
  const sparkData = (chartQ.data?.prices || []).map(([, p]) => p);
  const showFallback = detailQ.isError && fallback;

  return (
    <AnimatePresence>
      {coinId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl
              backdrop-blur-xl bg-[rgba(20,24,35,0.92)]
              border border-[rgba(255,255,255,0.1)]
              shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 rounded-full
                bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)]
                border border-[rgba(255,255,255,0.08)] text-txt-2 hover:text-txt
                flex items-center justify-center transition-colors cursor-pointer z-10"
            >
              ✕
            </button>

            {/* ── Header ────────────────────────────────────────── */}
            <div className="p-5 pb-3 border-b border-[rgba(255,255,255,0.06)]">
              {detailQ.isLoading && (
                <div className="flex items-center gap-3 h-14">
                  <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.04)] animate-pulse" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 w-32 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
                    <div className="h-3 w-20 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
                  </div>
                </div>
              )}
              {detail && (
                <div className="flex items-center gap-3">
                  {detail.image && (
                    <img src={detail.image} alt={detail.symbol} className="w-12 h-12 rounded-full flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[1.1rem] font-bold text-txt truncate">{detail.name}</span>
                      <span className="text-[.7rem] font-mono text-muted bg-white/5 rounded px-1.5 py-0.5">{detail.symbol}</span>
                      {detail.rank && <span className="text-[.65rem] text-muted">#{detail.rank}</span>}
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[1.3rem] font-mono font-bold text-txt">
                        {formatPrice(detail.price)}
                      </span>
                      <ChangePill value={detail.change24h} label="24h" />
                    </div>
                  </div>
                </div>
              )}
              {showFallback && (
                <div className="flex items-center gap-3">
                  {fallback.image && (
                    <img src={fallback.image} alt={fallback.symbol} className="w-12 h-12 rounded-full flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[1.1rem] font-bold text-txt truncate block">{fallback.name || fallback.symbol}</span>
                    <span className="text-[.7rem] font-mono text-muted">{(fallback.symbol || '').toUpperCase()}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[1.3rem] font-mono font-bold text-txt">
                        {formatPrice(fallback.current_price ?? fallback.price)}
                      </span>
                      <ChangePill value={fallback.price_change_percentage_24h ?? fallback.change24h} label="24h" />
                    </div>
                    <div className="text-[.65rem] text-muted mt-1">
                      Detailed metrics unavailable for this token.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sparkline ─────────────────────────────────────── */}
            {sparkData.length > 0 && (
              <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <div className="text-[.6rem] text-muted mb-1 font-mono">7-DAY</div>
                <Sparkline
                  data={sparkData}
                  color={detail?.change7d != null ? (detail.change7d >= 0 ? '#00ffa3' : '#ff716c') : '#5B7A9A'}
                />
              </div>
            )}

            {/* ── Stats grid ────────────────────────────────────── */}
            {detail && (
              <div className="grid grid-cols-2 gap-3 p-5 border-b border-[rgba(255,255,255,0.06)]">
                <Stat label="Market Cap" value={formatCompact(detail.marketCap)} />
                <Stat label="24h Volume" value={formatCompact(detail.volume24h)} />
                <Stat label="7d Change" value={formatPct(detail.change7d)} color={changeColor(detail.change7d)} />
                <Stat label="30d Change" value={formatPct(detail.change30d)} color={changeColor(detail.change30d)} />
                <Stat label="All-Time High" value={formatPrice(detail.ath)} sub={formatPct(detail.athChangePct)} />
                <Stat label="All-Time Low" value={formatPrice(detail.atl)} sub={formatPct(detail.atlChangePct)} />
              </div>
            )}

            {/* ── Description ───────────────────────────────────── */}
            {detail?.description && (
              <div className="p-5">
                <div className="text-[.6rem] text-muted mb-1.5 font-mono">ABOUT</div>
                <div
                  className="text-[.8rem] text-txt-2 leading-relaxed line-clamp-6 [&_a]:text-sea [&_a]:no-underline [&_a]:hover:underline"
                  dangerouslySetInnerHTML={{ __html: sanitizeDescription(detail.description) }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// CG descriptions are plain text with <a href> anchors. Strip <script>
// and on*= attributes defensively even though CG output is trusted —
// belt-and-braces since we inject via dangerouslySetInnerHTML.
function sanitizeDescription(html) {
  return String(html)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

function Sparkline({ data, color = '#00ffa3', height = 64 }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 560;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </svg>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[.6rem] text-muted font-mono uppercase tracking-wide">{label}</span>
      <span className="text-[.88rem] font-mono font-semibold text-txt" style={color ? { color } : undefined}>{value}</span>
      {sub && <span className="text-[.6rem] text-muted font-mono">{sub}</span>}
    </div>
  );
}

function ChangePill({ value, label }) {
  if (value == null || Number.isNaN(value)) return null;
  const positive = value >= 0;
  return (
    <span
      className="text-[.7rem] font-mono font-semibold rounded px-1.5 py-0.5"
      style={{
        color: positive ? '#00ffa3' : '#ff716c',
        background: positive ? 'rgba(0,255,163,0.1)' : 'rgba(255,113,108,0.1)',
      }}
    >
      {positive ? '+' : ''}{value.toFixed(2)}% {label}
    </span>
  );
}

function formatPrice(v) {
  if (v == null || Number.isNaN(v)) return '—';
  if (v < 0.01) return `$${v.toPrecision(3)}`;
  if (v < 1) return `$${v.toFixed(4)}`;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatCompact(v) {
  if (v == null || Number.isNaN(v)) return '—';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(0)}`;
}

function formatPct(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function changeColor(v) {
  if (v == null) return undefined;
  return v >= 0 ? '#00ffa3' : '#ff716c';
}
