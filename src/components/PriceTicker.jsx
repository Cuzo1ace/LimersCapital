import { useQuery } from '@tanstack/react-query';
import { fetchTradePrices } from '../api/prices';

function fmt(price) {
  if (price == null) return null;
  const v = Number(price);
  if (v >= 1000) return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (v >= 1)    return '$' + v.toFixed(2);
  if (v >= 0.01) return '$' + v.toFixed(4);
  return '$' + v.toPrecision(3);
}

export default function PriceTicker() {
  const { data: tokens } = useQuery({
    queryKey: ['trade-prices'],
    queryFn: fetchTradePrices,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  const items = (tokens || []).filter(t => t.current_price != null);
  if (!items.length) return null;

  const renderItems = (key) =>
    items.map(t => {
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

  return (
    <div
      className="relative overflow-hidden border-b py-1.5 select-none"
      style={{
        background: 'rgba(10,22,40,0.92)',
        borderColor: 'rgba(0,200,180,0.12)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10"
        style={{ background: 'linear-gradient(to right, rgba(10,22,40,0.95), transparent)' }} />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10"
        style={{ background: 'linear-gradient(to left, rgba(10,22,40,0.95), transparent)' }} />

      <div className="flex whitespace-nowrap ticker-scroll">
        {renderItems('a')}
        {renderItems('b')}
      </div>
    </div>
  );
}
