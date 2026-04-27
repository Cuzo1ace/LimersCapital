import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { TrendUpIcon } from './icons';

const TTD_RATE = 6.79;

export default function PortfolioValueChart({ trades, holdings, solTokens, ttseStocks }) {
  const series = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    // Build price lookup from current market data
    const prices = {};
    (solTokens || []).forEach(t => {
      if (t.current_price) prices[t.symbol.toUpperCase()] = { price: t.current_price, currency: 'USD' };
    });
    (ttseStocks || []).forEach(s => {
      if (s.close) prices[s.sym] = { price: s.close / TTD_RATE, currency: 'TTD' };
    });

    // Reconstruct portfolio value after each trade (oldest first)
    const sorted = [...trades].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    let cashUSD = 100000;
    let cashTTD = 679000;
    const holdingsMap = {}; // key: `market:symbol` → { qty, avgPrice, currency }

    const points = [];

    const portfolioValue = () => {
      let val = cashUSD + cashTTD / TTD_RATE;
      Object.values(holdingsMap).forEach(h => {
        const key = h.symbol.toUpperCase();
        const cur = prices[key];
        const px = cur ? cur.price : h.avgPrice;
        const inUSD = h.currency === 'TTD' ? px / TTD_RATE : px;
        val += h.qty * inUSD;
      });
      return +val.toFixed(2);
    };

    for (const trade of sorted) {
      const key = `${trade.market}:${trade.symbol}`;
      const isUSD = trade.currency !== 'TTD';
      const total = trade.total;

      if (trade.side === 'buy') {
        if (isUSD) cashUSD -= total; else cashTTD -= total;
        if (!holdingsMap[key]) {
          holdingsMap[key] = { symbol: trade.symbol, qty: trade.qty, avgPrice: trade.price, currency: trade.currency };
        } else {
          const h = holdingsMap[key];
          const newQty = h.qty + trade.qty;
          h.avgPrice = (h.avgPrice * h.qty + trade.price * trade.qty) / newQty;
          h.qty = newQty;
        }
      } else {
        if (isUSD) cashUSD += total; else cashTTD += total;
        const h = holdingsMap[key];
        if (h) {
          h.qty -= trade.qty;
          if (h.qty <= 0.0001) delete holdingsMap[key];
        }
      }

      points.push({ x: new Date(trade.timestamp).getTime(), y: portfolioValue() });
    }

    // Final point: now, using current market prices
    points.push({ x: Date.now(), y: portfolioValue() });

    return points;
  }, [trades, holdings, solTokens, ttseStocks]);

  if (!series) {
    return (
      <div className="rounded-2xl border border-border p-10 text-center" style={{ background: 'var(--color-card)' }}>
        <TrendUpIcon size={28} className="mx-auto mb-3 text-sea" />
        <div className="text-[.82rem] text-muted">Make your first trade to see your portfolio chart</div>
      </div>
    );
  }

  const first = series[0]?.y || 0;
  const last = series[series.length - 1]?.y || 0;
  const pct = first ? ((last - first) / first * 100) : 0;
  const isUp = pct >= 0;

  const options = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false },
      sparkline: { enabled: false },
    },
    stroke: { curve: 'smooth', width: 2, colors: ['#00C8B4'] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.25,
        opacityTo: 0.02,
        colorStops: [{ offset: 0, color: '#00C8B4', opacity: 0.25 }, { offset: 100, color: '#00C8B4', opacity: 0 }],
      },
    },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#5B7A9A', fontSize: '10px' } },
      axisBorder: { color: 'rgba(0,200,180,.1)' },
      axisTicks: { color: 'rgba(0,200,180,.1)' },
    },
    yaxis: {
      labels: {
        style: { colors: '#A0BAD8', fontSize: '10px' },
        formatter: v => '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 }),
      },
    },
    grid: { borderColor: 'rgba(0,200,180,.06)', strokeDashArray: 3 },
    tooltip: {
      theme: 'dark',
      x: { format: 'dd MMM yyyy HH:mm' },
      y: { formatter: v => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    },
    markers: { size: series.length <= 20 ? 4 : 0, colors: ['#00C8B4'], strokeColors: '#0A1628', strokeWidth: 2 },
    dataLabels: { enabled: false },
  };

  return (
    <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'var(--color-card)' }}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-sans font-bold text-[.88rem] text-txt uppercase tracking-widest">Portfolio Value</div>
          <div className="text-[.7rem] text-muted mt-0.5">Based on {trades.length} trade{trades.length !== 1 ? 's' : ''} · live prices</div>
        </div>
        <div className="text-right">
          <div className="font-sans font-black text-[1.4rem]" style={{ color: isUp ? '#1DCC8A' : '#FF4A6B' }}>
            ${last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[.72rem] font-mono font-bold" style={{ color: isUp ? '#1DCC8A' : '#FF4A6B' }}>
            {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}% all time
          </div>
        </div>
      </div>
      <div className="px-3 py-2">
        <Chart
          options={options}
          series={[{ name: 'Portfolio Value', data: series }]}
          type="area"
          height={260}
        />
      </div>
    </div>
  );
}
