import { useState, useMemo, useCallback } from 'react';

// Token logo with colored-initial fallback
function TokenLogo({ src, symbol, col }) {
  const [err, setErr] = useState(false);
  const onErr = useCallback(() => setErr(true), []);
  if (src && !err) {
    return <img src={src} alt={symbol} onError={onErr}
      className="w-6 h-6 rounded-full object-cover flex-shrink-0 bg-white/5" />;
  }
  return (
    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[.6rem] font-bold text-white"
      style={{ background: col || '#555' }}>
      {symbol?.[0]}
    </div>
  );
}
import { useQuery } from '@tanstack/react-query';
import { fetchTradePrices } from '../api/prices';
import { TTSE_FALLBACK } from '../api/ttse';
import { fetchTTSEData } from '../api/ttse';
import StockChart from '../components/StockChart';
import FeatureLock from '../components/gamification/FeatureLock';
import useStore from '../store/useStore';

const fmtUSD = n => {
  if (n == null) return '—';
  const v = Number(n);
  if (v === 0) return '$0.00';
  if (v >= 1000) return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1)    return '$' + v.toFixed(2);
  if (v >= 0.01) return '$' + v.toFixed(4);
  if (v >= 0.0001) return '$' + v.toFixed(6);
  // micro-price: show 4 sig figs in scientific notation
  return '$' + v.toPrecision(4);
};
const fmtTTD = n => n == null ? '—' : 'TT$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Generate simulated order book from a base price
function generateOrderBook(price, depth = 6) {
  if (!price) return { bids: [], asks: [] };
  const spread = price < 1 ? 0.0001 : price < 10 ? 0.01 : price < 100 ? 0.05 : 0.10;
  const bids = [], asks = [];
  for (let i = 0; i < depth; i++) {
    const seed = Math.sin((i + 1) * 9.81 + price) * 10000;
    const vol = Math.floor(Math.abs(seed) % 5000) + 100;
    bids.push({ price: +(price - spread * (i + 1)).toFixed(price < 1 ? 6 : 2), qty: vol });
    asks.push({ price: +(price + spread * (i + 1)).toFixed(price < 1 ? 6 : 2), qty: Math.floor(vol * 0.8 + 50) });
  }
  return { bids, asks: asks.reverse() };
}

const SOLFLARE_LINK = 'https://www.solflare.com/?af_qr=true&shortlink=carribean&c=Carribean&pid=Solana%20Carribean&af_xp=qr&source_caller=ui';
const SOLFLARE_ORANGE = '#FC5602';
const WAM_LINK = 'https://wam.money/';

export default function TradePage() {
  const { balanceUSD, balanceTTD, holdings, trades, executeTrade, walletConnected } = useStore();
  const marketQ = useQuery({
    queryKey: ['trade-prices'],
    queryFn: fetchTradePrices,
    staleTime: 10000,
    refetchInterval: 12000,
  });
  const ttseQ = useQuery({ queryKey: ['ttse-data'], queryFn: fetchTTSEData, staleTime: 120000 });

  const [market, setMarket] = useState('solana'); // 'solana' | 'ttse'
  const [side, setSide] = useState('buy');
  const [selectedId, setSelectedId] = useState('');
  const [qty, setQty] = useState('');
  const [message, setMessage] = useState(null);

  const isTTSE = market === 'ttse';
  const currency = isTTSE ? 'TTD' : 'USD';
  const fmtPrice = isTTSE ? fmtTTD : fmtUSD;
  const balance = isTTSE ? balanceTTD : balanceUSD;

  const solTokens = marketQ.data || [];
  const ttseStocks = ttseQ.data?.stocks || TTSE_FALLBACK;

  // Build unified asset list for current market
  const assets = useMemo(() => {
    if (isTTSE) {
      return ttseStocks.map(s => ({
        id: s.sym, symbol: s.sym, name: s.name, price: s.close,
        change: s.open > 0 ? ((s.chg / s.open) * 100) : 0,
        volume: s.vol, image: null, sector: s.sector,
      }));
    }
    return solTokens.map(t => ({
      id: t.id, symbol: t.symbol.toUpperCase(), name: t.name, price: t.current_price,
      change: t.price_change_percentage_24h, volume: t.total_volume, image: t.image,
      col: t._col,
    }));
  }, [isTTSE, solTokens, ttseStocks]);

  const selected = assets.find(a => a.id === selectedId);
  const price = selected?.price ?? null;
  const total = price != null ? (parseFloat(qty) || 0) * price : null;
  const fee   = total != null ? total * 0.003 : null;
  const orderBook = useMemo(() => generateOrderBook(price), [price]);

  // Filter holdings by current market
  const marketHoldings = holdings.filter(h => h.market === market);

  const handleExecute = () => {
    const q = parseFloat(qty);
    if (!q || q <= 0) { flash('error', 'Enter a valid quantity'); return; }
    if (!selected) { flash('error', 'Select an asset first'); return; }
    const result = executeTrade(side, selected.symbol, q, price, currency, market);
    if (result.error) { flash('error', result.error); }
    else { flash('success', `${side === 'buy' ? 'Bought' : 'Sold'} ${q} ${selected.symbol} @ ${fmtPrice(price)}`); setQty(''); }
  };

  function flash(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  }

  return (
    <div>
      {/* Solflare Affiliate Banner */}
      <a href={SOLFLARE_LINK} target="_blank" rel="noopener noreferrer"
        className="no-underline block mb-4">
        <div className="rounded-2xl border p-4 flex items-center gap-4 transition-all hover:brightness-110 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(252,86,2,.12) 0%, rgba(252,86,2,.04) 100%)',
            borderColor: 'rgba(252,86,2,.35)',
          }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: SOLFLARE_ORANGE }}>
            <span className="text-white font-black text-[1rem]">☀</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-sans font-bold text-[.88rem]" style={{ color: SOLFLARE_ORANGE }}>
              New to Solana? Get Solflare Wallet
            </div>
            <div className="text-[.72rem] text-txt-2 truncate">
              The #1 Solana wallet — secure, fast, built for DeFi & RWA trading ↗
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <span className="text-[.68rem] uppercase tracking-widest font-mono px-3 py-1.5 rounded-lg border font-bold"
              style={{ color: SOLFLARE_ORANGE, borderColor: 'rgba(252,86,2,.4)', background: 'rgba(252,86,2,.08)' }}>
              Free Download ↗
            </span>
          </div>
        </div>
      </a>

      {/* Wallet Connection Banner */}
      {!walletConnected && (
        <div className="rounded-2xl border border-sea/30 p-4 md:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-5"
          style={{ background: 'linear-gradient(135deg, rgba(0,200,180,.06), rgba(252,92,62,.04))' }}>
          <div className="text-3xl">🔗</div>
          <div className="flex-1">
            <div className="font-sans font-bold text-[.92rem] text-txt mb-1">Connect your Solflare wallet to trade</div>
            <div className="text-[.75rem] text-txt-2 leading-relaxed">
              Use Solflare to access your Solana wallet, or top up your TTD account with Wam. Paper trading is available without a wallet.
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
            <a href={WAM_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-[rgba(255,215,0,.08)] border border-[rgba(255,215,0,.28)]
                rounded-lg px-4 py-2.5 text-[.75rem] font-sans font-bold text-[#FFD700] no-underline
                transition-all hover:bg-[rgba(255,215,0,.14)]">
              <span className="w-4 h-4 rounded bg-[#FFD700] flex items-center justify-center text-[.5rem] font-black text-night">W</span>
              Top up with Wam
            </a>
            <a href={SOLFLARE_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-none no-underline
                text-white px-4 py-2.5 rounded-lg text-[.75rem] font-sans font-extrabold cursor-pointer
                transition-all hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, ${SOLFLARE_ORANGE}, #FF8C42)`, boxShadow: '0 0 20px rgba(252,86,2,.35)' }}>
              ☀ Get Solflare
            </a>
          </div>
        </div>
      )}

      {/* Dual Balance Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`rounded-2xl p-6 border cursor-pointer transition-all ${market === 'solana' ? 'border-sea/40 ring-1 ring-sea/20' : 'border-border'}`}
          style={{ background: 'linear-gradient(135deg, rgba(0,200,180,.1), rgba(45,155,86,.06))' }}
          onClick={() => { setMarket('solana'); setSelectedId(''); }}>
          <div className="text-[.68rem] text-muted uppercase tracking-widest mb-2">💵 USD Balance — Solana</div>
          <div className="font-serif text-[2.2rem] font-black text-txt">{fmtUSD(balanceUSD)}</div>
          <div className="text-[.72rem] text-muted mt-1">{solTokens.length} tokens available</div>
        </div>
        <div className={`rounded-2xl p-6 border cursor-pointer transition-all ${market === 'ttse' ? 'border-[#FF4D6D]/40 ring-1 ring-[#FF4D6D]/20' : 'border-border'}`}
          style={{ background: 'linear-gradient(135deg, rgba(200,16,46,.08), rgba(10,22,40,1))' }}
          onClick={() => { setMarket('ttse'); setSelectedId(''); }}>
          <div className="text-[.68rem] text-muted uppercase tracking-widest mb-2">🇹🇹 TTD Balance — TTSE Tokenized</div>
          <div className="font-serif text-[2.2rem] font-black text-[#FF4D6D]">{fmtTTD(balanceTTD)}</div>
          <div className="text-[.72rem] text-muted mt-1">{ttseStocks.length} stocks tokenized</div>
        </div>
      </div>

      {/* Market Toggle */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => { setMarket('solana'); setSelectedId(''); }}
          className={`px-4 py-2 rounded-lg text-[.75rem] font-mono cursor-pointer border transition-all
            ${market === 'solana' ? 'bg-sea/12 border-sea/35 text-sea' : 'bg-transparent border-border text-muted hover:text-txt'}`}>
          📊 Solana Tokens
        </button>
        <FeatureLock featureKey="ttse_trading" hint="Complete Module 2 (Caribbean Markets) in Learn to unlock TTSE trading">
          <button onClick={() => { setMarket('ttse'); setSelectedId(''); }}
            className={`px-4 py-2 rounded-lg text-[.75rem] font-mono cursor-pointer border transition-all
              ${market === 'ttse' ? 'bg-[rgba(200,16,46,.1)] border-[#FF4D6D]/35 text-[#FF4D6D]' : 'bg-transparent border-border text-muted hover:text-txt'}`}>
            🇹🇹 TTSE Stocks (Tokenized)
          </button>
        </FeatureLock>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Left: Order Book + Holdings */}
        <div>
          {/* Asset Selector + Order Book */}
          <div className="rounded-2xl border border-border p-5 mb-5" style={{ background: 'var(--color-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-[.88rem] font-bold uppercase tracking-widest text-txt">
                {isTTSE ? '🇹🇹 TTSE Order Book' : '📊 Solana Order Book'}
              </h3>
              <span className="text-[.62rem] text-muted px-2 py-0.5 border border-white/8 rounded-full">
                Simulated · Educational
              </span>
            </div>

            {/* Asset list as clickable rows */}
            <div className="max-h-[200px] md:max-h-[280px] overflow-y-auto mb-4 border border-border rounded-xl">
              <div className="grid items-center gap-2 px-3 py-1.5 text-[.62rem] text-muted uppercase tracking-widest border-b border-border sticky top-0 z-10"
                style={{ gridTemplateColumns: isTTSE ? '1.5fr 1fr .8fr .8fr' : '24px 1.5fr 1fr .8fr', background: 'var(--color-night-2)' }}>
                {!isTTSE && <span />}
                <span>Asset</span>
                <span>Price</span>
                <span>24h</span>
                {isTTSE && <span>Vol</span>}
              </div>
              {assets.map(a => (
                <div key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`grid items-center gap-2 px-3 py-2 cursor-pointer text-[.76rem] border-b border-white/3 transition-all hover:bg-sea/5
                    ${selectedId === a.id ? (isTTSE ? 'bg-[rgba(200,16,46,.08)]' : 'bg-sea/8') : ''}`}
                  style={{ gridTemplateColumns: isTTSE ? '1.5fr 1fr .8fr .8fr' : '24px 1.5fr 1fr .8fr' }}>
                  {!isTTSE && <TokenLogo src={a.image} symbol={a.symbol} col={a.col} />}
                  <div className="min-w-0">
                    <span className="font-sans font-bold text-[.78rem]">{a.symbol}</span>
                    <span className="text-muted text-[.6rem] ml-1 truncate">{a.name.length > 16 ? a.name.slice(0, 16) + '…' : a.name}</span>
                  </div>
                  <span className="font-sans font-bold text-[.78rem]">{fmtPrice(a.price)}</span>
                  <span className={`text-[.7rem] ${(a.change || 0) >= 0 ? 'text-up' : 'text-down'}`}>
                    {a.change != null ? ((a.change >= 0 ? '+' : '') + a.change.toFixed(2) + '%') : '—'}
                  </span>
                  {isTTSE && <span className="text-muted text-[.68rem]">{(a.volume || 0).toLocaleString()}</span>}
                </div>
              ))}
            </div>

            {/* Bid/Ask Order Book */}
            {selected && (
              <div>
                <div className="text-[.72rem] text-muted uppercase tracking-widest mb-2">
                  Order Book — {selected.symbol} <span className="text-txt font-bold ml-1">{fmtPrice(price)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Asks (sells) */}
                  <div>
                    <div className="text-[.6rem] text-down uppercase tracking-widest mb-1 px-2">Asks (Sell)</div>
                    {orderBook.asks.map((o, i) => (
                      <div key={i} className="flex justify-between px-2 py-[3px] text-[.72rem] relative">
                        <div className="absolute inset-y-0 right-0 bg-down/8 rounded-sm" style={{ width: `${Math.min(100, o.qty / 50)}%` }} />
                        <span className="text-down relative z-10">{fmtPrice(o.price)}</span>
                        <span className="text-muted relative z-10">{o.qty.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  {/* Bids (buys) */}
                  <div>
                    <div className="text-[.6rem] text-up uppercase tracking-widest mb-1 px-2">Bids (Buy)</div>
                    {orderBook.bids.map((o, i) => (
                      <div key={i} className="flex justify-between px-2 py-[3px] text-[.72rem] relative">
                        <div className="absolute inset-y-0 left-0 bg-up/8 rounded-sm" style={{ width: `${Math.min(100, o.qty / 50)}%` }} />
                        <span className="text-up relative z-10">{fmtPrice(o.price)}</span>
                        <span className="text-muted relative z-10">{o.qty.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center mt-2 py-1.5 rounded-lg text-[.68rem]" style={{ background: isTTSE ? 'rgba(200,16,46,.06)' : 'rgba(0,200,180,.06)' }}>
                  <span className="text-muted">Spread: </span>
                  <span className={isTTSE ? 'text-[#FF4D6D]' : 'text-sea'}>
                    {orderBook.asks.length && orderBook.bids.length
                      ? fmtPrice(Math.abs(orderBook.asks[orderBook.asks.length - 1].price - orderBook.bids[0].price))
                      : '—'}
                  </span>
                </div>
              </div>
            )}

            {!selected && (
              <div className="text-center py-8 text-muted text-[.78rem]">
                Select an asset above to view its order book
              </div>
            )}
          </div>

          {/* Price Chart */}
          {selected && (
            <div className="mb-5">
              <StockChart
                symbol={selected.symbol}
                name={selected.name}
                price={selected.price}
                currency={currency}
                isTTSE={isTTSE}
              />
            </div>
          )}

          {/* Holdings for current market */}
          <h3 className="font-sans text-[.88rem] font-bold uppercase tracking-widest mb-3 text-txt">
            {isTTSE ? '🇹🇹 TTSE Holdings' : '📊 Solana Holdings'}
          </h3>
          {marketHoldings.length === 0 ? (
            <div className="text-muted text-sm py-8 text-center border border-border rounded-xl" style={{ background: 'var(--color-card)' }}>
              No {isTTSE ? 'TTSE' : 'Solana'} holdings yet. Place your first trade!
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <div className="grid items-center gap-2 md:gap-3 px-3 md:px-4 py-1 text-[.62rem] text-muted uppercase tracking-widest
                [grid-template-columns:1.5fr_1fr_80px]
                md:[grid-template-columns:1.5fr_1fr_1fr_1fr_90px]">
                <span>Asset</span><span>Qty</span>
                <span className="hidden md:block">Avg Price</span><span className="hidden md:block">P&L</span><span />
              </div>
              {marketHoldings.map(h => {
                const a = assets.find(a => a.symbol === h.symbol);
                const curPrice = a?.price || h.avgPrice;
                const val = h.qty * curPrice;
                const pnl = ((curPrice - h.avgPrice) / h.avgPrice * 100);
                return (
                  <div key={`${h.market}:${h.symbol}`}
                    className="grid items-center gap-2 md:gap-3 rounded-xl px-3 md:px-4 py-3 border border-border
                      [grid-template-columns:1.5fr_1fr_80px]
                      md:[grid-template-columns:1.5fr_1fr_1fr_1fr_90px]"
                    style={{ background: 'var(--color-card)' }}>
                    <div>
                      <div className="font-sans font-bold text-[.84rem]">{h.symbol}</div>
                      {/* Show P&L inline on mobile */}
                      <div className={`md:hidden text-[.62rem] ${pnl >= 0 ? 'text-up' : 'text-down'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                      </div>
                    </div>
                    <span className="text-[.78rem] text-txt-2">{h.qty < 1 ? h.qty.toFixed(6) : h.qty.toFixed(2)}</span>
                    <span className="hidden md:block text-[.78rem] text-txt-2">{fmtPrice(h.avgPrice)}</span>
                    <div className="hidden md:block">
                      <div className="text-[.78rem] text-txt">{fmtPrice(val)}</div>
                      <div className={`text-[.65rem] ${pnl >= 0 ? 'text-up' : 'text-down'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const result = executeTrade('sell', h.symbol, h.qty, curPrice, h.currency, h.market);
                        if (result.success) flash('success', `Sold all ${h.symbol}`);
                      }}
                      className="bg-down/10 border border-down/25 text-down rounded-lg px-2 py-1 text-[.68rem] cursor-pointer font-mono transition-all hover:bg-down hover:text-white">
                      Sell All
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Trades */}
          {trades.filter(t => t.market === market).length > 0 && (
            <div className="mt-5">
              <h3 className="font-sans text-[.88rem] font-bold uppercase tracking-widest mb-3 text-txt">Recent Trades</h3>
              <div className="flex flex-col gap-1">
                {trades.filter(t => t.market === market).slice(0, 8).map(t => (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-2 border border-border text-[.74rem]"
                    style={{ background: 'var(--color-card)' }}>
                    <span className={`px-1.5 py-0.5 rounded text-[.62rem] font-semibold uppercase
                      ${t.side === 'buy' ? 'bg-up/12 text-up' : 'bg-down/12 text-down'}`}>{t.side}</span>
                    <span className="font-sans font-bold flex-1">{t.symbol}</span>
                    <span className="text-txt-2">{t.qty < 1 ? t.qty.toFixed(6) : t.qty.toFixed(2)} @ {t.currency === 'TTD' ? fmtTTD(t.price) : fmtUSD(t.price)}</span>
                    <span className="text-muted text-[.65rem] ml-auto">{new Date(t.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Panel */}
        <div className="rounded-2xl p-5 flex flex-col gap-3.5 border h-fit sticky top-20"
          style={{ background: 'var(--color-card)', borderColor: isTTSE ? 'rgba(200,16,46,.22)' : 'var(--color-border)' }}>
          <h3 className="font-sans text-[.88rem] font-bold uppercase tracking-widest text-txt">
            {isTTSE ? '🇹🇹 TTSE Order' : '⚡ Solana Order'}
          </h3>

          {/* Buy/Sell */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button onClick={() => setSide('buy')}
              className={`flex-1 py-2 text-[.73rem] font-mono cursor-pointer border-none transition-all ${side === 'buy' ? 'bg-up/15 text-up' : 'bg-transparent text-muted'}`}>
              Buy
            </button>
            <button onClick={() => setSide('sell')}
              className={`flex-1 py-2 text-[.73rem] font-mono cursor-pointer border-none transition-all ${side === 'sell' ? 'bg-down/15 text-down' : 'bg-transparent text-muted'}`}>
              Sell
            </button>
          </div>

          {/* Asset select */}
          <div className="flex flex-col gap-1">
            <label className="text-[.65rem] text-muted uppercase tracking-wider">
              {isTTSE ? 'Stock' : 'Token'}
            </label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="bg-black/30 border border-border text-txt rounded-lg px-3 py-2 font-mono text-[.78rem] outline-none">
              <option value="">— Select —</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.symbol} — {a.name} ({fmtPrice(a.price)})</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1">
            <label className="text-[.65rem] text-muted uppercase tracking-wider">Quantity</label>
            <input type="number" value={qty} onChange={e => setQty(e.target.value)}
              placeholder={isTTSE ? 'Shares' : '0.00'} min="0" step="any"
              className="bg-black/30 border border-border text-txt rounded-lg px-3 py-2 font-mono text-[.78rem] outline-none focus:border-sea" />
          </div>

          {/* Preview */}
          <div className="rounded-lg p-3 text-[.74rem] border border-border"
            style={{ background: isTTSE ? 'rgba(200,16,46,.04)' : 'rgba(0,200,180,.04)' }}>
            <PRow label="Price" value={fmtPrice(price)} />
            <PRow label="Qty" value={parseFloat(qty) || 0} />
            <PRow label="Fee (0.3%)" value={fmtPrice(fee)} />
            <div className="flex justify-between border-t border-border pt-1.5 mt-1">
              <span className="text-muted">Total</span>
              <span className={`font-bold ${isTTSE ? 'text-[#FF4D6D]' : 'text-sea'}`}>{fmtPrice(total)}</span>
            </div>
          </div>

          {/* Balance reminder */}
          <div className="text-[.65rem] text-muted text-center">
            Available: {fmtPrice(balance)} {currency}
          </div>

          <button onClick={handleExecute} disabled={!price || !qty}
            className={`w-full py-3 rounded-xl border-none cursor-pointer font-sans font-bold text-[.82rem] tracking-wide transition-all
              ${side === 'buy' ? 'bg-up text-night hover:brightness-90' : 'bg-down text-white hover:brightness-90'}
              disabled:opacity-40 disabled:cursor-not-allowed`}>
            {side === 'buy' ? 'Buy' : 'Sell'} {selected?.symbol || ''}
          </button>

          {message && (
            <div className={`text-[.78rem] p-2.5 rounded-lg text-center ${message.type === 'success' ? 'text-up bg-up/8 border border-up/25' : 'text-down bg-down/8 border border-down/25'}`}>
              {message.text}
            </div>
          )}

          <div className="text-[.62rem] text-muted text-center leading-relaxed">
            ⚠️ Paper trading only — no real funds.{isTTSE ? ' TTSE stocks shown as tokenized simulation.' : ''}
          </div>

          {/* Solflare affiliate CTA */}
          {!isTTSE && (
            <a href={SOLFLARE_LINK} target="_blank" rel="noopener noreferrer"
              className="no-underline flex items-center justify-center gap-2 rounded-xl py-2.5 text-[.72rem] font-sans font-bold transition-all hover:brightness-110 border"
              style={{
                background: 'linear-gradient(135deg, rgba(252,86,2,.1), rgba(252,86,2,.05))',
                borderColor: 'rgba(252,86,2,.3)',
                color: SOLFLARE_ORANGE,
              }}>
              <span>☀</span>
              <span>Trade live on Solflare Wallet</span>
              <span className="text-[.6rem] opacity-70">↗</span>
            </a>
          )}

        </div>
      </div>
    </div>
  );
}

function PRow({ label, value }) {
  return (
    <div className="flex justify-between mb-1">
      <span className="text-muted">{label}</span>
      <span className="text-txt">{value}</span>
    </div>
  );
}
