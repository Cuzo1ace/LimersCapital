import { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import { mockMicro, mockOnChainFlows, TICKER_UNIVERSE } from '../../api/marketDataMock';

function Bar({ value, max = 100, color = '#00ffa3' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function fmtMoney(v) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
}

export default function MicroPanel() {
  const [symbol, setSymbol] = useState('NVDA');
  const micro = mockMicro(symbol);
  const onchain = mockOnChainFlows();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Equity micro */}
      <GlassCard className="lg:col-span-6 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono">
            Equity micro
          </div>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-[rgba(255,255,255,0.04)] border border-border rounded-md px-2 py-1 text-xs font-mono text-txt focus:outline-none focus:border-sea/50"
          >
            {TICKER_UNIVERSE.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {micro && (
          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="flex justify-between mb-1"><span className="text-txt-2">RSI-14</span>
                <span className={micro.rsi14 > 70 ? 'text-down' : micro.rsi14 < 30 ? 'text-sea' : 'text-txt'}>
                  {micro.rsi14.toFixed(1)} · {micro.rsi14 > 70 ? 'overbought' : micro.rsi14 < 30 ? 'oversold' : 'neutral'}
                </span>
              </div>
              <Bar value={micro.rsi14} max={100} color={micro.rsi14 > 70 ? '#ff716c' : micro.rsi14 < 30 ? '#00ffa3' : '#FFCA3A'} />
            </div>
            <div>
              <div className="flex justify-between mb-1"><span className="text-txt-2">Volume vs 30-day avg</span>
                <span className={micro.volumeVsAvg > 1.5 ? 'text-sea' : micro.volumeVsAvg < 0.8 ? 'text-down' : 'text-txt'}>
                  {micro.volumeVsAvg.toFixed(2)}x
                </span>
              </div>
              <Bar value={micro.volumeVsAvg} max={3} color="#bf81ff" />
            </div>
            <div>
              <div className="flex justify-between mb-1"><span className="text-txt-2">OBV change (30d)</span>
                <span className={micro.obvChange >= 0 ? 'text-sea' : 'text-down'}>
                  {micro.obvChange >= 0 ? '+' : ''}{micro.obvChange.toFixed(2)}%
                </span>
              </div>
              <Bar value={Math.abs(micro.obvChange)} max={10} color={micro.obvChange >= 0 ? '#00ffa3' : '#ff716c'} />
            </div>
            <div className="flex justify-between">
              <span className="text-txt-2">Dark pool share</span>
              <span className="text-txt">{(micro.darkPoolPct * 100).toFixed(1)}%</span>
            </div>
            <div>
              <div className="text-txt-2 mb-1">Unusual options activity · call/put {micro.unusualOptions.callPut.toFixed(2)}</div>
              {micro.unusualOptions.notableStrikes.map((s, i) => (
                <div key={i} className="flex justify-between py-0.5 pl-2 border-l-2"
                     style={{ borderColor: s.type === 'call' ? '#00ffa3' : '#ff716c' }}>
                  <span className="text-txt-2">${s.strike} {s.type}</span>
                  <span className="text-txt">{s.contracts.toLocaleString()} contracts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* On-chain flows */}
      <GlassCard className="lg:col-span-6 p-5">
        <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono mb-3">
          On-chain flows · 24h
        </div>
        <div className="space-y-3 text-xs font-mono">
          <div className="flex justify-between p-2 rounded bg-[rgba(255,255,255,0.02)]">
            <span className="text-txt-2">Exchange netflow</span>
            <span className={onchain.exchangeNetflow24h < 0 ? 'text-sea' : 'text-down'}>
              {onchain.exchangeNetflow24h < 0 ? '↓ outflow' : '↑ inflow'}{' '}
              {fmtMoney(onchain.exchangeNetflow24h)}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded bg-[rgba(255,255,255,0.02)]">
            <span className="text-txt-2">Stablecoin mints</span>
            <span className="text-sea">+ {fmtMoney(onchain.stablecoinMints24h)}</span>
          </div>

          <div>
            <div className="text-[.6rem] uppercase tracking-widest text-muted mb-1 mt-3">Whale transactions</div>
            {onchain.whaleTransactions.map((w, i) => (
              <div key={i} className="flex justify-between py-1 border-b border-border/40 last:border-0">
                <span className="text-txt">{w.token} · {w.exchange}</span>
                <span className="text-txt-2">{w.side} {fmtMoney(w.amountUsd)}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[.6rem] uppercase tracking-widest text-muted mb-1 mt-3">Top DEX pairs by 24h volume</div>
            {onchain.topDexPairs.map((p, i) => (
              <div key={i} className="flex justify-between py-1 border-b border-border/40 last:border-0">
                <span className="text-txt">{p.pair}</span>
                <span className="text-txt-2">{fmtMoney(p.volume24h)}</span>
              </div>
            ))}
          </div>

          <div className="text-[.58rem] text-muted mt-2 italic">
            Snapshot — wire Flipside /flipside/query once FLIPSIDE_API_KEY is provisioned.
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
