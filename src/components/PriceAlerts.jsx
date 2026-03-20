import { useState } from 'react';
import useStore from '../store/useStore';

const SOL_SYMBOLS = ['SOL', 'USDC', 'JUP', 'RAY', 'BONK', 'RENDER', 'HNT', 'GOLD', 'ZBTC', 'WETH', 'BILL', 'PERP', 'NVDAX', 'PREN'];

export default function PriceAlerts() {
  const { priceAlerts, addPriceAlert, removePriceAlert } = useStore();
  const [symbol, setSymbol] = useState('SOL');
  const [condition, setCondition] = useState('below');
  const [targetPrice, setTargetPrice] = useState('');
  const [open, setOpen] = useState(false);

  const active = priceAlerts.filter(a => !a.triggered);
  const triggered = priceAlerts.filter(a => a.triggered);

  function handleAdd(e) {
    e.preventDefault();
    if (!targetPrice || isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) return;
    addPriceAlert(symbol, condition, targetPrice);
    setTargetPrice('');

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'var(--color-card)' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 border-b border-border hover:bg-white/2 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-[.82rem] font-sans font-bold uppercase tracking-widest text-txt">🔔 Price Alerts</span>
          {active.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[.6rem] font-mono bg-sea/15 text-sea border border-sea/25">
              {active.length} active
            </span>
          )}
        </div>
        <span className="text-muted text-[.7rem]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Create alert form */}
          <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[.6rem] text-muted uppercase tracking-widest">Token</label>
              <select
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                className="bg-black/30 border border-border text-txt rounded-lg px-2.5 py-1.5 text-[.72rem] font-mono outline-none"
              >
                {SOL_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[.6rem] text-muted uppercase tracking-widest">Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="bg-black/30 border border-border text-txt rounded-lg px-2.5 py-1.5 text-[.72rem] font-mono outline-none"
              >
                <option value="below">drops below</option>
                <option value="above">rises above</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[.6rem] text-muted uppercase tracking-widest">Price (USD)</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                className="bg-black/30 border border-border text-txt rounded-lg px-2.5 py-1.5 text-[.72rem] font-mono outline-none w-28"
              />
            </div>
            <button
              type="submit"
              disabled={!targetPrice}
              className="px-3 py-1.5 rounded-lg text-[.72rem] font-semibold bg-sea/10 text-sea border border-sea/30 hover:bg-sea/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              + Set Alert
            </button>
          </form>

          {/* Notification permission warning */}
          {'Notification' in window && Notification.permission === 'denied' && (
            <p className="text-[.68rem] text-[#FFB347] bg-[rgba(255,179,71,.08)] border border-[rgba(255,179,71,.2)] rounded-lg px-3 py-2">
              ⚠️ Browser notifications are blocked. Enable them in your browser settings to receive alerts.
            </p>
          )}

          {/* Active alerts */}
          {active.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[.6rem] text-muted uppercase tracking-widest">Active</div>
              {active.map(a => (
                <div key={a.id} className="flex items-center justify-between rounded-xl px-3 py-2 border border-sea/15 bg-sea/4 text-[.72rem]">
                  <span className="font-mono text-txt">
                    <span className="font-bold text-sea">{a.symbol}</span>
                    <span className="text-muted mx-1">{a.condition}</span>
                    <span className="text-txt">${a.targetPrice.toLocaleString()}</span>
                  </span>
                  <button onClick={() => removePriceAlert(a.id)}
                    className="text-muted hover:text-down cursor-pointer text-[.7rem] transition-colors">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Triggered alerts */}
          {triggered.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[.6rem] text-muted uppercase tracking-widest">Triggered</div>
              {triggered.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between rounded-xl px-3 py-2 border border-border text-[.72rem] opacity-60">
                  <span className="font-mono text-txt line-through">
                    {a.symbol} {a.condition} ${a.targetPrice.toLocaleString()}
                  </span>
                  <button onClick={() => removePriceAlert(a.id)}
                    className="text-muted hover:text-down cursor-pointer text-[.7rem] transition-colors">✕</button>
                </div>
              ))}
            </div>
          )}

          {priceAlerts.length === 0 && (
            <p className="text-[.72rem] text-muted text-center py-2">No alerts set. Add one above to get notified when prices move.</p>
          )}
        </div>
      )}
    </div>
  );
}
