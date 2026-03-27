import { useState, useRef, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';

/**
 * PerpChart — Real-time candlestick chart built from live price ticks.
 *
 * Unlike StockChart (which shows historical data), this chart accumulates
 * price updates in real-time as they stream in (every ~12s), aggregating
 * them into user-selectable candle intervals (1m, 5m, 15m, 1h).
 *
 * Overlays the user's open perp positions as entry price + liquidation
 * price horizontal annotation lines.
 *
 * Props:
 *   symbol       – e.g. "SOL"
 *   markPrice    – current live price (updates every ~12s)
 *   positions    – array of open perp positions for this symbol
 */

const INTERVALS = [
  { key: '1m',  label: '1m',  ms: 60 * 1000 },
  { key: '5m',  label: '5m',  ms: 5 * 60 * 1000 },
  { key: '15m', label: '15m', ms: 15 * 60 * 1000 },
  { key: '1h',  label: '1h',  ms: 60 * 60 * 1000 },
];

// Max ticks to keep in memory (avoids unbounded growth)
const MAX_TICKS = 2000;

export default function PerpChart({ symbol, markPrice, positions = [] }) {
  const [interval, setInterval_] = useState('1m');
  const ticksRef = useRef([]); // { time: ms, price: number }[]
  const prevSymbolRef = useRef(symbol);
  const [, forceRender] = useState(0);

  // Reset ticks when symbol changes
  useEffect(() => {
    if (symbol !== prevSymbolRef.current) {
      ticksRef.current = [];
      prevSymbolRef.current = symbol;
    }
  }, [symbol]);

  // Accumulate ticks as markPrice updates
  useEffect(() => {
    if (!markPrice || !symbol) return;
    const now = Date.now();
    const ticks = ticksRef.current;

    // Deduplicate: don't add if same price within 2s
    const last = ticks[ticks.length - 1];
    if (last && now - last.time < 2000 && last.price === markPrice) return;

    ticks.push({ time: now, price: markPrice });

    // Trim to max size
    if (ticks.length > MAX_TICKS) {
      ticksRef.current = ticks.slice(-MAX_TICKS);
    }

    // Force re-render to update chart
    forceRender(n => n + 1);
  }, [markPrice, symbol]);

  const intervalMs = INTERVALS.find(i => i.key === interval)?.ms || 60000;

  // Aggregate ticks into OHLCV candles
  const candles = useMemo(() => {
    const ticks = ticksRef.current;
    if (ticks.length < 2) return [];

    const buckets = new Map(); // bucketStart → { o, h, l, c }

    for (const tick of ticks) {
      const bucketStart = Math.floor(tick.time / intervalMs) * intervalMs;
      const existing = buckets.get(bucketStart);
      if (!existing) {
        buckets.set(bucketStart, {
          x: bucketStart,
          o: tick.price,
          h: tick.price,
          l: tick.price,
          c: tick.price,
        });
      } else {
        existing.h = Math.max(existing.h, tick.price);
        existing.l = Math.min(existing.l, tick.price);
        existing.c = tick.price;
      }
    }

    // Sort by time and convert to ApexCharts format
    return [...buckets.values()]
      .sort((a, b) => a.x - b.x)
      .map(c => ({
        x: c.x,
        y: [
          +c.o.toFixed(2),
          +c.h.toFixed(2),
          +c.l.toFixed(2),
          +c.c.toFixed(2),
        ],
      }));
  }, [ticksRef.current.length, interval, intervalMs]);

  // Position annotations (entry + liquidation lines)
  const annotations = useMemo(() => {
    const yaxis = [];
    const symPositions = positions.filter(p => p.symbol === symbol && p.status === 'open');

    symPositions.forEach((pos, i) => {
      // Entry price line
      yaxis.push({
        y: pos.entryPrice,
        borderColor: pos.side === 'long' ? '#00ffa3' : '#FF4A6B',
        strokeDashArray: 4,
        label: {
          text: `${pos.side.toUpperCase()} Entry $${pos.entryPrice.toFixed(2)}`,
          position: 'left',
          style: {
            color: '#fff',
            background: pos.side === 'long' ? '#00ffa3' : '#FF4A6B',
            fontSize: '10px',
            padding: { left: 6, right: 6, top: 2, bottom: 2 },
          },
        },
      });

      // Liquidation price line
      yaxis.push({
        y: pos.liquidationPrice,
        borderColor: '#FF4A6B',
        strokeDashArray: 2,
        label: {
          text: `LIQ $${pos.liquidationPrice.toFixed(2)}`,
          position: 'right',
          style: {
            color: '#fff',
            background: '#992233',
            fontSize: '10px',
            padding: { left: 6, right: 6, top: 2, bottom: 2 },
          },
        },
      });
    });

    return { yaxis };
  }, [positions, symbol]);

  // Calculate stats
  const firstPrice = candles.length ? candles[0].y[0] : null;
  const lastPrice = candles.length ? candles[candles.length - 1].y[3] : markPrice;
  const sessionHigh = candles.length ? Math.max(...candles.map(c => c.y[1])) : markPrice;
  const sessionLow = candles.length ? Math.min(...candles.map(c => c.y[2])) : markPrice;
  const sessionChange = firstPrice && lastPrice ? ((lastPrice - firstPrice) / firstPrice * 100) : 0;
  const tickCount = ticksRef.current.length;

  const options = useMemo(() => ({
    chart: {
      type: 'candlestick',
      height: 380,
      background: 'transparent',
      toolbar: { show: true, tools: { download: false, pan: true, zoom: true, zoomin: true, zoomout: true, reset: true } },
      zoom: { enabled: true },
      animations: { enabled: true, dynamicAnimation: { enabled: true, speed: 300 } },
    },
    plotOptions: {
      candlestick: {
        colors: { upward: '#00ffa3', downward: '#FF4A6B' },
        wick: { useFillColor: true },
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: { colors: '#5B7A9A', fontSize: '10px' },
        datetimeFormatter: { hour: 'HH:mm', minute: 'HH:mm' },
      },
      axisBorder: { color: 'rgba(255,165,0,.15)' },
      axisTicks: { color: 'rgba(255,165,0,.15)' },
    },
    yaxis: {
      labels: {
        style: { colors: '#A0BAD8', fontSize: '10px' },
        formatter: v => '$' + v.toFixed(2),
      },
      tooltip: { enabled: true },
    },
    grid: { borderColor: 'rgba(255,165,0,.08)', strokeDashArray: 3 },
    tooltip: {
      theme: 'dark',
      x: { format: 'HH:mm:ss' },
    },
    annotations,
    title: {
      text: `${symbol} — Live Perpetuals`,
      style: { color: '#E6F0FF', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif' },
    },
    subtitle: {
      text: lastPrice
        ? `$${lastPrice.toFixed(2)}  ${sessionChange >= 0 ? '+' : ''}${sessionChange.toFixed(3)}% (session)`
        : 'Waiting for data...',
      style: {
        color: sessionChange >= 0 ? '#00ffa3' : '#FF4A6B',
        fontSize: '12px',
        fontFamily: 'DM Mono, monospace',
      },
    },
  }), [symbol, lastPrice, sessionChange, annotations]);

  if (!symbol || !markPrice) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-muted text-[.8rem]" style={{ background: 'var(--color-card)' }}>
        <div className="text-2xl mb-2">📈</div>
        Select an asset to view the live price chart
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-card)', borderColor: 'rgba(255,165,0,.22)' }}>
      {/* Interval selector + status */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex gap-1">
          {INTERVALS.map(i => (
            <button key={i.key} onClick={() => setInterval_(i.key)}
              className={`px-3 py-1 rounded-md text-[.7rem] font-mono cursor-pointer border transition-all
                ${interval === i.key
                  ? 'border-[#FFA500]/40 text-[#FFA500] bg-[rgba(255,165,0,.12)]'
                  : 'border-border text-muted hover:text-txt bg-transparent'
                }`}>
              {i.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-up animate-pulse" />
          <span className="text-[.62rem] text-muted">
            Live · {tickCount} ticks · {candles.length} candles
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 py-2">
        {candles.length >= 2 ? (
          <Chart options={options} series={[{ data: candles }]} type="candlestick" height={380} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <div className="text-3xl mb-3 animate-pulse">📡</div>
            <div className="text-[.82rem] font-body font-bold mb-1">Building live chart...</div>
            <div className="text-[.68rem]">Accumulating price ticks ({tickCount}/2 minimum). Updates every ~12s.</div>
            <div className="mt-4 flex items-center gap-3 text-[.78rem]">
              <span className="text-txt font-mono font-bold">${markPrice.toFixed(2)}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-up animate-pulse" />
              <span className="text-muted text-[.65rem]">receiving data</span>
            </div>
          </div>
        )}
      </div>

      {/* Session stats strip */}
      <div className="px-5 py-3 border-t border-border flex gap-6 flex-wrap text-[.7rem]">
        <StatItem label="Price" value={`$${(lastPrice || markPrice).toFixed(2)}`} color="#FFA500" />
        <StatItem label="Session High" value={`$${(sessionHigh || markPrice).toFixed(2)}`} color="#00ffa3" />
        <StatItem label="Session Low" value={`$${(sessionLow || markPrice).toFixed(2)}`} color="#FF4A6B" />
        <StatItem label="Change" value={`${sessionChange >= 0 ? '+' : ''}${sessionChange.toFixed(3)}%`}
          color={sessionChange >= 0 ? '#00ffa3' : '#FF4A6B'} />
        <StatItem label="Spread" value={sessionHigh && sessionLow ? `$${(sessionHigh - sessionLow).toFixed(2)}` : '—'} color="#A0BAD8" />
      </div>

      {/* Position overlay legend */}
      {positions.filter(p => p.symbol === symbol && p.status === 'open').length > 0 && (
        <div className="px-5 py-2.5 border-t border-border flex items-center gap-4 text-[.65rem]">
          <span className="text-muted">Chart overlays:</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-[2px] bg-up" style={{ borderTop: '2px dashed #00ffa3' }} />
            <span className="text-up">Long Entry</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-[2px] bg-down" style={{ borderTop: '2px dashed #FF4A6B' }} />
            <span className="text-down">Short Entry</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-[2px]" style={{ borderTop: '2px dotted #992233' }} />
            <span className="text-down">Liquidation</span>
          </span>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[.6rem] text-muted uppercase tracking-widest">{label}</span>
      <span className="font-body font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
