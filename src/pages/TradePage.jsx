import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import useScrollReveal from '../hooks/useScrollReveal';
import { useCelebration } from '../components/fx/CelebrationBurst';
import ShatterButton from '../components/ui/ShatterButton';
// GlowCard and LiquidMetalButton kept as files but no longer used in TradePage
// import GlowCard from '../components/ui/GlowCard';
// import LiquidMetalButton from '../components/ui/LiquidMetalButton';

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
import { fetchTradePrices, fetchHeliusTokenLogos, HELIUS_LOGO_MINTS, SOL_TOKENS, TOKEN_INFO, fetchCandleData, fetchFMPCryptoList, fmtSupply } from '../api/prices';
import { CATEGORIES, LEGACY_CAT_LABEL } from '../data/tokenCatalog';
import { TTSE_FALLBACK } from '../api/ttse';
import { fetchTTSEData } from '../api/ttse';
import StockChart from '../components/StockChart';
import FeatureLock from '../components/gamification/FeatureLock';
import PriceAlerts from '../components/PriceAlerts';
import useStore from '../store/useStore';
import { RISK_BANNER } from '../data/legal';
import JupiterSwap from '../components/JupiterSwap';
import PerpChart from '../components/PerpChart';
import { usePercolatorLiveState } from '../solana/percolator-hooks';
import { usePercolatorMutations, mapPercolatorError } from '../solana/percolator-mutations';
import { useWalletAddress } from '../solana/hooks';
import { useSelectedWalletAccount } from '@solana/react';
import { useWallets } from '@wallet-standard/react';
import { PERCOLATOR_CONFIG } from '../solana/percolator';
import { usePythPrice, usePythStreamStatus } from '../api/usePythPrice';
import PostTradeInsight from '../components/gamification/PostTradeInsight';
import TradeJournalPrompt from '../components/TradeJournalPrompt';
import PracticeChallengePanel from '../components/PracticeChallengePanel';
import { TradingViewChart, TradingViewTechnicalAnalysis, TV_SYMBOL_MAP } from '../components/charts';
import PaperTradingModal from '../components/PaperTradingModal';
import WalletSetupWizard from '../components/WalletSetupWizard';
import ContextualHelp from '../components/ContextualHelp';
import Tooltip from '../components/ui/Tooltip';
import MicroLesson from '../components/MicroLesson';

// Inline SL/TP editor for positions table
function SLTPEditor({ pos, curPrice, onSave, onCancel }) {
  const [sl, setSl] = useState(pos.stopLoss ? String(pos.stopLoss) : '');
  const [tp, setTp] = useState(pos.takeProfit ? String(pos.takeProfit) : '');
  const slNum = parseFloat(sl) || null;
  const tpNum = parseFloat(tp) || null;
  const slOk = !slNum || (pos.side === 'long' ? slNum < curPrice : slNum > curPrice);
  const tpOk = !tpNum || (pos.side === 'long' ? tpNum > curPrice : tpNum < curPrice);
  return (
    <div className="flex flex-col gap-1 min-w-[120px]" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-1">
        <span className="text-down text-[.5rem] w-5 shrink-0">SL</span>
        <input type="number" value={sl} onChange={e => setSl(e.target.value)}
          placeholder="—" autoFocus
          className={`w-full bg-black/40 border rounded px-1.5 py-1 font-mono text-[.64rem] text-txt outline-none
            ${slNum && !slOk ? 'border-down/60' : 'border-border focus:border-down/50'}`} />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-up text-[.5rem] w-5 shrink-0">TP</span>
        <input type="number" value={tp} onChange={e => setTp(e.target.value)}
          placeholder="—"
          className={`w-full bg-black/40 border rounded px-1.5 py-1 font-mono text-[.64rem] text-txt outline-none
            ${tpNum && !tpOk ? 'border-down/60' : 'border-border focus:border-up/50'}`} />
      </div>
      <div className="flex gap-1">
        <button onClick={onCancel}
          className="flex-1 py-0.5 rounded border border-border bg-transparent text-muted text-[.56rem] cursor-pointer hover:text-txt transition-all">
          Cancel
        </button>
        <button onClick={() => { if (slOk && tpOk) onSave(slNum, tpNum); }}
          disabled={!slOk || !tpOk}
          className="flex-1 py-0.5 rounded border-none bg-[#FFA500]/20 text-[#FFA500] text-[.56rem] font-bold cursor-pointer hover:bg-[#FFA500]/30 disabled:opacity-30 transition-all">
          Save
        </button>
      </div>
    </div>
  );
}

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
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

function jupiterUrl(side, tokenMint) {
  if (!tokenMint) return 'https://jup.ag';
  const input  = side === 'buy'  ? USDC_MINT   : tokenMint;
  const output = side === 'buy'  ? tokenMint   : USDC_MINT;
  return `https://jup.ag/swap/${input}-${output}?slippage=0.5`;
}

export default function TradePage() {
  const { t } = useTranslation();
  const { balanceUSD, balanceTTD, holdings, trades, executeTrade, walletConnected, watchlist, toggleWatchlist,
          unlockedFeatures, limitOrders, addLimitOrder, cancelLimitOrder, checkLimitOrders,
          perpPositions, perpTradeCount, perpTotalPnl, openPerpPosition, closePerpPosition,
          checkPerpLiquidations, accruePerpFunding, checkPerpSLTP, updatePerpSLTP,
          adjustPerpMargin, checkTrailingStops, perpEventLog, logPerpEvent,
          percolatorMode, setPercolatorMode,
          tradeMode, setTradeMode, showWalletWizard, setShowWalletWizard } = useStore();

  const marketQ = useQuery({
    queryKey: ['trade-prices'],
    queryFn: fetchTradePrices,
    staleTime: 10000,
    refetchInterval: 12000,
  });
  const ttseQ = useQuery({ queryKey: ['ttse-data'], queryFn: fetchTTSEData, staleTime: 120000 });

  // Helius DAS: fetch on-chain logos for tokens without a hardcoded CDN image.
  // 24h staleTime — token logos never change, so one fetch per session is enough.
  const heliusLogosQ = useQuery({
    queryKey: ['helius-logos'],
    queryFn: () => fetchHeliusTokenLogos(HELIUS_LOGO_MINTS),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
  const heliusLogos = heliusLogosQ.data || {}; // { mint: logoUrl }

  const [market, setMarket] = useState('solana'); // 'solana' | 'ttse' | 'jupiter' | 'perpetuals'
  const [side, setSide] = useState('buy');
  const [selectedId, setSelectedId] = useState('');
  const [qty, setQty] = useState('');
  const [message, setMessage] = useState(null);
  const [assetFilter, setAssetFilter] = useState('all'); // 'all' | 'watchlist'
  const [confirmPending, setConfirmPending] = useState(null); // { side, symbol, qty, price, total, fee, currency }
  const [orderType, setOrderType] = useState('market'); // 'market' | 'limit'
  // Perpetuals-specific state
  const [perpSide, setPerpSide] = useState('long');
  const [perpLeverage, setPerpLeverage] = useState(5);
  const [perpCollateral, setPerpCollateral] = useState('');
  const [perpSelectedToken, setPerpSelectedToken] = useState('SOL');
  const [perpConfirm, setPerpConfirm] = useState(null);
  const [perpOrderType, setPerpOrderType] = useState('market');
  const [perpLimitPrice, setPerpLimitPrice] = useState('');
  const [perpTab, setPerpTab] = useState('positions');
  const [perpStopLoss, setPerpStopLoss] = useState('');
  const [perpTakeProfit, setPerpTakeProfit] = useState('');
  const [perpTrailingStop, setPerpTrailingStop] = useState('');
  const [editingSLTP, setEditingSLTP] = useState(null); // positionId being edited
  const [marginAdjust, setMarginAdjust] = useState(null); // { posId, amount }

  // ── UX polish: celebration on profitable trades + scroll-reveal ──
  const { fire: fireCelebration, CelebrationPortal } = useCelebration();
  const { childVariants: _tradeCV, ...tokenListReveal } = useScrollReveal({ stagger: 0.04, distance: 20 });
  const [closePartial, setClosePartial] = useState(null); // positionId showing partial close
  const [limitPrice, setLimitPrice] = useState('');
  const [paperTab, setPaperTab] = useState('holdings');
  const [jupiterTab, setJupiterTab] = useState('info');
  const [chartSource, setChartSource] = useState('tradingview'); // 'apex' | 'tradingview'
  const [showTAWidget, setShowTAWidget] = useState(false); // Technical Analysis widget toggle

  // (PerpChart accumulates ticks internally — no external query needed)

  const hasLimitOrders = unlockedFeatures.includes('limit_orders');

  // Real candle data from DexScreener — all 5 periods fetched together when a token is selected
  const candleQ = useQuery({
    queryKey: ['candles', selectedId],
    queryFn: async () => {
      const periods = ['1M', '3M', '6M', '1Y', '5Y'];
      const results = await Promise.allSettled(periods.map(p => fetchCandleData(selectedId, p)));
      const map = {};
      periods.forEach((p, i) => {
        if (results[i].status === 'fulfilled' && results[i].value?.length) map[p] = results[i].value;
      });
      return Object.keys(map).length ? map : null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!selectedId && market === 'solana',
    retry: 0,
  });
  const realCandles = candleQ.data || null;

  // FMP supply + ICO metadata (shared query key with MarketPage)
  const fmpQ = useQuery({ queryKey: ['fmp-crypto'], queryFn: fetchFMPCryptoList, staleTime: 300000, retry: 1 });
  const fmpData = fmpQ.data || {};

  // ── Live Percolator Hooks ────────────────────────────────
  const walletAddress = useWalletAddress();
  const [selectedAccount] = useSelectedWalletAccount();
  const wallets = useWallets();
  const connectedWallet = wallets.find(w =>
    w.accounts.some(a => a.address === walletAddress)
  ) || null;

  const isLiveMode = percolatorMode === 'live';
  const perpMarketKey = `${perpSelectedToken}-PERP`;

  const liveState = usePercolatorLiveState(
    isLiveMode ? perpMarketKey : null,
    isLiveMode ? walletAddress : null
  );
  const liveMutations = usePercolatorMutations(
    isLiveMode ? selectedAccount : null,
    isLiveMode ? connectedWallet : null,
    'devnet'
  );

  // ── Pyth WebSocket Streaming ──────────────────────────────
  const pythSOL = usePythPrice('SOL');
  const pythBTC = usePythPrice('BTC');
  const pythETH = usePythPrice('ETH');
  const pythGOLD = usePythPrice('GOLD');
  const pythStreamStatus = usePythStreamStatus();

  // Map perp token to streaming Pyth price (null if no Pyth feed for that token)
  const pythPriceForPerp = { SOL: pythSOL, BTC: pythBTC, ETH: pythETH, GOLD: pythGOLD }[perpSelectedToken] || null;

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
    return solTokens.map(t => {
      const sym = t.symbol.toUpperCase();
      const mint = SOL_TOKENS[sym];
      // Logo priority: (1) catalog-provided CDN URL on TOKEN_INFO.img,
      // (2) CoinGecko image from marketQ, (3) Helius DAS on-chain logo,
      // (4) null → fallback to colored initials circle in TokenLogo
      const info = TOKEN_INFO[sym] || null;
      const image = info?.img || t.image || (mint ? heliusLogos[mint] : null) || null;
      // Category key for the new picker filter. Prefer the lowercase structured
      // key from the catalog; fall back to the row's _cat (TitleCase legacy).
      const catKey = info?.category
        || (t._cat && Object.keys(LEGACY_CAT_LABEL).find(k => LEGACY_CAT_LABEL[k] === t._cat))
        || null;
      return {
        id: t.id, symbol: sym, name: t.name, price: t.current_price,
        change: t.price_change_percentage_24h, volume: t.total_volume,
        image, col: t._col,
        category: catKey,
      };
    });
  }, [isTTSE, solTokens, ttseStocks, heliusLogos]);

  const visibleAssets = useMemo(() => {
    // Watchlist takes precedence over category filter
    if (assetFilter === 'watchlist') {
      return assets.filter(a => watchlist.includes(a.symbol));
    }
    // Category filter: if assetFilter matches a lowercase CATEGORIES key, filter on asset.category
    const categoryKeys = Object.keys(CATEGORIES).filter(k => k !== 'all');
    const isCategoryFilter = categoryKeys.includes(assetFilter);
    const base = isCategoryFilter
      ? assets.filter(a => a.category === assetFilter)
      : assets;
    // Sort watchlisted first within the filtered subset
    return [...base].sort((a, b) => {
      const aw = watchlist.includes(a.symbol) ? 0 : 1;
      const bw = watchlist.includes(b.symbol) ? 0 : 1;
      return aw - bw;
    });
  }, [assets, watchlist, assetFilter]);

  // Per-category counts for the filter chip badges. Only Solana mode shows them;
  // TTSE stocks have their own (sector) taxonomy and are left untouched.
  const assetCategoryCounts = useMemo(() => {
    if (isTTSE) return {};
    const counts = { all: assets.length };
    for (const a of assets) {
      if (!a.category) continue;
      counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return counts;
  }, [assets, isTTSE]);

  const selected = assets.find(a => a.id === selectedId);
  const price = selected?.price ?? null;
  const total = price != null ? (parseFloat(qty) || 0) * price : null;
  const fee   = total != null ? total * 0.003 : null;
  const orderBook = useMemo(() => generateOrderBook(price), [price]);

  // Filter holdings by current market
  const marketHoldings = holdings.filter(h => h.market === market);

  const handleExecute = () => {
    const q = parseFloat(qty);
    if (!q || q <= 0 || !isFinite(q)) { flash('error', 'Enter a valid quantity'); return; }
    if (q > 1e9) { flash('error', 'Quantity too large'); return; }
    if (!selected) { flash('error', 'Select an asset first'); return; }

    // Limit order path
    if (orderType === 'limit') {
      const lp = parseFloat(limitPrice);
      if (!lp || lp <= 0 || !isFinite(lp)) { flash('error', 'Enter a valid limit price'); return; }
      addLimitOrder({ side, symbol: selected.symbol, qty: q, limitPrice: lp, currency, market });
      setQty('');
      setLimitPrice('');
      return;
    }

    // Market order path — show confirmation modal
    setConfirmPending({
      side, symbol: selected.symbol, qty: q,
      price, total: q * price, fee: q * price * 0.003, currency,
    });
  };

  const handleConfirm = () => {
    if (!confirmPending) return;
    const { side: s, symbol, qty: q, price: p, currency: c } = confirmPending;
    const result = executeTrade(s, symbol, q, p, c, market);
    setConfirmPending(null);
    if (result.error) { flash('error', result.error); }
    else {
      flash('success', `${s === 'buy' ? 'Bought' : 'Sold'} ${q} ${symbol} @ ${fmtPrice(p)}`);
      setQty('');
      // Celebrate sells at a profit (the user locked in gains)
      if (s === 'sell') {
        const holding = holdings.find(h => h.symbol === symbol);
        if (holding && p > holding.avgPrice) fireCelebration('profit');
      }
    }
  };

  function flash(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  }

  const isFallback = ttseQ.data && ttseQ.data.live === false;

  // Check limit orders + perp liquidations whenever live prices update
  useEffect(() => {
    if (!marketQ.data?.length) return;
    const priceMap = {};
    const perpPriceMap = {};
    marketQ.data.forEach(t => {
      const sym = t.symbol.toUpperCase();
      priceMap[sym] = { price: t.current_price };
      perpPriceMap[sym] = t.current_price;
    });
    checkLimitOrders(priceMap);
    checkTrailingStops(perpPriceMap);
    checkPerpLiquidations(perpPriceMap);
    checkPerpSLTP(perpPriceMap);
    accruePerpFunding();
  }, [marketQ.data]);

  return (
    <div className="overflow-x-hidden">
      <CelebrationPortal />
      {/* Post-Trade Teaching Moments */}
      <PostTradeInsight />
      {/* Trade Journal Prompt — appears after trade execution */}
      {trades.length > 0 && <TradeJournalPrompt />}
      {/* Practice Challenges */}
      <PracticeChallengePanel />

      {/* Paper Trading Explainer Modal — shows once */}
      {market !== 'jupiter' && <PaperTradingModal />}

      {/* ── Risk Disclosure Banner ──────────────────────────── */}
      <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5 border border-[rgba(251,146,60,.25)] bg-[rgba(251,146,60,.06)] text-[.76rem] text-[#FB923C] font-body">
        <span className="flex-shrink-0 mt-0.5">&#9888;&#65039;</span>
        <span>{RISK_BANNER.trade}</span>
      </div>

      {/* Simple / Advanced Mode Toggle */}
      {market === 'solana' && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[.68rem] text-muted">Mode:</span>
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button onClick={() => setTradeMode('simple')}
                className={`px-3 py-1.5 text-[.68rem] font-bold cursor-pointer border-none transition-all
                  ${tradeMode === 'simple' ? 'bg-sea/15 text-sea' : 'bg-transparent text-muted hover:text-txt'}`}>
                Simple
              </button>
              <button onClick={() => setTradeMode('advanced')}
                className={`px-3 py-1.5 text-[.68rem] font-bold cursor-pointer border-none transition-all
                  ${tradeMode === 'advanced' ? 'bg-sea/15 text-sea' : 'bg-transparent text-muted hover:text-txt'}`}>
                Advanced
              </button>
            </div>
          </div>
          <span className="text-[.6rem] text-muted">
            {tradeMode === 'simple' ? 'Simplified view — pick, amount, trade' : 'Full order types, charts, and alerts'}
          </span>
        </div>
      )}

      {/* ── Trade Confirmation Modal ─────────────────────────── */}
      {confirmPending && (
        <div
          role="dialog" aria-modal="true" aria-label="Confirm trade"
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmPending(null); }}
        >
          <div className="rounded-xl border border-border max-w-sm w-full p-5 flex flex-col gap-4"
            style={{ background: 'var(--color-night-2)' }}>
            <div className="font-body font-black text-[.92rem] text-txt text-center">
              Confirm {confirmPending.side === 'buy' ? 'Buy' : 'Sell'}
            </div>
            <div className="rounded border border-border p-3 text-[.74rem] flex flex-col gap-1.5"
              style={{ background: 'var(--color-card)' }}>
              <div className="flex justify-between"><span className="text-muted">Asset</span><span className="text-txt font-bold">{confirmPending.symbol}</span></div>
              <div className="flex justify-between"><span className="text-muted">Direction</span><span className={confirmPending.side === 'buy' ? 'text-up font-bold' : 'text-down font-bold'}>{confirmPending.side.toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-muted">Quantity</span><span className="text-txt font-bold">{confirmPending.qty}</span></div>
              <div className="flex justify-between"><span className="text-muted">Price</span><span className="text-txt">{fmtPrice(confirmPending.price)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Fee (0.3%)</span><span className="text-muted">{fmtPrice(confirmPending.fee)}</span></div>
              <div className="flex justify-between border-t border-border pt-1.5 mt-0.5">
                <span className="text-txt font-bold">Total</span>
                <span className={`font-bold ${confirmPending.side === 'buy' ? 'text-up' : 'text-down'}`}>
                  {fmtPrice(confirmPending.total)} {confirmPending.currency}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmPending(null)}
                className="flex-1 py-2.5 rounded border border-border bg-transparent text-muted text-[.76rem] font-bold cursor-pointer hover:text-txt transition-all">
                Cancel
              </button>
              <ShatterButton
                onClick={handleConfirm}
                shatterColor={confirmPending.side === 'buy' ? '#00ffa3' : '#ff716c'}
                shardCount={18}
              >
                Confirm {confirmPending.side === 'buy' ? 'Buy' : 'Sell'}
              </ShatterButton>
            </div>
          </div>
        </div>
      )}

      {/* Solflare Affiliate Banner */}
      <a href={SOLFLARE_LINK} target="_blank" rel="noopener noreferrer"
        className="no-underline block mb-4">
        <div className="rounded-xl border p-4 flex items-center gap-4 transition-all hover:brightness-110 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(252,86,2,.12) 0%, rgba(252,86,2,.04) 100%)',
            borderColor: 'rgba(252,86,2,.35)',
          }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: SOLFLARE_ORANGE }}>
            <span className="text-white font-black text-[1rem]">☀</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-body font-bold text-[.88rem]" style={{ color: SOLFLARE_ORANGE }}>
              New to Solana? Get Solflare Wallet
            </div>
            <div className="text-[.72rem] text-txt-2 truncate">
              The #1 Solana wallet — secure, fast, built for DeFi & RWA trading ↗
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <span className="text-[.68rem] uppercase tracking-widest font-headline px-3 py-1.5 rounded-lg border font-bold"
              style={{ color: SOLFLARE_ORANGE, borderColor: 'rgba(252,86,2,.4)', background: 'rgba(252,86,2,.08)' }}>
              Free Download ↗
            </span>
          </div>
        </div>
      </a>

      {/* Wallet Connection — Wizard or compact banner */}
      {!walletConnected && (
        showWalletWizard ? (
          <WalletSetupWizard onClose={() => setShowWalletWizard(false)} />
        ) : (
          <div className="rounded-xl border border-sea/30 p-4 md:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-5"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.06), rgba(252,92,62,.04))' }}>
            <div className="text-3xl">🔗</div>
            <div className="flex-1">
              <div className="font-body font-bold text-[.92rem] text-txt mb-1">Connect your Solflare wallet to trade</div>
              <div className="text-[.75rem] text-txt-2 leading-relaxed">
                Use Solflare to access your Solana wallet, or top up your TTD account with Wam. Paper trading is available without a wallet.
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
              <button onClick={() => setShowWalletWizard(true)}
                className="flex items-center justify-center gap-1.5 bg-sea/8 border border-sea/25
                  rounded-lg px-4 py-2.5 text-[.75rem] font-body font-bold text-sea cursor-pointer
                  transition-all hover:bg-sea/15">
                What is a wallet?
              </button>
              <a href={WAM_LINK} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-[rgba(255,215,0,.08)] border border-[rgba(255,215,0,.28)]
                  rounded-lg px-4 py-2.5 text-[.75rem] font-body font-bold text-[#FFD700] no-underline
                  transition-all hover:bg-[rgba(255,215,0,.14)]">
                <span className="w-4 h-4 rounded bg-[#FFD700] flex items-center justify-center text-[.5rem] font-black text-night">W</span>
                Top up with Wam
              </a>
              <a href={SOLFLARE_LINK} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border-none no-underline
                  text-white px-4 py-2.5 rounded-lg text-[.75rem] font-body font-extrabold cursor-pointer
                  transition-all hover:-translate-y-0.5"
                style={{ background: `linear-gradient(135deg, ${SOLFLARE_ORANGE}, #FF8C42)`, boxShadow: '0 0 20px rgba(252,86,2,.35)' }}>
                ☀ Get Solflare
              </a>
            </div>
          </div>
        )
      )}

      {/* Dual Balance Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`rounded-xl p-6 border cursor-pointer transition-all ${market === 'solana' ? 'border-sea/40 ring-1 ring-sea/20' : 'border-border'}`}
          style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.1), rgba(45,155,86,.06))' }}
          onClick={() => { setMarket('solana'); setSelectedId(''); }}>
          <div className="text-[.68rem] text-muted uppercase tracking-widest mb-2">💵 USD Balance — Solana</div>
          <div className="font-headline text-[2.2rem] font-black text-txt">{fmtUSD(balanceUSD)}</div>
          <div className="text-[.72rem] text-muted mt-1">{solTokens.length} tokens available</div>
        </div>
        <div className={`rounded-xl p-6 border cursor-pointer transition-all ${market === 'ttse' ? 'border-[#FF4D6D]/40 ring-1 ring-[#FF4D6D]/20' : 'border-border'}`}
          style={{ background: 'linear-gradient(135deg, rgba(200,16,46,.08), rgba(13,14,16,1))' }}
          onClick={() => { setMarket('ttse'); setSelectedId(''); }}>
          <div className="text-[.68rem] text-muted uppercase tracking-widest mb-2">🇹🇹 TTD Balance — TTSE Tokenized</div>
          <div className="font-headline text-[2.2rem] font-black text-[#FF4D6D]">{fmtTTD(balanceTTD)}</div>
          <div className="text-[.72rem] text-muted mt-1">{ttseStocks.length} stocks tokenized</div>
        </div>
      </div>

      {/* TTSE Stale Data Warning */}
      {isFallback && market === 'ttse' && (
        <div role="alert" className="rounded-xl border border-[#92400E]/40 bg-[#92400E]/10 text-[#FCD34D] text-[.74rem] font-mono px-4 py-2.5 mb-4 flex items-center gap-2">
          <span aria-hidden="true">⚠️</span>
          <span>Showing cached TTSE data (last updated 17 Mar 2026) — live feed unavailable</span>
        </div>
      )}

      {/* Market Toggle */}
      {/* Tab order groups paper-trading tabs first (Solana Tokens + Perpetuals Paper)
          so users practice with simulated balances before touching live options
          (TTSE and Real Swap). */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => { setMarket('solana'); setSelectedId(''); }}
          className={`px-4 py-2 rounded-lg text-[.75rem] font-headline cursor-pointer border transition-all
            ${market === 'solana' ? 'bg-sea/12 border-sea/35 text-sea' : 'bg-transparent border-border text-muted hover:text-txt'}`}>
          📊 {t('trade.solanaTokens')}
        </button>
        <button onClick={() => { setMarket('perpetuals'); setSelectedId(''); }}
          className={`px-4 py-2 rounded-lg text-[.75rem] font-headline cursor-pointer border transition-all flex items-center gap-1.5
            ${market === 'perpetuals' ? 'bg-[rgba(255,165,0,.1)] border-[#FFA500]/35 text-[#FFA500]' : 'bg-transparent border-border text-muted hover:text-txt'}`}>
          📈 Perpetuals
          <span className="text-[.55rem] bg-[#FFA500]/15 text-[#FFA500] rounded px-1.5 py-0.5 font-bold uppercase">Paper</span>
        </button>
        <FeatureLock featureKey="ttse_trading" hint="Complete Module 2 (Caribbean Markets) in Learn to unlock TTSE trading">
          <button onClick={() => { setMarket('ttse'); setSelectedId(''); }}
            className={`px-4 py-2 rounded-lg text-[.75rem] font-headline cursor-pointer border transition-all
              ${market === 'ttse' ? 'bg-[rgba(200,16,46,.1)] border-[#FF4D6D]/35 text-[#FF4D6D]' : 'bg-transparent border-border text-muted hover:text-txt'}`}>
            🇹🇹 {t('trade.ttseStocks')}
          </button>
        </FeatureLock>
        <button onClick={() => setMarket('jupiter')}
          className={`px-4 py-2 rounded-lg text-[.75rem] font-headline cursor-pointer border transition-all flex items-center gap-1.5
            ${market === 'jupiter' ? 'bg-[rgba(196,108,255,.1)] border-[#C46CFF]/35 text-[#C46CFF]' : 'bg-transparent border-border text-muted hover:text-txt'}`}>
          ⚡ {t('trade.realSwap')}
          <span className="text-[.55rem] bg-up/15 text-up rounded px-1.5 py-0.5 font-bold uppercase">{t('trade.live')}</span>
        </button>
      </div>

      {/* Jupiter Real Swap View — Unified DEX-style layout */}
      {market === 'jupiter' && (
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-night-2)' }}>
          {/* ─── Top Market Info Strip ─── */}
          <div className="flex items-center gap-5 px-4 py-2.5 border-b border-border overflow-x-auto" style={{ background: 'var(--color-card)' }}>
            <span className="text-txt font-body font-black text-[1rem] flex-shrink-0">Jupiter Swap</span>
            <div className="h-6 w-px bg-border flex-shrink-0" />
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[.58rem] text-muted leading-none">Network</span>
              <span className="text-txt font-mono font-bold text-[.82rem] leading-tight">Solana Mainnet</span>
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[.58rem] text-muted leading-none">Aggregator</span>
              <span className="text-[#C46CFF] font-mono font-bold text-[.82rem] leading-tight">Jupiter V6</span>
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[.58rem] text-muted leading-none">Wallet</span>
              <span className={`font-mono font-bold text-[.82rem] leading-tight ${walletConnected ? 'text-up' : 'text-muted'}`}>
                {walletConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <span className="ml-auto text-[.55rem] bg-up/15 text-up rounded px-2 py-0.5 font-bold uppercase flex-shrink-0">LIVE</span>
          </div>

          {/* ─── Main: Info + Swap Panel ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">
            {/* Left: Info cards */}
            <div className="border-r border-border p-5 flex flex-col gap-4 min-h-[420px]">
              <div className="rounded border border-border p-4" style={{ background: 'var(--color-card)' }}>
                <h3 className="font-body font-bold text-[.82rem] text-txt mb-3">Real On-Chain Swaps</h3>
                <div className="flex flex-col gap-2 text-[.72rem] text-txt-2">
                  <div className="flex items-start gap-2"><span className="text-up mt-0.5">✓</span><span>Execute real token swaps on Solana mainnet via Jupiter aggregator</span></div>
                  <div className="flex items-start gap-2"><span className="text-up mt-0.5">✓</span><span>Best price across all Solana DEXs (Raydium, Orca, Meteora, etc.)</span></div>
                  <div className="flex items-start gap-2"><span className="text-up mt-0.5">✓</span><span>Sub-second settlement with transaction proof on Solscan</span></div>
                  <div className="flex items-start gap-2"><span className="text-up mt-0.5">✓</span><span>Network fee: ~$0.00025 per transaction</span></div>
                </div>
              </div>
              <div className="rounded border border-border p-4" style={{ background: 'var(--color-card)' }}>
                <h3 className="font-body font-bold text-[.76rem] text-txt mb-3">Paper vs Real</h3>
                <div className="grid grid-cols-2 gap-2 text-[.66rem]">
                  <div className="bg-sea/8 border border-sea/20 rounded p-2.5 text-center">
                    <div className="text-sea font-bold mb-0.5">Paper Trading</div>
                    <div className="text-muted">Practice · No risk · Earn XP</div>
                  </div>
                  <div className="bg-[#C46CFF]/8 border border-[#C46CFF]/20 rounded p-2.5 text-center">
                    <div className="text-[#C46CFF] font-bold mb-0.5">Real Swap</div>
                    <div className="text-muted">On-chain · Real tokens · Jupiter</div>
                  </div>
                </div>
              </div>
              <div className="text-[.6rem] text-muted mt-auto">
                Swaps use your connected wallet. Paper trading is separate — switch to "Solana Tokens" tab to practice with no risk.
              </div>
            </div>

            {/* Right: Swap Form */}
            <div className="flex flex-col overflow-y-auto max-h-[85vh]" style={{ background: 'var(--color-card)' }}>
              <JupiterSwap variant="unified" />
            </div>
          </div>

          {/* ─── Bottom: Tabs ─── */}
          <div className="border-t border-border">
            <div className="flex gap-0 border-b border-border" style={{ background: 'var(--color-card)' }}>
              {[
                { key: 'info', label: 'How It Works' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setJupiterTab(tab.key)}
                  className={`px-5 py-2.5 text-[.72rem] font-bold cursor-pointer border-none border-b-2 transition-all
                    ${jupiterTab === tab.key ? 'border-b-[#C46CFF] text-txt bg-transparent' : 'border-b-transparent text-muted bg-transparent hover:text-txt'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {jupiterTab === 'info' && (
              <div className="p-5 max-w-2xl">
                <h4 className="font-body font-bold text-[.82rem] text-txt mb-3">How Solflare Swap & Stake Works</h4>
                <div className="flex flex-col gap-2 text-[.74rem] text-txt-2 mb-4">
                  <div className="text-[.62rem] text-muted uppercase tracking-widest">Swap</div>
                  <div className="flex items-start gap-2"><span className="text-[#E8AC41] font-bold shrink-0">1.</span><span><strong>Connect Solflare</strong> — Link your Solflare wallet to access on-chain swaps with best-price routing.</span></div>
                  <div className="flex items-start gap-2"><span className="text-[#E8AC41] font-bold shrink-0">2.</span><span><strong>Select tokens</strong> — Choose any Solana SPL token pair. Solflare routes across all major DEXs for the best price.</span></div>
                  <div className="flex items-start gap-2"><span className="text-[#E8AC41] font-bold shrink-0">3.</span><span><strong>Review & confirm</strong> — Check price impact, route, and slippage. One-tap approval in your Solflare wallet.</span></div>
                  <div className="flex items-start gap-2"><span className="text-[#E8AC41] font-bold shrink-0">4.</span><span><strong>Instant settlement</strong> — Tokens arrive in your wallet in under 1 second. Transaction proof on Solscan.</span></div>
                </div>
                <div className="flex flex-col gap-2 text-[.74rem] text-txt-2 mb-4">
                  <div className="text-[.62rem] text-muted uppercase tracking-widest">Stake SOL</div>
                  <div className="flex items-start gap-2"><span className="text-[#E8AC41] font-bold shrink-0">1.</span><span><strong>Choose amount</strong> — Select how much SOL to stake directly from your Solflare wallet.</span></div>
                  <div className="flex items-start gap-2"><span className="text-[#E8AC41] font-bold shrink-0">2.</span><span><strong>Pick a validator</strong> — Solflare recommends top-performing validators or you can choose your own.</span></div>
                  <div className="flex items-start gap-2"><span className="text-[#E8AC41] font-bold shrink-0">3.</span><span><strong>Earn yield</strong> — Earn staking rewards (~7% APY) while keeping your SOL secure and liquid.</span></div>
                </div>
                <div className="rounded border border-border p-3 text-[.68rem] mt-4" style={{ background: 'var(--color-card)' }}>
                  <div className="text-[.6rem] text-muted uppercase tracking-widest mb-2">Details</div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    <div className="flex justify-between"><span className="text-muted">Wallet</span><span className="text-txt">Solflare</span></div>
                    <div className="flex justify-between"><span className="text-muted">Network</span><span className="text-txt">Solana Mainnet</span></div>
                    <div className="flex justify-between"><span className="text-muted">Staking APY</span><span className="text-up">~7%</span></div>
                    <div className="flex justify-between"><span className="text-muted">Tx Fee</span><span className="text-txt">~$0.00025</span></div>
                  </div>
                </div>
                <a href="https://www.solflare.com/?af_qr=true&shortlink=carribean&c=Carribean&pid=Solana%20Carribean&af_xp=qr&source_caller=ui"
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#E8AC41]/40 bg-[#E8AC41]/10 text-[#E8AC41] text-[.76rem] font-bold no-underline hover:bg-[#E8AC41]/20 transition-all cursor-pointer">
                  <span>☀️</span> Get Solflare Wallet
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Perpetuals View — DEX-Style ──────────────────── */}
      {market === 'perpetuals' && (() => {
        const perpTokens = (marketQ.data || []);
        const selToken = perpTokens.find(t => t.symbol.toUpperCase() === perpSelectedToken);

        // ── Unified data: Pyth streaming → live oracle → REST fallback ──
        const markPrice = pythPriceForPerp?.price || (isLiveMode && liveState?.markPrice ? liveState.markPrice : null) || selToken?.current_price;
        const pct24h = selToken?.price_change_percentage_24h;
        const collateralNum = parseFloat(perpCollateral) || 0;
        const notionalSize = collateralNum * perpLeverage;
        const maintenanceMargin = 0.05;
        const openFee = notionalSize * 0.001;

        const liqPricePreview = markPrice && collateralNum > 0
          ? (perpSide === 'long'
              ? markPrice * (1 - (1 / perpLeverage) + maintenanceMargin)
              : markPrice * (1 + (1 / perpLeverage) - maintenanceMargin))
          : null;

        // ── Unified positions: live on-chain positions vs paper Zustand ──
        const activePositions = isLiveMode ? (liveState?.positions || []) : perpPositions;
        const openPositions = activePositions.filter(p => p.status === 'open');
        const closedPositions = (isLiveMode ? [] : perpPositions.filter(p => p.status !== 'open')).slice(0, 20);
        const totalUnrealizedPnl = openPositions.reduce((sum, pos) => {
          const cp = pos.isLive ? (pos.markPrice || pos.entryPrice)
            : (perpTokens.find(t => t.symbol.toUpperCase() === pos.symbol)?.current_price || pos.entryPrice);
          const dir = pos.side === 'long' ? 1 : -1;
          return sum + ((cp - pos.entryPrice) * dir / pos.entryPrice) * pos.size - (pos.accumulatedFunding || 0);
        }, 0);

        // ── Live mode: balance from on-chain capital instead of paper USD ──
        const liveCapitalDisplay = isLiveMode && liveState?.capital != null
          ? `$${liveState.capital.toFixed(2)} on-chain`
          : null;

        const slNum = parseFloat(perpStopLoss) || null;
        const tpNum = parseFloat(perpTakeProfit) || null;

        // SL/TP validation
        const slValid = !slNum || (perpSide === 'long' ? slNum < (markPrice || 0) : slNum > (markPrice || Infinity));
        const tpValid = !tpNum || (perpSide === 'long' ? tpNum > (markPrice || Infinity) : tpNum < (markPrice || 0));

        const handleOpenPerp = () => {
          if (!markPrice || collateralNum <= 0) { flash('error', 'Enter valid collateral amount'); return; }
          // Paper mode: check paper balance. Live mode: check on-chain capital.
          if (isLiveMode) {
            if (!walletAddress) { flash('error', 'Connect wallet for live trading'); return; }
            if (!liveState?.hasAccount) { flash('error', 'Initialize your account first — deposit collateral'); return; }
            if (liveState?.capital != null && collateralNum > liveState.capital) { flash('error', 'Insufficient on-chain collateral'); return; }
          } else {
            if (collateralNum > balanceUSD) { flash('error', 'Insufficient USD balance'); return; }
          }
          if (!slValid) { flash('error', `Stop Loss must be ${perpSide === 'long' ? 'below' : 'above'} mark price`); return; }
          if (!tpValid) { flash('error', `Take Profit must be ${perpSide === 'long' ? 'above' : 'below'} mark price`); return; }
          const tsNum = parseFloat(perpTrailingStop) || null;
          const trailPct = tsNum && tsNum > 0 && tsNum <= 50 ? tsNum / 100 : null;
          setPerpConfirm({ side: perpSide, symbol: perpSelectedToken, leverage: perpLeverage, collateral: collateralNum, price: markPrice, size: notionalSize, fee: openFee, stopLoss: slNum, takeProfit: tpNum, trailingStop: trailPct });
        };

        const handleConfirmPerp = async () => {
          if (!perpConfirm) return;

          if (isLiveMode) {
            // ── Live mode: send on-chain transaction ──
            try {
              const priceScale = PERCOLATOR_CONFIG.PRICE_SCALE;
              const sizeE6 = Math.round(perpConfirm.size * priceScale);
              const requestedSize = perpConfirm.side === 'long' ? sizeE6 : -sizeE6;

              await liveMutations.openTrade.mutateAsync({
                userIdx: liveState?.userIdx,
                lpIdx: liveState?.lpIdx || 0,
                requestedSize,
                maxSlippage: PERCOLATOR_CONFIG.DEFAULT_SLIPPAGE_BPS,
                slabPubkey: liveState?.slabState ? perpMarketKey : null,
              });

              setPerpConfirm(null);
              flash('success', `Opened ${perpConfirm.leverage}x ${perpConfirm.side.toUpperCase()} ${perpConfirm.symbol} (on-chain)`);
              setPerpCollateral(''); setPerpStopLoss(''); setPerpTakeProfit(''); setPerpTrailingStop('');
            } catch (e) {
              setPerpConfirm(null);
              const msg = mapPercolatorError(e);
              if (msg) flash('error', msg);
            }
          } else {
            // ── Paper mode: Zustand simulation (unchanged) ──
            const result = openPerpPosition(perpConfirm.symbol, perpConfirm.side, perpConfirm.leverage, perpConfirm.collateral, perpConfirm.price, { stopLoss: perpConfirm.stopLoss, takeProfit: perpConfirm.takeProfit, trailingStop: perpConfirm.trailingStop });
            setPerpConfirm(null);
            if (result.error) flash('error', result.error);
            else { flash('success', `Opened ${perpConfirm.leverage}x ${perpConfirm.side.toUpperCase()} ${perpConfirm.symbol}`); setPerpCollateral(''); setPerpStopLoss(''); setPerpTakeProfit(''); setPerpTrailingStop(''); }
          }
        };

        return (
          <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-night-2)' }}>
            {/* ─── Top Market Info Strip ─── */}
            <div className="flex items-center gap-5 px-4 py-2.5 border-b border-border overflow-x-auto" style={{ background: 'var(--color-card)' }}>
              <select value={perpSelectedToken} onChange={e => setPerpSelectedToken(e.target.value)}
                className="bg-transparent border-none text-txt font-body font-black text-[1rem] outline-none cursor-pointer pr-2 appearance-auto">
                {perpTokens.map(t => (
                  <option key={t.symbol} value={t.symbol.toUpperCase()} style={{ background: 'var(--color-night)' }}>
                    {t.symbol.toUpperCase()}-PERP
                  </option>
                ))}
              </select>
              <div className="h-6 w-px bg-border flex-shrink-0" />
              <div className="flex flex-col flex-shrink-0">
                <div className="flex items-center gap-1">
                  <MicroLesson concept="mark-price"><span className="text-[.58rem] text-muted leading-none">Mark Price</span></MicroLesson>
                  {pythPriceForPerp?.isStreaming ? (
                    <span className="flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[.5rem] text-green-400 font-semibold">LIVE</span>
                    </span>
                  ) : (
                    <span className="text-[.5rem] text-muted font-semibold">POLL</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-txt font-mono font-bold text-[.88rem] leading-tight">{fmtUSD(markPrice)}</span>
                  {pythPriceForPerp?.confidence && (
                    <span className="text-[.5rem] text-muted font-mono">±{fmtUSD(pythPriceForPerp.confidence)}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col flex-shrink-0">
                <span className="text-[.58rem] text-muted leading-none">24h Change</span>
                <span className={`font-mono font-bold text-[.82rem] leading-tight ${(pct24h || 0) >= 0 ? 'text-up' : 'text-down'}`}>
                  {(pct24h || 0) >= 0 ? '+' : ''}{(pct24h || 0).toFixed(2)}%
                </span>
              </div>
              <div className="flex flex-col flex-shrink-0">
                <MicroLesson concept="funding-rate"><span className="text-[.58rem] text-muted leading-none">Funding Rate</span></MicroLesson>
                <span className="text-txt font-mono text-[.82rem] leading-tight">0.01%</span>
              </div>
              <div className="flex flex-col flex-shrink-0">
                <span className="text-[.58rem] text-muted leading-none">Positions</span>
                <span className="text-[#FFA500] font-mono font-bold text-[.82rem] leading-tight">{openPositions.length}</span>
              </div>
              <div className="flex flex-col flex-shrink-0">
                <span className="text-[.58rem] text-muted leading-none">Account P&L</span>
                <span className={`font-mono font-bold text-[.82rem] leading-tight ${totalUnrealizedPnl >= 0 ? 'text-up' : 'text-down'}`}>
                  {totalUnrealizedPnl >= 0 ? '+' : ''}{fmtUSD(totalUnrealizedPnl)}
                </span>
              </div>
              {/* Paper ↔ Live Toggle */}
              <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => percolatorMode === 'paper' ? setPercolatorMode('live') : setPercolatorMode('paper')}
                  className={`text-[.58rem] px-2 py-0.5 border rounded cursor-pointer transition-all ${
                    percolatorMode === 'live'
                      ? 'bg-up/15 text-up border-up/40 hover:bg-up/25'
                      : 'text-muted border-border hover:text-txt hover:border-sea/40'
                  }`}
                  title={percolatorMode === 'paper' ? 'Switch to live on-chain perps (requires 5,000 XP)' : 'Switch back to paper trading'}
                >
                  {percolatorMode === 'live' ? '⚡ LIVE' : '📄 PAPER'}
                </button>
                {percolatorMode === 'live' && (
                  <span className="text-[.5rem] text-up/60 animate-pulse">
                    {liveState?.isLoading ? 'SYNCING...' : liveState?.error ? 'RPC ERROR' : 'ON-CHAIN'}
                  </span>
                )}
              </div>
            </div>

            {/* ─── Long / Short Toggle — Full Width ─── */}
            <div className="grid grid-cols-2 gap-2 px-4 py-2 border-b border-border" style={{ background: 'var(--color-card)' }}>
              <button onClick={() => setPerpSide('long')}
                className={`py-3 rounded text-[.9rem] font-bold cursor-pointer border-2 transition-all
                  ${perpSide === 'long' ? 'bg-up text-night border-up' : 'bg-up/10 text-up border-up/30 hover:bg-up/20'}`}>
                ▲ Long
              </button>
              <button onClick={() => setPerpSide('short')}
                className={`py-3 rounded text-[.9rem] font-bold cursor-pointer border-2 transition-all
                  ${perpSide === 'short' ? 'bg-down text-white border-down' : 'bg-down/10 text-down border-down/30 hover:bg-down/20'}`}>
                ▼ Short
              </button>
            </div>

            {/* ─── Main: Chart + Order Panel ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] w-full overflow-hidden">
              {/* Chart Area — order-2 on mobile so order panel shows first */}
              <div className="border-r border-border min-h-[420px] order-2 lg:order-1 min-w-0">
                {/* Perps Chart Source Toggle */}
                <div className="flex items-center gap-1 px-3 pt-2">
                  <div className="flex items-center gap-0 rounded-lg border border-border overflow-hidden">
                    <button onClick={() => setChartSource('tradingview')}
                      className={`px-2.5 py-1 text-[.62rem] font-mono cursor-pointer border-none transition-all ${
                        chartSource === 'tradingview'
                          ? 'bg-[#FFA500]/15 text-[#FFA500] font-bold'
                          : 'bg-transparent text-muted hover:text-txt'
                      }`}>
                      TradingView
                    </button>
                    <button onClick={() => setChartSource('apex')}
                      className={`px-2.5 py-1 text-[.62rem] font-mono cursor-pointer border-none transition-all ${
                        chartSource === 'apex'
                          ? 'bg-[#FFA500]/15 text-[#FFA500] font-bold'
                          : 'bg-transparent text-muted hover:text-txt'
                      }`}>
                      Live Ticks
                    </button>
                  </div>
                  {chartSource === 'apex' && (
                    <span className="text-[.55rem] text-muted ml-1">Real-time tick accumulation</span>
                  )}
                </div>
                {chartSource === 'tradingview' && TV_SYMBOL_MAP[perpSelectedToken] ? (
                  <div className="px-3 py-2">
                    <TradingViewChart
                      symbol={TV_SYMBOL_MAP[perpSelectedToken]}
                      interval="5"
                      height={620}
                    />
                  </div>
                ) : (
                  <PerpChart symbol={perpSelectedToken} markPrice={markPrice} positions={perpPositions} />
                )}
              </div>

              {/* Order Panel — order-1 on mobile so it shows first */}
              <div className="flex flex-col p-3 gap-2.5 overflow-y-auto max-h-[85vh] lg:sticky lg:top-0 lg:self-start order-1 lg:order-2" style={{ background: 'var(--color-card)' }}>

                {/* Order Type Tabs */}
                <div className="flex gap-1">
                  {['market', 'limit', 'stop'].map(ot => (
                    <button key={ot} onClick={() => setPerpOrderType(ot)}
                      className={`flex-1 py-1.5 rounded text-[.68rem] font-bold uppercase cursor-pointer border transition-all
                        ${perpOrderType === ot ? 'border-border bg-white/5 text-txt' : 'border-transparent bg-transparent text-muted hover:text-txt'}`}>
                      {ot}
                    </button>
                  ))}
                </div>

                {/* Limit / Stop price input */}
                {perpOrderType !== 'market' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[.6rem] text-muted uppercase tracking-wider">{perpOrderType === 'limit' ? 'Limit' : 'Stop'} Price</label>
                    <input type="number" value={perpLimitPrice} onChange={e => setPerpLimitPrice(e.target.value)}
                      placeholder={markPrice ? fmtUSD(markPrice).replace('$','') : '0.00'}
                      className="bg-black/30 border border-border text-txt rounded px-2.5 py-1.5 font-mono text-[.76rem] outline-none focus:border-[#FFA500]/60" />
                  </div>
                )}

                {/* Leverage Quick Buttons */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <MicroLesson concept="leverage"><span className="text-[.6rem] text-muted uppercase tracking-wider">Leverage</span></MicroLesson>
                    <span className={`font-mono font-bold text-[.78rem] ${
                      perpLeverage <= 3 ? 'text-up' : perpLeverage <= 10 ? 'text-[#FFA500]' : 'text-down'
                    }`}>{perpLeverage}x</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 5, 10, 20].map(lv => (
                      <button key={lv} onClick={() => setPerpLeverage(lv)}
                        className={`flex-1 py-1.5 rounded text-[.68rem] font-mono font-bold cursor-pointer border transition-all
                          ${perpLeverage === lv ? 'border-[#FFA500] bg-[#FFA500]/10 text-[#FFA500]' : 'border-border bg-transparent text-muted hover:text-txt'}`}>
                        {lv}x
                      </button>
                    ))}
                  </div>
                  <input type="range" min="1" max="20" step="1" value={perpLeverage}
                    onChange={e => setPerpLeverage(Number(e.target.value))}
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer opacity-60"
                    style={{ background: `linear-gradient(to right, #00ffa3 0%, #FFA500 50%, #FF4D6D 100%)` }} />
                </div>

                {/* Collateral Input */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <MicroLesson concept="collateral"><span className="text-[.6rem] text-muted uppercase tracking-wider">Collateral (USD)</span></MicroLesson>
                    <span className="text-[.58rem] text-muted">{fmtUSD(balanceUSD)} avail</span>
                  </div>
                  <input type="number" value={perpCollateral} onChange={e => setPerpCollateral(e.target.value)}
                    placeholder="0.00" min="1" max={isLiveMode && liveState?.capital != null ? liveState.capital : balanceUSD} step="any"
                    className="bg-black/30 border border-border text-txt rounded px-2.5 py-1.5 font-mono text-[.76rem] outline-none focus:border-[#FFA500]/60" />
                  <div className="flex gap-1">
                    {[10, 25, 50, 100].map(pct => {
                      const maxBal = isLiveMode && liveState?.capital != null ? liveState.capital : balanceUSD;
                      return (
                      <button key={pct} onClick={() => setPerpCollateral(String((maxBal * pct / 100).toFixed(2)))}
                        className="flex-1 py-1 rounded text-[.6rem] font-mono cursor-pointer border border-border bg-transparent text-muted hover:text-txt hover:border-[#FFA500]/40 transition-all">
                        {pct}%
                      </button>
                    );})}
                  </div>
                </div>

                {/* Stop Loss / Take Profit / Trailing */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-[.6rem] text-muted uppercase tracking-wider">Risk Management</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[.56rem] text-down uppercase tracking-wider"><MicroLesson concept="stop-loss">Stop Loss</MicroLesson></label>
                      <input type="number" value={perpStopLoss} onChange={e => setPerpStopLoss(e.target.value)}
                        placeholder={markPrice ? (perpSide === 'long' ? (markPrice * 0.95).toFixed(2) : (markPrice * 1.05).toFixed(2)) : '—'}
                        className={`bg-black/30 border text-txt rounded px-2 py-1.5 font-mono text-[.72rem] outline-none focus:border-down/60
                          ${slNum && !slValid ? 'border-down/60' : 'border-border'}`} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[.56rem] text-up uppercase tracking-wider"><MicroLesson concept="take-profit">Take Profit</MicroLesson></label>
                      <input type="number" value={perpTakeProfit} onChange={e => setPerpTakeProfit(e.target.value)}
                        placeholder={markPrice ? (perpSide === 'long' ? (markPrice * 1.10).toFixed(2) : (markPrice * 0.90).toFixed(2)) : '—'}
                        className={`bg-black/30 border text-txt rounded px-2 py-1.5 font-mono text-[.72rem] outline-none focus:border-up/60
                          ${tpNum && !tpValid ? 'border-down/60' : 'border-border'}`} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[.56rem] text-[#FFA500] uppercase tracking-wider"><MicroLesson concept="trailing-stop">Trailing Stop (%)</MicroLesson></label>
                    <input type="number" value={perpTrailingStop} onChange={e => setPerpTrailingStop(e.target.value)}
                      placeholder="e.g. 3" min="0.5" max="50" step="0.5"
                      className="bg-black/30 border border-border text-txt rounded px-2 py-1.5 font-mono text-[.72rem] outline-none focus:border-[#FFA500]/60" />
                    {perpTrailingStop && <div className="text-[.5rem] text-muted">SL auto-adjusts as price moves {perpSide === 'long' ? 'up' : 'down'} — locks in profit</div>}
                  </div>
                  {slNum && !slValid && <div className="text-[.56rem] text-down">SL must be {perpSide === 'long' ? 'below' : 'above'} mark price</div>}
                  {tpNum && !tpValid && <div className="text-[.56rem] text-down">TP must be {perpSide === 'long' ? 'above' : 'below'} mark price</div>}
                </div>

                {/* P&L Scenario Preview */}
                {markPrice && collateralNum > 0 && (
                  <div className="rounded p-2 text-[.62rem] border border-border bg-black/20">
                    <div className="text-[.56rem] text-muted uppercase tracking-wider mb-1">P&L Scenarios</div>
                    {[
                      { label: perpSide === 'long' ? '+10%' : '-10%', mult: perpSide === 'long' ? 1.10 : 0.90 },
                      { label: perpSide === 'long' ? '+5%' : '-5%', mult: perpSide === 'long' ? 1.05 : 0.95 },
                      { label: perpSide === 'long' ? '-5%' : '+5%', mult: perpSide === 'long' ? 0.95 : 1.05 },
                      { label: perpSide === 'long' ? '-10%' : '+10%', mult: perpSide === 'long' ? 0.90 : 1.10 },
                    ].map(sc => {
                      const scPrice = markPrice * sc.mult;
                      const dir = perpSide === 'long' ? 1 : -1;
                      const scPnl = ((scPrice - markPrice) * dir / markPrice) * notionalSize;
                      const scPct = (scPnl / collateralNum) * 100;
                      return (
                        <div key={sc.label} className="flex justify-between py-0.5">
                          <span className="text-muted">{fmtUSD(scPrice)} ({sc.label})</span>
                          <span className={`font-mono font-bold ${scPnl >= 0 ? 'text-up' : 'text-down'}`}>
                            {scPnl >= 0 ? '+' : ''}{fmtUSD(scPnl)} ({scPct >= 0 ? '+' : ''}{scPct.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Order Summary */}
                <div className="rounded p-2.5 text-[.7rem] border border-border bg-black/20 flex flex-col gap-1">
                  <div className="flex justify-between"><span className="text-muted">Size</span><span className="text-txt font-mono">{fmtUSD(notionalSize)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Fee (0.1%)</span><span className="text-muted font-mono">{fmtUSD(openFee)}</span></div>
                  {slNum && slValid && <div className="flex justify-between"><span className="text-down text-[.66rem]">Stop Loss</span><span className="text-down font-mono">{fmtUSD(slNum)}</span></div>}
                  {tpNum && tpValid && <div className="flex justify-between"><span className="text-up text-[.66rem]">Take Profit</span><span className="text-up font-mono">{fmtUSD(tpNum)}</span></div>}
                  {perpTrailingStop && parseFloat(perpTrailingStop) > 0 && <div className="flex justify-between"><span className="text-[#FFA500] text-[.66rem]">Trail Stop</span><span className="text-[#FFA500] font-mono">{perpTrailingStop}%</span></div>}
                  <div className="flex justify-between"><span className="text-down text-[.66rem]">Liq. Price</span><span className="text-down font-mono font-bold">{liqPricePreview ? fmtUSD(Math.max(0, liqPricePreview)) : '—'}</span></div>
                </div>

                {/* Execute Button */}
                <button onClick={handleOpenPerp}
                  disabled={!markPrice || !perpCollateral || collateralNum <= 0}
                  className={`w-full py-3 rounded font-bold text-[.82rem] cursor-pointer border-none transition-all
                    ${perpSide === 'long'
                      ? 'bg-up text-night hover:brightness-110 disabled:opacity-30'
                      : 'bg-down text-white hover:brightness-110 disabled:opacity-30'}`}>
                  {perpSide === 'long' ? 'Long' : 'Short'} {perpSelectedToken} {perpLeverage}x
                </button>

                {message && (
                  <div className={`text-[.72rem] p-2 rounded text-center ${message.type === 'success' ? 'text-up bg-up/8 border border-up/25' : 'text-down bg-down/8 border border-down/25'}`}>
                    {message.text}
                  </div>
                )}

                {/* Account Summary + Risk Score */}
                <div className="border-t border-border pt-2 mt-1">
                  <div className="text-[.58rem] text-muted uppercase tracking-widest mb-1.5">Account</div>
                  {(() => {
                    const totalCollateralInUse = openPositions.reduce((s, p) => s + p.collateral, 0);
                    const totalExposure = openPositions.reduce((s, p) => s + p.size, 0);
                    const equity = balanceUSD + totalCollateralInUse + totalUnrealizedPnl;
                    const exposurePct = equity > 0 ? (totalExposure / equity) * 100 : 0;
                    const riskLevel = exposurePct < 100 ? 'LOW' : exposurePct < 300 ? 'MEDIUM' : exposurePct < 600 ? 'HIGH' : 'EXTREME';
                    const riskColor = riskLevel === 'LOW' ? 'text-up' : riskLevel === 'MEDIUM' ? 'text-[#FFA500]' : 'text-down';
                    return (
                      <div className="flex flex-col gap-1 text-[.68rem]">
                        <div className="flex justify-between"><span className="text-muted">Balance</span><span className="text-txt font-mono">{fmtUSD(balanceUSD)}</span></div>
                        <div className="flex justify-between"><span className="text-muted">Unrealized P&L</span>
                          <span className={`font-mono font-bold ${totalUnrealizedPnl >= 0 ? 'text-up' : 'text-down'}`}>
                            {totalUnrealizedPnl >= 0 ? '+' : ''}{fmtUSD(totalUnrealizedPnl)}
                          </span>
                        </div>
                        <div className="flex justify-between"><span className="text-muted">Realized P&L</span>
                          <span className={`font-mono font-bold ${perpTotalPnl >= 0 ? 'text-up' : 'text-down'}`}>
                            {perpTotalPnl >= 0 ? '+' : ''}{fmtUSD(perpTotalPnl)}
                          </span>
                        </div>
                        <div className="flex justify-between"><span className="text-muted">Total Trades</span><span className="text-txt font-mono">{perpTradeCount}</span></div>
                        {openPositions.length > 0 && (
                          <div className="flex justify-between border-t border-border pt-1 mt-0.5">
                            <span className="text-muted">Risk Score</span>
                            <span className={`font-mono font-bold ${riskColor}`}>
                              {riskLevel} ({exposurePct.toFixed(0)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="text-[.56rem] text-muted text-center mt-1">
                  {isLiveMode
                    ? (walletAddress
                        ? (liveCapitalDisplay || 'Real transactions — test USDC on devnet')
                        : 'Connect wallet for live trading')
                    : 'Paper trading — no real funds at risk'}
                </div>
              </div>
            </div>

            {/* ─── Bottom: Positions / History / Info Tabs ─── */}
            <div className="border-t border-border">
              {/* Tabs */}
              <div className="flex gap-0 border-b border-border" style={{ background: 'var(--color-card)' }}>
                {[
                  { key: 'positions', label: `Positions (${openPositions.length})` },
                  { key: 'history', label: 'History' },
                  { key: 'orders', label: 'Order Log' },
                  { key: 'info', label: 'Info' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setPerpTab(tab.key)}
                    className={`px-5 py-2.5 text-[.72rem] font-bold cursor-pointer border-none border-b-2 transition-all
                      ${perpTab === tab.key ? 'border-b-[#FFA500] text-txt bg-transparent' : 'border-b-transparent text-muted bg-transparent hover:text-txt'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Positions Tab */}
              {perpTab === 'positions' && (
                <div className="overflow-x-auto">
                  {openPositions.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <div className="text-3xl opacity-40">📈</div>
                      <div className="text-txt text-[.82rem] font-bold">No open positions</div>
                      <div className="text-muted text-[.72rem] max-w-xs leading-relaxed">
                        Open a perpetual position using the order panel — choose long or short with up to 20x leverage.
                      </div>
                      <div className="flex items-center gap-1.5 text-[.65rem] text-sea/70 mt-1">
                        <span>💡</span>
                        <span>Start with low leverage (2-3x) to manage risk while learning</span>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full text-[.7rem]">
                      <thead>
                        <tr className="text-muted text-[.6rem] uppercase tracking-wider border-b border-border">
                          <th className="text-left px-4 py-2 font-medium">Symbol</th>
                          <th className="text-left px-3 py-2 font-medium">Side</th>
                          <th className="text-right px-3 py-2 font-medium">Lev</th>
                          <th className="text-right px-3 py-2 font-medium">Size</th>
                          <th className="text-right px-3 py-2 font-medium">Entry</th>
                          <th className="text-right px-3 py-2 font-medium">Mark</th>
                          <th className="text-right px-3 py-2 font-medium">P&L</th>
                          <th className="text-right px-3 py-2 font-medium">SL / TP</th>
                          <th className="text-right px-3 py-2 font-medium">Liq</th>
                          <th className="text-right px-4 py-2 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {openPositions.map(pos => {
                          const curPrice = pos.isLive
                            ? (pos.markPrice || pos.entryPrice)
                            : (perpTokens.find(t => t.symbol.toUpperCase() === pos.symbol)?.current_price || pos.entryPrice);
                          const direction = pos.side === 'long' ? 1 : -1;
                          const priceDelta = (curPrice - pos.entryPrice) * direction;
                          const pnl = pos.isLive
                            ? (pos.unrealizedPnl || 0)
                            : (priceDelta / pos.entryPrice) * pos.size - (pos.accumulatedFunding || 0);
                          const pnlPct = (pnl / pos.collateral) * 100;
                          const isEditing = editingSLTP === pos.id;
                          return (
                            <tr key={pos.id} className="border-b border-border/50 hover:bg-white/[.02] transition-colors align-top">
                              <td className="px-4 py-2.5 font-bold text-txt">{pos.symbol}</td>
                              <td className="px-3 py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[.6rem] font-bold uppercase ${pos.side === 'long' ? 'bg-up/12 text-up' : 'bg-down/12 text-down'}`}>
                                  {pos.side}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right text-[#FFA500] font-mono font-bold">{pos.leverage}x</td>
                              <td className="px-3 py-2.5 text-right text-txt font-mono">{fmtUSD(pos.size)}</td>
                              <td className="px-3 py-2.5 text-right text-txt font-mono">{fmtUSD(pos.entryPrice)}</td>
                              <td className="px-3 py-2.5 text-right text-txt font-mono">{fmtUSD(curPrice)}</td>
                              <td className={`px-3 py-2.5 text-right font-mono font-bold ${pnl >= 0 ? 'text-up' : 'text-down'}`}>
                                {pnl >= 0 ? '+' : ''}{fmtUSD(pnl)}
                                <div className="text-[.56rem] opacity-70">{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%</div>
                              </td>
                              <td className="px-3 py-2 text-right">
                                {isEditing ? (
                                  <SLTPEditor pos={pos} curPrice={curPrice} onSave={(sl, tp) => {
                                    updatePerpSLTP(pos.id, { stopLoss: sl, takeProfit: tp });
                                    setEditingSLTP(null);
                                    flash('success', 'SL/TP updated');
                                  }} onCancel={() => setEditingSLTP(null)} />
                                ) : (
                                  <button onClick={() => setEditingSLTP(pos.id)}
                                    className="text-left cursor-pointer bg-transparent border-none p-0 group">
                                    <div className="flex flex-col gap-0.5 text-[.62rem]">
                                      <span className={pos.stopLoss ? 'text-down font-mono' : 'text-muted'}>
                                        SL: {pos.stopLoss ? fmtUSD(pos.stopLoss) : '—'}
                                      </span>
                                      <span className={pos.takeProfit ? 'text-up font-mono' : 'text-muted'}>
                                        TP: {pos.takeProfit ? fmtUSD(pos.takeProfit) : '—'}
                                      </span>
                                    </div>
                                    <span className="text-[.5rem] text-muted group-hover:text-txt transition-colors">click to edit</span>
                                  </button>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right text-down font-mono">
                                {fmtUSD(pos.liquidationPrice)}
                                {pos.trailingStop && <div className="text-[.5rem] text-[#FFA500]">Trail {(pos.trailingStop * 100).toFixed(1)}%</div>}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex flex-col gap-1 items-end">
                                  {closePartial === pos.id ? (
                                    <div className="flex gap-1 flex-wrap justify-end">
                                      {[25, 50, 75, 100].map(pct => (
                                        <button key={pct} onClick={async () => {
                                          if (isLiveMode && pos.isLive) {
                                            // ── Live close ──
                                            try {
                                              const priceScale = PERCOLATOR_CONFIG.PRICE_SCALE;
                                              await liveMutations.closeTrade.mutateAsync({
                                                userIdx: liveState?.userIdx,
                                                lpIdx: liveState?.lpIdx || 0,
                                                currentSize: Math.round(pos.size * priceScale) * (pos.side === 'long' ? 1 : -1),
                                                fraction: pct / 100,
                                                maxSlippage: PERCOLATOR_CONFIG.DEFAULT_SLIPPAGE_BPS,
                                                slabPubkey: perpMarketKey,
                                              });
                                              flash('success', `${pct === 100 ? 'Closed' : `Closed ${pct}% of`} ${pos.symbol} (on-chain)`);
                                            } catch (e) {
                                              const msg = mapPercolatorError(e);
                                              if (msg) flash('error', msg);
                                            }
                                          } else {
                                            // ── Paper close ──
                                            const result = closePerpPosition(pos.id, curPrice, pct / 100);
                                            if (result.error) flash('error', result.error);
                                            else flash('success', `${pct === 100 ? 'Closed' : `Closed ${pct}% of`} ${pos.symbol} — P&L: ${result.pnl >= 0 ? '+' : ''}$${result.pnl.toFixed(2)}`);
                                          }
                                          setClosePartial(null);
                                        }}
                                          className={`px-1.5 py-0.5 rounded border text-[.56rem] font-bold cursor-pointer transition-all
                                            ${pct === 100 ? 'border-down/40 bg-down/15 text-down hover:bg-down/25' : 'border-border bg-white/5 text-muted hover:text-txt'}`}>
                                          {pct}%
                                        </button>
                                      ))}
                                      <button onClick={() => setClosePartial(null)}
                                        className="px-1.5 py-0.5 rounded border border-border bg-transparent text-muted text-[.56rem] cursor-pointer hover:text-txt">
                                        X
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1">
                                      <button onClick={() => setClosePartial(pos.id)}
                                        className="px-2 py-1 rounded border border-down/30 bg-down/8 text-down text-[.6rem] font-bold cursor-pointer hover:bg-down/20 transition-all">
                                        Close
                                      </button>
                                      <button onClick={() => setMarginAdjust(marginAdjust?.posId === pos.id ? null : { posId: pos.id, amount: '' })}
                                        className="px-1.5 py-1 rounded border border-border bg-transparent text-muted text-[.6rem] cursor-pointer hover:text-[#FFA500] hover:border-[#FFA500]/40 transition-all"
                                        title="Adjust Margin">
                                        +/-
                                      </button>
                                      <button onClick={() => {
                                        const text = `${pos.side === 'long' ? 'LONG' : 'SHORT'} $${pos.symbol}-PERP ${pos.leverage}x\nEntry: ${fmtUSD(pos.entryPrice)} | Mark: ${fmtUSD(curPrice)}\nP&L: ${pnl >= 0 ? '+' : ''}${fmtUSD(pnl)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)\n\nPaper trading on Limer's Capital`;
                                        navigator.clipboard?.writeText(text).then(() => flash('success', 'Trade copied to clipboard'));
                                      }}
                                        className="px-1.5 py-1 rounded border border-border bg-transparent text-muted text-[.6rem] cursor-pointer hover:text-sea hover:border-sea/40 transition-all"
                                        title="Share Trade">
                                        Share
                                      </button>
                                    </div>
                                  )}
                                  {marginAdjust?.posId === pos.id && (
                                    <div className="flex gap-1 items-center mt-0.5">
                                      <input type="number" value={marginAdjust.amount}
                                        onChange={e => setMarginAdjust({ ...marginAdjust, amount: e.target.value })}
                                        placeholder="$" className="w-16 bg-black/40 border border-border rounded px-1.5 py-0.5 font-mono text-[.58rem] text-txt outline-none" />
                                      <button onClick={() => {
                                        const amt = parseFloat(marginAdjust.amount);
                                        if (!amt) return;
                                        const r = adjustPerpMargin(pos.id, amt);
                                        if (r.error) flash('error', r.error);
                                        else { flash('success', `Margin ${amt > 0 ? 'added' : 'removed'} — new lev: ${r.newLeverage}x`); logPerpEvent('margin_adjust', { symbol: pos.symbol, amount: amt }); }
                                        setMarginAdjust(null);
                                      }}
                                        className="px-1.5 py-0.5 rounded bg-[#FFA500]/15 text-[#FFA500] text-[.54rem] font-bold border-none cursor-pointer">
                                        OK
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* History Tab */}
              {perpTab === 'history' && (
                <div className="overflow-x-auto">
                  {closedPositions.length === 0 ? (
                    <div className="text-muted text-[.76rem] py-10 text-center">No trade history</div>
                  ) : (
                    <table className="w-full text-[.7rem]">
                      <thead>
                        <tr className="text-muted text-[.6rem] uppercase tracking-wider border-b border-border">
                          <th className="text-left px-4 py-2 font-medium">Symbol</th>
                          <th className="text-left px-3 py-2 font-medium">Side</th>
                          <th className="text-right px-3 py-2 font-medium">Lev</th>
                          <th className="text-right px-3 py-2 font-medium">Result</th>
                          <th className="text-right px-3 py-2 font-medium">P&L</th>
                          <th className="text-right px-4 py-2 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedPositions.map(pos => (
                          <tr key={pos.id} className="border-b border-border/50 hover:bg-white/[.02] transition-colors">
                            <td className="px-4 py-2.5 font-bold text-txt">{pos.symbol}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[.6rem] font-bold uppercase ${pos.side === 'long' ? 'bg-up/8 text-up' : 'bg-down/8 text-down'}`}>
                                {pos.side}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-[#FFA500] font-mono">{pos.leverage}x</td>
                            <td className="px-3 py-2.5 text-right">
                              <span className={`px-1.5 py-0.5 rounded text-[.58rem] font-bold uppercase
                                ${pos.status === 'liquidated' ? 'bg-down/20 text-down' : (pos.unrealizedPnl || 0) >= 0 ? 'bg-up/12 text-up' : 'bg-down/12 text-down'}`}>
                                {pos.status === 'liquidated' ? 'LIQ' : (pos.unrealizedPnl || 0) >= 0 ? 'WIN' : 'LOSS'}
                              </span>
                            </td>
                            <td className={`px-3 py-2.5 text-right font-mono font-bold ${(pos.unrealizedPnl || 0) >= 0 ? 'text-up' : 'text-down'}`}>
                              {(pos.unrealizedPnl || 0) >= 0 ? '+' : ''}{fmtUSD(pos.unrealizedPnl || 0)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted font-mono">{pos.closedAt ? new Date(pos.closedAt).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Order Log Tab */}
              {perpTab === 'orders' && (
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  {perpEventLog.length === 0 ? (
                    <div className="text-muted text-[.76rem] py-10 text-center">No events yet — open a position to start logging</div>
                  ) : (
                    <table className="w-full text-[.66rem]">
                      <thead>
                        <tr className="text-muted text-[.56rem] uppercase tracking-wider border-b border-border sticky top-0" style={{ background: 'var(--color-card)' }}>
                          <th className="text-left px-4 py-1.5 font-medium">Time</th>
                          <th className="text-left px-3 py-1.5 font-medium">Event</th>
                          <th className="text-left px-3 py-1.5 font-medium">Symbol</th>
                          <th className="text-left px-3 py-1.5 font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perpEventLog.map(ev => {
                          const typeColors = { open: 'text-up', close: 'text-down', partial_close: 'text-[#FFA500]', liquidation: 'text-down', tp_triggered: 'text-up', sl_triggered: 'text-down', margin_adjust: 'text-[#FFA500]' };
                          const typeLabels = { open: 'OPENED', close: 'CLOSED', partial_close: 'PARTIAL', liquidation: 'LIQUIDATED', tp_triggered: 'TP HIT', sl_triggered: 'SL HIT', margin_adjust: 'MARGIN' };
                          return (
                            <tr key={ev.id} className="border-b border-border/30 hover:bg-white/[.02]">
                              <td className="px-4 py-1.5 text-muted font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                              <td className="px-3 py-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[.54rem] font-bold uppercase ${typeColors[ev.type] || 'text-muted'}`}>
                                  {typeLabels[ev.type] || ev.type}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 font-bold text-txt">{ev.symbol || '—'}</td>
                              <td className="px-3 py-1.5 text-muted">
                                {ev.side && <span className={ev.side === 'long' ? 'text-up' : 'text-down'}>{ev.side.toUpperCase()} </span>}
                                {ev.leverage && <span className="text-[#FFA500]">{ev.leverage}x </span>}
                                {ev.price && <span>@ {fmtUSD(ev.price)} </span>}
                                {ev.pnl != null && <span className={ev.pnl >= 0 ? 'text-up font-bold' : 'text-down font-bold'}>{ev.pnl >= 0 ? '+' : ''}{fmtUSD(ev.pnl)} </span>}
                                {ev.fraction && <span className="text-[#FFA500]">({ev.fraction}) </span>}
                                {ev.amount && <span className="text-[#FFA500]">{ev.amount > 0 ? '+' : ''}{fmtUSD(ev.amount)} margin </span>}
                                {ev.target && <span>target: {fmtUSD(ev.target)} </span>}
                                {ev.trigger && <span>trigger: {fmtUSD(ev.trigger)} </span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Info Tab */}
              {perpTab === 'info' && (
                <div className="p-5 max-w-2xl">
                  <h4 className="font-body font-bold text-[.82rem] text-txt mb-3">How Perpetual Futures Work</h4>
                  <div className="flex flex-col gap-2 text-[.74rem] text-txt-2 mb-4">
                    <div className="flex items-start gap-2"><span className="text-[#FFA500] font-bold shrink-0">1.</span><span><strong>Leverage</strong> — Multiply your exposure (2x-20x). $100 at 10x = $1,000 position size.</span></div>
                    <div className="flex items-start gap-2"><span className="text-[#FFA500] font-bold shrink-0">2.</span><span><strong>Long vs Short</strong> — Long profits when price goes up. Short profits when price goes down.</span></div>
                    <div className="flex items-start gap-2"><span className="text-[#FFA500] font-bold shrink-0">3.</span><span><strong>Liquidation</strong> — If losses exceed your collateral (5% maintenance margin), the position is forcefully closed.</span></div>
                    <div className="flex items-start gap-2"><span className="text-[#FFA500] font-bold shrink-0">4.</span><span><strong>Funding Rate</strong> — A small periodic fee (0.01% / 8h) to keep perp prices aligned with spot.</span></div>
                    <div className="flex items-start gap-2"><span className="text-[#FFA500] font-bold shrink-0">5.</span><span><strong>Stop Loss / Take Profit</strong> — Auto-close at target prices. SL limits losses, TP locks gains.</span></div>
                    <div className="flex items-start gap-2"><span className="text-[#FFA500] font-bold shrink-0">6.</span><span><strong>Trailing Stop</strong> — SL that auto-adjusts as price moves in your favor. Set a %, and it follows the peak/trough.</span></div>
                    <div className="flex items-start gap-2"><span className="text-[#FFA500] font-bold shrink-0">7.</span><span><strong>Partial Close</strong> — Close 25/50/75% of a position to take profits while keeping exposure.</span></div>
                    <div className="flex items-start gap-2"><span className="text-[#FFA500] font-bold shrink-0">8.</span><span><strong>Margin Adjustment</strong> — Add collateral to avoid liquidation, or remove excess to free up capital.</span></div>
                  </div>
                  <div className="rounded border border-border p-3 text-[.68rem]" style={{ background: 'var(--color-card)' }}>
                    <div className="text-[.6rem] text-muted uppercase tracking-widest mb-2">Contract Specs</div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                      <div className="flex justify-between"><span className="text-muted">Type</span><span className="text-txt">Perpetual</span></div>
                      <div className="flex justify-between"><span className="text-muted">Settlement</span><span className="text-txt">USD</span></div>
                      <div className="flex justify-between"><span className="text-muted">Max Leverage</span><span className="text-txt">20x</span></div>
                      <div className="flex justify-between"><span className="text-muted">Maintenance</span><span className="text-txt">5%</span></div>
                      <div className="flex justify-between"><span className="text-muted">Trading Fee</span><span className="text-txt">0.1%</span></div>
                      <div className="flex justify-between"><span className="text-muted">Funding Rate</span><span className="text-txt">0.01% / 8h</span></div>
                    </div>
                  </div>
                  <div className="mt-3 text-[.6rem] text-muted">Paper trading — practice leverage risk before using real capital.</div>
                </div>
              )}
            </div>

            {/* Confirmation Modal */}
            {perpConfirm && (
              <div role="dialog" aria-modal="true" className="fixed inset-0 z-[500] flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }}
                onClick={e => { if (e.target === e.currentTarget) setPerpConfirm(null); }}>
                <div className="rounded-xl border border-border max-w-sm w-full p-5 flex flex-col gap-4" style={{ background: 'var(--color-night-2)' }}>
                  <div className="font-body font-black text-[.92rem] text-txt text-center">
                    Confirm {perpConfirm.side === 'long' ? 'Long' : 'Short'}
                  </div>
                  <div className="rounded border border-border p-3 text-[.74rem] flex flex-col gap-1.5" style={{ background: 'var(--color-card)' }}>
                    <div className="flex justify-between"><span className="text-muted">Asset</span><span className="text-txt font-bold">{perpConfirm.symbol}-PERP</span></div>
                    <div className="flex justify-between"><span className="text-muted">Direction</span><span className={perpConfirm.side === 'long' ? 'text-up font-bold' : 'text-down font-bold'}>{perpConfirm.side.toUpperCase()}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Leverage</span><span className="text-[#FFA500] font-bold">{perpConfirm.leverage}x</span></div>
                    <div className="flex justify-between"><span className="text-muted">Collateral</span><span className="text-txt">{fmtUSD(perpConfirm.collateral)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Position Size</span><span className="text-txt font-bold">{fmtUSD(perpConfirm.size)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Entry Price</span><span className="text-txt">{fmtUSD(perpConfirm.price)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Fee</span><span className="text-muted">{fmtUSD(perpConfirm.fee)}</span></div>
                    {perpConfirm.stopLoss && <div className="flex justify-between"><span className="text-down text-[.68rem]">Stop Loss</span><span className="text-down font-mono">{fmtUSD(perpConfirm.stopLoss)}</span></div>}
                    {perpConfirm.takeProfit && <div className="flex justify-between"><span className="text-up text-[.68rem]">Take Profit</span><span className="text-up font-mono">{fmtUSD(perpConfirm.takeProfit)}</span></div>}
                    {perpConfirm.trailingStop && <div className="flex justify-between"><span className="text-[#FFA500] text-[.68rem]">Trailing Stop</span><span className="text-[#FFA500] font-mono">{(perpConfirm.trailingStop * 100).toFixed(1)}%</span></div>}
                    <div className="flex justify-between border-t border-border pt-1.5 mt-0.5">
                      <span className="text-down text-[.68rem]">Liquidation</span>
                      <span className="text-down font-bold">{liqPricePreview ? fmtUSD(liqPricePreview) : '—'}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setPerpConfirm(null)} className="flex-1 py-2.5 rounded border border-border bg-transparent text-muted text-[.76rem] font-bold cursor-pointer hover:text-txt transition-all">Cancel</button>
                    <ShatterButton
                      onClick={handleConfirmPerp}
                      shatterColor={perpConfirm.side === 'long' ? '#00ffa3' : '#ff716c'}
                      shardCount={22}
                    >
                      Open {perpConfirm.side === 'long' ? 'Long' : 'Short'}
                    </ShatterButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Paper Trading Views (Solana + TTSE) — Unified DEX-style layout */}
      {market !== 'jupiter' && market !== 'perpetuals' ? (() => {
        const accentColor = isTTSE ? '#FF4D6D' : '#00ffa3';
        const holdingsPnl = marketHoldings.reduce((sum, h) => {
          const a = assets.find(a => a.symbol === h.symbol);
          const cp = a?.price || h.avgPrice;
          return sum + (cp - h.avgPrice) * h.qty;
        }, 0);
        const marketTrades = trades.filter(t => t.market === market);
        const openLimits = limitOrders.filter(o => o.status === 'open' && o.market === market);

        return (
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-night-2)' }}>
          {/* ─── Top Market Info Strip ─── */}
          <div className="flex items-center gap-5 px-4 py-2.5 border-b border-border overflow-x-auto" style={{ background: 'var(--color-card)' }}>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="bg-transparent border-none text-txt font-body font-black text-[1rem] outline-none cursor-pointer pr-2 appearance-auto">
              <option value="" style={{ background: 'var(--color-night)' }}>
                {isTTSE ? 'TTSE' : 'Solana'} — Select
              </option>
              {assets.map(a => (
                <option key={a.id} value={a.id} style={{ background: 'var(--color-night)' }}>
                  {a.symbol}
                </option>
              ))}
            </select>
            <div className="h-6 w-px bg-border flex-shrink-0" />
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[.58rem] text-muted leading-none">Price</span>
              <span className="text-txt font-mono font-bold text-[.88rem] leading-tight">{fmtPrice(price)}</span>
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[.58rem] text-muted leading-none">24h Change</span>
              <span className={`font-mono font-bold text-[.82rem] leading-tight ${(selected?.change || 0) >= 0 ? 'text-up' : 'text-down'}`}>
                {selected?.change != null ? ((selected.change >= 0 ? '+' : '') + selected.change.toFixed(2) + '%') : '—'}
              </span>
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[.58rem] text-muted leading-none">Holdings</span>
              <span className="font-mono font-bold text-[.82rem] leading-tight" style={{ color: accentColor }}>{marketHoldings.length}</span>
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="text-[.58rem] text-muted leading-none">Portfolio P&L</span>
              <span className={`font-mono font-bold text-[.82rem] leading-tight ${holdingsPnl >= 0 ? 'text-up' : 'text-down'}`}>
                {holdingsPnl >= 0 ? '+' : ''}{fmtPrice(holdingsPnl)}
              </span>
            </div>
            <span className="ml-auto text-[.58rem] text-muted px-2 py-0.5 border border-border rounded flex-shrink-0">PAPER</span>
          </div>

          {/* ─── Main: Order Book/Chart + Order Panel ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
            {/* Left: Order Book + Chart */}
            <div className="border-r border-border min-h-[420px] overflow-y-auto">
              {/* Asset filter bar — watchlist + category chips (Solana mode only) */}
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
                <button onClick={() => setAssetFilter('all')}
                  className={`flex-shrink-0 px-3 py-1 rounded text-[.65rem] font-bold cursor-pointer border transition-all
                    ${assetFilter === 'all' ? 'border-border bg-white/5 text-txt' : 'border-transparent bg-transparent text-muted hover:text-txt'}`}>
                  All
                  {!isTTSE && assetCategoryCounts.all > 0 && (
                    <span className="ml-1.5 text-[.55rem] opacity-60 font-mono">{assetCategoryCounts.all}</span>
                  )}
                </button>
                {watchlist.length > 0 && (
                  <button onClick={() => setAssetFilter('watchlist')}
                    className={`flex-shrink-0 px-3 py-1 rounded text-[.65rem] font-bold cursor-pointer border transition-all flex items-center gap-1
                      ${assetFilter === 'watchlist' ? 'border-border bg-white/5 text-txt' : 'border-transparent bg-transparent text-muted hover:text-txt'}`}>
                    ★ Watchlist ({watchlist.length})
                  </button>
                )}
                {/* Category chips — Solana mode only */}
                {!isTTSE && Object.entries(CATEGORIES).filter(([k]) => k !== 'all').map(([key, cat]) => {
                  const count = assetCategoryCounts[key] || 0;
                  if (count === 0) return null; // hide empty categories
                  const isActive = assetFilter === key;
                  return (
                    <button key={key} onClick={() => setAssetFilter(key)}
                      title={cat.description}
                      className={`flex-shrink-0 px-3 py-1 rounded text-[.65rem] font-bold cursor-pointer border transition-all flex items-center gap-1.5
                        ${isActive ? 'border-border bg-white/5 text-txt' : 'border-transparent bg-transparent text-muted hover:text-txt'}`}>
                      <span>{cat.label}</span>
                      <span className="text-[.55rem] opacity-60 font-mono">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Asset list */}
              <div role="listbox" aria-label={isTTSE ? 'TTSE stocks' : 'Solana tokens'}
                className="max-h-[200px] md:max-h-[260px] overflow-y-auto mx-3 mb-3 border border-border rounded">
                <div className="grid items-center gap-2 px-3 py-1.5 text-[.58rem] text-muted uppercase tracking-wider border-b border-border sticky top-0 z-10"
                  style={{ gridTemplateColumns: isTTSE ? '1.5fr 1fr .8fr .8fr' : '16px 24px 1.5fr 1fr .8fr', background: 'var(--color-night-2)' }}>
                  {!isTTSE && <span />}
                  {!isTTSE && <span />}
                  <span>Asset</span>
                  <span>Price</span>
                  <span>24h</span>
                  {isTTSE && <span>Vol</span>}
                </div>
                {visibleAssets.map(a => {
                  const starred = watchlist.includes(a.symbol);
                  const isSelected = selectedId === a.id;
                  return (
                    <div key={a.id} role="option" aria-selected={isSelected} tabIndex={0}
                      onClick={() => setSelectedId(a.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(a.id); } }}
                      className={`grid items-center gap-2 px-3 py-2 cursor-pointer text-[.72rem] border-b border-border/30 transition-all hover:bg-white/[.02] focus:outline-none
                        ${isSelected ? 'bg-white/[.04]' : ''}`}
                      style={{ gridTemplateColumns: isTTSE ? '1.5fr 1fr .8fr .8fr' : '16px 24px 1.5fr 1fr .8fr' }}>
                      {!isTTSE && (
                        <button onClick={e => { e.stopPropagation(); toggleWatchlist(a.symbol); }}
                          className="text-[.75rem] leading-none cursor-pointer bg-transparent border-none p-0 transition-all hover:scale-125"
                          style={{ color: starred ? '#FFCA3A' : 'rgba(90,120,160,0.5)' }}>
                          {starred ? '★' : '☆'}
                        </button>
                      )}
                      {!isTTSE && <TokenLogo src={a.image} symbol={a.symbol} col={a.col} />}
                      <div className="min-w-0">
                        <span className="font-body font-bold text-[.74rem]">{a.symbol}</span>
                        <span className="text-muted text-[.56rem] ml-1 truncate">{a.name.length > 16 ? a.name.slice(0, 16) + '…' : a.name}</span>
                      </div>
                      <span className="font-mono font-bold text-[.74rem]">{fmtPrice(a.price)}</span>
                      <span className={`font-mono text-[.68rem] ${(a.change || 0) >= 0 ? 'text-up' : 'text-down'}`}>
                        {a.change != null ? ((a.change >= 0 ? '+' : '') + a.change.toFixed(2) + '%') : '—'}
                      </span>
                      {isTTSE && <span className="text-muted text-[.64rem] font-mono">{(a.volume || 0).toLocaleString()}</span>}
                    </div>
                  );
                })}
                {assetFilter === 'watchlist' && visibleAssets.length === 0 && (
                  <div className="px-4 py-6 text-center text-muted text-[.72rem]">No tokens starred yet — click ☆ to add</div>
                )}
              </div>

              {/* Bid/Ask Order Book */}
              {selected && (
                <div className="px-4 pb-3">
                  <div className="text-[.68rem] text-muted uppercase tracking-wider mb-2">
                    Order Book — <span className="text-txt font-bold">{selected.symbol}</span> <span className="font-mono ml-1">{fmtPrice(price)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[.56rem] text-down uppercase tracking-wider mb-1 px-2">Asks</div>
                      {orderBook.asks.map((o, i) => (
                        <div key={i} className="flex justify-between px-2 py-[3px] text-[.68rem] relative">
                          <div className="absolute inset-y-0 right-0 bg-down/8 rounded-sm" style={{ width: `${Math.min(100, o.qty / 50)}%` }} />
                          <span className="text-down relative z-10 font-mono">{fmtPrice(o.price)}</span>
                          <span className="text-muted relative z-10 font-mono">{o.qty.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-[.56rem] text-up uppercase tracking-wider mb-1 px-2">Bids</div>
                      {orderBook.bids.map((o, i) => (
                        <div key={i} className="flex justify-between px-2 py-[3px] text-[.68rem] relative">
                          <div className="absolute inset-y-0 left-0 bg-up/8 rounded-sm" style={{ width: `${Math.min(100, o.qty / 50)}%` }} />
                          <span className="text-up relative z-10 font-mono">{fmtPrice(o.price)}</span>
                          <span className="text-muted relative z-10 font-mono">{o.qty.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center mt-2 py-1 rounded text-[.64rem] bg-black/20 border border-border">
                    <span className="text-muted">Spread: </span>
                    <span className="font-mono font-bold" style={{ color: accentColor }}>
                      {orderBook.asks.length && orderBook.bids.length
                        ? fmtPrice(Math.abs(orderBook.asks[orderBook.asks.length - 1].price - orderBook.bids[0].price))
                        : '—'}
                    </span>
                  </div>

                  {/* FMP Supply Info */}
                  {!isTTSE && (() => {
                    const sym = selected.symbol?.toUpperCase();
                    const f = fmpData[sym];
                    if (!f) return null;
                    const pct = f.totalSupply ? ((f.circulatingSupply / f.totalSupply) * 100).toFixed(0) : null;
                    return (
                      <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-x-6 gap-y-1.5 text-[.66rem]">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[.56rem] text-muted uppercase tracking-wider">Circulating</span>
                          <span className="text-txt-2 font-mono font-bold">{fmtSupply(f.circulatingSupply)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[.56rem] text-muted uppercase tracking-wider">Total Supply</span>
                          <span className="text-txt-2 font-mono font-bold">{fmtSupply(f.totalSupply)}</span>
                        </div>
                        {pct && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[.56rem] text-muted uppercase tracking-wider">% Circulating</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-14 h-1.5 rounded-full bg-border overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: accentColor }} />
                              </div>
                              <span className="font-mono font-bold" style={{ color: accentColor }}>{pct}%</span>
                            </div>
                          </div>
                        )}
                        {f.icoDate && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[.56rem] text-muted uppercase tracking-wider">ICO Date</span>
                            <span className="text-txt-2 font-mono">{new Date(f.icoDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {!selected && (
                <div className="text-center py-10 text-muted text-[.76rem]">Select an asset to view its order book</div>
              )}

              {/* Price Chart */}
              {selected && (
                <div className="px-3 pb-3">
                  {/* Chart Source Toggle */}
                  {!isTTSE && TV_SYMBOL_MAP[selected.symbol.toUpperCase()] && (
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 rounded-lg border border-border overflow-hidden">
                        <button onClick={() => setChartSource('tradingview')}
                          className={`px-2.5 py-1 text-[.62rem] font-mono cursor-pointer border-none transition-all ${
                            chartSource === 'tradingview'
                              ? 'bg-sea/15 text-sea font-bold'
                              : 'bg-transparent text-muted hover:text-txt'
                          }`}>
                          TradingView
                        </button>
                        <button onClick={() => setChartSource('apex')}
                          className={`px-2.5 py-1 text-[.62rem] font-mono cursor-pointer border-none transition-all ${
                            chartSource === 'apex'
                              ? 'bg-sea/15 text-sea font-bold'
                              : 'bg-transparent text-muted hover:text-txt'
                          }`}>
                          Basic
                        </button>
                      </div>
                      <button onClick={() => setShowTAWidget(v => !v)}
                        className={`text-[.6rem] font-mono px-2 py-0.5 rounded border cursor-pointer transition-all ${
                          showTAWidget
                            ? 'border-sea/40 text-sea bg-sea/10'
                            : 'border-border text-muted hover:text-txt bg-transparent'
                        }`}>
                        {showTAWidget ? '📊 Signals ON' : '📊 Signals'}
                      </button>
                    </div>
                  )}

                  {/* TradingView Advanced Chart */}
                  {chartSource === 'tradingview' && !isTTSE && TV_SYMBOL_MAP[selected.symbol.toUpperCase()] ? (
                    <TradingViewChart
                      symbol={TV_SYMBOL_MAP[selected.symbol.toUpperCase()]}
                      interval="D"
                      height={620}
                    />
                  ) : (
                    <StockChart symbol={selected.symbol} name={selected.name} price={selected.price} currency={currency} isTTSE={isTTSE} realCandles={isTTSE ? null : realCandles} />
                  )}

                  {/* Technical Analysis Widget */}
                  {showTAWidget && !isTTSE && TV_SYMBOL_MAP[selected.symbol.toUpperCase()] && (
                    <div className="mt-3">
                      <TradingViewTechnicalAnalysis
                        symbol={TV_SYMBOL_MAP[selected.symbol.toUpperCase()]}
                        height={380}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Price Alerts */}
              {!isTTSE && (
                <div className="px-3 pb-3">
                  <PriceAlerts />
                </div>
              )}
            </div>

            {/* Right: Order Panel */}
            <div className="flex flex-col p-3 gap-2.5 overflow-y-auto max-h-[85vh]" style={{ background: 'var(--color-card)' }}>
              {/* Buy/Sell Toggle */}
              <div className="flex rounded overflow-hidden border border-border">
                <button onClick={() => setSide('buy')}
                  className={`flex-1 py-2 text-[.76rem] font-bold cursor-pointer border-none transition-all
                    ${side === 'buy' ? 'bg-up text-night' : 'bg-transparent text-muted hover:text-txt'}`}>
                  Buy
                </button>
                <button onClick={() => setSide('sell')}
                  className={`flex-1 py-2 text-[.76rem] font-bold cursor-pointer border-none transition-all
                    ${side === 'sell' ? 'bg-down text-white' : 'bg-transparent text-muted hover:text-txt'}`}>
                  Sell
                </button>
              </div>

              {/* Order Type Tabs — hidden in simple mode */}
              {tradeMode === 'advanced' && (
                <div className="flex gap-1">
                  {['market', 'limit'].map(ot => {
                    if (ot === 'limit' && !hasLimitOrders) {
                      return (
                        <button key={ot} onClick={() => flash('error', 'Complete Module 3 in Learn to unlock Limit Orders')}
                          className="flex-1 py-1.5 rounded text-[.68rem] font-bold uppercase cursor-pointer border border-transparent bg-transparent text-muted/50 flex items-center justify-center gap-1">
                          🔒 Limit
                        </button>
                      );
                    }
                    return (
                      <button key={ot} onClick={() => setOrderType(ot)}
                        className={`flex-1 py-1.5 rounded text-[.68rem] font-bold uppercase cursor-pointer border transition-all
                          ${orderType === ot ? 'border-border bg-white/5 text-txt' : 'border-transparent bg-transparent text-muted hover:text-txt'}`}>
                        {ot}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Asset Select */}
              <div className="flex flex-col gap-1">
                <span className="text-[.6rem] text-muted uppercase tracking-wider">{isTTSE ? 'Stock' : 'Token'}</span>
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                  className="bg-black/30 border border-border text-txt rounded px-2.5 py-1.5 font-mono text-[.76rem] outline-none">
                  <option value="">— Select —</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.symbol} — {fmtPrice(a.price)}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[.6rem] text-muted uppercase tracking-wider">Quantity</span>
                  <span className="text-[.58rem] text-muted">{fmtPrice(balance)} avail</span>
                </div>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)}
                  placeholder={isTTSE ? 'Shares' : '0.00'} min="0" step="any"
                  className="bg-black/30 border border-border text-txt rounded px-2.5 py-1.5 font-mono text-[.76rem] outline-none focus:border-sea/60" />
                {tradeMode === 'advanced' && (
                  <div className="flex gap-1">
                    {[10, 25, 50, 100].map(pct => (
                      <button key={pct} onClick={() => {
                        if (!price || price <= 0) return;
                        const maxQty = (balance * pct / 100) / price;
                        setQty(String(maxQty.toFixed(isTTSE ? 0 : 6)));
                      }}
                        className="flex-1 py-1 rounded text-[.6rem] font-mono cursor-pointer border border-border bg-transparent text-muted hover:text-txt hover:border-white/20 transition-all">
                        {pct}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Limit Price */}
              {orderType === 'limit' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[.6rem] text-[#FFCA3A] uppercase tracking-wider">
                    Limit Price <span className="text-muted normal-case text-[.54rem]">({side === 'buy' ? '≤ market' : '≥ market'})</span>
                  </label>
                  <input type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                    placeholder={price ? price.toFixed(4) : '0.00'} min="0" step="any"
                    className="bg-black/30 border border-[#FFCA3A]/40 text-txt rounded px-2.5 py-1.5 font-mono text-[.76rem] outline-none focus:border-[#FFCA3A]/60" />
                  {price && limitPrice && (() => {
                    const lp = parseFloat(limitPrice);
                    if (!isFinite(lp) || lp <= 0) return null;
                    const diff = ((lp - price) / price * 100);
                    return <div className={`text-[.56rem] ${diff >= 0 ? 'text-up' : 'text-down'}`}>{diff >= 0 ? '+' : ''}{diff.toFixed(2)}% from market</div>;
                  })()}
                </div>
              )}

              {/* Order Summary */}
              <div className="rounded p-2.5 text-[.7rem] border border-border bg-black/20 flex flex-col gap-1">
                <div className="flex justify-between"><span className="text-muted">Price</span><span className="text-txt font-mono">{fmtPrice(price)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Qty</span><span className="text-txt font-mono">{parseFloat(qty) || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted">Fee (0.3%)</span><span className="text-muted font-mono">{fmtPrice(fee)}</span></div>
                <div className="flex justify-between border-t border-border pt-1 mt-0.5">
                  <span className="text-muted">Total</span>
                  <span className="font-mono font-bold" style={{ color: accentColor }}>{fmtPrice(total)}</span>
                </div>
              </div>

              {/* Execute Button */}
              <button onClick={handleExecute}
                disabled={!price || !qty || (orderType === 'limit' && !limitPrice)}
                className={`w-full py-3 rounded font-bold text-[.82rem] cursor-pointer border-none transition-all
                  ${side === 'buy'
                    ? 'bg-up text-night hover:brightness-110 disabled:opacity-30'
                    : 'bg-down text-white hover:brightness-110 disabled:opacity-30'}`}>
                {orderType === 'limit'
                  ? `Place Limit ${side === 'buy' ? 'Buy' : 'Sell'}`
                  : `${side === 'buy' ? 'Buy' : 'Sell'} ${selected?.symbol || ''}`}
              </button>

              {message && (
                <div className={`text-[.72rem] p-2 rounded text-center ${message.type === 'success' ? 'text-up bg-up/8 border border-up/25' : 'text-down bg-down/8 border border-down/25'}`}>
                  {message.text}
                </div>
              )}

              {/* Account Summary */}
              <div className="border-t border-border pt-2 mt-1">
                <div className="text-[.58rem] text-muted uppercase tracking-widest mb-1.5">Account</div>
                <div className="flex flex-col gap-1 text-[.68rem]">
                  <div className="flex justify-between"><span className="text-muted">Balance</span><span className="text-txt font-mono">{fmtPrice(balance)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Holdings</span><span className="text-txt font-mono">{marketHoldings.length} assets</span></div>
                  <div className="flex justify-between"><span className="text-muted">Portfolio P&L</span>
                    <span className={`font-mono font-bold ${holdingsPnl >= 0 ? 'text-up' : 'text-down'}`}>
                      {holdingsPnl >= 0 ? '+' : ''}{fmtPrice(holdingsPnl)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[.56rem] text-muted text-center mt-1">Paper trading — no real funds at risk</div>
            </div>
          </div>

          {/* ─── Bottom: Tabs ─── */}
          <div className="border-t border-border">
            <div className="flex gap-0 border-b border-border" style={{ background: 'var(--color-card)' }}>
              {[
                { key: 'holdings', label: `Holdings (${marketHoldings.length})` },
                { key: 'trades', label: 'Trades' },
                ...(hasLimitOrders && openLimits.length > 0 ? [{ key: 'limits', label: `Limits (${openLimits.length})` }] : []),
                { key: 'info', label: 'Info' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setPaperTab(tab.key)}
                  className={`px-5 py-2.5 text-[.72rem] font-bold cursor-pointer border-none border-b-2 transition-all
                    ${paperTab === tab.key ? 'text-txt bg-transparent' : 'border-b-transparent text-muted bg-transparent hover:text-txt'}`}
                  style={paperTab === tab.key ? { borderBottomColor: accentColor } : {}}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Holdings Tab */}
            {paperTab === 'holdings' && (
              <div className="overflow-x-auto">
                {marketHoldings.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="text-3xl opacity-40">{isTTSE ? '🇹🇹' : '📊'}</div>
                    <div className="text-txt text-[.82rem] font-bold">No {isTTSE ? 'TTSE' : 'Solana'} holdings yet</div>
                    <div className="text-muted text-[.72rem] max-w-xs leading-relaxed">
                      {isTTSE
                        ? 'Select a TTSE stock from the market list and place a paper trade to get started.'
                        : 'Choose a token above, set your quantity, and execute your first paper trade — no real funds at risk.'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[.65rem] text-sea/70 mt-1">
                      <span>💡</span>
                      <span>Paper trading helps you learn without risking real money</span>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-[.7rem]">
                    <thead>
                      <tr className="text-muted text-[.6rem] uppercase tracking-wider border-b border-border">
                        <th className="text-left px-4 py-2 font-medium">Asset</th>
                        <th className="text-right px-3 py-2 font-medium">Qty</th>
                        <th className="text-right px-3 py-2 font-medium">Avg Price</th>
                        <th className="text-right px-3 py-2 font-medium">Value</th>
                        <th className="text-right px-3 py-2 font-medium">P&L</th>
                        <th className="text-right px-4 py-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketHoldings.map(h => {
                        const a = assets.find(a => a.symbol === h.symbol);
                        const cp = a?.price || h.avgPrice;
                        const val = h.qty * cp;
                        const pnl = ((cp - h.avgPrice) / h.avgPrice * 100);
                        return (
                          <tr key={`${h.market}:${h.symbol}`} className="border-b border-border/50 hover:bg-white/[.02] transition-colors">
                            <td className="px-4 py-2.5 font-bold text-txt">{h.symbol}</td>
                            <td className="px-3 py-2.5 text-right text-txt font-mono">{h.qty < 1 ? h.qty.toFixed(6) : h.qty.toFixed(2)}</td>
                            <td className="px-3 py-2.5 text-right text-txt font-mono">{fmtPrice(h.avgPrice)}</td>
                            <td className="px-3 py-2.5 text-right text-txt font-mono">{fmtPrice(val)}</td>
                            <td className={`px-3 py-2.5 text-right font-mono font-bold ${pnl >= 0 ? 'text-up' : 'text-down'}`}>
                              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button onClick={() => {
                                const result = executeTrade('sell', h.symbol, h.qty, cp, h.currency, h.market);
                                if (result.success) flash('success', `Sold all ${h.symbol}`);
                              }}
                                className="px-2.5 py-1 rounded border border-down/30 bg-down/8 text-down text-[.64rem] font-bold cursor-pointer hover:bg-down/20 transition-all">
                                Sell All
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Trades Tab */}
            {paperTab === 'trades' && (
              <div className="overflow-x-auto">
                {marketTrades.length === 0 ? (
                  <div className="text-muted text-[.76rem] py-10 text-center">No trade history</div>
                ) : (
                  <table className="w-full text-[.7rem]">
                    <thead>
                      <tr className="text-muted text-[.6rem] uppercase tracking-wider border-b border-border">
                        <th className="text-left px-4 py-2 font-medium">Side</th>
                        <th className="text-left px-3 py-2 font-medium">Asset</th>
                        <th className="text-right px-3 py-2 font-medium">Qty</th>
                        <th className="text-right px-3 py-2 font-medium">Price</th>
                        <th className="text-right px-3 py-2 font-medium">Total</th>
                        <th className="text-right px-4 py-2 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketTrades.slice(0, 20).map(t => (
                        <tr key={t.id} className="border-b border-border/50 hover:bg-white/[.02] transition-colors">
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[.6rem] font-bold uppercase ${t.side === 'buy' ? 'bg-up/12 text-up' : 'bg-down/12 text-down'}`}>{t.side}</span>
                          </td>
                          <td className="px-3 py-2.5 font-bold text-txt">{t.symbol}</td>
                          <td className="px-3 py-2.5 text-right text-txt font-mono">{t.qty < 1 ? t.qty.toFixed(6) : t.qty.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right text-txt font-mono">{fmtPrice(t.price)}</td>
                          <td className="px-3 py-2.5 text-right text-txt font-mono">{fmtPrice(t.total)}</td>
                          <td className="px-4 py-2.5 text-right text-muted font-mono">{new Date(t.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Limit Orders Tab */}
            {paperTab === 'limits' && (
              <div className="overflow-x-auto">
                {openLimits.length === 0 ? (
                  <div className="text-muted text-[.76rem] py-10 text-center">No open limit orders</div>
                ) : (
                  <table className="w-full text-[.7rem]">
                    <thead>
                      <tr className="text-muted text-[.6rem] uppercase tracking-wider border-b border-border">
                        <th className="text-left px-4 py-2 font-medium">Side</th>
                        <th className="text-left px-3 py-2 font-medium">Asset</th>
                        <th className="text-right px-3 py-2 font-medium">Qty</th>
                        <th className="text-right px-3 py-2 font-medium">Limit Price</th>
                        <th className="text-right px-4 py-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {openLimits.map(o => (
                        <tr key={o.id} className="border-b border-border/50 hover:bg-white/[.02] transition-colors">
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[.6rem] font-bold uppercase ${o.side === 'buy' ? 'bg-up/12 text-up' : 'bg-down/12 text-down'}`}>{o.side}</span>
                          </td>
                          <td className="px-3 py-2.5 font-bold text-txt">{o.symbol}</td>
                          <td className="px-3 py-2.5 text-right text-txt font-mono">{o.qty}</td>
                          <td className="px-3 py-2.5 text-right text-txt font-mono">{fmtPrice(o.limitPrice)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button onClick={() => cancelLimitOrder(o.id)}
                              className="px-2.5 py-1 rounded border border-down/30 bg-down/8 text-down text-[.64rem] font-bold cursor-pointer hover:bg-down/20 transition-all">
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Info Tab */}
            {paperTab === 'info' && (
              <div className="p-5 max-w-2xl">
                <h4 className="font-body font-bold text-[.82rem] text-txt mb-3">{isTTSE ? 'TTSE Paper Trading' : 'Solana Paper Trading'}</h4>
                <div className="flex flex-col gap-2 text-[.74rem] text-txt-2 mb-4">
                  <div className="flex items-start gap-2"><span className="font-bold shrink-0" style={{ color: accentColor }}>1.</span><span><strong>Select an asset</strong> — Browse tokens or stocks and click to select.</span></div>
                  <div className="flex items-start gap-2"><span className="font-bold shrink-0" style={{ color: accentColor }}>2.</span><span><strong>Place orders</strong> — Market orders execute instantly. Limit orders trigger when price is reached.</span></div>
                  <div className="flex items-start gap-2"><span className="font-bold shrink-0" style={{ color: accentColor }}>3.</span><span><strong>Track holdings</strong> — View your portfolio, P&L, and trade history in the tabs.</span></div>
                  <div className="flex items-start gap-2"><span className="font-bold shrink-0" style={{ color: accentColor }}>4.</span><span><strong>No risk</strong> — Paper trading uses simulated balances. Earn XP and LP as you learn.</span></div>
                </div>
                {!isTTSE && (
                  <div className="flex flex-col gap-2 mt-4">
                    <a href={selected ? jupiterUrl(side, SOL_TOKENS[selected.symbol]) : 'https://jup.ag'} target="_blank" rel="noopener noreferrer"
                      className="no-underline flex items-center justify-center gap-2 rounded py-2.5 text-[.72rem] font-bold transition-all hover:brightness-110 border"
                      style={{ background: 'rgba(0,255,163,.08)', borderColor: 'rgba(0,255,163,.3)', color: '#00ffa3' }}>
                      Trade for real on Jupiter ↗
                    </a>
                    <a href={SOLFLARE_LINK} target="_blank" rel="noopener noreferrer"
                      className="no-underline flex items-center justify-center gap-2 rounded py-2.5 text-[.72rem] font-bold transition-all hover:brightness-110 border"
                      style={{ background: 'rgba(252,86,2,.08)', borderColor: 'rgba(252,86,2,.3)', color: SOLFLARE_ORANGE }}>
                      Get Solflare Wallet ↗
                    </a>
                  </div>
                )}
                <div className="mt-3 text-[.6rem] text-muted">Paper trading — practice before using real capital.</div>
              </div>
            )}
          </div>
        </div>
        );
      })() : null}

      {/* Contextual Help Panel */}
      <ContextualHelp pageTitle="Trading" items={[
        { title: 'What is paper trading?', content: 'Paper trading lets you practice buying and selling with virtual money ($100K). No real money is involved — it\'s a risk-free way to learn how markets work.' },
        { title: 'What are tokens?', content: 'Tokens are digital assets on a blockchain. SOL is the main token of Solana. Others like USDC (digital dollar), JUP, and BONK each serve different purposes — similar to stocks.' },
        { title: 'Buy vs Sell', content: 'Buy means you\'re purchasing a token — you think its price will go up. Sell means you\'re selling tokens you already own — you want to lock in profits or cut losses.' },
        { title: 'What is a Market Order?', content: 'A market order buys or sells immediately at the current price. It\'s the simplest type — just pick a token, enter an amount, and click Buy or Sell.' },
        { title: 'What is a Limit Order?', content: 'A limit order lets you set a specific price. Your order only executes when the market reaches that price. Useful for buying dips or selling at a target.' },
        { title: 'What are Perpetuals?', content: 'Perpetual futures (perps) let you bet on price movements with leverage — meaning you can control a bigger position with less money. Higher risk, higher potential reward.' },
        { title: 'What does Fee (0.3%) mean?', content: 'Each trade has a small 0.3% fee. On a $100 trade, the fee is $0.30. In paper trading this is simulated. On real swaps via Jupiter, fees are typically 0.25-0.5%.' },
      ]} />
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
