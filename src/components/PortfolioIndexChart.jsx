import { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { TTD_RATE } from '../api/ttse';

// ─── Seeded PRNG ─────────────────────────────────────────────────────────────
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}
function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Generate daily price series for an asset (deterministic)
function genDailySeries(symbol, currentPrice, days, vol = 0.02) {
  const rand = seededRandom(hashStr(symbol + ':idx'));
  const now = new Date();
  const prices = [];
  let price = currentPrice * (0.6 + rand() * 0.8);

  for (let i = days; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const change = (rand() - 0.48) * vol * price;
    price = Math.max(0.01, price + change);
    prices.push({ date: d.getTime(), price: +price.toFixed(4) });
  }
  // Anchor last to current
  if (prices.length) prices[prices.length - 1].price = currentPrice;
  return prices;
}

// Generate USD strength index (DXY-like, inverted for comparison)
function genUSDIndex(days) {
  const rand = seededRandom(hashStr('USD:DXY:2026'));
  const now = new Date();
  const data = [];
  let val = 100; // base 100

  for (let i = days; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    val += (rand() - 0.505) * 0.3; // slight downward drift (USD weakening = good for assets)
    val = Math.max(90, Math.min(110, val));
    data.push({ date: d.getTime(), value: +val.toFixed(2) });
  }
  return data;
}

const PERIODS = [
  { key: '1M', days: 30 },
  { key: '3M', days: 90 },
  { key: '6M', days: 180 },
  { key: '1Y', days: 365 },
];

export default function PortfolioIndexChart({ holdings, solTokens, ttseStocks }) {
  const [period, setPeriod] = useState('3M');
  const days = PERIODS.find(p => p.key === period)?.days || 90;

  // Build the composite index
  const { indexSeries, usdSeries, stats } = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return { indexSeries: [], usdSeries: [], stats: null };
    }

    // Get current prices and weights for each holding
    const positions = holdings.map(h => {
      const isTTSE = h.market === 'ttse';
      let currentPrice;
      if (isTTSE) {
        const stock = ttseStocks?.find(s => s.sym === h.symbol);
        currentPrice = stock?.close || h.avgPrice;
      } else {
        const token = solTokens?.find(t => t.symbol?.toUpperCase() === h.symbol);
        currentPrice = token?.current_price || h.avgPrice;
      }
      // Normalize TTSE prices to USD for composite
      const priceUSD = isTTSE ? currentPrice / TTD_RATE : currentPrice;
      const valueUSD = h.qty * priceUSD;
      const vol = isTTSE ? 0.008 : (priceUSD < 1 ? 0.04 : 0.02);

      return {
        symbol: h.symbol, market: h.market, qty: h.qty,
        currentPrice: priceUSD, avgPrice: isTTSE ? h.avgPrice / TTD_RATE : h.avgPrice,
        valueUSD, vol,
        series: genDailySeries(h.symbol, priceUSD, days, vol),
      };
    });

    const totalValue = positions.reduce((s, p) => s + p.valueUSD, 0);
    if (totalValue === 0) return { indexSeries: [], usdSeries: [], stats: null };

    // Calculate weights
    positions.forEach(p => { p.weight = p.valueUSD / totalValue; });

    // Find common dates across all series
    const dateSet = new Set();
    positions.forEach(p => p.series.forEach(d => dateSet.add(d.date)));
    const dates = [...dateSet].sort((a, b) => a - b);

    // Build composite index (base 100)
    const indexData = [];
    let baseValues = null;

    for (const date of dates) {
      // Get each position's price at this date
      const priceMap = {};
      positions.forEach(p => {
        const point = p.series.find(s => s.date === date);
        if (point) priceMap[p.symbol] = point.price;
      });

      // Skip if we don't have all positions
      if (Object.keys(priceMap).length < positions.length) continue;

      // Set base values on first complete day
      if (!baseValues) {
        baseValues = {};
        positions.forEach(p => { baseValues[p.symbol] = priceMap[p.symbol]; });
      }

      // Weighted composite return
      let compositeReturn = 0;
      positions.forEach(p => {
        const ret = (priceMap[p.symbol] - baseValues[p.symbol]) / baseValues[p.symbol];
        compositeReturn += ret * p.weight;
      });

      const indexValue = +(100 * (1 + compositeReturn)).toFixed(2);

      // Generate OHLC for the index candle
      const rand = seededRandom(hashStr('idx:' + date));
      const noise = rand() * 0.5;
      const open = indexData.length ? indexData[indexData.length - 1].close : 100;
      const close = indexValue;
      const high = +(Math.max(open, close) + noise).toFixed(2);
      const low = +(Math.min(open, close) - noise).toFixed(2);

      indexData.push({
        date, open, high: Math.max(high, open, close), low: Math.min(low, open, close), close,
      });
    }

    // Build candlestick series
    const candleSeries = indexData.map(d => ({
      x: d.date,
      y: [d.open, d.high, d.low, d.close],
    }));

    // USD strength line
    const usdData = genUSDIndex(days);
    const usdLine = usdData
      .filter(u => dates.includes(u.date) || true)
      .map(u => ({ x: u.date, y: u.value }));

    // Stats
    const firstVal = indexData[0]?.close || 100;
    const lastVal = indexData[indexData.length - 1]?.close || 100;
    const totalReturn = ((lastVal - firstVal) / firstVal * 100);
    const highVal = Math.max(...indexData.map(d => d.high));
    const lowVal = Math.min(...indexData.map(d => d.low));
    const maxDrawdown = indexData.reduce((max, d, i) => {
      const peak = Math.max(...indexData.slice(0, i + 1).map(x => x.high));
      const dd = ((d.low - peak) / peak) * 100;
      return Math.min(max, dd);
    }, 0);

    return {
      indexSeries: candleSeries,
      usdSeries: usdLine,
      stats: {
        totalReturn, highVal, lowVal, lastVal, firstVal,
        maxDrawdown,
        positions: positions.map(p => ({ symbol: p.symbol, weight: (p.weight * 100).toFixed(1), market: p.market })),
      },
    };
  }, [holdings, solTokens, ttseStocks, days]);

  const options = useMemo(() => ({
    chart: {
      type: 'candlestick',
      height: 400,
      background: 'transparent',
      toolbar: { show: true, tools: { download: false, pan: true, zoom: true, zoomin: true, zoomout: true, reset: true } },
    },
    plotOptions: {
      candlestick: {
        colors: { upward: '#1DCC8A', downward: '#FF4A6B' },
        wick: { useFillColor: true },
      },
    },
    stroke: { width: [1, 2] },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#5B7A9A', fontSize: '10px' } },
      axisBorder: { color: 'rgba(0,200,180,.15)' },
    },
    yaxis: [
      {
        title: { text: 'Portfolio Index', style: { color: '#00C8B4', fontSize: '11px' } },
        labels: {
          style: { colors: '#A0BAD8', fontSize: '10px' },
          formatter: v => v.toFixed(1),
        },
        tooltip: { enabled: true },
      },
      {
        opposite: true,
        title: { text: 'USD Strength', style: { color: '#FFCA3A', fontSize: '11px' } },
        labels: {
          style: { colors: '#FFCA3A88', fontSize: '10px' },
          formatter: v => v.toFixed(1),
        },
        min: 88,
        max: 112,
      },
    ],
    grid: { borderColor: 'rgba(0,200,180,.06)', strokeDashArray: 3 },
    tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy' } },
    title: {
      text: 'Portfolio Index vs USD Dominance',
      style: { color: '#E6F0FF', fontSize: '14px', fontWeight: 700, fontFamily: 'Syne, sans-serif' },
    },
    subtitle: {
      text: stats ? `Index: ${stats.lastVal.toFixed(2)} | Return: ${stats.totalReturn >= 0 ? '+' : ''}${stats.totalReturn.toFixed(2)}% (${period})` : '',
      style: {
        color: stats?.totalReturn >= 0 ? '#1DCC8A' : '#FF4A6B',
        fontSize: '12px', fontFamily: 'DM Mono, monospace',
      },
    },
    legend: {
      labels: { colors: '#A0BAD8' },
      fontSize: '11px',
    },
    annotations: {
      yaxis: [{
        y: 100, yAxisIndex: 0,
        borderColor: '#5B7A9A44', strokeDashArray: 4,
        label: { text: 'Base (100)', style: { color: '#5B7A9A', background: 'transparent', fontSize: '10px' }, position: 'front' },
      }],
    },
  }), [stats, period]);

  const series = useMemo(() => [
    { name: 'Portfolio Index', type: 'candlestick', data: indexSeries },
    { name: 'USD Strength', type: 'line', data: usdSeries },
  ], [indexSeries, usdSeries]);

  if (!holdings || holdings.length === 0) {
    return (
      <div className="rounded-2xl border border-border p-8 text-center text-muted text-[.8rem]" style={{ background: 'var(--color-card)' }}>
        <div className="text-3xl mb-3">📊</div>
        <div className="font-sans font-bold text-txt mb-1">Portfolio Index Chart</div>
        <div>Make trades in both Solana and TTSE markets to see your</div>
        <div>composite portfolio indexed against USD dominance.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'var(--color-card)' }}>
      {/* Period selector */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className="px-3 py-1 rounded-md text-[.7rem] font-mono cursor-pointer border transition-all"
              style={period === p.key
                ? { color: '#00C8B4', borderColor: '#00C8B466', background: '#00C8B418' }
                : { color: '#5B7A9A', borderColor: 'var(--color-border)', background: 'transparent' }}>
              {p.key}
            </button>
          ))}
        </div>
        <span className="text-[.62rem] text-muted">Base 100 · Weighted by position size</span>
      </div>

      {/* Chart */}
      <div className="px-3 py-2">
        <Chart options={options} series={series} type="candlestick" height={400} />
      </div>

      {/* Stats + Composition */}
      {stats && <div className="px-5 py-3 border-t border-border">
        <div className="flex gap-6 flex-wrap text-[.7rem] mb-3">
          <Stat label="Return" value={`${stats.totalReturn >= 0 ? '+' : ''}${stats.totalReturn.toFixed(2)}%`}
            color={stats.totalReturn >= 0 ? '#1DCC8A' : '#FF4A6B'} />
          <Stat label="Index High" value={stats.highVal.toFixed(2)} color="#1DCC8A" />
          <Stat label="Index Low" value={stats.lowVal.toFixed(2)} color="#FF4A6B" />
          <Stat label="Max Drawdown" value={`${stats.maxDrawdown.toFixed(2)}%`} color="#FF4A6B" />
          <Stat label="Current" value={stats.lastVal.toFixed(2)} color="#00C8B4" />
        </div>

        {/* Portfolio composition bar */}
        <div className="text-[.6rem] text-muted uppercase tracking-widest mb-2">Portfolio Composition</div>
        <div className="flex rounded-lg overflow-hidden h-5 mb-2">
          {stats.positions?.map((p, i) => {
            const colors = ['#00C8B4', '#FFCA3A', '#FF5C4D', '#7EB2FF', '#C87EFF', '#2D9B56', '#FF4D6D', '#FB923C'];
            const bg = colors[i % colors.length];
            return (
              <div key={p.symbol}
                style={{ width: `${p.weight}%`, background: bg, minWidth: '2px' }}
                title={`${p.symbol}: ${p.weight}%`} />
            );
          })}
        </div>
        <div className="flex gap-3 flex-wrap">
          {stats.positions?.map((p, i) => {
            const colors = ['#00C8B4', '#FFCA3A', '#FF5C4D', '#7EB2FF', '#C87EFF', '#2D9B56', '#FF4D6D', '#FB923C'];
            return (
              <span key={p.symbol} className="flex items-center gap-1.5 text-[.68rem]">
                <span className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
                <span className="text-txt font-bold">{p.symbol}</span>
                <span className="text-muted">{p.weight}%</span>
                <span className="text-muted text-[.58rem]">{p.market === 'ttse' ? '🇹🇹' : '📊'}</span>
              </span>
            );
          })}
        </div>
      </div>}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[.6rem] text-muted uppercase tracking-widest">{label}</span>
      <span className="font-sans font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
