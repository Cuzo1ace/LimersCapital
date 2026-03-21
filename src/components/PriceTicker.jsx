import { useQuery } from '@tanstack/react-query';
import { fetchTradePrices } from '../api/prices';
import { fetchTTSEData, TTD_RATE } from '../api/ttse';

function fmt(price) {
  if (price == null) return null;
  const v = Number(price);
  if (v >= 1000) return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (v >= 1)    return '$' + v.toFixed(2);
  if (v >= 0.01) return '$' + v.toFixed(4);
  return '$' + v.toPrecision(3);
}

function fmtTTD(n) {
  return 'TT$' + Number(n).toFixed(2);
}

// Use CSS variable so fade works in both dark + light mode
const FADE   = 'linear-gradient(to right, var(--color-night) 0%, transparent 100%)';
const FADE_R = 'linear-gradient(to left,  var(--color-night) 0%, transparent 100%)';

export default function PriceTicker() {
  const { data: tokens } = useQuery({
    queryKey: ['trade-prices'],
    queryFn: fetchTradePrices,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  const { data: ttseData } = useQuery({
    queryKey: ['ttse-data'],
    queryFn: fetchTTSEData,
    staleTime: 120000,
    refetchInterval: 300000,
  });

  const cryptoItems = (tokens || []).filter(t => t.current_price != null);
  const ttseItems = (ttseData?.stocks || []).filter(s => s.close != null);

  function renderCrypto(key) {
    return cryptoItems.map(t => {
      const chg = t.price_change_percentage_24h;
      const up = chg != null && chg >= 0;
      return (
        <span key={`${key}-${t.symbol}`} className="inline-flex items-center gap-1.5 px-4">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t._col || '#555' }} />
          <span className="text-txt-2 font-mono text-[.68rem] tracking-wide">{t.symbol.toUpperCase()}</span>
          <span className="text-txt font-mono text-[.7rem] font-semibold">{fmt(t.current_price)}</span>
          {chg != null && (
            <span className="text-[.62rem] font-mono font-bold" style={{ color: up ? '#1DCC8A' : '#FF4A6B' }}>
              {up ? '▲' : '▼'}{Math.abs(chg).toFixed(2)}%
            </span>
          )}
        </span>
      );
    });
  }

  function renderTTSE(key) {
    return ttseItems.map(s => {
      const up = s.chg > 0;
      const flat = s.chg === 0;
      const color = flat ? '#5B7A9A' : up ? '#1DCC8A' : '#FF4A6B';
      return (
        <span key={`${key}-${s.sym}`} className="inline-flex items-center gap-1.5 px-4">
          <span className="text-[.6rem] font-mono font-bold" style={{ color: '#C8102E' }}>TTSE</span>
          <span className="text-txt-2 font-mono text-[.68rem] tracking-wide">{s.sym}</span>
          <span className="text-txt font-mono text-[.7rem] font-semibold">{fmtTTD(s.close)}</span>
          <span className="text-[.62rem] font-mono font-bold" style={{ color }}>
            {flat ? '–' : up ? '▲' : '▼'}{flat ? '' : Math.abs(s.chg).toFixed(2)}
          </span>
        </span>
      );
    });
  }

  if (!cryptoItems.length) return null;

  return (
    <div className="border-b select-none" style={{ borderColor: 'rgba(0,200,180,0.12)' }}>
      {/* ── Row 1: Solana crypto (scrolls left) ── */}
      <div
        className="relative overflow-hidden py-1.5"
        style={{ background: 'rgba(10,22,40,0.92)', backdropFilter: 'blur(8px)' }}
      >
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10" style={{ background: FADE }} />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10" style={{ background: FADE_R }} />
        <div className="flex whitespace-nowrap ticker-scroll">
          {renderCrypto('a')}
          {renderCrypto('b')}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'rgba(0,200,180,0.08)' }} />

      {/* ── Row 2: TTSE stocks (scrolls right) ── */}
      {ttseItems.length > 0 && (
        <div
          className="relative overflow-hidden py-1.5"
          style={{ background: 'rgba(8,18,34,0.92)', backdropFilter: 'blur(8px)' }}
        >
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10" style={{ background: FADE }} />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10" style={{ background: FADE_R }} />
          <div className="flex whitespace-nowrap ticker-scroll-rev">
            {renderTTSE('a')}
            {renderTTSE('b')}
          </div>
        </div>
      )}
    </div>
  );
}
