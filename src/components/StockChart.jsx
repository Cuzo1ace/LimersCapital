import { useState, useMemo, useCallback } from 'react';
import Chart from 'react-apexcharts';

// ─── Seeded PRNG (deterministic per asset) ──────────────────────────────────
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── Generate deterministic OHLCV data for any asset ────────────────────────
function generateOHLCV(symbol, basePrice, days, volatilityPct = 0.02) {
  const seed = hashString(symbol + ':master');
  const rand = seededRandom(seed);
  const now = new Date();
  const data = [];
  let price = basePrice * (0.6 + rand() * 0.8); // Start at a historical price

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;

    const change = (rand() - 0.48) * volatilityPct * price;
    const open = price;
    const close = +(price + change).toFixed(price < 1 ? 6 : 2);
    const range = Math.abs(close - open) * (1 + rand() * 1.5);
    const high = +(Math.max(open, close) + range * rand()).toFixed(price < 1 ? 6 : 2);
    const low = +(Math.min(open, close) - range * rand()).toFixed(price < 1 ? 6 : 2);
    const vol = Math.floor(5000 + rand() * 500000 * (Math.abs(change) / (volatilityPct * price) + 0.3));

    data.push({
      x: date.getTime(),
      y: [+open.toFixed(2), Math.max(high, open, close), Math.max(0.01, Math.min(low, open, close)), +close.toFixed(2)],
    });

    price = Math.max(0.01, close);
  }

  // Anchor last candle close to actual current price
  if (data.length > 0) {
    data[data.length - 1].y[3] = +basePrice.toFixed(basePrice < 1 ? 6 : 2);
  }

  return data;
}

// ─── Aggregate daily data into weekly ────────────────────────────────────────
function aggregateWeekly(data) {
  const weeks = [];
  let week = null;
  for (const d of data) {
    const date = new Date(d.x);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1);
    const key = weekStart.getTime();
    if (!week || week.key !== key) {
      if (week) weeks.push(week.candle);
      week = { key, candle: { x: weekStart.getTime(), y: [...d.y] } };
    } else {
      week.candle.y[1] = Math.max(week.candle.y[1], d.y[1]);
      week.candle.y[2] = Math.min(week.candle.y[2], d.y[2]);
      week.candle.y[3] = d.y[3];
    }
  }
  if (week) weeks.push(week.candle);
  return weeks;
}

const PERIODS = [
  { key: '1M', label: '1M', days: 30 },
  { key: '3M', label: '3M', days: 90 },
  { key: '6M', label: '6M', days: 180 },
  { key: '1Y', label: '1Y', days: 365 },
  { key: '5Y', label: '5Y', days: 1825 },
];

export default function StockChart({ symbol, name, price, currency = 'USD', isTTSE = false }) {
  const [period, setPeriod] = useState('1Y');

  const periodDays = PERIODS.find(p => p.key === period)?.days || 365;
  const vol = isTTSE ? 0.008 : (price < 0.001 ? 0.06 : price < 1 ? 0.04 : 0.02);

  const chartData = useMemo(() => {
    if (!price || !symbol) return [];
    let data = generateOHLCV(symbol, price, periodDays, vol);
    if (period === '5Y') data = aggregateWeekly(data);
    return data;
  }, [symbol, price, periodDays, vol, period]);

  const currLabel = currency === 'TTD' ? 'TT$' : '$';
  const accentColor = isTTSE ? '#FF4D6D' : '#00C8B4';

  const lastClose = chartData.length ? chartData[chartData.length - 1].y[3] : 0;
  const firstOpen = chartData.length ? chartData[0].y[0] : 0;
  const totalChg = firstOpen ? ((lastClose - firstOpen) / firstOpen * 100) : 0;

  const options = useMemo(() => ({
    chart: {
      type: 'candlestick',
      height: 360,
      background: 'transparent',
      toolbar: { show: true, tools: { download: false, pan: true, zoom: true, zoomin: true, zoomout: true, reset: true } },
      zoom: { enabled: true },
    },
    plotOptions: {
      candlestick: {
        colors: { upward: '#1DCC8A', downward: '#FF4A6B' },
        wick: { useFillColor: true },
      },
    },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#5B7A9A', fontSize: '10px' } },
      axisBorder: { color: 'rgba(0,200,180,.15)' },
      axisTicks: { color: 'rgba(0,200,180,.15)' },
    },
    yaxis: {
      labels: {
        style: { colors: '#A0BAD8', fontSize: '10px' },
        formatter: v => currLabel + (price < 1 ? v.toFixed(4) : v.toFixed(2)),
      },
      tooltip: { enabled: true },
    },
    grid: { borderColor: 'rgba(0,200,180,.06)', strokeDashArray: 3 },
    tooltip: {
      theme: 'dark',
      x: { format: 'dd MMM yyyy' },
    },
    title: {
      text: `${symbol} — ${name}`,
      style: { color: '#E6F0FF', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif' },
    },
    subtitle: {
      text: `${currLabel}${lastClose.toFixed(price < 1 ? 4 : 2)}  ${totalChg >= 0 ? '+' : ''}${totalChg.toFixed(2)}% (${period})`,
      style: { color: totalChg >= 0 ? '#1DCC8A' : '#FF4A6B', fontSize: '12px', fontFamily: 'DM Mono, monospace' },
    },
  }), [symbol, name, currLabel, price, lastClose, totalChg, period]);

  if (!symbol || !price) {
    return (
      <div className="rounded-2xl border border-border p-8 text-center text-muted text-[.8rem]" style={{ background: 'var(--color-card)' }}>
        <div className="text-2xl mb-2">📈</div>
        Select an asset or make a trade to view its price chart
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-card)', borderColor: isTTSE ? 'rgba(200,16,46,.22)' : 'var(--color-border)' }}>
      {/* Period selector */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded-md text-[.7rem] font-mono cursor-pointer border transition-all
                ${period === p.key
                  ? `border-[${accentColor}]/40 text-[${accentColor}]` + (isTTSE ? ' bg-[rgba(200,16,46,.1)]' : ' bg-sea/12')
                  : 'border-border text-muted hover:text-txt bg-transparent'
                }`}
              style={period === p.key ? { color: accentColor, borderColor: accentColor + '66', background: accentColor + '18' } : {}}>
              {p.label}
            </button>
          ))}
        </div>
        <span className="text-[.62rem] text-muted">Simulated · Educational</span>
      </div>

      {/* Chart */}
      <div className="px-3 py-2">
        <Chart options={options} series={[{ data: chartData }]} type="candlestick" height={360} />
      </div>

      {/* Stats strip */}
      <div className="px-5 py-3 border-t border-border flex gap-6 flex-wrap text-[.7rem]">
        <Stat label="Open" value={`${currLabel}${firstOpen.toFixed(price < 1 ? 4 : 2)}`} color="#A0BAD8" />
        <Stat label="High" value={`${currLabel}${Math.max(...chartData.map(d => d.y[1])).toFixed(price < 1 ? 4 : 2)}`} color="#1DCC8A" />
        <Stat label="Low" value={`${currLabel}${Math.min(...chartData.map(d => d.y[2])).toFixed(price < 1 ? 4 : 2)}`} color="#FF4A6B" />
        <Stat label="Close" value={`${currLabel}${lastClose.toFixed(price < 1 ? 4 : 2)}`} color={totalChg >= 0 ? '#1DCC8A' : '#FF4A6B'} />
        <Stat label={`${period} Chg`} value={`${totalChg >= 0 ? '+' : ''}${totalChg.toFixed(2)}%`} color={totalChg >= 0 ? '#1DCC8A' : '#FF4A6B'} />
      </div>
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
