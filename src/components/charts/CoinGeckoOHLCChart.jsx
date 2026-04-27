import { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { useQuery } from '@tanstack/react-query';
import { fetchCoinOhlc } from '../../api/coingecko';

// Candlestick chart backed by CoinGecko's /coins/{id}/ohlc. Used as a
// gap-fill for Pro Terminal tokens that TradingView can't chart (Jupiter-
// only mints like WETH-portal, zBTC, GOLD, etc.). The CoinGecko proxy
// route edge-caches OHLC payloads for 600s — perfect for educational
// candlesticks where 10-minute freshness is fine.
//
// CG OHLC granularity is fixed by the `days` param:
//   1 day   → 30-min candles
//   7 days  → 4-hour candles
//   30 days → 4-hour candles
//   90+     → 1-day candles

const PERIODS = [
  { key: 1,  label: '1D' },
  { key: 7,  label: '1W' },
  { key: 30, label: '1M' },
  { key: 90, label: '3M' },
];

export default function CoinGeckoOHLCChart({
  coinGeckoId,
  symbol,
  name,
  height = 360,
}) {
  const [days, setDays] = useState(7);

  const ohlcQ = useQuery({
    queryKey: ['cg-ohlc', coinGeckoId, days],
    queryFn: () => fetchCoinOhlc(coinGeckoId, days),
    enabled: !!coinGeckoId,
    staleTime: 300_000,
  });

  const chartData = ohlcQ.data || [];
  const lastClose = chartData.length ? chartData[chartData.length - 1].y[3] : 0;
  const firstOpen = chartData.length ? chartData[0].y[0] : 0;
  const totalChg = firstOpen ? ((lastClose - firstOpen) / firstOpen * 100) : 0;

  const options = useMemo(() => ({
    chart: {
      type: 'candlestick',
      height,
      background: 'transparent',
      toolbar: { show: true, tools: { download: false, pan: true, zoom: true, zoomin: true, zoomout: true, reset: true } },
      zoom: { enabled: true },
    },
    plotOptions: {
      candlestick: {
        colors: { upward: '#00ffa3', downward: '#FF4A6B' },
        wick: { useFillColor: true },
      },
    },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#5B7A9A', fontSize: '10px' } },
      axisBorder: { color: 'rgba(0,255,163,.15)' },
      axisTicks: { color: 'rgba(0,255,163,.15)' },
    },
    yaxis: {
      labels: {
        style: { colors: '#A0BAD8', fontSize: '10px' },
        formatter: (v) => `$${lastClose < 1 ? v.toFixed(4) : v.toFixed(2)}`,
      },
      tooltip: { enabled: true },
    },
    grid: { borderColor: 'rgba(0,255,163,.06)', strokeDashArray: 3 },
    tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy HH:mm' } },
    title: {
      text: `${symbol || ''}${name ? ' — ' + name : ''}`,
      style: { color: '#E6F0FF', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif' },
    },
    subtitle: {
      text: chartData.length
        ? `$${lastClose.toFixed(lastClose < 1 ? 4 : 2)}  ${totalChg >= 0 ? '+' : ''}${totalChg.toFixed(2)}% (${days}d)`
        : '',
      style: { color: totalChg >= 0 ? '#00ffa3' : '#FF4A6B', fontSize: '12px', fontFamily: 'DM Mono, monospace' },
    },
  }), [symbol, name, lastClose, totalChg, days, height, chartData.length]);

  if (!coinGeckoId) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-muted text-[.8rem]" style={{ background: 'var(--color-card)' }}>
        <div className="text-2xl mb-2">📈</div>
        No CoinGecko listing for this asset
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-card)' }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setDays(p.key)}
              className={`px-3 py-1 rounded-md text-[.7rem] font-mono cursor-pointer border transition-all ${
                days === p.key
                  ? 'border-sea/40 text-sea bg-sea/12'
                  : 'border-border text-muted hover:text-txt bg-transparent'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="text-[.62rem] text-muted">
          {ohlcQ.isLoading ? 'Loading…' : ohlcQ.isError ? '⚠️ Fetch failed' : '📡 CoinGecko OHLC'}
        </span>
      </div>

      <div className="px-3 py-2">
        {ohlcQ.isError && (
          <div className="text-coral text-[.78rem] text-center py-10">
            {ohlcQ.error?.message || 'Could not load OHLC data'}
          </div>
        )}
        {!ohlcQ.isError && chartData.length > 0 && (
          <Chart options={options} series={[{ data: chartData }]} type="candlestick" height={height} />
        )}
        {!ohlcQ.isError && !ohlcQ.isLoading && chartData.length === 0 && (
          <div className="text-muted text-[.78rem] text-center py-10">No OHLC data returned for this period.</div>
        )}
      </div>
    </div>
  );
}
